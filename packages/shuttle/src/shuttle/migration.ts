import { DB, getDbClient, getHubClient, allActiveDbMessagesOfTypeForFid } from "../index"; // If you want to use this as a standalone app, replace this import with "@farcaster/shuttle"
import {
  AdminRpcClient,
  getAdminRpcClient,
  HubError,
  HubResult,
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
import {
  BACKFILL_FIDS,
  HUB_ADMIN_HOST,
  HUB_HOST,
  MAX_FID,
  ONCHAIN_EVENTS_HUB_HOST,
  POSTGRES_SCHEMA,
  SNAPCHAIN_HOST,
} from "../example-app/env";
import * as process from "node:process";
import url from "node:url";
import { err, ok } from "neverthrow";
import { sleep } from "src/utils";

export class Migration {
  private snapchainClient: HubRpcClient;
  private snapchainAdminClient: AdminRpcClient;
  private hubClient: HubRpcClient;
  private hubAdminClient: AdminRpcClient;
  private onchainEventsHubClient: HubRpcClient;
  private backendDb: DB;

  constructor(
    backendDb: DB,
    snapchainClient: HubRpcClient,
    hubClient: HubRpcClient,
    snapchainAdminClient: AdminRpcClient,
    hubAdminClient: AdminRpcClient,
    onchainEventsHubClient: HubRpcClient,
  ) {
    this.backendDb = backendDb;
    this.snapchainClient = snapchainClient;
    this.hubClient = hubClient;
    this.snapchainAdminClient = snapchainAdminClient;
    this.hubAdminClient = hubAdminClient;
    this.onchainEventsHubClient = onchainEventsHubClient;
  }

  static async create(
    dbSchema: string,
    onchainEventsHubUrl: string,
    snapchainUrl: string,
    hubUrl: string,
    hubAdminUrl: string,
  ) {
    const backendDb = getDbClient(
      "postgres://read_prod:bbgrq8k3jVLUBRUKOJ3HZVXp2mqOAynE@read.cluster-custom-cbfnhl1vqqgl.us-east-1.rds.amazonaws.com:5432/indexer_prod",
      dbSchema,
    );
    const snapchainClient = getHubClient(snapchainUrl, { ssl: false }).client;
    const snapchainAdminClient = await getAdminRpcClient(snapchainUrl);
    const onchainEventsHubClient = getHubClient(onchainEventsHubUrl, { ssl: true });
    const hubClient = getHubClient(hubUrl, { ssl: false });
    const hubAdminClient = await getAdminRpcClient(hubAdminUrl);
    return new Migration(
      backendDb,
      snapchainClient,
      hubClient.client,
      snapchainAdminClient,
      hubAdminClient,
      onchainEventsHubClient.client,
    );
  }

  async ingestOnchainEvents(fid: number, eventType: OnChainEventType) {
    // Just sync all of them, no need to reconcile
    // TODO(aditi): Handle multiple pages
    const result = await this.onchainEventsHubClient.getOnChainEvents(OnChainEventRequest.create({ fid, eventType }));

    if (result.isErr()) {
      return err(result.error);
    }

    let numOnchainEvents = 0;
    let numSkipped = 0;
    for (const onChainEvent of result.value.events) {
      const snapchainResult = await this.submitWithRetry(3, () => {
        return this.snapchainAdminClient.submitOnChainEvent(onChainEvent);
      });
      if (snapchainResult.isErr()) {
        log.info(
          `Unable to submit onchain event to snapchain ${snapchainResult.error.message} ${snapchainResult.error.stack}`,
        );
        if (this.shouldRetry(snapchainResult.error)) {
          log.info("Skipping hub submit to avoid mismatch");
          numSkipped += 1;
          continue;
        }
      }

      const hubResult = await this.hubAdminClient.submitOnChainEvent(onChainEvent);
      if (hubResult.isErr()) {
        log.info(`Unable to submit onchain event to hub ${hubResult.error.message} ${hubResult.error.stack}`);
      }

      numOnchainEvents += 1;
    }

    log.info(`Processed ${numOnchainEvents} onchain events for fid ${fid}. Skipped ${numSkipped}.`);

    return ok(undefined);
  }

  async ingestUsernameProofs(fids: number[]) {
    for (const fid of fids) {
      const result = await this.onchainEventsHubClient.getUserNameProofsByFid({ fid });
      if (result.isErr()) {
        log.info(`Unable to get username proofs for fid ${fid}`);
        continue;
      }

      let numSkipped = 0;
      for (const usernameProof of result.value.proofs) {
        const snapchainResult = await this.submitWithRetry(3, () => {
          return this.snapchainAdminClient.submitUserNameProof(usernameProof);
        });
        if (snapchainResult.isErr()) {
          log.info(`Unable to submit username proof for fid ${fid} to snapchain ${snapchainResult.error.message}`);
          if (this.shouldRetry(snapchainResult.error)) {
            log.info("Skipping hub submit to avoid mismatch");
            numSkipped += 1;
            continue;
          }
        }

        const hubResult = await this.hubAdminClient.submitUserNameProof(usernameProof);
        if (hubResult.isErr()) {
          log.info(`Unable to submit username proof for fid ${fid} to hub ${hubResult.error.message}`);
        }
      }

      log.info(`Processed ${result.value.proofs.length} username proofs for fid ${fid}. Skipped ${numSkipped}.`);
    }
  }

  async ingestAllOnchainEvents(fids: number[]) {
    for (const fid of fids) {
      const storageResult = await this.ingestOnchainEvents(fid, OnChainEventType.EVENT_TYPE_STORAGE_RENT);
      if (storageResult.isErr()) {
        log.info(
          `Unable to get storage events for fid ${fid} ${storageResult.error.message} ${storageResult.error.stack}`,
        );
      }

      const signerResult = await this.ingestOnchainEvents(fid, OnChainEventType.EVENT_TYPE_SIGNER);
      if (signerResult.isErr()) {
        log.info(
          `Unable to get signer events for fid ${fid} ${signerResult.error.message} ${signerResult.error.stack}`,
        );
      }

      // TODO(aditi): Signer migrated for fid 0

      const idRegisterResult = await this.ingestOnchainEvents(fid, OnChainEventType.EVENT_TYPE_ID_REGISTER);
      if (idRegisterResult.isErr()) {
        log.info(
          `Unable to get signer events for fid ${fid} ${idRegisterResult.error.message} ${idRegisterResult.error.stack}`,
        );
      }
    }
  }

  shouldRetry(error: HubError) {
    return error.message.includes("channel is full");
  }

  async submitWithRetry<T>(numRetries: number, submitFn: () => Promise<HubResult<T>>) {
    let result = await submitFn();
    let numRetriesRemaining = numRetries;
    let waitTime = 1000;

    if (result.isErr() && this.shouldRetry(result.error) && numRetriesRemaining > 0) {
      await sleep(waitTime);
      numRetriesRemaining -= 1;
      waitTime *= 2;
      result = await submitFn();
    }

    return result;
  }

  async compareMessageCounts(fid: number) {
    const hubCounts = await this.hubClient.getCurrentStorageLimitsByFid({ fid });

    if (hubCounts.isErr()) {
      return err(hubCounts.error);
    }

    const snapchainCounts = await this.snapchainClient.getCurrentStorageLimitsByFid({ fid });

    if (snapchainCounts.isErr()) {
      return err(snapchainCounts.error);
    }

    const hubUsages = new Map();
    for (const limits of hubCounts.value.limits) {
      hubUsages.set(limits.name, limits.used);
    }

    const snapchainUsages = new Map();
    for (const limits of snapchainCounts.value.limits) {
      snapchainUsages.set(limits.name, limits.used);
    }

    for (const [name, hubUsage] of hubUsages.entries()) {
      const snapchainUsage = snapchainUsages.get(name);
      if (hubUsage !== snapchainUsage) {
        log.info(`USAGE MISMATCH: type: ${name}, hub usage: ${hubUsage}, snapchain usage ${snapchainUsage}`);
      }
    }

    return ok(undefined);
  }

  async ingestMessagesFromDb(fids: number[]) {
    for (const fid of fids) {
      let numMessages = 0;
      let numErrorsOnHub = 0;
      let numErrorsOnSnapchain = 0;
      let numSkipped = 0;
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

            const snapchainResult = await this.submitWithRetry(3, async () => {
              return this.snapchainClient.submitMessage(newMessage);
            });
            const hubResult = await this.hubClient.submitMessage(newMessage);

            if (snapchainResult.isErr()) {
              log.info(
                `Unable to submit message to snapchain ${snapchainResult.error.message} ${snapchainResult.error.stack}`,
              );
              if (this.shouldRetry(snapchainResult.error)) {
                log.info("Skipping hub submit to avoid mismatch");
                numSkipped += 1;
                continue;
              }
              numErrorsOnSnapchain += 1;
            }

            if (hubResult.isErr()) {
              log.info(`Unable to submit message to hub ${hubResult.error.message} ${hubResult.error.stack}`);
              numErrorsOnHub += 1;
            }
            numMessages += 1;
          }

          pageNumber += 1;
        }
      }

      const result = await this.hubAdminClient.pruneMessages({ fid });
      let numMessagesPruned = 0;
      if (result.isErr()) {
        log.info(`Unable to prune hub messages for fid ${fid}`);
      } else {
        numMessagesPruned = result.value.numMessagesPruned;
      }

      // TODO(aditi): This log should have better structure.
      log.info(
        `Submitted ${numMessages} messages for fid ${fid}. ${numErrorsOnHub} hub errors. ${numErrorsOnSnapchain} snapchain errors. ${numMessagesPruned} pruned on hub. Skipped ${numSkipped}.`,
      );

      const compareResult = await this.compareMessageCounts(fid);
      if (compareResult.isErr()) {
        log.info(`Error comparing message counts ${compareResult.error}`);
      }
    }
  }
}

if (import.meta.url.endsWith(url.pathToFileURL(process.argv[1] || "").toString())) {
  async function backfillOnChainEvents() {
    const migration = await Migration.create(
      POSTGRES_SCHEMA,
      ONCHAIN_EVENTS_HUB_HOST,
      SNAPCHAIN_HOST,
      HUB_HOST,
      HUB_ADMIN_HOST,
    );
    const fids = BACKFILL_FIDS
      ? BACKFILL_FIDS.split(",").map((fid) => parseInt(fid))
      : Array.from({ length: parseInt(MAX_FID) }, (_, i) => i + 1);
    await migration.ingestAllOnchainEvents(fids);
    await migration.ingestUsernameProofs(fids);
    return;
  }

  async function backfillMessages() {
    const migration = await Migration.create(
      POSTGRES_SCHEMA,
      ONCHAIN_EVENTS_HUB_HOST,
      SNAPCHAIN_HOST,
      HUB_HOST,
      HUB_ADMIN_HOST,
    );
    const fids = BACKFILL_FIDS
      ? BACKFILL_FIDS.split(",").map((fid) => parseInt(fid))
      : Array.from({ length: parseInt(MAX_FID) }, (_, i) => i + 1);

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
