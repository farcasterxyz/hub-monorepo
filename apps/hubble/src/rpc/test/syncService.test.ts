import { jestRocksDB } from "../../storage/db/jestUtils.js";
import {
  CastAddMessage,
  Factories,
  FarcasterNetwork,
  getInsecureHubRpcClient,
  HubInfoRequest,
  HubRpcClient,
  OnChainEvent,
  SyncStatusRequest,
} from "@farcaster/hub-nodejs";
import Engine from "../../storage/engine/index.js";
import { MockHub } from "../../test/mocks.js";
import Server from "../server.js";
import SyncEngine from "../../network/sync/syncEngine.js";
import { GossipNode } from "../../network/p2p/gossipNode.js";
import { sleepWhile, SLEEPWHILE_TIMEOUT } from "../../utils/crypto.js";

const db = jestRocksDB("protobufs.rpc.syncService.test");
const network = FarcasterNetwork.TESTNET;
const mockGossipNode = {
  allPeerIds: () => ["test"],
} as unknown as GossipNode;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine, mockGossipNode);

let syncEngine: SyncEngine;
let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  syncEngine = new SyncEngine(hub, db);
  await syncEngine.start();
  server = new Server(hub, engine, syncEngine, mockGossipNode);
  const port = await server.start();
  client = getInsecureHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  client.close();
  await syncEngine.stop();
  await server.stop();
  await engine.stop();
});

beforeEach(async () => {
  await syncEngine.trie.clear();
});

const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: OnChainEvent;
let signerEvent: OnChainEvent;
let storageEvent: OnChainEvent;
let castAdd: CastAddMessage;
let castAdd2: CastAddMessage;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
  signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signerKey } });
  storageEvent = Factories.StorageRentOnChainEvent.build({ fid });

  castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
  castAdd2 = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
});

describe("getInfo", () => {
  test("succeeds", async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
    await engine.mergeMessage(castAdd);
    await engine.mergeMessage(castAdd2);

    await sleepWhile(() => syncEngine.syncTrieQSize > 0, SLEEPWHILE_TIMEOUT);

    const result = await client.getInfo(HubInfoRequest.create({ dbStats: true }));
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap().dbStats?.numMessages).toEqual(5); // Currently returns all items in the trie (3 events + 2 messages)
    expect(result._unsafeUnwrap().dbStats?.numFidEvents).toEqual(1);
    expect(result._unsafeUnwrap().dbStats?.numFnameEvents).toEqual(0);
  });
});

describe("getSyncStatus", () => {
  test("succeeds", async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
    await engine.mergeMessage(castAdd);

    const result = await client.getSyncStatus(SyncStatusRequest.create());
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap().isSyncing).toEqual(false);
    expect(result._unsafeUnwrap().syncStatus).toHaveLength(0);
  });
});
