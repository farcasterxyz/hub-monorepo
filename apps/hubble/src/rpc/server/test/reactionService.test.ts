import * as protobufs from '@farcaster/protobufs';
import { Factories, getInsecureHubRpcClient, HubError, HubRpcClient } from '@farcaster/utils';
import SyncEngine from '~/network/sync/syncEngine';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.reactionService.test');
const network = protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(engine, db));
  const port = await server.start();
  client = getInsecureHubRpcClient(`127.0.0.1:${port}`);
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

let castId: protobufs.CastId;
let reactionAddLike: protobufs.ReactionAddMessage;
let reactionAddRecast: protobufs.ReactionAddMessage;

beforeAll(async () => {
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySigner.signerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerBody: { signer: signer.signerKey } } },
    { transient: { signer: custodySigner } }
  );

  castId = Factories.CastId.build();

  reactionAddLike = await Factories.ReactionAddMessage.create(
    { data: { fid, reactionBody: { type: protobufs.ReactionType.REACTION_TYPE_LIKE, targetCastId: castId } } },
    { transient: { signer } }
  );

  reactionAddRecast = await Factories.ReactionAddMessage.create(
    { data: { fid, reactionBody: { type: protobufs.ReactionType.REACTION_TYPE_RECAST, targetCastId: castId } } },
    { transient: { signer } }
  );
});

describe('getReaction', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds with like', async () => {
    await engine.mergeMessage(reactionAddLike);

    const result = await client.getReaction(
      protobufs.ReactionRequest.create({ fid, reactionType: reactionAddLike.data.reactionBody.type, castId })
    );

    expect(protobufs.Message.toJSON(result._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(reactionAddLike));
  });

  test('succeeds with recast', async () => {
    await engine.mergeMessage(reactionAddRecast);

    const result = await client.getReaction(
      protobufs.ReactionRequest.create({ fid, reactionType: reactionAddRecast.data.reactionBody.type, castId })
    );

    expect(protobufs.Message.toJSON(result._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(reactionAddRecast));
  });

  test('fails if reaction is missing', async () => {
    const result = await client.getReaction(
      protobufs.ReactionRequest.create({ fid, reactionType: reactionAddRecast.data.reactionBody.type, castId })
    );
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails with invalid reaction type', async () => {
    const result = await client.getReaction(
      protobufs.ReactionRequest.create({
        fid,
        castId,
      })
    );

    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'targetId provided without type')
    );
  });

  test('fails without cast', async () => {
    const castId = Factories.CastId.build({ fid: 0, hash: new Uint8Array() });
    const result = await client.getReaction(
      protobufs.ReactionRequest.create({ fid, castId: castId, reactionType: protobufs.ReactionType.REACTION_TYPE_LIKE })
    );
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'fid is missing, hash is missing')
    );
  });

  test('fails without fid', async () => {
    const castId = Factories.CastId.build();
    const result = await client.getReaction(
      protobufs.ReactionRequest.create({ castId, reactionType: protobufs.ReactionType.REACTION_TYPE_LIKE })
    );
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
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
        const reactions = await client.getReactionsByFid(protobufs.ReactionsByFidRequest.create({ fid }));
        expect(reactions._unsafeUnwrap().messages.map((m) => protobufs.Message.toJSON(m))).toEqual(
          [reactionAddLike, reactionAddRecast].map((m) => protobufs.Message.toJSON(m))
        );
      });

      test('succeeds with type Like', async () => {
        const reactions = await client.getReactionsByFid(
          protobufs.ReactionsByFidRequest.create({ fid, reactionType: protobufs.ReactionType.REACTION_TYPE_LIKE })
        );

        expect(reactions._unsafeUnwrap().messages.map((m) => protobufs.Message.toJSON(m))).toEqual(
          [reactionAddLike].map((m) => protobufs.Message.toJSON(m))
        );
      });

      test('succeeds with type Recast', async () => {
        const reactions = await client.getReactionsByFid(
          protobufs.ReactionsByFidRequest.create({ fid, reactionType: protobufs.ReactionType.REACTION_TYPE_RECAST })
        );
        expect(reactions._unsafeUnwrap().messages.map((m) => protobufs.Message.toJSON(m))).toEqual(
          [reactionAddRecast].map((m) => protobufs.Message.toJSON(m))
        );
      });
    });

    test('returns empty array without messages', async () => {
      const reactions = await client.getReactionsByFid(protobufs.ReactionsByFidRequest.create({ fid }));
      expect(reactions._unsafeUnwrap().messages).toEqual([]);
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
        const reactions = await client.getReactionsByCast(protobufs.ReactionsByCastRequest.create({ castId }));
        expect(reactions._unsafeUnwrap().messages.map((m) => protobufs.Message.toJSON(m))).toEqual(
          [reactionAddLike, reactionAddRecast].map((m) => protobufs.Message.toJSON(m))
        );
      });

      test('succeeds with type Like', async () => {
        const reactions = await client.getReactionsByCast(
          protobufs.ReactionsByCastRequest.create({ castId, reactionType: protobufs.ReactionType.REACTION_TYPE_LIKE })
        );
        expect(reactions._unsafeUnwrap().messages.map((m) => protobufs.Message.toJSON(m))).toEqual(
          [reactionAddLike].map((m) => protobufs.Message.toJSON(m))
        );
      });

      test('succeeds with type Recast', async () => {
        const reactions = await client.getReactionsByCast(
          protobufs.ReactionsByCastRequest.create({ castId, reactionType: protobufs.ReactionType.REACTION_TYPE_RECAST })
        );
        expect(reactions._unsafeUnwrap().messages.map((m) => protobufs.Message.toJSON(m))).toEqual(
          [reactionAddRecast].map((m) => protobufs.Message.toJSON(m))
        );
      });
    });

    test('returns empty array without messages', async () => {
      const reactions = await client.getReactionsByCast(protobufs.ReactionsByCastRequest.create({ castId }));
      expect(reactions._unsafeUnwrap().messages).toEqual([]);
    });
  });
});
