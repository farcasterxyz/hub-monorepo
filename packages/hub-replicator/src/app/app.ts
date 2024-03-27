import { getDbClient, migrateToLatest, Tables } from "./db";
import { getHubClient } from "../replicator/hub";
import { Kysely } from "kysely";
import { HubEvent, MessageType } from "@farcaster/hub-nodejs";
import { log } from "../log";
import { HubSubscriber, HubSubscriberImpl } from "../replicator/hubSubscriber";
import { RedisClient } from "../replicator/redis";
import { HubEventProcessor } from "../replicator/hubEventProcessor";
import { Command } from "@commander-js/extra-typings";
import { readFileSync } from "fs";
import { HUB_HOST, HUB_SSL, POSTGRES_URL, REDIS_URL } from "./env";
import * as process from "node:process";
import { MessageReconciliation } from "../replicator/messageReconciliation";

const hubId = "replicator";

export class App {
  private db: Kysely<Tables>;
  private hubSubscriber: HubSubscriber;
  private redis: RedisClient;
  private hubId = "";
  private reconciler: MessageReconciliation | undefined;

  constructor(
    db: Kysely<Tables>,
    redis: RedisClient,
    hubSubscriber: HubSubscriber,
    reconciler?: MessageReconciliation,
  ) {
    this.db = db;
    this.redis = redis;
    this.hubSubscriber = hubSubscriber;
    this.reconciler = reconciler;
    this.hubId = "replicator";

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
    const reconciler = new MessageReconciliation(hub, db);
    return new App(db, redis, hubSubscriber, reconciler);
  }

  async start() {
    await this.ensureMigrations();

    if (this.reconciler) {
      await this.reconciler.reconcileMessagesForFid(389);
    }

    // const fromId = await this.redis.getLastProcessedEvent(hubId);
    // log.info(`Starting from hub event id ${fromId}`);
    // await this.hubSubscriber.start(fromId);
  }

  private async processHubEvent(hubEvent: HubEvent) {
    await HubEventProcessor.processHubEvent(this.db, hubEvent);
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

//If the module is being run directly, start the replicator
//Otherwise, export the start function

if (import.meta.url.endsWith(process.argv[1] || "")) {
  let app: App;
  async function start() {
    log.info(`Creating app connecting to: ${POSTGRES_URL}, ${REDIS_URL}, ${HUB_HOST}`);
    app = App.create(POSTGRES_URL, REDIS_URL, HUB_HOST, HUB_SSL);
    log.info("Starting replicator");
    app.start();
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
    .name("replicator")
    .description("Synchronizes a Farcaster Hub with a Postgres database")
    .version(JSON.parse(readFileSync("./package.json").toString()).version);

  program.command("start").description("Starts the replicator").action(start);

  program.parse(process.argv);
}
