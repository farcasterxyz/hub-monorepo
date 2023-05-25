import { jestRocksDB } from '../../storage/db/jestUtils.js';
import {
  CastAddMessage,
  Factories,
  FarcasterNetwork,
  getInsecureHubRpcClient,
  HubInfoRequest,
  HubRpcClient,
  IdRegistryEvent,
  SignerAddMessage,
  SyncStatusRequest,
} from '@farcaster/hub-nodejs';
import Engine from '../../storage/engine/index.js';
import { MockHub } from '../../test/mocks.js';
import Server from '../server.js';
import SyncEngine from '../../network/sync/syncEngine.js';
import { GossipNode } from '../../network/p2p/gossipNode.js';

const db = jestRocksDB('protobufs.rpc.syncService.test');
const network = FarcasterNetwork.TESTNET;
const mockGossipNode = {
  allPeerIds: () => ['test'],
} as unknown as GossipNode;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine, mockGossipNode);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(hub, db), mockGossipNode);
  const port = await server.start();
  client = getInsecureHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  client.close();
  await server.stop();
  await engine.stop();
});

const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: IdRegistryEvent;
let signerAdd: SignerAddMessage;
let castAdd: CastAddMessage;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } }
  );

  castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
});

describe('getInfo', () => {
  test('succeeds', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(castAdd);

    const result = await client.getInfo(HubInfoRequest.create({ dbStats: true }));
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap().dbStats?.numMessages).toEqual(2);
    expect(result._unsafeUnwrap().dbStats?.numFidEvents).toEqual(1);
    expect(result._unsafeUnwrap().dbStats?.numFnameEvents).toEqual(0);
  });
});

describe('getSyncStatus', () => {
  test('succeeds', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(castAdd);

    const result = await client.getSyncStatus(SyncStatusRequest.create());
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap().isSyncing).toEqual(false);
    expect(result._unsafeUnwrap().syncStatus).toHaveLength(0);
  });
});
