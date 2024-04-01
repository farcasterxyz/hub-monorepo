import {
  Factories,
  HubResult,
  getInsecureHubRpcClient,
  HubRpcClient,
  FarcasterNetwork,
  Message,
  ReactionType,
} from "@farcaster/hub-nodejs";
import SyncEngine from "../../network/sync/syncEngine.js";
import Server from "../server.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import Engine from "../../storage/engine/index.js";
import { seedSigner } from "../../storage/engine/seed.js";
import { MockHub } from "../../test/mocks.js";

const db = jestRocksDB("protobufs.rpc.concurrency.test");
const network = FarcasterNetwork.TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

let syncEngine: SyncEngine;
let server: Server;
let client1: HubRpcClient;
let client2: HubRpcClient;
let client3: HubRpcClient;

beforeAll(async () => {
  syncEngine = new SyncEngine(hub, db);
  await syncEngine.start();
  server = new Server(hub, engine, syncEngine);
  const port = await server.start();
  client1 = getInsecureHubRpcClient(`127.0.0.1:${port}`);
  client2 = getInsecureHubRpcClient(`127.0.0.1:${port}`);
  client3 = getInsecureHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  client1.close();
  client2.close();
  client3.close();

  await syncEngine.stop();
  await server.stop();
  await engine.stop();
});

const fid = Factories.Fid.build();
const signer1 = Factories.Ed25519Signer.build();
const signer2 = Factories.Ed25519Signer.build();

const assertNoTimeouts = (results: HubResult<Message>[]) => {
  expect(
    results.every(
      (result) => result.isOk() || (result.isErr() && result.error.errCode !== "unavailable.storage_failure"),
    ),
  ).toBeTruthy();
};

describe("submitMessage", () => {
  beforeEach(async () => {
    const signerKey1 = (await signer1.getSignerKey())._unsafeUnwrap();
    const signerKey2 = (await signer2.getSignerKey())._unsafeUnwrap();
    const ethSigner = await seedSigner(engine, fid, signerKey1);
    await seedSigner(engine, fid, signerKey2, ethSigner);
  });

  test("succeeds with concurrent, conflicting reaction messages", async () => {
    const castId = Factories.CastId.build();
    const like1 = await Factories.ReactionAddMessage.create(
      { data: { fid, reactionBody: { type: ReactionType.LIKE, targetCastId: castId } } },
      { transient: { signer: signer1 } },
    );

    const like2 = await Factories.ReactionAddMessage.create(
      { data: { fid, reactionBody: { type: ReactionType.LIKE, targetCastId: castId } } },
      { transient: { signer: signer2 } },
    );

    const removeLike2 = await Factories.ReactionRemoveMessage.create(
      { data: { fid, reactionBody: { type: ReactionType.LIKE, targetCastId: castId } } },
      { transient: { signer: signer2 } },
    );

    const promises = Promise.all([
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

    const results = await promises;

    assertNoTimeouts(results);

    const response = await engine.getAllReactionMessagesByFid(fid);
    expect(response.isOk()).toBeTruthy();
    expect(response._unsafeUnwrap().messages.length).toEqual(1);
  });

  test("succeeds with concurrent, conflicting cast message", async () => {
    const cast1 = await Factories.CastAddMessage.create({ data: { fid } }, { transient: { signer: signer1 } });
    const cast2 = await Factories.CastAddMessage.create({ data: { fid } }, { transient: { signer: signer2 } });

    const removeCast1 = await Factories.CastRemoveMessage.create(
      { data: { fid, castRemoveBody: { targetHash: cast1.hash } } },
      { transient: { signer: signer1 } },
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

    const response = await engine.getAllCastMessagesByFid(fid);
    expect(response.isOk()).toBeTruthy();

    // We are expecting 2 messages. cast1add and cast2remove
    expect(response._unsafeUnwrap().messages.length).toEqual(2);
    expect(Message.toJSON(response._unsafeUnwrap().messages.find((m) => m.data.castAddBody) as Message)).toEqual(
      Message.toJSON(cast2),
    );
    expect(Message.toJSON(response._unsafeUnwrap().messages.find((m) => m.data.castRemoveBody) as Message)).toEqual(
      Message.toJSON(removeCast1),
    );
  });
});
