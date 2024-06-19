import { migrateToLatest } from "./example-app/db";
import { log } from "./log";
import { sql } from "kysely";
import {
  Factories,
  HubEvent,
  HubEventType,
  HubRpcClient,
  LinkCompactStateBody,
  Message,
  MessageType,
} from "@farcaster/hub-nodejs";
import {
  RedisClient,
  HubSubscriber,
  DB,
  getDbClient,
  MessageHandler,
  StoreMessageOperation,
  HubEventProcessor,
  MessageState,
  MessageReconciliation,
} from "./shuttle";
import { anything, instance, mock, when } from "ts-mockito";
import { ok } from "neverthrow";

let db: DB;
let subscriber: FakeHubSubscriber;
let redis: RedisClient;
let client: HubRpcClient;

const signer = Factories.Ed25519Signer.build();

const POSTGRES_URL = process.env["POSTGRES_URL"] || "postgres://shuttle:password@localhost:6541";
const REDIS_URL = process.env["REDIS_URL"] || "localhost:16379";

class FakeHubSubscriber extends HubSubscriber implements MessageHandler {
  public override async start(fromId?: number): Promise<void> {}
  public override stop(): void {}
  public override destroy(): void {}
  public messageCallbacks: (
    | ((
        message: Message,
        operation: StoreMessageOperation,
        state: MessageState,
        isNew: boolean,
        wasMissed: boolean,
      ) => void)
    | undefined
  )[] = [];

  public override async processHubEvent(event: HubEvent): Promise<boolean> {
    await HubEventProcessor.processHubEvent(db, event, subscriber);
    return true;
  }

  addMessageCallback(
    callback?: (
      message: Message,
      operation: StoreMessageOperation,
      state: MessageState,
      isNew: boolean,
      wasMissed: boolean,
    ) => void,
  ) {
    this.messageCallbacks.push(callback);
  }

  async handleMessageMerge(
    message: Message,
    _txn: DB,
    operation: StoreMessageOperation,
    state: MessageState,
    isNew: boolean,
    wasMissed: boolean,
  ): Promise<void> {
    const callback = this.messageCallbacks.shift();
    if (callback) {
      callback(message, operation, state, isNew, wasMissed);
    }
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

  const mockRPCClient = mock<HubRpcClient>();
  client = instance(mockRPCClient);
});

afterAll(async () => {
  await db.destroy();
});

describe("shuttle", () => {
  beforeEach(() => {
    subscriber = new FakeHubSubscriber();
  });

  afterEach(() => {
    // Ensure that all callbacks are called
    expect(subscriber.messageCallbacks).toHaveLength(0);
  });

  test("replicates hubs events to database tables", async () => {
    const message = await Factories.CastAddMessage.create({}, { transient: { signer } });
    await subscriber.processHubEvent(
      HubEvent.create({ id: 10, type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message } }),
    );
    // count messages table and expect it to be 1
    const hash = await db.selectFrom("messages").select("hash").executeTakeFirstOrThrow();
    expect(Buffer.from(hash.hash)).toEqual(Buffer.from(message.hash));
  });

  test("message handler callback is invoked correctly", async () => {
    const message = await Factories.CastAddMessage.create({}, { transient: { signer } });

    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(msg.hash).toEqual(message.hash);
      expect(operation).toEqual("merge");
      expect(state).toEqual("created");
      expect(isNew).toEqual(true);
      expect(wasMissed).toEqual(false);
    });
    await subscriber.processHubEvent(
      HubEvent.create({ id: 100, type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message } }),
    );

    // When same message is inserted again, it should still be called, but isNew should be false
    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(msg.hash).toEqual(message.hash);
      expect(operation).toEqual("merge");
      expect(state).toEqual("created");
      expect(isNew).toEqual(false);
      expect(wasMissed).toEqual(false);
    });
    await subscriber.processHubEvent(
      HubEvent.create({ id: 101, type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message } }),
    );
  });

  test("marks messages as deleted", async () => {
    const addMessage = await Factories.CastAddMessage.create({}, { transient: { signer } });
    const removeMessage = await Factories.CastRemoveMessage.create(
      { data: { fid: addMessage.data.fid, castRemoveBody: { targetHash: addMessage.hash } } },
      { transient: { signer } },
    );

    // We expect 3 callbacks, one for the add, one for the delete of the add, and one for the remove, in that order
    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(operation).toEqual("merge");
      expect(state).toEqual("created");
      expect(msg.hash).toEqual(addMessage.hash);
      expect(isNew).toEqual(true);
    });
    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(operation).toEqual("delete");
      expect(state).toEqual("deleted");
      expect(msg.hash).toEqual(addMessage.hash);
      // isNew is true because the message was updated in the db
      expect(isNew).toEqual(true);
    });
    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(operation).toEqual("merge");
      expect(state).toEqual("deleted");
      expect(msg.hash).toEqual(removeMessage.hash);
      expect(isNew).toEqual(true);
    });

    await subscriber.processHubEvent(
      HubEvent.create({ id: 1, type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message: addMessage } }),
    );
    await subscriber.processHubEvent(
      HubEvent.create({
        id: 2,
        type: HubEventType.MERGE_MESSAGE,
        mergeMessageBody: { message: removeMessage, deletedMessages: [addMessage] },
      }),
    );

    const addMessageInDb = await db
      .selectFrom("messages")
      .select(["hash", "deletedAt"])
      .where("hash", "=", addMessage.hash)
      .executeTakeFirstOrThrow();
    expect(Buffer.from(addMessageInDb.hash)).toEqual(Buffer.from(addMessage.hash));
    expect(addMessageInDb.deletedAt).not.toBeNull();

    const removeMessageInDb = await db
      .selectFrom("messages")
      .select(["hash", "deletedAt"])
      .where("hash", "=", removeMessage.hash)
      .executeTakeFirstOrThrow();
    expect(Buffer.from(removeMessageInDb.hash)).toEqual(Buffer.from(removeMessage.hash));
    expect(removeMessageInDb.deletedAt).toBeNull();
  });

  test("reconciler flags incorrectly deleted messages", async () => {
    const addMessage = await Factories.LinkAddMessage.create({}, { transient: { signer } });
    const targetFid = addMessage.data.linkBody.targetFid;
    expect(targetFid).toBeDefined();
    const compactMessage = await Factories.LinkCompactStateMessage.create(
      {
        data: {
          fid: addMessage.data.fid,
          linkCompactStateBody: {
            type: addMessage.data.linkBody.type,
            targetFids: [targetFid ?? 0],
          },
        },
      },
      { transient: { signer } },
    );

    await subscriber.processHubEvent(
      HubEvent.create({ id: 1, type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message: addMessage } }),
    );
    await subscriber.processHubEvent(
      HubEvent.create({
        id: 2,
        type: HubEventType.MERGE_MESSAGE,
        mergeMessageBody: { message: compactMessage },
      }),
    );

    // set compact message to deleted:
    await db.updateTable("messages").where("hash", "=", compactMessage.hash).set({ deletedAt: new Date() }).execute();

    when(client.getAllLinkMessagesByFid(anything())).thenCall(async () => {
      return Promise.resolve(
        ok({
          messages: [addMessage],
          nextPageToken: undefined,
        }),
      );
    });
    when(client.getLinkCompactStateMessageByFid(anything())).thenCall(async () => {
      return Promise.resolve(
        ok({
          messages: [compactMessage],
          nextPageToken: undefined,
        }),
      );
    });

    const reconciler = new MessageReconciliation(client, db, log);
    const messagesOnHub: Message[] = [];
    const missingFromHub: boolean[] = [];
    const prunedInDb: boolean[] = [];
    const revokedInDb: boolean[] = [];
    const messagesInDb: {
      hash: Uint8Array;
      prunedAt: Date | null;
      revokedAt: Date | null;
      fid: number;
      type: MessageType;
      raw: Uint8Array;
      signer: Uint8Array;
    }[] = [];
    const missingFromDb: boolean[] = [];
    const a = await reconciler.reconcileMessagesOfTypeForFid(
      addMessage.data.fid,
      MessageType.LINK_ADD,
      async (msg, missing, pruned, revoked) => {
        messagesOnHub.push(msg);
        missingFromHub.push(missing);
        prunedInDb.push(pruned);
        revokedInDb.push(revoked);
      },
      async (dbMsg, missing) => {
        messagesInDb.push(dbMsg);
        missingFromDb.push(missing);
      },
    );

    expect(messagesOnHub.length).toBe(2);
    expect(messagesInDb.length).toBe(1);
    expect(missingFromHub).toMatchObject([false, false]);
    expect(prunedInDb).toMatchObject([false, false]);
    expect(revokedInDb).toMatchObject([false, false]);
    expect(missingFromDb).toMatchObject([false]);
  });

  test("marks messages as pruned", async () => {
    const addMessage = await Factories.ReactionAddMessage.create({}, { transient: { signer } });
    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(operation).toEqual("merge");
      expect(state).toEqual("created");
      expect(msg.hash).toEqual(addMessage.hash);
      expect(isNew).toEqual(true);
    });
    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(operation).toEqual("prune");
      expect(state).toEqual("deleted");
      expect(msg.hash).toEqual(addMessage.hash);
      expect(isNew).toEqual(true);
    });
    await subscriber.processHubEvent(
      HubEvent.create({ id: 1, type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message: addMessage } }),
    );
    await subscriber.processHubEvent(
      HubEvent.create({ id: 2, type: HubEventType.PRUNE_MESSAGE, pruneMessageBody: { message: addMessage } }),
    );
    const addMessageInDb = await db
      .selectFrom("messages")
      .select(["hash", "prunedAt"])
      .where("hash", "=", addMessage.hash)
      .executeTakeFirstOrThrow();
    expect(Buffer.from(addMessageInDb.hash)).toEqual(Buffer.from(addMessage.hash));
    expect(addMessageInDb.prunedAt).not.toBeNull();
  });

  test("marks messages as revoked", async () => {
    const addMessage = await Factories.LinkAddMessage.create({}, { transient: { signer } });
    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(operation).toEqual("merge");
      expect(state).toEqual("created");
      expect(msg.hash).toEqual(addMessage.hash);
      expect(isNew).toEqual(true);
    });
    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(operation).toEqual("revoke");
      expect(state).toEqual("deleted");
      expect(msg.hash).toEqual(addMessage.hash);
      expect(isNew).toEqual(true);
    });
    await subscriber.processHubEvent(
      HubEvent.create({ id: 1, type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message: addMessage } }),
    );
    await subscriber.processHubEvent(
      HubEvent.create({ id: 2, type: HubEventType.REVOKE_MESSAGE, revokeMessageBody: { message: addMessage } }),
    );
    const addMessageInDb = await db
      .selectFrom("messages")
      .select(["hash", "revokedAt"])
      .where("hash", "=", addMessage.hash)
      .executeTakeFirstOrThrow();
    expect(Buffer.from(addMessageInDb.hash)).toEqual(Buffer.from(addMessage.hash));
    expect(addMessageInDb.revokedAt).not.toBeNull();
  });

  describe("message types", () => {
    test("handles compact link state messages", async () => {
      const message = await Factories.LinkCompactStateMessage.create(
        {
          data: {
            linkCompactStateBody: {
              type: "follow",
              targetFids: [1, 2, 3],
            },
          },
        },
        { transient: { signer } },
      );
      await subscriber.processHubEvent(
        HubEvent.create({ id: 10, type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message } }),
      );
      const res = await db
        .selectFrom("messages")
        .select(["hash", "body"])
        .where("hash", "=", message.hash)
        .executeTakeFirstOrThrow();
      expect((res.body as LinkCompactStateBody).targetFids).toEqual([1, 2, 3]);
    });
  });
});
