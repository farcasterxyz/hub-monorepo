import * as protobufs from '@farcaster/protobufs';
import { Factories, getHubRpcClient, HubResult, HubRpcClient } from '@farcaster/utils';
import SyncEngine from '~/network/sync/syncEngine';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { seedSigner } from '~/storage/engine/seed';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.concurrency.test');
const network = protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

let server: Server;
let client1: HubRpcClient;
let client2: HubRpcClient;
let client3: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(engine));
  const port = await server.start();
  client1 = getHubRpcClient(`127.0.0.1:${port}`);
  client2 = getHubRpcClient(`127.0.0.1:${port}`);
  client3 = getHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  client1.$.close();
  client2.$.close();
  client3.$.close();
  await server.stop();
});

const fid = Factories.Fid.build();
const signer1 = Factories.Ed25519Signer.build();
const signer2 = Factories.Ed25519Signer.build();

const assertNoTimeouts = (results: HubResult<protobufs.Message>[]) => {
  expect(
    results.every(
      (result) => result.isOk() || (result.isErr() && result.error.errCode !== 'unavailable.storage_failure')
    )
  ).toBeTruthy();
};

describe('submitMessage', () => {
  beforeEach(async () => {
    await seedSigner(engine, fid, signer1.signerKey);
    await seedSigner(engine, fid, signer2.signerKey);
  });

  test('succeeds with concurrent, conflicting reaction messages', async () => {
    const castId = Factories.CastId.build();
    const like1 = await Factories.ReactionAddMessage.create(
      { data: { fid, reactionBody: { type: protobufs.ReactionType.REACTION_TYPE_LIKE, targetCastId: castId } } },
      { transient: { signer: signer1 } }
    );

    const like2 = await Factories.ReactionAddMessage.create(
      { data: { fid, reactionBody: { type: protobufs.ReactionType.REACTION_TYPE_LIKE, targetCastId: castId } } },
      { transient: { signer: signer2 } }
    );

    const removeLike2 = await Factories.ReactionRemoveMessage.create(
      { data: { fid, reactionBody: { type: protobufs.ReactionType.REACTION_TYPE_LIKE, targetCastId: castId } } },
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
    assertNoTimeouts(results);

    const messages = await engine.getAllReactionMessagesByFid(fid);
    expect(messages._unsafeUnwrap().length).toEqual(1);
  });

  test('succeeds with concurrent, conflicting cast message', async () => {
    const cast1 = await Factories.CastAddMessage.create({ data: { fid } }, { transient: { signer: signer1 } });
    const cast2 = await Factories.CastAddMessage.create({ data: { fid } }, { transient: { signer: signer2 } });

    const removeCast1 = await Factories.CastRemoveMessage.create(
      { data: { fid, castRemoveBody: { targetHash: cast1.hash } } },
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
    assertNoTimeouts(results);

    const messages = await engine.getAllCastMessagesByFid(fid);
    expect(messages._unsafeUnwrap().length).toEqual(1);
  });
});
