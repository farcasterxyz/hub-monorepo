import { DB, getDbClient, getHubClient, allActiveDbMessagesOfTypeForFid } from "../index"; // If you want to use this as a standalone app, replace this import with "@farcaster/shuttle"
import {
  AdminRpcClient,
  getAdminRpcClient,
  HubRpcClient,
  Message,
  MessageData,
  MessageType,
  OnChainEventRequest,
  OnChainEventType,
} from "@farcaster/hub-nodejs";
import { log } from "../example-app/log";
import { Command } from "@commander-js/extra-typings";
import { readFileSync } from "fs";
import { BACKFILL_FIDS, HUB_HOST, MAX_FID, POSTGRES_SCHEMA, SNAPCHAIN_HOST } from "../example-app/env";
import * as process from "node:process";
import url from "node:url";
import { err, ok } from "neverthrow";

export class Migration {
  private snapchainClient: HubRpcClient;
  private snapchainAdminClient: AdminRpcClient;
  private onchainEventsHubClient: HubRpcClient;
  private backendDb: DB;

  constructor(
    backendDb: DB,
    snapchainClient: HubRpcClient,
    snapchainAdminClient: AdminRpcClient,
    onchainEventsHubClient: HubRpcClient,
  ) {
    this.backendDb = backendDb;
    this.snapchainClient = snapchainClient;
    this.snapchainAdminClient = snapchainAdminClient;
    this.onchainEventsHubClient = onchainEventsHubClient;
  }

  static async create(dbSchema: string, onchainEventsHubUrl: string, snapchainUrl: string) {
    const backendDb = getDbClient(
      "postgres://read_prod:bbgrq8k3jVLUBRUKOJ3HZVXp2mqOAynE@read.cluster-custom-cbfnhl1vqqgl.us-east-1.rds.amazonaws.com:5432/indexer_prod",
      dbSchema,
    );
    const snapchainClient = getHubClient(snapchainUrl, { ssl: false }).client;
    const snapchainAdminClient = await getAdminRpcClient(snapchainUrl);
    const onchainEventsHubClient = getHubClient(onchainEventsHubUrl, { ssl: false });
    return new Migration(backendDb, snapchainClient, snapchainAdminClient, onchainEventsHubClient.client);
  }

  async ingestOnchainEvents(fid: number, eventType: OnChainEventType) {
    // Just sync all of them, no need to reconcile
    // TODO(aditi): Handle multiple pages
    const result = await this.onchainEventsHubClient.getOnChainEvents(OnChainEventRequest.create({ fid, eventType }));

    if (result.isErr()) {
      return err(result.error);
    }

    for (const onChainEvent of result.value.events) {
      const result = await this.snapchainAdminClient.submitOnChainEvent(onChainEvent);
      if (result.isErr()) {
        log.info(`Unable to submit onchain event to snapchain ${result.error.message} ${result.error.stack}`);
      }
    }

    return ok(undefined);
  }

  async ingestAllOnchainEvents(fids: number[]) {
    for (const fid of fids) {
      const storageResult = await this.ingestOnchainEvents(fid, OnChainEventType.EVENT_TYPE_STORAGE_RENT);
      if (storageResult.isErr()) {
        log.info(`Unable to get storage events ${storageResult.error.message} ${storageResult.error.stack}`);
      }

      const signerResult = await this.ingestOnchainEvents(fid, OnChainEventType.EVENT_TYPE_SIGNER);
      if (signerResult.isErr()) {
        log.info(`Unable to get signer events ${signerResult.error.message} ${signerResult.error.stack}`);
      }

      // TODO(aditi): Signer migrated for fid 0

      const idRegisterResult = await this.ingestOnchainEvents(fid, OnChainEventType.EVENT_TYPE_ID_REGISTER);
      if (idRegisterResult.isErr()) {
        log.info(`Unable to get signer events ${idRegisterResult.error.message} ${idRegisterResult.error.stack}`);
      }
    }
  }

  async ingestMessagesFromDb(fids: number[]) {
    for (const fid of fids) {
      const messageTypes = [
        MessageType.CAST_ADD,
        MessageType.CAST_REMOVE,
        MessageType.REACTION_ADD,
        MessageType.REACTION_REMOVE,
        MessageType.LINK_ADD,
        MessageType.LINK_REMOVE,
        MessageType.LINK_COMPACT_STATE,
        MessageType.VERIFICATION_ADD_ETH_ADDRESS,
        MessageType.VERIFICATION_REMOVE,
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
            newMessage.data = undefined;
            // TODO(aditi): Is this right? Need to leave data as is to avoid message missing data error.
            // newMessage.data = undefined;
            const result = await this.snapchainClient.submitMessage(newMessage);
            if (result.isErr()) {
              log.info(`Unable to submit message to snapchain ${result.error.message} ${result.error.stack}`);
            }
          }

          pageNumber += 1;
        }
      }
    }
  }
}

//If the module is being run directly, start the shuttle
if (import.meta.url.endsWith(url.pathToFileURL(process.argv[1] || "").toString())) {
  async function backfillOnChainEvents() {
    const migration = await Migration.create(POSTGRES_SCHEMA, HUB_HOST, SNAPCHAIN_HOST);
    const fids = BACKFILL_FIDS
      ? BACKFILL_FIDS.split(",").map((fid) => parseInt(fid))
      : Array.from<number>({ length: parseInt(MAX_FID) });
    await migration.ingestAllOnchainEvents(fids);
    return;
  }

  async function backfillMessages() {
    const migration = await Migration.create(POSTGRES_SCHEMA, HUB_HOST, SNAPCHAIN_HOST);
    const fids = BACKFILL_FIDS
      ? BACKFILL_FIDS.split(",").map((fid) => parseInt(fid))
      : Array.from<number>({ length: parseInt(MAX_FID) });

    await migration.ingestMessagesFromDb(fids);

    return;
  }

  const program = new Command()
    .name("migration")
    .description("Synchronizes a Farcaster Hub with a Postgres database")
    .version(JSON.parse(readFileSync("./package.json").toString()).version);

  program.command("backfill-messages").description("Queue up backfill for the worker").action(backfillMessages);
  program
    .command("backfill-onchain-events")
    .description("Queue up backfill for the worker")
    .action(backfillOnChainEvents);

  program.parse(process.argv);
}
