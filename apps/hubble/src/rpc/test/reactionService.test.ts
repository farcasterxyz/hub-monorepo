import {
  Message,
  FarcasterNetwork,
  IdRegistryEvent,
  SignerAddMessage,
  CastId,
  ReactionAddMessage,
  ReactionType,
  ReactionRequest,
  ReactionsByFidRequest,
  ReactionsByCastRequest,
  Factories,
  HubError,
  getInsecureHubRpcClient,
  HubRpcClient,
} from '@farcaster/hub-nodejs';
import SyncEngine from '~/network/sync/syncEngine';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.reactionService.test');
const network = FarcasterNetwork.TESTNET;
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
  client.close();
  await server.stop();
  await engine.stop();
});

const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: IdRegistryEvent;
let signerAdd: SignerAddMessage;

let castId: CastId;
let reactionAddLike: ReactionAddMessage;
let reactionAddRecast: ReactionAddMessage;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } }
  );

  castId = Factories.CastId.build();

  reactionAddLike = await Factories.ReactionAddMessage.create(
    { data: { fid, reactionBody: { type: ReactionType.LIKE, targetCastId: castId } } },
    { transient: { signer } }
  );

  reactionAddRecast = await Factories.ReactionAddMessage.create(
    {
      data: {
        fid,
        reactionBody: { type: ReactionType.RECAST, targetCastId: castId },
        timestamp: reactionAddLike.data.timestamp + 1,
      },
    },
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
      ReactionRequest.create({ fid, reactionType: reactionAddLike.data.reactionBody.type, castId })
    );

    expect(Message.toJSON(result._unsafeUnwrap())).toEqual(Message.toJSON(reactionAddLike));
  });

  test('succeeds with recast', async () => {
    await engine.mergeMessage(reactionAddRecast);

    const result = await client.getReaction(
      ReactionRequest.create({ fid, reactionType: reactionAddRecast.data.reactionBody.type, castId })
    );

    expect(Message.toJSON(result._unsafeUnwrap())).toEqual(Message.toJSON(reactionAddRecast));
  });

  test('fails if reaction is missing', async () => {
    const result = await client.getReaction(
      ReactionRequest.create({ fid, reactionType: reactionAddRecast.data.reactionBody.type, castId })
    );
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails with invalid reaction type', async () => {
    const result = await client.getReaction(
      ReactionRequest.create({
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
      ReactionRequest.create({ fid, castId: castId, reactionType: ReactionType.LIKE })
    );
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'fid is missing, hash is missing')
    );
  });

  test('fails without fid', async () => {
    const castId = Factories.CastId.build();
    const result = await client.getReaction(ReactionRequest.create({ castId, reactionType: ReactionType.LIKE }));
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
        const reactions = await client.getReactionsByFid(ReactionsByFidRequest.create({ fid }));
        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddLike, reactionAddRecast].map((m) => Message.toJSON(m))
        );
      });

      test('succeeds with type Like', async () => {
        const reactions = await client.getReactionsByFid(
          ReactionsByFidRequest.create({ fid, reactionType: ReactionType.LIKE })
        );

        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddLike].map((m) => Message.toJSON(m))
        );
      });

      test('succeeds with type Recast', async () => {
        const reactions = await client.getReactionsByFid(
          ReactionsByFidRequest.create({ fid, reactionType: ReactionType.RECAST })
        );
        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddRecast].map((m) => Message.toJSON(m))
        );
      });
    });

    test('returns empty array without messages', async () => {
      const reactions = await client.getReactionsByFid(ReactionsByFidRequest.create({ fid }));
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
        const reactions = await client.getReactionsByCast(ReactionsByCastRequest.create({ castId }));
        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddLike, reactionAddRecast].map((m) => Message.toJSON(m))
        );
      });

      test('succeeds with type Like', async () => {
        const reactions = await client.getReactionsByCast(
          ReactionsByCastRequest.create({ castId, reactionType: ReactionType.LIKE })
        );
        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddLike].map((m) => Message.toJSON(m))
        );
      });

      test('succeeds with type Recast', async () => {
        const reactions = await client.getReactionsByCast(
          ReactionsByCastRequest.create({ castId, reactionType: ReactionType.RECAST })
        );
        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddRecast].map((m) => Message.toJSON(m))
        );
      });
    });

    test('returns empty array without messages', async () => {
      const reactions = await client.getReactionsByCast(ReactionsByCastRequest.create({ castId }));
      expect(reactions._unsafeUnwrap().messages).toEqual([]);
    });
  });
});
