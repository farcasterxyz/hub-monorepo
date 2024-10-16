import { migrateToLatest } from "./example-app/db";
import { log } from "./log";
import { sql } from "kysely";
import {
  CallOptions,
  Factories,
  FidRequest,
  HubError,
  HubEvent,
  HubEventType,
  HubRpcClient,
  LinkCompactStateBody,
  Message,
  MessageType,
  MessagesResponse,
  Metadata,
  getFarcasterTime,
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
import { err, ok } from "neverthrow";
import { bytesToHex } from "./utils";

let db: DB;
let subscriber: FakeHubSubscriber;
let redis: RedisClient;

const signer = Factories.Ed25519Signer.build();

const POSTGRES_URL = process.env["POSTGRES_URL"] || "postgres://shuttle:password@localhost:6541";
const POSTGRES_SCHEMA = process.env["POSTGRES_SCHEMA"] || "shuttle_test";
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

  shouldSkip = false;

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

  public setShouldSkip(shouldSkip: boolean): void {
    this.shouldSkip = shouldSkip;
  }

  async onHubEvent(_event: HubEvent, _txn: DB): Promise<boolean> {
    return this.shouldSkip;
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
  db = getDbClient(POSTGRES_URL, POSTGRES_SCHEMA);
  await sql`DROP DATABASE IF EXISTS shuttle_test`.execute(db);
  await sql`CREATE DATABASE shuttle_test`.execute(db);

  db = getDbClient(`${POSTGRES_URL}/${dbName}`, POSTGRES_SCHEMA);
  const result = await migrateToLatest(db, POSTGRES_SCHEMA, log);
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

  test("shouldSkip skip handler callbacks", async () => {
    const message = await Factories.CastAddMessage.create({}, { transient: { signer } });
    subscriber.setShouldSkip(true);
    subscriber.addMessageCallback(() => {
      fail("Should not be called");
    });
    await subscriber.processHubEvent(
      HubEvent.create({ id: 102, type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message } }),
    );
    expect(subscriber.messageCallbacks).toHaveLength(1); // 1 uncalled callback
    // Need to clear the callback because afterEach expects it to be empty
    subscriber.messageCallbacks.shift();

    const addMessageInDb = await db
      .selectFrom("messages")
      .select(["hash", "deletedAt"])
      .where("hash", "=", message.hash)
      .executeTakeFirst();

    expect(addMessageInDb).toBeUndefined();
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

  test("marks messages as deleted for compact types", async () => {
    const addMessage1 = await Factories.LinkAddMessage.create(
      { data: { timestamp: 1, linkBody: { type: "follow", targetFid: 1 } } },
      { transient: { signer } },
    );
    const addMessage2 = await Factories.LinkAddMessage.create(
      { data: { timestamp: 2, fid: addMessage1.data.fid, linkBody: { type: "follow", targetFid: 2 } } },
      { transient: { signer } },
    );
    const addMessage3 = await Factories.LinkAddMessage.create(
      { data: { timestamp: 3, fid: addMessage1.data.fid, linkBody: { type: "follow", targetFid: 3 } } },
      { transient: { signer } },
    );
    const removeMessage = await Factories.LinkRemoveMessage.create(
      { data: { timestamp: 4, fid: addMessage1.data.fid, linkBody: addMessage1.data.linkBody } },
      { transient: { signer } },
    );
    const compactMessage = await Factories.LinkCompactStateMessage.create(
      {
        data: {
          timestamp: 5,
          fid: addMessage1.data.fid,
          linkCompactStateBody: {
            type: "follow",
            targetFids: [addMessage2.data.linkBody.targetFid || 0],
          },
        },
      },
      { transient: { signer } },
    );

    // We expect 8 callbacks, three for the adds, one for the delete of the add, one for the remove,
    // two for the deletes of the compact, one for the compact, in that order
    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(operation).toEqual("merge");
      expect(state).toEqual("created");
      expect(bytesToHex(msg.hash)).toEqual(bytesToHex(addMessage1.hash));
      expect(isNew).toEqual(true);
    });
    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(operation).toEqual("merge");
      expect(state).toEqual("created");
      expect(bytesToHex(msg.hash)).toEqual(bytesToHex(addMessage2.hash));
      expect(isNew).toEqual(true);
    });
    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(operation).toEqual("merge");
      expect(state).toEqual("created");
      expect(bytesToHex(msg.hash)).toEqual(bytesToHex(addMessage3.hash));
      expect(isNew).toEqual(true);
    });
    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(operation).toEqual("delete");
      expect(state).toEqual("deleted");
      expect(bytesToHex(msg.hash)).toEqual(bytesToHex(addMessage1.hash));
      // isNew is true because the message was updated in the db
      expect(isNew).toEqual(true);
    });
    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(operation).toEqual("merge");
      expect(state).toEqual("deleted");
      expect(bytesToHex(msg.hash)).toEqual(bytesToHex(removeMessage.hash));
      expect(isNew).toEqual(true);
    });

    await subscriber.processHubEvent(
      HubEvent.create({ id: 1, type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message: addMessage1 } }),
    );
    await subscriber.processHubEvent(
      HubEvent.create({ id: 2, type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message: addMessage2 } }),
    );
    await subscriber.processHubEvent(
      HubEvent.create({ id: 3, type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message: addMessage3 } }),
    );
    await subscriber.processHubEvent(
      HubEvent.create({
        id: 4,
        type: HubEventType.MERGE_MESSAGE,
        mergeMessageBody: { message: removeMessage, deletedMessages: [addMessage1] },
      }),
    );

    const hashes = await db
      .selectFrom("messages")
      .select("hash")
      .where((eb) =>
        eb.and([eb("fid", "=", addMessage1.data.fid), eb("hash", "in", [removeMessage.hash, addMessage3.hash])]),
      )
      .execute();

    // preserve order from db:
    for (const hash of hashes.map((h) => bytesToHex(h.hash))) {
      const message = bytesToHex(removeMessage.hash) === hash ? removeMessage : addMessage3;
      subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
        expect(operation).toEqual("delete");
        expect(state).toEqual("deleted");
        expect(bytesToHex(msg.hash)).toEqual(bytesToHex(message.hash));
        // isNew is true because the message was updated in the db
        expect(isNew).toEqual(true);
      });
    }

    subscriber.addMessageCallback((msg, operation, state, isNew, wasMissed) => {
      expect(operation).toEqual("merge");
      expect(state).toEqual("created");
      expect(bytesToHex(msg.hash)).toEqual(bytesToHex(compactMessage.hash));
      expect(isNew).toEqual(true);
    });

    await subscriber.processHubEvent(
      HubEvent.create({
        id: 5,
        type: HubEventType.MERGE_MESSAGE,
        mergeMessageBody: {
          message: compactMessage,
          deletedMessages: [],
        },
      }),
    );

    const addMessage1InDb = await db
      .selectFrom("messages")
      .select(["hash", "deletedAt"])
      .where("hash", "=", addMessage1.hash)
      .executeTakeFirstOrThrow();
    expect(Buffer.from(addMessage1InDb.hash)).toEqual(Buffer.from(addMessage1.hash));
    expect(addMessage1InDb.deletedAt).not.toBeNull();

    const addMessage2InDb = await db
      .selectFrom("messages")
      .select(["hash", "deletedAt"])
      .where("hash", "=", addMessage2.hash)
      .executeTakeFirstOrThrow();
    expect(Buffer.from(addMessage2InDb.hash)).toEqual(Buffer.from(addMessage2.hash));
    expect(addMessage2InDb.deletedAt).toBeNull();

    const addMessage3InDb = await db
      .selectFrom("messages")
      .select(["hash", "deletedAt"])
      .where("hash", "=", addMessage3.hash)
      .executeTakeFirstOrThrow();
    expect(Buffer.from(addMessage3InDb.hash)).toEqual(Buffer.from(addMessage3.hash));
    expect(addMessage3InDb.deletedAt).not.toBeNull();

    const removeMessageInDb = await db
      .selectFrom("messages")
      .select(["hash", "deletedAt"])
      .where("hash", "=", removeMessage.hash)
      .executeTakeFirstOrThrow();
    expect(Buffer.from(removeMessageInDb.hash)).toEqual(Buffer.from(removeMessage.hash));
    expect(removeMessageInDb.deletedAt).not.toBeNull();

    const compactMessageInDb = await db
      .selectFrom("messages")
      .select(["hash", "deletedAt"])
      .where("hash", "=", compactMessage.hash)
      .executeTakeFirstOrThrow();
    expect(Buffer.from(compactMessageInDb.hash)).toEqual(Buffer.from(compactMessage.hash));
    expect(compactMessageInDb.deletedAt).toBeNull();
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

    // It's a hack, but mockito is not handling this well:
    const mockRPCClient = {
      streamFetch: (metadata?: Metadata, options?: Partial<CallOptions>) => {
        return err(new HubError("unavailable", "unavailable"));
      },
      getAllLinkMessagesByFid: async (_request: FidRequest, _metadata: Metadata, _options: Partial<CallOptions>) => {
        return ok(
          MessagesResponse.create({
            messages: [addMessage],
            nextPageToken: undefined,
          }),
        );
      },
      getLinkCompactStateMessageByFid: async (
        _request: FidRequest,
        _metadata: Metadata,
        _options: Partial<CallOptions>,
      ) => {
        return ok(
          MessagesResponse.create({
            messages: [compactMessage],
            nextPageToken: undefined,
          }),
        );
      },
    };

    const reconciler = new MessageReconciliation(mockRPCClient as unknown as HubRpcClient, db, log);
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

  test("reconciler takes start and stop time into account", async () => {
    const startTimestamp = getFarcasterTime()._unsafeUnwrap();

    const linkAddMessage = await Factories.LinkAddMessage.create(
      { data: { timestamp: startTimestamp } },
      { transient: { signer } },
    );

    const castAddMessage = await Factories.CastAddMessage.create({
      data: { timestamp: startTimestamp - 1, fid: linkAddMessage.data.fid },
    });

    const verificationAddMessage = await Factories.CastAddMessage.create({
      data: { timestamp: startTimestamp - 2, fid: linkAddMessage.data.fid },
    });

    await subscriber.processHubEvent(
      HubEvent.create({
        id: 1,
        type: HubEventType.MERGE_MESSAGE,
        mergeMessageBody: { message: verificationAddMessage },
      }),
    );
    await subscriber.processHubEvent(
      HubEvent.create({
        id: 2,
        type: HubEventType.MERGE_MESSAGE,
        mergeMessageBody: { message: castAddMessage },
      }),
    );
    await subscriber.processHubEvent(
      HubEvent.create({
        id: 3,
        type: HubEventType.MERGE_MESSAGE,
        mergeMessageBody: { message: linkAddMessage },
      }),
    );

    // It's a hack, but mockito is not handling this well:
    const mockRPCClient = {
      streamFetch: (metadata?: Metadata, options?: Partial<CallOptions>) => {
        return err(new HubError("unavailable", "unavailable"));
      },
      getAllLinkMessagesByFid: async (_request: FidRequest, _metadata: Metadata, _options: Partial<CallOptions>) => {
        return ok(
          MessagesResponse.create({
            messages: [linkAddMessage],
            nextPageToken: undefined,
          }),
        );
      },
      getAllCastMessagesByFid: async (_request: FidRequest, _metadata: Metadata, _options: Partial<CallOptions>) => {
        return ok(
          MessagesResponse.create({
            messages: [
              /* Pretend this message is missing from the hub */
            ],
            nextPageToken: undefined,
          }),
        );
      },
      getAllVerficationMessagesByFid: async (
        _request: FidRequest,
        _metadata: Metadata,
        _options: Partial<CallOptions>,
      ) => {
        return ok(
          MessagesResponse.create({
            messages: [verificationAddMessage],
            nextPageToken: undefined,
          }),
        );
      },
      getAllReactionMessagesByFid: async (
        _request: FidRequest,
        _metadata: Metadata,
        _options: Partial<CallOptions>,
      ) => {
        return ok(
          MessagesResponse.create({
            messages: [],
            nextPageToken: undefined,
          }),
        );
      },
      getLinkCompactStateMessageByFid: async (
        _request: FidRequest,
        _metadata: Metadata,
        _options: Partial<CallOptions>,
      ) => {
        return ok(
          MessagesResponse.create({
            messages: [],
            nextPageToken: undefined,
          }),
        );
      },
      getAllVerificationMessagesByFid: async (
        _request: FidRequest,
        _metadata: Metadata,
        _options: Partial<CallOptions>,
      ) => {
        return ok(
          MessagesResponse.create({
            messages: [],
            nextPageToken: undefined,
          }),
        );
      },
      getAllUserDataMessagesByFid: async (
        _request: FidRequest,
        _metadata: Metadata,
        _options: Partial<CallOptions>,
      ) => {
        return ok(
          MessagesResponse.create({
            messages: [],
            nextPageToken: undefined,
          }),
        );
      },
    };

    // Only include 2 of the 3 messages in the time window
    const reconciler = new MessageReconciliation(mockRPCClient as unknown as HubRpcClient, db, log);
    const messagesOnHub: Message[] = [];
    const messagesInDb: {
      hash: Uint8Array;
      prunedAt: Date | null;
      revokedAt: Date | null;
      fid: number;
      type: MessageType;
      raw: Uint8Array;
      signer: Uint8Array;
    }[] = [];
    await reconciler.reconcileMessagesForFid(
      linkAddMessage.data.fid,
      async (msg, _missing, _pruned, _revoked) => {
        messagesOnHub.push(msg);
      },
      async (dbMsg, _missing) => {
        messagesInDb.push(dbMsg);
      },
      startTimestamp - 1,
      startTimestamp,
    );

    expect(messagesOnHub.length).toBe(1);
    expect(messagesInDb.length).toBe(2);
  });

  test("reconciler lets unresponsive server requests terminate in error", async () => {
    const startTimestamp = getFarcasterTime()._unsafeUnwrap();

    const linkAddMessage = await Factories.LinkAddMessage.create(
      { data: { timestamp: startTimestamp } },
      { transient: { signer } },
    );

    const castAddMessage = await Factories.CastAddMessage.create({
      data: { timestamp: startTimestamp - 1, fid: linkAddMessage.data.fid },
    });

    const verificationAddMessage = await Factories.CastAddMessage.create({
      data: { timestamp: startTimestamp - 2, fid: linkAddMessage.data.fid },
    });

    await subscriber.processHubEvent(
      HubEvent.create({
        id: 1,
        type: HubEventType.MERGE_MESSAGE,
        mergeMessageBody: { message: verificationAddMessage },
      }),
    );
    await subscriber.processHubEvent(
      HubEvent.create({
        id: 2,
        type: HubEventType.MERGE_MESSAGE,
        mergeMessageBody: { message: castAddMessage },
      }),
    );
    await subscriber.processHubEvent(
      HubEvent.create({
        id: 3,
        type: HubEventType.MERGE_MESSAGE,
        mergeMessageBody: { message: linkAddMessage },
      }),
    );

    // It's a hack, but mockito is not handling this well:
    const mockRPCClient = {
      streamFetch: (metadata?: Metadata, options?: Partial<CallOptions>) => {
        return err(new HubError("unavailable", "unavailable"));
      },
      getAllLinkMessagesByFid: async (_request: FidRequest, _metadata: Metadata, _options: Partial<CallOptions>) => {
        return ok(
          MessagesResponse.create({
            messages: [linkAddMessage],
            nextPageToken: undefined,
          }),
        );
      },
      getAllCastMessagesByFid: async (_request: FidRequest, _metadata: Metadata, _options: Partial<CallOptions>) => {
        // force wait longer than MessageReconciliation's configured timeout to trigger failure
        await new Promise((resolve) => setTimeout(resolve, 550));
        return ok(
          MessagesResponse.create({
            messages: [
              /* Pretend this message is missing from the hub */
            ],
            nextPageToken: undefined,
          }),
        );
      },
      getAllVerificationMessagesByFid: async (
        _request: FidRequest,
        _metadata: Metadata,
        _options: Partial<CallOptions>,
      ) => {
        return ok(
          MessagesResponse.create({
            messages: [],
            nextPageToken: undefined,
          }),
        );
      },
      getAllReactionMessagesByFid: async (
        _request: FidRequest,
        _metadata: Metadata,
        _options: Partial<CallOptions>,
      ) => {
        return ok(
          MessagesResponse.create({
            messages: [],
            nextPageToken: undefined,
          }),
        );
      },
      getLinkCompactStateMessageByFid: async (
        _request: FidRequest,
        _metadata: Metadata,
        _options: Partial<CallOptions>,
      ) => {
        // force wait longer than MessageReconciliation's configured timeout to trigger failure
        await new Promise((resolve) => setTimeout(resolve, 550));
        return ok(
          MessagesResponse.create({
            messages: [],
            nextPageToken: undefined,
          }),
        );
      },
      getAllUserDataMessagesByFid: async (
        _request: FidRequest,
        _metadata: Metadata,
        _options: Partial<CallOptions>,
      ) => {
        return ok(
          MessagesResponse.create({
            messages: [],
            nextPageToken: undefined,
          }),
        );
      },
    };

    // Only include 2 of the 3 messages in the time window
    const reconciler = new MessageReconciliation(mockRPCClient as unknown as HubRpcClient, db, log, 500);
    const messagesOnHub: Message[] = [];
    const messagesInDb: {
      hash: Uint8Array;
      prunedAt: Date | null;
      revokedAt: Date | null;
      fid: number;
      type: MessageType;
      raw: Uint8Array;
      signer: Uint8Array;
    }[] = [];
    await expect(
      reconciler.reconcileMessagesForFid(
        linkAddMessage.data.fid,
        async (msg, _missing, _pruned, _revoked) => {
          messagesOnHub.push(msg);
        },
        async (dbMsg, _missing) => {
          messagesInDb.push(dbMsg);
        },
        startTimestamp - 1,
        startTimestamp,
      ),
    ).rejects.toThrow();
  }, 5000); // Need to make sure this is long enough to handle the timeout termination

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
