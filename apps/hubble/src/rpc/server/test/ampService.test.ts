import * as protobufs from '@farcaster/protobufs';
import { Factories, getHubRpcClient, HubError, HubRpcClient } from '@farcaster/utils';
import SyncEngine from '~/network/sync/syncEngine';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.ampService.test');
const network = protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(engine, db));
  const port = await server.start();
  client = getHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  client.$.close();
  await server.stop();
});

const fid = Factories.Fid.build();
const custodySigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();

let custodyEvent: protobufs.IdRegistryEvent;
let signerAdd: protobufs.Message;
let ampAdd: protobufs.AmpAddMessage;

beforeAll(async () => {
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySigner.signerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerBody: { signer: signer.signerKey } } },
    { transient: { signer: custodySigner } }
  );

  ampAdd = await Factories.AmpAddMessage.create({ data: { fid, network } }, { transient: { signer } });
});

describe('getAmp', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(ampAdd);

    const result = await client.getAmp(protobufs.AmpRequest.create({ fid, targetFid: ampAdd.data.ampBody?.targetFid }));
    expect(result.isOk()).toBeTruthy();
    expect(protobufs.Message.toJSON(result._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(ampAdd));
  });

  test('fails if amp is missing', async () => {
    const result = await client.getAmp(protobufs.AmpRequest.create({ fid, targetFid: ampAdd.data.ampBody?.targetFid }));
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without user', async () => {
    const result = await client.getAmp(protobufs.AmpRequest.create({ fid, targetFid: 0 }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });

  test('fails without fid', async () => {
    const result = await client.getAmp(
      protobufs.AmpRequest.create({ fid: 0, targetFid: ampAdd.data.ampBody?.targetFid })
    );
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });
});

describe('getAmpsByFid', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(ampAdd);
    const amps = await client.getAmpsByFid(protobufs.FidRequest.create({ fid }));
    expect(amps._unsafeUnwrap().messages.map((m) => protobufs.Message.toJSON(m))).toEqual(
      [ampAdd].map((m) => protobufs.Message.toJSON(m))
    );
  });

  test('returns empty array without messages', async () => {
    const amps = await client.getAmpsByFid(protobufs.FidRequest.create({ fid }));
    expect(amps._unsafeUnwrap().messages.length).toEqual(0);
  });
});

describe('getAmpsByUser', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(ampAdd);
    const amps = await client.getAmpsByUser(protobufs.FidRequest.create({ fid: ampAdd.data.ampBody?.targetFid }));
    expect(amps._unsafeUnwrap().messages.map((m) => protobufs.Message.toJSON(m))).toEqual(
      [ampAdd].map((m) => protobufs.Message.toJSON(m))
    );
  });

  test('returns empty with the wrong fid', async () => {
    await engine.mergeMessage(ampAdd);
    const amps = await client.getAmpsByUser(protobufs.FidRequest.create({ fid }));
    expect(amps._unsafeUnwrap().messages.length).toEqual(0);
  });

  test('returns empty array without messages', async () => {
    const amps = await client.getAmpsByUser(protobufs.FidRequest.create({ fid: ampAdd.data.ampBody?.targetFid }));
    expect(amps._unsafeUnwrap().messages.length).toEqual(0);
  });
});
