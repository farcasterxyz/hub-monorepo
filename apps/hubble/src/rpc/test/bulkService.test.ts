import {
  CastAddMessage,
  CastRemoveMessage,
  Factories,
  FarcasterNetwork,
  FidRequest,
  getInsecureHubRpcClient,
  HubResult,
  HubRpcClient,
  IdRegistryEvent,
  Message,
  MessagesResponse,
  ReactionAddMessage,
  ReactionRemoveMessage,
  SignerAddMessage,
  SignerRemoveMessage,
  UserDataAddMessage,
  UserDataType,
  VerificationAddEthAddressMessage,
  VerificationRemoveMessage,
} from "@farcaster/hub-nodejs";
import SyncEngine from "../../network/sync/syncEngine.js";
import Server from "../server.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import Engine from "../../storage/engine/index.js";
import { MockHub } from "../../test/mocks.js";

const db = jestRocksDB("protobufs.rpc.bulkService.test");
const network = FarcasterNetwork.TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(hub, db));
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

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } },
  );
});

const assertMessagesMatchResult = (result: HubResult<MessagesResponse>, messages: Message[]) => {
  expect(result._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(messages.map((m) => Message.toJSON(m)));
};

describe("getAllCastMessagesByFid", () => {
  let castAdd: CastAddMessage;
  let castRemove: CastRemoveMessage;

  beforeAll(async () => {
    castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });

    castRemove = await Factories.CastRemoveMessage.create(
      { data: { fid, network, timestamp: castAdd.data.timestamp + 1 } },
      { transient: { signer } },
    );
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test("succeeds", async () => {
    await engine.mergeMessage(castAdd);
    await engine.mergeMessage(castRemove);
    const result = await client.getAllCastMessagesByFid(FidRequest.create({ fid }));
    assertMessagesMatchResult(result, [castAdd, castRemove]);
  });

  test("returns empty array without messages", async () => {
    const result = await client.getAllCastMessagesByFid(FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });
});

describe("getAllReactionMessagesByFid", () => {
  let reactionAdd: ReactionAddMessage;
  let reactionRemove: ReactionRemoveMessage;

  beforeAll(async () => {
    reactionAdd = await Factories.ReactionAddMessage.create({ data: { fid, network } }, { transient: { signer } });

    reactionRemove = await Factories.ReactionRemoveMessage.create(
      { data: { fid, network, timestamp: reactionAdd.data.timestamp + 1 } },
      { transient: { signer } },
    );
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test("succeeds", async () => {
    await engine.mergeMessage(reactionAdd);
    await engine.mergeMessage(reactionRemove);
    const result = await client.getAllReactionMessagesByFid(FidRequest.create({ fid }));
    assertMessagesMatchResult(result, [reactionAdd, reactionRemove]);
  });

  test("returns empty array without messages", async () => {
    const result = await client.getAllReactionMessagesByFid(FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });
});

describe("getAllVerificationMessagesByFid", () => {
  let verificationAdd: VerificationAddEthAddressMessage;
  let verificationRemove: VerificationRemoveMessage;

  beforeAll(async () => {
    verificationAdd = await Factories.VerificationAddEthAddressMessage.create(
      { data: { fid, network } },
      { transient: { signer } },
    );

    verificationRemove = await Factories.VerificationRemoveMessage.create(
      { data: { fid, network, timestamp: verificationAdd.data.timestamp + 1 } },
      { transient: { signer } },
    );
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test("succeeds", async () => {
    await engine.mergeMessage(verificationAdd);
    await engine.mergeMessage(verificationRemove);
    const result = await client.getAllVerificationMessagesByFid(FidRequest.create({ fid }));
    assertMessagesMatchResult(result, [verificationAdd, verificationRemove]);
  });

  test("returns empty array without messages", async () => {
    const result = await client.getAllVerificationMessagesByFid(FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });
});

describe("getAllSignerMessagesByFid", () => {
  let signerRemove: SignerRemoveMessage;

  beforeAll(async () => {
    signerRemove = await Factories.SignerRemoveMessage.create(
      { data: { fid, network, timestamp: signerAdd.data.timestamp + 1 } },
      { transient: { signer: custodySigner } },
    );
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
  });

  test("succeeds", async () => {
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(signerRemove);
    const result = await client.getAllSignerMessagesByFid(FidRequest.create({ fid }));
    assertMessagesMatchResult(result, [signerAdd, signerRemove]);
  });

  test("returns pageSize results", async () => {
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(signerRemove);
    const result = await client.getAllSignerMessagesByFid(FidRequest.create({ fid, pageSize: 1 }));
    assertMessagesMatchResult(result, [signerAdd]);
  });

  test("returns all signer messages when pageSize > events", async () => {
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(signerRemove);
    const result = await client.getAllSignerMessagesByFid(FidRequest.create({ fid, pageSize: 3 }));
    assertMessagesMatchResult(result, [signerAdd, signerRemove]);
  });

  test("returns results after pageToken", async () => {
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(signerRemove);
    const page1Result = await client.getAllSignerMessagesByFid(FidRequest.create({ fid, pageSize: 1 }));
    const page2Result = await client.getAllSignerMessagesByFid(
      FidRequest.create({ fid, pageSize: 1, pageToken: page1Result._unsafeUnwrap().nextPageToken }),
    );
    assertMessagesMatchResult(page2Result, [signerRemove]);
  });

  test("returns empty array without messages", async () => {
    const result = await client.getAllSignerMessagesByFid(FidRequest.create({ fid }));
    assertMessagesMatchResult(result, []);
  });
});

describe("getAllUserDataMessagesByFid", () => {
  let userDataAdd: UserDataAddMessage;

  beforeAll(async () => {
    userDataAdd = await Factories.UserDataAddMessage.create(
      { data: { fid, network, userDataBody: { type: UserDataType.BIO } } },
      { transient: { signer } },
    );
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test("succeeds", async () => {
    await engine.mergeMessage(userDataAdd);
    const result = await client.getAllUserDataMessagesByFid(FidRequest.create({ fid }));
    assertMessagesMatchResult(result, [userDataAdd]);
  });

  test("returns empty array without messages", async () => {
    const result = await client.getAllUserDataMessagesByFid(FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });
});
