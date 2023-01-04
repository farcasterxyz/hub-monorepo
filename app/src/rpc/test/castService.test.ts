import { CastId, UserId } from '@hub/flatbuffers';
import Factories from '~/flatbuffers/factories';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import { CastAddModel, SignerAddModel } from '~/flatbuffers/models/types';
import { hexStringToBytes } from '~/flatbuffers/utils/bytes';
import SyncEngine from '~/network/sync/syncEngine';
import Client from '~/rpc/client';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';
import { HubError } from '~/utils/hubErrors';

const db = jestRocksDB('flatbuffers.rpc.castService.test');
const engine = new Engine(db);
const hub = new MockHub(db, engine);

let server: Server;
let client: Client;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(engine));
  const port = await server.start();
  client = new Client(`127.0.0.1:${port}`);
});

afterAll(async () => {
  client.close();
  await server.stop();
});

const fid = Factories.FID.build();
const ethSigner = Factories.Eip712Signer.build();
const wallet = ethSigner.wallet;
const signer = Factories.Ed25519Signer.build();
let custodyEvent: IdRegistryEventModel;
let signerAdd: SignerAddModel;
let castAdd: CastAddModel;

beforeAll(async () => {
  custodyEvent = new IdRegistryEventModel(
    await Factories.IdRegistryEvent.create(
      { to: Array.from(hexStringToBytes(wallet.address)._unsafeUnwrap()), fid: Array.from(fid) },
      { transient: { wallet } }
    )
  );

  const signerAddData = await Factories.SignerAddData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer.signerKey) }),
    fid: Array.from(fid),
  });
  signerAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { ethSigner } })
  ) as SignerAddModel;

  const castAddData = await Factories.CastAddData.create({
    fid: Array.from(fid),
  });
  castAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(castAddData.bb?.bytes() ?? []) }, { transient: { signer } })
  ) as CastAddModel;
});

describe('getCast', () => {
  test('succeeds', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(castAdd);
    const result = await client.getCast(fid, castAdd.tsHash());
    expect(result._unsafeUnwrap()).toEqual(castAdd);
  });

  test('fails if cast is missing', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
    const result = await client.getCast(fid, castAdd.tsHash());
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without fid or tsHash', async () => {
    const result = await client.getCast(new Uint8Array(), new Uint8Array());
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });

  test('fails without tsHash', async () => {
    const result = await client.getCast(fid, new Uint8Array());
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'tsHash is missing'));
  });

  test('fails without fid', async () => {
    const result = await client.getCast(new Uint8Array(), castAdd.tsHash());
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });
});

describe('getCastsByFid', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(castAdd);
    const casts = await client.getCastsByFid(fid);
    expect(casts._unsafeUnwrap()).toEqual([castAdd]);
  });

  test('returns empty array without casts', async () => {
    const casts = await client.getCastsByFid(fid);
    expect(casts._unsafeUnwrap()).toEqual([]);
  });
});

describe('getCastsByParent', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(castAdd);
    const casts = await client.getCastsByParent(castAdd.body().parent() ?? new CastId());
    expect(casts._unsafeUnwrap()).toEqual([castAdd]);
  });

  test('returns empty array without casts', async () => {
    const casts = await client.getCastsByParent(castAdd.body().parent() ?? new CastId());
    expect(casts._unsafeUnwrap()).toEqual([]);
  });
});

describe('getCastsByMention', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(castAdd);
    for (let i = 0; i < castAdd.body().mentionsLength(); i++) {
      const casts = await client.getCastsByMention(castAdd.body().mentions(i) ?? new UserId());
      expect(casts._unsafeUnwrap().map((cast) => cast.hash())).toEqual([castAdd.hash()]);
    }
  });

  test('returns empty array without casts', async () => {
    for (let i = 0; i < castAdd.body().mentionsLength(); i++) {
      const casts = await client.getCastsByMention(castAdd.body().mentions(i) ?? new UserId());
      expect(casts._unsafeUnwrap()).toEqual([]);
    }
  });
});
