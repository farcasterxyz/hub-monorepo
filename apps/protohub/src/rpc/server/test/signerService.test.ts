import * as protobufs from '@farcaster/protobufs';
import { Factories, getHubRpcClient, HubError, HubRpcClient } from '@farcaster/utils';
import SyncEngine from '~/network/sync/syncEngine';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.signerService.test');
const network = protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(engine));
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
beforeAll(async () => {
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySigner.signerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerBody: { signer: signer.signerKey } } },
    { transient: { signer: custodySigner } }
  );
});

describe('getSigner', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(signerAdd);
    // const result = await client.getSigner(fid, signer.signerKey);
    // expect(result._unsafeUnwrap()).toEqual(signerAdd.message);
    const result = await client.getSigner(protobufs.SignerRequest.create({ fid, signer: signer.signerKey }));
    expect(protobufs.Message.toJSON(result._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(signerAdd));
  });

  test('fails if signer is missing', async () => {
    // const result = await client.getSigner(fid, signer.signerKey);
    // expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
    const result = await client.getSigner(protobufs.SignerRequest.create({ fid, signer: signer.signerKey }));
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without signer key', async () => {
    // const result = await client.getSigner(fid, new Uint8Array());
    // expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'publicKey is missing'));
    const result = await client.getSigner(protobufs.SignerRequest.create({ fid, signer: new Uint8Array() }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'publicKey is missing'));
  });

  test('fails without fid', async () => {
    // const result = await client.getSigner(new Uint8Array(), signer.signerKey);
    // expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
    const result = await client.getSigner(protobufs.SignerRequest.create({ fid: 0, signer: signer.signerKey }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });
});

describe('getSignersByFid', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(signerAdd);
    // const result = await client.getSignersByFid(fid);
    // expect(result._unsafeUnwrap()).toEqual([signerAdd.message]);
    const result = await client.getSignersByFid(protobufs.FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.map((m) => protobufs.Message.toJSON(m))).toEqual(
      [signerAdd].map((m) => protobufs.Message.toJSON(m))
    );
  });

  test('returns empty array without messages', async () => {
    // const result = await client.getSignersByFid(fid);
    // expect(result._unsafeUnwrap()).toEqual([]);
    const result = await client.getSignersByFid(protobufs.FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages).toEqual([]);
  });
});

describe('getIdRegistryEvent', () => {
  test('succeeds', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    // const result = await client.getIdRegistryEvent(fid);
    // expect(result._unsafeUnwrap()).toEqual(custodyEvent.event);
    const result = await client.getIdRegistryEvent(protobufs.FidRequest.create({ fid }));
    expect(protobufs.IdRegistryEvent.toJSON(result._unsafeUnwrap())).toEqual(
      protobufs.IdRegistryEvent.toJSON(custodyEvent)
    );
  });

  test('fails when event is missing', async () => {
    // const result = await client.getIdRegistryEvent(fid);
    // expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
    const result = await client.getIdRegistryEvent(protobufs.FidRequest.create({ fid }));
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });
});

describe('getFids', () => {
  test('succeeds', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    // const result = await client.getFids();
    // expect(result._unsafeUnwrap()).toEqual([custodyEvent.fid()]);
    const result = await client.getFids(protobufs.Empty.create());
    expect(result._unsafeUnwrap().fids).toEqual([custodyEvent.fid]);
  });

  test('returns empty array without events', async () => {
    const result = await client.getFids(protobufs.Empty.create());
    expect(result._unsafeUnwrap().fids).toEqual([]);
  });
});
