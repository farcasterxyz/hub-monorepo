import { migrateToLatest } from "./example-app/migration";
import { log } from "./log";
import { sql } from "kysely";
import { Factories, HubEvent, HubEventType, Message } from "@farcaster/hub-nodejs";
import {
  RedisClient,
  HubSubscriber,
  DB,
  getDbClient,
  MessageHandler,
  StoreMessageOperation,
  HubEventProcessor,
} from "./shuttle";
import { sleep } from "./utils";

let db: DB;
let subscriber: FakeHubSubscriber;
let redis: RedisClient;

const POSTGRES_URL = process.env["POSTGRES_URL"] || "postgres://shuttle:password@localhost:6541";
const REDIS_URL = process.env["REDIS_URL"] || "localhost:16379";

class FakeHubSubscriber extends HubSubscriber implements MessageHandler {
  public override async start(fromId?: number): Promise<void> {}
  public override stop(): void {}
  public override destroy(): void {}

  public override async processHubEvent(event: HubEvent): Promise<boolean> {
    this.emit("event", event);
    return true;
  }

  async handleMessageMerge(
    _message: Message,
    _txn: DB,
    _operation: StoreMessageOperation,
    _isNew: boolean,
    _wasMissed: boolean,
  ): Promise<void> {
    // noop
  }
}

beforeAll(async () => {
  const dbName = "shuttle_test";
  if (process.env["NODE_ENV"] !== "test") {
    throw new Error("NODE_ENV must be set to test");
  }
  db = getDbClient(POSTGRES_URL);
  await sql`DROP DATABASE IF EXISTS shuttle_test`.execute(db);
  await sql`CREATE DATABASE shuttle_test`.execute(db);

  db = getDbClient(`${POSTGRES_URL}/${dbName}`);
  const result = await migrateToLatest(db, log);
  expect(result.isOk()).toBe(true);

  redis = RedisClient.create(REDIS_URL);
  await redis.clearForTest();
});

afterAll(async () => {
  await db.destroy();
});

describe("shuttle", () => {
  beforeEach(() => {
    subscriber = new FakeHubSubscriber();
    subscriber.on("event", async (event) => {
      await HubEventProcessor.processHubEvent(db, event, subscriber);
    });
  });

  test("replicates hubs events to database tables", async () => {
    const signer = Factories.Ed25519Signer.build();
    const message = await Factories.CastAddMessage.create({}, { transient: { signer } });
    expect(message.signature).toHaveLength(64);
    await subscriber.processHubEvent(
      HubEvent.create({ id: 10, type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message } }),
    );
    // count messages table and expect it to be 1
    const hash = await db.selectFrom("messages").select("hash").executeTakeFirstOrThrow();
    expect(Buffer.from(hash.hash)).toEqual(Buffer.from(message.hash));
  });
});
