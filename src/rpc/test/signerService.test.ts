import { utils, Wallet } from 'ethers';
import Factories from '~/flatbuffers/factories/flatbuffer';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import { SignerAddModel } from '~/flatbuffers/models/types';
import Client from '~/rpc/client';
import Server from '~/rpc/server';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine/flatbuffers';
import { MockHub } from '~/test/mocks';
import { KeyPair } from '~/types';
import { generateEd25519KeyPair } from '~/utils/crypto';
import { HubError } from '~/utils/hubErrors';
import { addressInfoFromParts } from '~/utils/p2p';

const db = jestBinaryRocksDB('flatbuffers.rpc.signerService.test');
const engine = new Engine(db);
const hub = new MockHub(db, engine);

let server: Server;
let client: Client;

beforeAll(async () => {
  server = new Server(hub, engine);
  const port = await server.start();
  client = new Client(addressInfoFromParts('127.0.0.1', port)._unsafeUnwrap());
});

afterAll(async () => {
  client.close();
  await server.stop();
});

const fid = Factories.FID.build();
const wallet = new Wallet(utils.randomBytes(32));
let custodyEvent: IdRegistryEventModel;
let signer: KeyPair;
let signerAdd: SignerAddModel;

beforeAll(async () => {
  custodyEvent = new IdRegistryEventModel(
    await Factories.IdRegistryEvent.create(
      { to: Array.from(utils.arrayify(wallet.address)), fid: Array.from(fid) },
      { transient: { wallet } }
    )
  );

  signer = await generateEd25519KeyPair();
  const signerAddData = await Factories.SignerAddData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer.publicKey) }),
    fid: Array.from(fid),
  });
  signerAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { wallet } })
  ) as SignerAddModel;
});

describe('getSigner', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(signerAdd);
    const result = await client.getSigner(fid, signer.publicKey);
    expect(result._unsafeUnwrap()).toEqual(signerAdd);
  });

  test('fails if signer is missing', async () => {
    const result = await client.getSigner(fid, signer.publicKey);
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without signer key', async () => {
    const result = await client.getSigner(fid, new Uint8Array());
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'publicKey is missing'));
  });

  test('fails without fid', async () => {
    const result = await client.getSigner(new Uint8Array(), signer.publicKey);
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
    expect(result._unsafeUnwrap().map((msg) => msg.hash())).toEqual([signerAdd.hash()]);
  });

  test('returns empty array without messages', async () => {
    const result = await client.getSignersByFid(fid);
    expect(result._unsafeUnwrap()).toEqual([]);
  });
});

describe('getCustodyEvent', () => {
  test('succeeds', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    const result = await client.getCustodyEvent(fid);
    expect(result._unsafeUnwrap()).toEqual(custodyEvent);
  });

  test('fails when event is missing', async () => {
    const result = await client.getCustodyEvent(fid);
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
