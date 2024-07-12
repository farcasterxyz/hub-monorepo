import {
  Message,
  FarcasterNetwork,
  CastAddMessage,
  ReactionAddMessage,
  HubEventType,
  HubEvent,
  SubscribeRequest,
  isMergeMessageHubEvent,
  isPruneMessageHubEvent,
  isRevokeMessageHubEvent,
  Factories,
  getInsecureHubRpcClient,
  HubRpcClient,
  ClientReadableStream,
  UserNameProof,
  isMergeUsernameProofHubEvent,
  getAuthMetadata,
  OnChainEvent,
  isMergeOnChainHubEvent,
} from "@farcaster/hub-nodejs";
import Server from "../server.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import Engine from "../../storage/engine/index.js";
import { MockHub } from "../../test/mocks.js";
import { sleep } from "../../utils/crypto.js";

const db = jestRocksDB("rpc.eventService.test");
const engine = new Engine(db, FarcasterNetwork.TESTNET);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

const rpcUser = "rpcUser";
const rpcPass = "rpcPass";
const testRpcSubscribePerIpLimit = 5;

beforeAll(async () => {
  server = new Server(
    hub,
    engine,
    undefined,
    undefined,
    `${rpcUser}:${rpcPass}`,
    undefined,
    testRpcSubscribePerIpLimit,
  );
  const port = await server.start();
  client = getInsecureHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  await server.stop(true);
  await engine.stop();
});

let fid: number;
let fname: Uint8Array;
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();
let usernameProof: UserNameProof;
let custodyEvent: OnChainEvent;
let signerEvent: OnChainEvent;
let storageEvent: OnChainEvent;
let castAdd: CastAddMessage;
let reactionAdd: ReactionAddMessage;
// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
let events: [HubEventType, any][];
let stream: ClientReadableStream<HubEvent>;

beforeEach(async () => {
  events = [];
});

afterEach(async () => {
  if (stream) {
    await closeStream(stream);
  }
});

const setupMessages = async (fidToUse: number, fnameToUse: Uint8Array) => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  fid = fidToUse;
  fname = fnameToUse;
  usernameProof = Factories.UserNameProof.build({ owner: custodySignerKey, name: fname, fid });
  custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
  signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signerKey } });
  storageEvent = Factories.StorageRentOnChainEvent.build({ fid });
  castAdd = await Factories.CastAddMessage.create({ data: { fid } }, { transient: { signer } });
  reactionAdd = await Factories.ReactionAddMessage.create({ data: { fid } }, { transient: { signer } });
};

beforeAll(async () => {
  await setupMessages(Factories.Fid.build(), Factories.Fname.build());
});

const setupSubscription = async (
  // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
  events: [HubEventType, any][],
  options: { eventTypes?: HubEventType[]; fromId?: number; totalShards?: number; shardIndex?: number } = {},
): Promise<ClientReadableStream<HubEvent>> => {
  // First, clear the rate limits
  server.clearRateLimiters();

  const request = SubscribeRequest.create(options);

  const streamResult = await client.subscribe(request);
  expect(streamResult.isOk()).toBeTruthy();
  const stream = streamResult._unsafeUnwrap();

  stream.on("data", (event: HubEvent) => {
    if (isMergeMessageHubEvent(event)) {
      // biome-ignore lint/style/noNonNullAssertion: legacy code, avoid using ignore for new code
      events.push([event.type, Message.toJSON(event.mergeMessageBody.message!)]);
    } else if (isPruneMessageHubEvent(event)) {
      // biome-ignore lint/style/noNonNullAssertion: legacy code, avoid using ignore for new code
      events.push([event.type, Message.toJSON(event.pruneMessageBody.message!)]);
    } else if (isRevokeMessageHubEvent(event)) {
      // biome-ignore lint/style/noNonNullAssertion: legacy code, avoid using ignore for new code
      events.push([event.type, Message.toJSON(event.revokeMessageBody.message!)]);
    } else if (isMergeUsernameProofHubEvent(event)) {
      // biome-ignore lint/style/noNonNullAssertion: legacy code, avoid using ignore for new code
      events.push([event.type, UserNameProof.toJSON(event.mergeUsernameProofBody.usernameProof!)]);
    } else if (isMergeOnChainHubEvent(event)) {
      // biome-ignore lint/style/noNonNullAssertion: legacy code, avoid using ignore for new code
      events.push([event.type, OnChainEvent.toJSON(event.mergeOnChainEventBody.onChainEvent!)]);
    }
  });

  await sleep(100); // Wait for server to start listeners

  return stream;
};

const closeStream = async (stream: ClientReadableStream<HubEvent>): Promise<boolean> => {
  if (stream.closed) {
    return true;
  }

  return new Promise((resolve) => {
    stream.on("close", () => {
      resolve(true);
    });
    stream.on("end", () => {
      resolve(true);
    });

    stream.cancel();
  });
};

describe("subscribe", () => {
  describe("without type filters", () => {
    test("emits events", async () => {
      stream = await setupSubscription(events);
      await engine.mergeOnChainEvent(custodyEvent);
      await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);
      await engine.mergeMessage(castAdd);
      await engine.mergeUserNameProof(usernameProof);
      await sleep(100); // Wait for server to send events over stream
      expect(events).toEqual([
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(custodyEvent)],
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(signerEvent)],
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(storageEvent)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(castAdd)],
        [HubEventType.MERGE_USERNAME_PROOF, UserNameProof.toJSON(usernameProof)],
      ]);
    });
  });

  describe("with one type filter", () => {
    test("emits events", async () => {
      stream = await setupSubscription(events, {
        eventTypes: [HubEventType.MERGE_MESSAGE],
      });

      await engine.mergeOnChainEvent(custodyEvent);
      await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);
      await engine.mergeUserNameProof(usernameProof);
      await engine.mergeMessage(castAdd);
      await sleep(100); // Wait for server to send events over stream
      expect(events).toEqual([[HubEventType.MERGE_MESSAGE, Message.toJSON(castAdd)]]);
    });
  });

  describe("with multiple type filters", () => {
    test("emits events", async () => {
      stream = await setupSubscription(events, {
        eventTypes: [HubEventType.MERGE_MESSAGE, HubEventType.MERGE_USERNAME_PROOF, HubEventType.MERGE_ON_CHAIN_EVENT],
      });

      await engine.mergeOnChainEvent(custodyEvent);
      await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);
      await engine.mergeUserNameProof(usernameProof);
      await engine.mergeMessage(castAdd);
      await sleep(100); // Wait for server to send events over stream
      expect(events).toEqual([
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(custodyEvent)],
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(signerEvent)],
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(storageEvent)],
        [HubEventType.MERGE_USERNAME_PROOF, UserNameProof.toJSON(usernameProof)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(castAdd)],
      ]);
    });
  });

  describe("with fromId", () => {
    test("emits events from id onwards", async () => {
      await engine.mergeOnChainEvent(custodyEvent);
      const signerResult = await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);

      await engine.mergeMessage(castAdd);
      stream = await setupSubscription(events, { fromId: signerResult._unsafeUnwrap() });
      await engine.mergeUserNameProof(usernameProof);
      await engine.mergeMessage(reactionAdd);
      await sleep(100);
      expect(events).toEqual([
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(signerEvent)],
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(storageEvent)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(castAdd)],
        [HubEventType.MERGE_USERNAME_PROOF, UserNameProof.toJSON(usernameProof)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(reactionAdd)],
      ]);
    });

    test("emits events with early id", async () => {
      await engine.mergeOnChainEvent(custodyEvent);
      await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);

      stream = await setupSubscription(events, { fromId: 1 });
      expect(events).toEqual([
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(custodyEvent)],
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(signerEvent)],
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(storageEvent)],
      ]);
    });

    test("emits events with fromId of 0", async () => {
      await engine.mergeOnChainEvent(custodyEvent);
      await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);

      stream = await setupSubscription(events, { fromId: 0 });

      expect(events).toEqual([
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(custodyEvent)],
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(signerEvent)],
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(storageEvent)],
      ]);
    });

    test("can't subscribe too many times", async () => {
      const streams = [];

      // All these should succeed
      for (let i = 0; i < testRpcSubscribePerIpLimit; i++) {
        const stream = await client.subscribe({ eventTypes: [] });
        expect(stream.isOk()).toBe(true);
        streams.push(stream._unsafeUnwrap());
      }

      // Assert all are open
      for (const stream of streams) {
        expect(stream.closed).toBe(false);
      }

      // This should fail
      const overLimitStream = await client.subscribe({ eventTypes: [] });
      const result = await new Promise((resolve) => {
        overLimitStream._unsafeUnwrap().on("error", (err) => {
          resolve(err.message);
        });
      });

      expect(result).toContain("Too many connections");
      overLimitStream._unsafeUnwrap().cancel();

      // But if we pass rpc auth credentials, it will bypass the limit and succeed
      const authStream = await client.subscribe({ eventTypes: [] }, getAuthMetadata(rpcUser, rpcPass));
      expect(authStream.isOk()).toBe(true);
      expect(authStream._unsafeUnwrap().closed).toBe(false);

      // Close all streams
      authStream._unsafeUnwrap().cancel();
    });
  });

  describe("with fromId and type filters", () => {
    test("emits events", async () => {
      const nameResult = await engine.mergeUserNameProof(usernameProof);
      await engine.mergeOnChainEvent(custodyEvent);

      stream = await setupSubscription(events, {
        fromId: nameResult._unsafeUnwrap(),
        eventTypes: [HubEventType.MERGE_MESSAGE, HubEventType.MERGE_ON_CHAIN_EVENT],
      });
      await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);
      await engine.mergeMessage(castAdd);
      await engine.mergeMessage(reactionAdd);
      await sleep(100);
      expect(events).toEqual([
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(custodyEvent)],
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(signerEvent)],
        [HubEventType.MERGE_ON_CHAIN_EVENT, OnChainEvent.toJSON(storageEvent)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(castAdd)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(reactionAdd)],
      ]);
    });
  });
});

describe("sharded event stream", () => {
  test("emits events only for fids that match", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
    const shard0Events: [HubEventType, any][] = [];
    // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
    const shard1Events: [HubEventType, any][] = [];
    await setupSubscription(shard0Events, { totalShards: 2, shardIndex: 0 });
    await setupSubscription(shard1Events, { totalShards: 2, shardIndex: 1 });

    // Merge events for shard 0
    await setupMessages(202, Factories.Fname.build());
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
    await engine.mergeMessage(castAdd);
    await engine.mergeUserNameProof(usernameProof);

    // Merge events for shard 1
    await setupMessages(301, Factories.Fname.build());
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
    await engine.mergeMessage(castAdd);
    await engine.mergeUserNameProof(usernameProof);
    await sleep(100); // Wait for server to send events over stream

    expect(shard0Events.length).toEqual(5);
    expect(shard1Events.length).toEqual(5);

    shard0Events.map(([, event]) => {
      expect(event.fid || event.data.fid).toBe(202);
    });
    shard1Events.map(([, event]) => {
      expect(event.fid || event.data.fid).toBe(301);
    });

    // Should also work when requesting events from the past
    // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
    const shard0HistoricalEvents: [HubEventType, any][] = [];
    // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
    const shard1HistoricalEvents: [HubEventType, any][] = [];

    await setupSubscription(shard0HistoricalEvents, { totalShards: 2, shardIndex: 0, fromId: 0 });
    await setupSubscription(shard1HistoricalEvents, { totalShards: 2, shardIndex: 1, fromId: 0 });
    await sleep(100);

    expect(shard0HistoricalEvents).toHaveLength(5);
    expect(shard1HistoricalEvents).toHaveLength(5);
    shard0HistoricalEvents.map(([, event]) => {
      expect(event.fid || event.data.fid).toBe(202);
    });
    shard1HistoricalEvents.map(([, event]) => {
      expect(event.fid || event.data.fid).toBe(301);
    });
  });
});
