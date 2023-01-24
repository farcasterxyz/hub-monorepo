import { FarcasterNetwork } from '@farcaster/flatbuffers';
import { Factories, HubError } from '@farcaster/utils';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import { SignerAddModel } from '~/flatbuffers/models/types';
import SyncEngine from '~/network/sync/syncEngine';
import HubRpcClient from '~/rpc/client';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';
import { addressInfoFromParts } from '~/utils/p2p';

const db = jestRocksDB('flatbuffers.rpc.signerService.test');
const engine = new Engine(db, FarcasterNetwork.Testnet);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(engine));
  const port = await server.start();
  client = new HubRpcClient(addressInfoFromParts('127.0.0.1', port)._unsafeUnwrap());
});

afterAll(async () => {
  client.close();
  await server.stop();
});

const fid = Factories.FID.build();
const ethSigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();
let custodyEvent: IdRegistryEventModel;
let signerAdd: SignerAddModel;

beforeAll(async () => {
  custodyEvent = new IdRegistryEventModel(
    await Factories.IdRegistryEvent.create({ to: Array.from(ethSigner.signerKey), fid: Array.from(fid) })
  );

  const signerAddData = await Factories.SignerAddData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer.signerKey) }),
    fid: Array.from(fid),
  });
  signerAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { ethSigner } })
  ) as SignerAddModel;
});

describe('getSigner', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(signerAdd);
    const result = await client.getSigner(fid, signer.signerKey);
    expect(result._unsafeUnwrap()).toEqual(signerAdd.message);
  });

  test('fails if signer is missing', async () => {
    const result = await client.getSigner(fid, signer.signerKey);
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without signer key', async () => {
    const result = await client.getSigner(fid, new Uint8Array());
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'publicKey is missing'));
  });

  test('fails without fid', async () => {
    const result = await client.getSigner(new Uint8Array(), signer.signerKey);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });
});

describe('getSignersByFid', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(signerAdd);
    const result = await client.getSignersByFid(fid);
    expect(result._unsafeUnwrap()).toEqual([signerAdd.message]);
  });

  test('returns empty array without messages', async () => {
    const result = await client.getSignersByFid(fid);
    expect(result._unsafeUnwrap()).toEqual([]);
  });
});

describe('getIdRegistryEvent', () => {
  test('succeeds', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    const result = await client.getIdRegistryEvent(fid);
    expect(result._unsafeUnwrap()).toEqual(custodyEvent.event);
  });

  test('fails when event is missing', async () => {
    const result = await client.getIdRegistryEvent(fid);
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });
});

describe('getFids', () => {
  test('succeeds', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    const result = await client.getFids();
    expect(result._unsafeUnwrap()).toEqual([custodyEvent.fid()]);
  });

  test('returns empty array without events', async () => {
    const result = await client.getFids();
    expect(result._unsafeUnwrap()).toEqual([]);
  });
});
