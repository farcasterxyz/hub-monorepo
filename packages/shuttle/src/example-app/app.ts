import {
  DB,
  getDbClient,
  getHubClient,
  MessageHandler,
  StoreMessageOperation,
  MessageReconciliation,
  RedisClient,
  HubEventProcessor,
  EventStreamHubSubscriber,
  EventStreamConnection,
  HubEventStreamConsumer,
  HubSubscriber,
  MessageState,
  BasicHubSubscriber,
  allActiveDbMessagesOfTypeForFid,
} from "../index"; // If you want to use this as a standalone app, replace this import with "@farcaster/shuttle"
import { AppDb, migrateToLatest, Tables } from "./db";
import {
  AdminRpcClient,
  bytesToHexString,
  getAdminRpcClient,
  getStorageUnitExpiry,
  getStorageUnitType,
  HubEvent,
  HubRpcClient,
  isCastAddMessage,
  isCastRemoveMessage,
  isIdRegisterOnChainEvent,
  isMergeOnChainHubEvent,
  isSignerOnChainEvent,
  isStorageRentOnChainEvent,
  LegacyMessage,
  Message,
  MessageData,
  MessageType,
  OnChainEvent,
  OnChainEventRequest,
  OnChainEventType,
} from "@farcaster/hub-nodejs";
import { log } from "./log";
import { Command } from "@commander-js/extra-typings";
import { readFileSync } from "fs";
import {
  BACKFILL_FIDS,
  CONCURRENCY,
  HUB_HOST,
  HUB_SSL,
  MAX_FID,
  POSTGRES_URL,
  POSTGRES_SCHEMA,
  REDIS_URL,
  SHARD_INDEX,
  TOTAL_SHARDS,
  SNAPCHAIN_HOST,
  CLEAR_DB,
} from "./env";
import * as process from "node:process";
import url from "node:url";
import { err, ok, Result } from "neverthrow";
import { getQueue, getWorker } from "./worker";
import { Queue } from "bullmq";
import { bytesToHex, farcasterTimeToDate, sleep } from "../utils";
import { sql } from "kysely";

const hubId = "shuttle";

export class App implements MessageHandler {
  private readonly db: DB;
  private readonly dbSchema: string;
  private hubSubscriber: HubSubscriber;
  private streamConsumer: HubEventStreamConsumer;
  public redis: RedisClient;
  private readonly hubId;
  private snapchainClient: HubRpcClient;
  private snapchainAdminClient: AdminRpcClient;
  private backendDb: DB;

  constructor(
    db: DB,
    backendDb: DB,
    dbSchema: string,
    redis: RedisClient,
    hubSubscriber: HubSubscriber,
    streamConsumer: HubEventStreamConsumer,
    snapchainClient: HubRpcClient,
    snapchainAdminClient: AdminRpcClient,
  ) {
    this.db = db;
    this.backendDb = backendDb;
    this.dbSchema = dbSchema;
    this.redis = redis;
    this.hubSubscriber = hubSubscriber;
    this.hubId = hubId;
    this.streamConsumer = streamConsumer;
    this.snapchainClient = snapchainClient;
    this.snapchainAdminClient = snapchainAdminClient;
  }

  static async create(
    dbUrl: string,
    dbSchema: string,
    redisUrl: string,
    hubUrl: string,
    snapchainUrl: string,
    totalShards: number,
    shardIndex: number,
    hubSSL = false,
    clearDb = false,
  ) {
    const db = getDbClient(dbUrl, dbSchema);
    const backendDb = getDbClient(
      "postgres://read_prod:bbgrq8k3jVLUBRUKOJ3HZVXp2mqOAynE@read.cluster-custom-cbfnhl1vqqgl.us-east-1.rds.amazonaws.com:5432/indexer_prod",
      dbSchema,
    );
    const hub = getHubClient(hubUrl, { ssl: hubSSL });
    const snapchainClient = getHubClient(snapchainUrl, { ssl: false }).client;
    const snapchainAdminClient = await getAdminRpcClient(snapchainUrl);
    const redis = RedisClient.create(redisUrl);
    if (clearDb) {
      await sql`TRUNCATE TABLE messages`.execute(db);
      await sql`TRUNCATE TABLE onchain_events`.execute(db);
    }
    const eventStreamForWrite = new EventStreamConnection(redis.client);
    const eventStreamForRead = new EventStreamConnection(redis.client);
    const shardKey = totalShards === 0 ? "all" : `${shardIndex}`;
    const hubSubscriber = new BasicHubSubscriber(
      hubId,
      hub,
      eventStreamForWrite,
      log,
      shardKey,
      undefined,
      totalShards,
      shardIndex,
      1000 * 60 * 10, // 10 mins
    );
    const streamConsumer = new HubEventStreamConsumer(hub, eventStreamForRead, shardKey);

    return new App(
      db,
      backendDb,
      dbSchema,
      redis,
      hubSubscriber,
      streamConsumer,
      snapchainClient,
      snapchainAdminClient,
    );
  }

  async handleOnChainEvent(onChainEvent: OnChainEvent, txn: DB, submitToSnapchain = false) {
    if (submitToSnapchain) {
      const result = await this.snapchainAdminClient.submitOnChainEvent(onChainEvent);
      if (result.isErr()) {
        log.info(`Unable to submit onchain event to snapchain ${result.error.message} ${result.error.stack}`);
        return;
      }
    }

    let body = {};
    if (isIdRegisterOnChainEvent(onChainEvent)) {
      body = {
        eventType: onChainEvent.idRegisterEventBody.eventType,
        from: bytesToHex(onChainEvent.idRegisterEventBody.from),
        to: bytesToHex(onChainEvent.idRegisterEventBody.to),
        recoveryAddress: bytesToHex(onChainEvent.idRegisterEventBody.recoveryAddress),
      };
    } else if (isSignerOnChainEvent(onChainEvent)) {
      body = {
        eventType: onChainEvent.signerEventBody.eventType,
        key: bytesToHex(onChainEvent.signerEventBody.key),
        keyType: onChainEvent.signerEventBody.keyType,
        metadata: bytesToHex(onChainEvent.signerEventBody.metadata),
        metadataType: onChainEvent.signerEventBody.metadataType,
      };
    } else if (isStorageRentOnChainEvent(onChainEvent)) {
      body = {
        eventType: getStorageUnitType(onChainEvent),
        expiry: getStorageUnitExpiry(onChainEvent),
        units: onChainEvent.storageRentEventBody.units,
        payer: bytesToHex(onChainEvent.storageRentEventBody.payer),
      };
    }
    try {
      await (txn as AppDb)
        .insertInto("onchain_events")
        .values({
          fid: onChainEvent.fid,
          timestamp: new Date(onChainEvent.blockTimestamp * 1000),
          blockNumber: onChainEvent.blockNumber,
          logIndex: onChainEvent.logIndex,
          txHash: onChainEvent.transactionHash,
          type: onChainEvent.type,
          body: body,
        })
        .execute();
      log.info(`Recorded OnchainEvent ${onChainEvent.type} for fid  ${onChainEvent.fid}`);
    } catch (e) {
      log.error("Failed to insert onchain event", e);
    }
  }

  async onHubEvent(event: HubEvent, txn: DB): Promise<boolean> {
    if (isMergeOnChainHubEvent(event)) {
      const onChainEvent = event.mergeOnChainEventBody.onChainEvent;
      await this.handleOnChainEvent(onChainEvent, txn);
    }
    return false;
  }

  async handleMessageMerge(
    message: Message,
    txn: DB,
    operation: StoreMessageOperation,
    state: MessageState,
    isNew: boolean,
    wasMissed: boolean,
  ): Promise<void> {
    if (!isNew) {
      // Message was already in the db, no-op
      return;
    }

    const appDB = txn as unknown as AppDb; // Need this to make typescript happy, not clean way to "inherit" table types

    // Example of how to materialize casts into a separate table. Insert casts into a separate table, and mark them as deleted when removed
    // Note that since we're relying on "state", this can sometimes be invoked twice. e.g. when a CastRemove is merged, this call will be invoked 2 twice:
    // castAdd, operation=delete, state=deleted (the cast that the remove is removing)
    // castRemove, operation=merge, state=deleted (the actual remove message)
    const isCastMessage = isCastAddMessage(message) || isCastRemoveMessage(message);
    if (isCastMessage && state === "created") {
      await appDB
        .insertInto("casts")
        .values({
          fid: message.data.fid,
          hash: message.hash,
          text: message.data.castAddBody?.text || "",
          timestamp: farcasterTimeToDate(message.data.timestamp) || new Date(),
        })
        .execute();
    } else if (isCastMessage && state === "deleted") {
      await appDB
        .updateTable("casts")
        .set({ deletedAt: farcasterTimeToDate(message.data.timestamp) || new Date() })
        .where("hash", "=", message.hash)
        .execute();
    }

    const messageDesc = wasMissed ? `missed message (${operation})` : `message (${operation})`;
    log.info(
      `${state} ${messageDesc} ${bytesToHexString(message.hash)._unsafeUnwrap()} (type ${message.data?.type}) (fid ${
        message.data?.fid
      })`,
    );
  }

  async start() {
    await this.ensureMigrations();
    // Hub subscriber listens to events from the hub and writes them to a redis stream. This allows for scaling by
    // splitting events to multiple streams
    await this.hubSubscriber.start();

    // Sleep 10 seconds to give the subscriber a chance to create the stream for the first time.
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    log.info("Starting stream consumer");
    // Stream consumer reads from the redis stream and inserts them into postgres
    await this.streamConsumer.start(async (event) => {
      await this.processHubEvent(event);
      return ok({ skipped: false });
    });
  }

  async reconcileOnchainEvents(fid: number, eventType: OnChainEventType) {
    // Just sync all of them, no need to reconcile
    // TODO(aditi): Handle multiple pages
    if (!this.hubSubscriber.hubClient) {
      throw "Missing hub client";
    }

    const result = await this.hubSubscriber.hubClient.getOnChainEvents(OnChainEventRequest.create({ fid, eventType }));

    if (result.isErr()) {
      return err(result.error);
    }

    for (const onChainEvent of result.value.events) {
      await this.handleOnChainEvent(onChainEvent, this.db, true);
    }

    return ok(undefined);
  }

  async reconcileFidsAgainstBackendDb(fids: number[]) {
    for (const fid of fids) {
      const messageTypes = [
        MessageType.CAST_ADD,
        MessageType.REACTION_ADD,
        MessageType.LINK_ADD,
        MessageType.VERIFICATION_ADD_ETH_ADDRESS,
        MessageType.USER_DATA_ADD,
      ];
      for (const type of messageTypes) {
        let pageNumber = 0;
        const pageSize = 100;
        while (true) {
          const messages = await allActiveDbMessagesOfTypeForFid(
            this.backendDb,
            fid,
            type,
            undefined,
            undefined,
            pageSize,
            pageSize * pageNumber,
          );
          if (messages.isErr()) {
            throw messages.error;
          }

          if (messages.value.length === 0) {
            break;
          }

          for (const dbMessage of messages.value) {
            const message = Message.decode(dbMessage.raw);

            if (!message.data) {
              return;
            }

            const newMessage = Message.create(message);
            newMessage.dataBytes = MessageData.encode(message.data).finish();
            // TODO(aditi): Is this right? Need to leave data as is to avoid message missing data error.
            // newMessage.data = undefined;
            const result = await this.snapchainClient.submitMessage(newMessage);
            if (result.isErr()) {
              log.info(`Unable to submit message to snapchain ${result.error.message} ${result.error.stack}`);
              continue;
            }
            HubEventProcessor.handleMissingMessage(this.db, message, this, false);
          }

          pageNumber += 1;
        }
      }
    }
  }

  async reconcileFids(fids: number[]) {
    // biome-ignore lint/style/noNonNullAssertion: client is always initialized
    const reconciler = new MessageReconciliation(this.hubSubscriber.hubClient!, this.db, log);
    for (const fid of fids) {
      await reconciler.reconcileMessagesForFid(
        fid,
        async (message, missingInDb, prunedInDb, revokedInDb) => {
          if (missingInDb) {
            await HubEventProcessor.handleMissingMessage(this.db, message, this, false);
          } else if (prunedInDb || revokedInDb) {
            const messageDesc = prunedInDb ? "pruned" : revokedInDb ? "revoked" : "existing";
            log.info(`Reconciled ${messageDesc} message ${bytesToHexString(message.hash)._unsafeUnwrap()}`);
          }
        },
        async (message, missingInHub) => {
          if (missingInHub) {
            await HubEventProcessor.handleMissingMessage(this.db, Message.decode(message.raw), this, missingInHub);
          }
        },
      );
    }
  }

  async reconcileAllOnchainEvents(fids: number[]) {
    await this.ensureMigrations();

    for (const fid of fids) {
      const storageResult = await this.reconcileOnchainEvents(fid, OnChainEventType.EVENT_TYPE_STORAGE_RENT);
      if (storageResult.isErr()) {
        log.info(`Unable to get storage events ${storageResult.error.message} ${storageResult.error.stack}`);
      }

      const signerResult = await this.reconcileOnchainEvents(fid, OnChainEventType.EVENT_TYPE_SIGNER);
      if (signerResult.isErr()) {
        log.info(`Unable to get signer events ${signerResult.error.message} ${signerResult.error.stack}`);
      }

      // TODO(aditi): Signer migrated for fid 0

      const idRegisterResult = await this.reconcileOnchainEvents(fid, OnChainEventType.EVENT_TYPE_ID_REGISTER);
      if (idRegisterResult.isErr()) {
        log.info(`Unable to get signer events ${idRegisterResult.error.message} ${idRegisterResult.error.stack}`);
      }
    }
  }

  async backfillFids(fids: number[], backfillQueue: Queue, jobKind: "reconcile" | "reconcileOnchainEvents") {
    await this.ensureMigrations();

    const startedAt = Date.now();
    if (fids.length === 0) {
      log.info("No fids provided");
      const maxFidResult = await this.hubSubscriber.hubClient.getFids({ pageSize: 1, reverse: true });
      if (maxFidResult.isErr()) {
        log.error("Failed to get max fid", maxFidResult.error);
        throw maxFidResult.error;
      }
      const maxFid = MAX_FID ? parseInt(MAX_FID) : maxFidResult.value.fids[0];
      if (!maxFid) {
        log.error("Max fid was undefined");
        throw new Error("Max fid was undefined");
      }
      log.info(`Queuing up fids up to: ${maxFid}`);
      const fids = Array.from({ length: maxFid }, (_, i) => i).map((fid) => fid + 1);
      await backfillQueue.add(jobKind, { fids });
    } else {
      log.info(`Adding fids ${fids}`);
      await backfillQueue.add(jobKind, { fids });
    }
    await backfillQueue.add("completionMarker", { startedAt });
    log.info("Backfill jobs queued");
  }

  private async processHubEvent(hubEvent: HubEvent) {
    await HubEventProcessor.processHubEvent(this.db, hubEvent, this);
  }

  async ensureMigrations() {
    const result = await migrateToLatest(this.db, this.dbSchema, log);
    if (result.isErr()) {
      log.error("Failed to migrate database", result.error);
      throw result.error;
    }
  }

  async stop() {
    this.hubSubscriber.stop();
    const lastEventId = await this.redis.getLastProcessedEvent(this.hubId);
    log.info(`Stopped at eventId: ${lastEventId}`);
  }
}

//If the module is being run directly, start the shuttle
if (import.meta.url.endsWith(url.pathToFileURL(process.argv[1] || "").toString())) {
  async function start() {
    log.info(`Creating app connecting to: ${POSTGRES_URL}, ${REDIS_URL}, ${HUB_HOST}`);
    const app = await App.create(
      POSTGRES_URL,
      POSTGRES_SCHEMA,
      REDIS_URL,
      HUB_HOST,
      SNAPCHAIN_HOST,
      TOTAL_SHARDS,
      SHARD_INDEX,
      HUB_SSL,
      CLEAR_DB,
    );
    log.info("Starting shuttle");
    await app.start();
  }

  async function backfillOnChainEvents() {
    log.info(`Creating app connecting to: ${POSTGRES_URL}, ${REDIS_URL}, ${HUB_HOST}`);
    const app = await App.create(
      POSTGRES_URL,
      POSTGRES_SCHEMA,
      REDIS_URL,
      HUB_HOST,
      SNAPCHAIN_HOST,
      TOTAL_SHARDS,
      SHARD_INDEX,
      HUB_SSL,
      CLEAR_DB,
    );
    const fids = BACKFILL_FIDS ? BACKFILL_FIDS.split(",").map((fid) => parseInt(fid)) : [];
    log.info(`Backfilling fids: ${fids}`);

    // Don't want any carry over from past runs for now
    const backfillQueue = getQueue(app.redis.client);
    await backfillQueue.drain(true);

    await app.backfillFids(fids, backfillQueue, "reconcileOnchainEvents");

    // Start the worker after initiating a backfill
    const worker = getWorker(app, app.redis.client, log, CONCURRENCY);
    await worker.run();
    return;
  }

  async function backfill() {
    log.info(`Creating app connecting to: ${POSTGRES_URL}, ${REDIS_URL}, ${HUB_HOST}`);
    const app = await App.create(
      POSTGRES_URL,
      POSTGRES_SCHEMA,
      REDIS_URL,
      HUB_HOST,
      SNAPCHAIN_HOST,
      TOTAL_SHARDS,
      SHARD_INDEX,
      HUB_SSL,
      CLEAR_DB,
    );
    const fids = BACKFILL_FIDS ? BACKFILL_FIDS.split(",").map((fid) => parseInt(fid)) : [];
    log.info(`Backfilling fids: ${fids}`);

    // Don't want any carry over from past runs for now
    const backfillQueue = getQueue(app.redis.client);
    await backfillQueue.drain(true);

    await app.backfillFids(fids, backfillQueue, "reconcile");

    // Start the worker after initiating a backfill
    const worker = getWorker(app, app.redis.client, log, CONCURRENCY);
    await worker.run();
    return;
  }

  async function worker() {
    log.info(`Starting worker connecting to: ${POSTGRES_URL}, ${REDIS_URL}, ${HUB_HOST}`);
    const app = await App.create(
      POSTGRES_URL,
      POSTGRES_SCHEMA,
      REDIS_URL,
      HUB_HOST,
      SNAPCHAIN_HOST,
      TOTAL_SHARDS,
      SHARD_INDEX,
      HUB_SSL,
      CLEAR_DB,
    );
    const worker = getWorker(app, app.redis.client, log, CONCURRENCY);
    await worker.run();
  }

  // for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  //   process.on(signal, async () => {
  //     log.info(`Received ${signal}. Shutting down...`);
  //     (async () => {
  //       await sleep(10_000);
  //       log.info(`Shutdown took longer than 10s to complete. Forcibly terminating.`);
  //       process.exit(1);
  //     })();
  //     await app?.stop();
  //     process.exit(1);
  //   });
  // }

  const program = new Command()
    .name("shuttle")
    .description("Synchronizes a Farcaster Hub with a Postgres database")
    .version(JSON.parse(readFileSync("./package.json").toString()).version);

  program.command("start").description("Starts the shuttle").action(start);
  program.command("backfill").description("Queue up backfill for the worker").action(backfill);
  program
    .command("backfill-onchain-events")
    .description("Queue up backfill for the worker")
    .action(backfillOnChainEvents);
  program.command("worker").description("Starts the backfill worker").action(worker);

  program.parse(process.argv);
}
