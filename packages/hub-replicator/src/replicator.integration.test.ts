import { getDbClient, migrateToLatest, Tables } from "./app/db";
import { log } from "./log";
import { Kysely, sql } from "kysely";
import { App } from "./app/app";
import { Factories, HubEvent, HubEventType } from "@farcaster/hub-nodejs";
import { RedisClient } from "./replicator/redis";
import { HubSubscriber } from "./replicator/hubSubscriber";
import { sleep } from "./utils";
import { MessageReconciliation } from "./replicator/messageReconciliation";

let db: Kysely<Tables>;
let subscriber: FakeHubSubscriber;
let redis: RedisClient;

const POSTGRES_URL = process.env["POSTGRES_URL"] || "postgres://replicator:password@localhost:6541";
const REDIS_URL = process.env["REDIS_URL"] || "localhost:16379";

class FakeHubSubscriber extends HubSubscriber {
  public override async start(fromId?: number): Promise<void> {}
  public override stop(): void {}
  public override destroy(): void {}

  public emitEvent(event: HubEvent) {
    this.emit("event", event);
  }
}

beforeAll(async () => {
  const dbName = "replicator_test";
  if (process.env["NODE_ENV"] !== "test") {
    throw new Error("NODE_ENV must be set to test");
  }
  db = getDbClient(POSTGRES_URL);
  await sql`DROP DATABASE IF EXISTS replicator_test`.execute(db);
  await sql`CREATE DATABASE replicator_test`.execute(db);

  db = getDbClient(`${POSTGRES_URL}/${dbName}`);
  const result = await migrateToLatest(db, log);
  expect(result.isOk()).toBe(true);

  redis = RedisClient.create(REDIS_URL);
  await redis.clearForTest();
});

afterAll(async () => {
  await db.destroy();
});

describe("replicator", () => {
  let app: App;

  beforeEach(() => {
    subscriber = new FakeHubSubscriber();
    app = new App(db, redis, subscriber);
  });

  test("replicates hubs events to database tables", async () => {
    await expect(redis.getLastProcessedEvent("replicator")).resolves.toBe(0);
    await app.start();
    const signer = Factories.Ed25519Signer.build();
    const message = await Factories.CastAddMessage.create({}, { transient: { signer } });
    expect(message.signature).toHaveLength(64);
    subscriber.emitEvent(HubEvent.create({ id: 10, type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message } }));

    await sleep(100);

    await expect(redis.getLastProcessedEvent("replicator")).resolves.toBe(10);
    await app.stop();

    // count messages table and expect it to be 1
    const hash = await db.selectFrom("messages").select("hash").executeTakeFirstOrThrow();
    expect(Buffer.from(hash.hash)).toEqual(Buffer.from(message.hash));
  });
});
