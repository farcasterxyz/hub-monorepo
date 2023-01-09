import { CastId, CastIdT, ReactionType } from '@hub/flatbuffers';
import { Factories, HubError } from '@hub/utils';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import { ReactionAddModel, SignerAddModel } from '~/flatbuffers/models/types';
import SyncEngine from '~/network/sync/syncEngine';
import HubRpcClient from '~/rpc/client';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';
import { addressInfoFromParts } from '~/utils/p2p';

const db = jestRocksDB('flatbuffers.rpc.reactionService.test');
const engine = new Engine(db);
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

let castId: CastIdT;
let reactionAddLike: ReactionAddModel;
let reactionAddRecast: ReactionAddModel;

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

  castId = await Factories.CastId.build();

  const likeData = await Factories.ReactionAddData.create({
    fid: Array.from(fid),
    body: Factories.ReactionBody.build({ type: ReactionType.Like, target: castId }),
  });
  reactionAddLike = new MessageModel(
    await Factories.Message.create({ data: Array.from(likeData.bb?.bytes() ?? []) }, { transient: { signer } })
  ) as ReactionAddModel;

  const recastData = await Factories.ReactionAddData.create({
    fid: Array.from(fid),
    body: Factories.ReactionBody.build({ type: ReactionType.Recast, target: castId }),
  });
  reactionAddRecast = new MessageModel(
    await Factories.Message.create({ data: Array.from(recastData.bb?.bytes() ?? []) }, { transient: { signer } })
  ) as ReactionAddModel;
});

describe('getReaction', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds with like', async () => {
    await engine.mergeMessage(reactionAddLike);
    const result = await client.getReaction(
      fid,
      reactionAddLike.body().type(),
      (reactionAddLike.body().target(new CastId()) as CastId).unpack() ?? new CastIdT()
    );
    expect(result._unsafeUnwrap()).toEqual(reactionAddLike.message);
  });

  test('succeeds with recast', async () => {
    await engine.mergeMessage(reactionAddRecast);
    const result = await client.getReaction(
      fid,
      reactionAddRecast.body().type(),
      (reactionAddRecast.body().target(new CastId()) as CastId).unpack() ?? new CastIdT()
    );
    expect(result._unsafeUnwrap()).toEqual(reactionAddRecast.message);
  });

  test('fails if reaction is missing', async () => {
    const result = await client.getReaction(
      fid,
      reactionAddLike.body().type(),
      (reactionAddLike.body().target(new CastId()) as CastId).unpack() ?? new CastIdT()
    );
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails with invalid reaction type', async () => {
    const result = await client.getReaction(fid, 0, castId);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid reaction type'));
  });

  test('fails without cast', async () => {
    const castId = await Factories.CastId.build({ fid: [], tsHash: [] });
    const result = await client.getReaction(fid, ReactionType.Like, castId);
    // TODO: improve error messages so we know this is cast.fid is missing
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'fid is missing, tsHash is missing')
    );
  });

  test('fails without fid', async () => {
    const result = await client.getReaction(
      new Uint8Array(),
      reactionAddRecast.body().type(),
      (reactionAddRecast.body().target(new CastId()) as CastId).unpack() ?? new CastIdT()
    );
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });
});

describe('getReactionsByFid', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  describe('with messages', () => {
    beforeEach(async () => {
      await engine.mergeMessage(reactionAddLike);
      await engine.mergeMessage(reactionAddRecast);
    });

    test('succeeds without type', async () => {
      const reactions = await client.getReactionsByFid(fid);
      // The underlying buffers are different, so we can't compare full objects
      expect(reactions._unsafeUnwrap()).toEqual([reactionAddLike.message, reactionAddRecast.message]);
    });

    test('succeeds with type Like', async () => {
      const reactions = await client.getReactionsByFid(fid, ReactionType.Like);
      expect(reactions._unsafeUnwrap()).toEqual([reactionAddLike.message]);
    });

    test('succeeds with type Recast', async () => {
      const reactions = await client.getReactionsByFid(fid, ReactionType.Recast);
      expect(reactions._unsafeUnwrap()).toEqual([reactionAddRecast.message]);
    });
  });

  test('returns empty array without messages', async () => {
    const reactions = await client.getReactionsByFid(fid);
    expect(reactions._unsafeUnwrap()).toEqual([]);
  });
});

describe('getReactionsByCast', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  describe('with messages', () => {
    beforeEach(async () => {
      await engine.mergeMessage(reactionAddLike);
      await engine.mergeMessage(reactionAddRecast);
    });

    test('succeeds without type', async () => {
      const reactions = await client.getReactionsByCast(castId);
      expect(reactions._unsafeUnwrap()).toEqual([reactionAddLike.message, reactionAddRecast.message]);
    });

    test('succeeds with type Like', async () => {
      const reactions = await client.getReactionsByCast(castId, ReactionType.Like);
      expect(reactions._unsafeUnwrap()).toEqual([reactionAddLike.message]);
    });

    test('succeeds with type Recast', async () => {
      const reactions = await client.getReactionsByCast(castId, ReactionType.Recast);
      expect(reactions._unsafeUnwrap()).toEqual([reactionAddRecast.message]);
    });
  });

  test('returns empty array without messages', async () => {
    const reactions = await client.getReactionsByCast(castId);
    expect(reactions._unsafeUnwrap()).toEqual([]);
  });
});
