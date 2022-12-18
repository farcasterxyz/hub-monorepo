import Server from '~/network/rpc/flatbuffers/server';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import Client from '~/network/rpc/flatbuffers/client';
import MessageModel from '~/storage/flatbuffers/messageModel';
import Factories from '~/test/factories/flatbuffer';
import Engine from '~/storage/engine/flatbuffers';
import { ReactionAddModel, SignerAddModel } from '~/storage/flatbuffers/types';
import { Wallet, utils } from 'ethers';
import { generateEd25519KeyPair } from '~/utils/crypto';
import IdRegistryEventModel from '~/storage/flatbuffers/idRegistryEventModel';
import { KeyPair } from '~/types';
import { CastId, ReactionType } from '~/utils/generated/message_generated';
import { HubError } from '~/utils/hubErrors';

const db = jestBinaryRocksDB('flatbuffers.rpc.reactionService.test');
const engine = new Engine(db);

let server: Server;
let client: Client;

beforeAll(async () => {
  server = new Server(engine);
  const port = await server.start();
  client = new Client(port);
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

let castId: CastId;
let reactionAddLike: ReactionAddModel;
let reactionAddRecast: ReactionAddModel;

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

  castId = await Factories.CastId.create();

  const likeData = await Factories.ReactionAddData.create({
    fid: Array.from(fid),
    body: Factories.ReactionBody.build({ type: ReactionType.Like, cast: castId.unpack() }),
  });
  reactionAddLike = new MessageModel(
    await Factories.Message.create({ data: Array.from(likeData.bb?.bytes() ?? []) }, { transient: { signer } })
  ) as ReactionAddModel;

  const recastData = await Factories.ReactionAddData.create({
    fid: Array.from(fid),
    body: Factories.ReactionBody.build({ type: ReactionType.Recast, cast: castId.unpack() }),
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
      reactionAddLike.body().cast() ?? new CastId()
    );
    expect(result._unsafeUnwrap()).toEqual(reactionAddLike);
  });

  test('succeeds with recast', async () => {
    await engine.mergeMessage(reactionAddRecast);
    const result = await client.getReaction(
      fid,
      reactionAddRecast.body().type(),
      reactionAddRecast.body().cast() ?? new CastId()
    );
    expect(result._unsafeUnwrap()).toEqual(reactionAddRecast);
  });

  test('fails if reaction is missing', async () => {
    const result = await client.getReaction(
      fid,
      reactionAddLike.body().type(),
      reactionAddLike.body().cast() ?? new CastId()
    );
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails with invalid reaction type', async () => {
    const result = await client.getReaction(fid, 0, castId);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid reaction type'));
  });

  test('fails without cast', async () => {
    const castId = await Factories.CastId.create({ fid: [], tsHash: [] });
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
      reactionAddRecast.body().cast() ?? new CastId()
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
      expect(reactions._unsafeUnwrap().map((reaction) => reaction.hash())).toEqual([
        reactionAddLike.hash(),
        reactionAddRecast.hash(),
      ]);
    });

    test('succeeds with type Like', async () => {
      const reactions = await client.getReactionsByFid(fid, ReactionType.Like);
      // The underlying buffers are different, so we can't compare full objects
      expect(reactions._unsafeUnwrap().map((reaction) => reaction.hash())).toEqual([reactionAddLike.hash()]);
    });

    test('succeeds with type Recast', async () => {
      const reactions = await client.getReactionsByFid(fid, ReactionType.Recast);
      // The underlying buffers are different, so we can't compare full objects
      expect(reactions._unsafeUnwrap().map((reaction) => reaction.hash())).toEqual([reactionAddRecast.hash()]);
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
      // The underlying buffers are different, so we can't compare full objects
      expect(reactions._unsafeUnwrap().map((reaction) => reaction.hash())).toEqual([
        reactionAddLike.hash(),
        reactionAddRecast.hash(),
      ]);
    });

    test('succeeds with type Like', async () => {
      const reactions = await client.getReactionsByCast(castId, ReactionType.Like);
      // The underlying buffers are different, so we can't compare full objects
      expect(reactions._unsafeUnwrap().map((reaction) => reaction.hash())).toEqual([reactionAddLike.hash()]);
    });

    test('succeeds with type Recast', async () => {
      const reactions = await client.getReactionsByCast(castId, ReactionType.Recast);
      // The underlying buffers are different, so we can't compare full objects
      expect(reactions._unsafeUnwrap().map((reaction) => reaction.hash())).toEqual([reactionAddRecast.hash()]);
    });
  });

  test('returns empty array without messages', async () => {
    const reactions = await client.getReactionsByCast(castId);
    expect(reactions._unsafeUnwrap()).toEqual([]);
  });
});
