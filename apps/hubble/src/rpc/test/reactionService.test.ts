import { faker } from "@faker-js/faker";
import {
  Message,
  FarcasterNetwork,
  CastId,
  ReactionAddMessage,
  ReactionType,
  ReactionRequest,
  ReactionsByFidRequest,
  ReactionsByTargetRequest,
  Factories,
  HubError,
  getInsecureHubRpcClient,
  HubRpcClient,
  OnChainEvent,
} from "@farcaster/hub-nodejs";
import SyncEngine from "../../network/sync/syncEngine.js";
import Server from "../server.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import Engine from "../../storage/engine/index.js";
import { MockHub } from "../../test/mocks.js";

const db = jestRocksDB("protobufs.rpc.reactionService.test");
const network = FarcasterNetwork.TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

let syncEngine: SyncEngine;
let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  syncEngine = new SyncEngine(hub, db);
  await syncEngine.start();
  server = new Server(hub, engine, syncEngine);
  const port = await server.start();
  client = getInsecureHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  client.close();
  await syncEngine.stop();
  await server.stop();
  await engine.stop();
});

const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: OnChainEvent;
let signerEvent: OnChainEvent;
let storageEvent: OnChainEvent;

let castId: CastId;
let reactionAddLike: ReactionAddMessage;
let reactionAddRecast: ReactionAddMessage;
let reactionAddTargetUrl: ReactionAddMessage;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
  signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signerKey } });
  storageEvent = Factories.StorageRentOnChainEvent.build({ fid });

  castId = Factories.CastId.build();

  reactionAddLike = await Factories.ReactionAddMessage.create(
    { data: { fid, reactionBody: { type: ReactionType.LIKE, targetCastId: castId } } },
    { transient: { signer } },
  );

  reactionAddRecast = await Factories.ReactionAddMessage.create(
    {
      data: {
        fid,
        reactionBody: { type: ReactionType.RECAST, targetCastId: castId },
        timestamp: reactionAddLike.data.timestamp + 1,
      },
    },
    { transient: { signer } },
  );

  reactionAddTargetUrl = await Factories.ReactionAddMessage.create(
    { data: { fid, reactionBody: { targetCastId: undefined, targetUrl: faker.internet.url() } } },
    { transient: { signer } },
  );
});

describe("getReaction", () => {
  beforeEach(async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
  });

  test("succeeds with like", async () => {
    await engine.mergeMessage(reactionAddLike);

    const result = await client.getReaction(
      ReactionRequest.create({ fid, reactionType: reactionAddLike.data.reactionBody.type, targetCastId: castId }),
    );

    expect(Message.toJSON(result._unsafeUnwrap())).toEqual(Message.toJSON(reactionAddLike));
  });

  test("succeeds with recast", async () => {
    await engine.mergeMessage(reactionAddRecast);

    const result = await client.getReaction(
      ReactionRequest.create({ fid, reactionType: reactionAddRecast.data.reactionBody.type, targetCastId: castId }),
    );

    expect(Message.toJSON(result._unsafeUnwrap())).toEqual(Message.toJSON(reactionAddRecast));
  });

  test("succeeds with target url", async () => {
    await engine.mergeMessage(reactionAddTargetUrl);

    const { type, targetUrl } = reactionAddTargetUrl.data.reactionBody;
    const result = await client.getReaction(ReactionRequest.create({ fid, reactionType: type, targetUrl }));

    expect(result.isOk()).toBeTruthy();
    expect(Message.toJSON(result._unsafeUnwrap())).toEqual(Message.toJSON(reactionAddTargetUrl));
  });

  test("fails if reaction is missing", async () => {
    const result = await client.getReaction(
      ReactionRequest.create({ fid, reactionType: reactionAddRecast.data.reactionBody.type, targetCastId: castId }),
    );
    expect(result._unsafeUnwrapErr().errCode).toEqual("not_found");
  });

  test("fails with invalid reaction type", async () => {
    const result = await client.getReaction(
      ReactionRequest.create({
        fid,
        targetCastId: castId,
      }),
    );

    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError("bad_request.validation_failure", "targetCastId provided without type"),
    );
  });

  test("fails without cast", async () => {
    const castId = Factories.CastId.build({ fid: 0, hash: new Uint8Array() });
    const result = await client.getReaction(
      ReactionRequest.create({ fid, targetCastId: castId, reactionType: ReactionType.LIKE }),
    );
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError("bad_request.validation_failure", "fid is missing, hash is missing"),
    );
  });

  test("fails without fid", async () => {
    const castId = Factories.CastId.build();
    const result = await client.getReaction(
      ReactionRequest.create({ targetCastId: castId, reactionType: ReactionType.LIKE }),
    );
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "fid is missing"));
  });

  describe("getReactionsByFid", () => {
    beforeEach(async () => {
      await engine.mergeOnChainEvent(custodyEvent);
      await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);
    });

    describe("with messages", () => {
      beforeEach(async () => {
        await engine.mergeMessage(reactionAddLike);
        await engine.mergeMessage(reactionAddRecast);
      });

      test("succeeds without type", async () => {
        const reactions = await client.getReactionsByFid(ReactionsByFidRequest.create({ fid }));
        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddLike, reactionAddRecast].map((m) => Message.toJSON(m)),
        );
      });

      test("succeeds with type Like", async () => {
        const reactions = await client.getReactionsByFid(
          ReactionsByFidRequest.create({ fid, reactionType: ReactionType.LIKE }),
        );

        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddLike].map((m) => Message.toJSON(m)),
        );
      });

      test("succeeds with type Recast", async () => {
        const reactions = await client.getReactionsByFid(
          ReactionsByFidRequest.create({ fid, reactionType: ReactionType.RECAST }),
        );
        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddRecast].map((m) => Message.toJSON(m)),
        );
      });
    });

    test("returns empty array without messages", async () => {
      const reactions = await client.getReactionsByFid(ReactionsByFidRequest.create({ fid }));
      expect(reactions._unsafeUnwrap().messages).toEqual([]);
    });
  });

  describe("getReactionsByCast", () => {
    beforeEach(async () => {
      await engine.mergeOnChainEvent(custodyEvent);
      await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);
    });

    describe("with messages", () => {
      beforeEach(async () => {
        await engine.mergeMessage(reactionAddLike);
        await engine.mergeMessage(reactionAddRecast);
      });

      test("succeeds without type", async () => {
        const reactions = await client.getReactionsByCast(ReactionsByTargetRequest.create({ targetCastId: castId }));
        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddLike, reactionAddRecast].map((m) => Message.toJSON(m)),
        );
      });

      test("succeeds with type Like", async () => {
        const reactions = await client.getReactionsByCast(
          ReactionsByTargetRequest.create({ targetCastId: castId, reactionType: ReactionType.LIKE }),
        );

        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddLike].map((m) => Message.toJSON(m)),
        );
      });

      test("succeeds with type Recast", async () => {
        const reactions = await client.getReactionsByCast(
          ReactionsByTargetRequest.create({ targetCastId: castId, reactionType: ReactionType.RECAST }),
        );
        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddRecast].map((m) => Message.toJSON(m)),
        );
      });
    });

    test("returns empty array without messages", async () => {
      const reactions = await client.getReactionsByCast(ReactionsByTargetRequest.create({ targetCastId: castId }));
      expect(reactions._unsafeUnwrap().messages).toEqual([]);
    });

    test("fails with target url", async () => {
      const targetUrl = faker.internet.url();
      const reactionAddTargetUrl = await Factories.ReactionAddMessage.create(
        { data: { fid, reactionBody: { targetUrl, targetCastId: undefined } } },
        { transient: { signer } },
      );
      await engine.mergeMessage(reactionAddTargetUrl);
      const reactions = await client.getReactionsByCast(ReactionsByTargetRequest.create({ targetUrl }));
      expect(reactions.isErr()).toBeTruthy();
    });
  });

  describe("getReactionsByTarget", () => {
    beforeEach(async () => {
      await engine.mergeOnChainEvent(custodyEvent);
      await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);
    });

    describe("with messages", () => {
      beforeEach(async () => {
        await engine.mergeMessage(reactionAddLike);
        await engine.mergeMessage(reactionAddRecast);
      });

      test("succeeds without type", async () => {
        const reactions = await client.getReactionsByTarget(ReactionsByTargetRequest.create({ targetCastId: castId }));
        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddLike, reactionAddRecast].map((m) => Message.toJSON(m)),
        );
      });

      test("succeeds with type Like", async () => {
        const reactions = await client.getReactionsByTarget(
          ReactionsByTargetRequest.create({ targetCastId: castId, reactionType: ReactionType.LIKE }),
        );
        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddLike].map((m) => Message.toJSON(m)),
        );
      });

      test("succeeds with type Recast", async () => {
        const reactions = await client.getReactionsByTarget(
          ReactionsByTargetRequest.create({ targetCastId: castId, reactionType: ReactionType.RECAST }),
        );
        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddRecast].map((m) => Message.toJSON(m)),
        );
      });

      test("succeeds with target url", async () => {
        const targetUrl = faker.internet.url();
        const reactionAddTargetUrl = await Factories.ReactionAddMessage.create(
          { data: { fid, reactionBody: { targetUrl, targetCastId: undefined } } },
          { transient: { signer } },
        );
        await engine.mergeMessage(reactionAddTargetUrl);
        const reactions = await client.getReactionsByTarget(ReactionsByTargetRequest.create({ targetUrl }));
        expect(reactions.isOk()).toBeTruthy();
        expect(reactions._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [reactionAddTargetUrl].map((m) => Message.toJSON(m)),
        );
      });
    });

    test("returns empty array without messages", async () => {
      const reactions = await client.getReactionsByTarget(ReactionsByTargetRequest.create({ targetCastId: castId }));
      expect(reactions._unsafeUnwrap().messages).toEqual([]);
    });
  });
});
