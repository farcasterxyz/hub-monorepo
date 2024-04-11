import { DB, getDbClient } from "@farcaster/hub-shuttle";
import { migrateToLatest } from "./migration";
import { getHubClient } from "@farcaster/hub-shuttle";
import { bytesToHexString, HubEvent, Message } from "@farcaster/hub-nodejs";
import { log } from "./log";
import { HubSubscriber, HubSubscriberImpl } from "@farcaster/hub-shuttle";
import { RedisClient } from "@farcaster/hub-shuttle";
import { HubEventProcessor } from "@farcaster/hub-shuttle";
import { Command } from "@commander-js/extra-typings";
import { readFileSync } from "fs";
import { BACKFILL_FIDS, HUB_HOST, HUB_SSL, POSTGRES_URL, REDIS_URL } from "./env";
import * as process from "node:process";
import url from "node:url";
import { MessageHandler, StoreMessageOperation, MessageReconciliation } from "@farcaster/hub-shuttle";

const hubId = "shuttle";

export class App implements MessageHandler {
  private readonly db: DB;
  private hubSubscriber: HubSubscriber;
  private redis: RedisClient;
  private readonly hubId;

  constructor(db: DB, redis: RedisClient, hubSubscriber: HubSubscriber) {
    this.db = db;
    this.redis = redis;
    this.hubSubscriber = hubSubscriber;
    this.hubId = hubId;

    this.hubSubscriber.on("event", async (hubEvent) => {
      void this.processHubEvent(hubEvent);
      await this.redis.setLastProcessedEvent(hubId, hubEvent.id);
    });
  }

  static create(dbUrl: string, redisUrl: string, hubUrl: string, hubSSL = false) {
    const db = getDbClient(dbUrl);
    const hub = getHubClient(hubUrl, { ssl: hubSSL });

    const hubSubscriber = new HubSubscriberImpl(hubId, hub, log);
    const redis = RedisClient.create(redisUrl);
    return new App(db, redis, hubSubscriber);
  }

  async handleMessageMerge(
    message: Message,
    _txn: DB,
    _operation: StoreMessageOperation,
    wasMissed: false,
  ): Promise<void> {
    const messageDesc = wasMissed ? "missed message" : "message";
    log.info(`Stored ${messageDesc} ${bytesToHexString(message.hash)._unsafeUnwrap()} (type ${message.data?.type})`);
  }

  async start() {
    await this.ensureMigrations();

    const fromId = await this.redis.getLastProcessedEvent(hubId);
    log.info(`Starting from hub event id ${fromId}`);
    await this.hubSubscriber.start(fromId);
  }

  async reconcileFids(fids: number[]) {
    // biome-ignore lint/style/noNonNullAssertion: client is always initialized
    const reconciler = new MessageReconciliation(this.hubSubscriber.hubClient!, this.db, log);
    for (const fid of fids) {
      await reconciler.reconcileMessagesForFid(fid, async (message, missingInDb, prunedInDb, revokedInDb) => {
        if (missingInDb) {
          await HubEventProcessor.handleMissingMessage(this.db, message, this);
        } else if (prunedInDb || revokedInDb) {
          const messageDesc = prunedInDb ? "pruned" : revokedInDb ? "revoked" : "existing";
          log.info(`Reconciled ${messageDesc} message ${bytesToHexString(message.hash)._unsafeUnwrap()}`);
        }
      });
    }
  }

  private async processHubEvent(hubEvent: HubEvent) {
    await HubEventProcessor.processHubEvent(this.db, hubEvent, this);
  }

  async ensureMigrations() {
    const result = await migrateToLatest(this.db, log);
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
    const app = App.create(POSTGRES_URL, REDIS_URL, HUB_HOST, HUB_SSL);
    log.info("Starting shuttle");
    await app.start();
  }

  async function backfill() {
    log.info(`Creating app connecting to: ${POSTGRES_URL}, ${REDIS_URL}, ${HUB_HOST}`);
    const app = App.create(POSTGRES_URL, REDIS_URL, HUB_HOST, HUB_SSL);
    const fids = BACKFILL_FIDS.split(",").map((fid) => parseInt(fid));
    log.info(`Backfilling fids: ${fids}`);
    await app.reconcileFids(fids);
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
  program.command("backfill").description("Starts the shuttle").action(backfill);

  program.parse(process.argv);
}
