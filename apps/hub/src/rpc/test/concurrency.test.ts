import * as flatbuffers from '@farcaster/flatbuffers';
import { Factories, toTsHash } from '@farcaster/utils';
import SyncEngine from '~/network/sync/syncEngine';
import HubRpcClient from '~/rpc/client';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { seedSigner } from '~/storage/engine/seed';
import { MockHub } from '~/test/mocks';
import { addressInfoFromParts } from '~/utils/p2p';

const db = jestRocksDB('flatbuffers.rpc.concurrency.test');
const engine = new Engine(db);
const hub = new MockHub(db, engine);

let server: Server;
let client1: HubRpcClient;
let client2: HubRpcClient;
let client3: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(engine));
  const port = await server.start();
  client1 = new HubRpcClient(addressInfoFromParts('127.0.0.1', port)._unsafeUnwrap());
  client2 = new HubRpcClient(addressInfoFromParts('127.0.0.1', port)._unsafeUnwrap());
  client3 = new HubRpcClient(addressInfoFromParts('127.0.0.1', port)._unsafeUnwrap());
});

afterAll(async () => {
  client1.close();
  client2.close();
  client3.close();
  await server.stop();
});

const fid = Factories.FID.build();
const signer1 = Factories.Ed25519Signer.build();
const signer2 = Factories.Ed25519Signer.build();

describe('submitMessage', () => {
  beforeEach(async () => {
    await seedSigner(engine, fid, signer1.signerKey);
    await seedSigner(engine, fid, signer2.signerKey);
  });

  test('succeeds with concurrent, conflicting reaction messages', async () => {
    const castId = Factories.CastId.build();
    const body = Factories.ReactionBody.build({ type: flatbuffers.ReactionType.Like, target: castId });
    const addData = await Factories.ReactionAddData.create({ fid: Array.from(fid), body });
    const removeData = await Factories.ReactionRemoveData.create({ fid: Array.from(fid), body });

    const like1 = await Factories.Message.create(
      { data: Array.from(addData.bb?.bytes() ?? []) },
      { transient: { signer: signer1 } }
    );
    const like2 = await Factories.Message.create(
      { data: Array.from(addData.bb?.bytes() ?? []) },
      { transient: { signer: signer2 } }
    );

    const removeLike2 = await Factories.Message.create(
      { data: Array.from(removeData.bb?.bytes() ?? []) },
      { transient: { signer: signer2 } }
    );

    const results = await Promise.all([
      client1.submitMessage(like1),
      client1.submitMessage(like2),
      client1.submitMessage(removeLike2),
      client2.submitMessage(like1),
      client2.submitMessage(like2),
      client2.submitMessage(removeLike2),
      client3.submitMessage(like1),
      client3.submitMessage(like2),
      client3.submitMessage(removeLike2),
      client1.submitMessage(like1),
      client1.submitMessage(like2),
      client1.submitMessage(removeLike2),
      client2.submitMessage(like1),
      client2.submitMessage(like2),
      client2.submitMessage(removeLike2),
      client3.submitMessage(like1),
      client3.submitMessage(like2),
      client3.submitMessage(removeLike2),
      client1.submitMessage(like1),
      client1.submitMessage(like2),
      client1.submitMessage(removeLike2),
      client2.submitMessage(like1),
      client2.submitMessage(like2),
      client2.submitMessage(removeLike2),
      client3.submitMessage(like1),
      client3.submitMessage(like2),
      client3.submitMessage(removeLike2),
    ]);

    expect(results.every((result) => result.isOk())).toBeTruthy();
    const messages = await engine.getAllReactionMessagesByFid(fid);
    expect(messages._unsafeUnwrap().length).toEqual(1);
  });

  test('succeeds with concurrent, conflicting cast message', async () => {
    const addData = await Factories.CastAddData.create({ fid: Array.from(fid) });
    const cast1 = await Factories.Message.create(
      { data: Array.from(addData.bb?.bytes() ?? []) },
      { transient: { signer: signer1 } }
    );
    const cast2 = await Factories.Message.create(
      { data: Array.from(addData.bb?.bytes() ?? []) },
      { transient: { signer: signer2 } }
    );

    const castTsHash = toTsHash(addData.timestamp(), cast1.hashArray() ?? new Uint8Array())._unsafeUnwrap();
    const removeData = await Factories.CastRemoveData.create({
      fid: Array.from(fid),
      body: Factories.CastRemoveBody.build({ targetTsHash: Array.from(castTsHash) }),
    });
    const removeCast1 = await Factories.Message.create(
      { data: Array.from(removeData.bb?.bytes() ?? []) },
      { transient: { signer: signer1 } }
    );

    const results = await Promise.all([
      client1.submitMessage(cast1),
      client1.submitMessage(cast2),
      client1.submitMessage(removeCast1),
      client2.submitMessage(cast1),
      client2.submitMessage(cast2),
      client2.submitMessage(removeCast1),
      client3.submitMessage(cast1),
      client3.submitMessage(cast2),
      client3.submitMessage(removeCast1),
    ]);
    expect(results.every((result) => result.isOk())).toBeTruthy();
    const messages = await engine.getAllCastMessagesByFid(fid);
    expect(messages._unsafeUnwrap().length).toEqual(1);
  });
});
