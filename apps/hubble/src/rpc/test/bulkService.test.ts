import {
  CastAddMessage,
  CastRemoveMessage,
  Factories,
  FarcasterNetwork,
  FidRequest,
  getFarcasterTime,
  getInsecureHubRpcClient,
  HubResult,
  HubRpcClient,
  LinkAddMessage,
  LinkRemoveMessage,
  Message,
  MessagesResponse,
  OnChainEvent,
  ReactionAddMessage,
  ReactionRemoveMessage,
  FidTimestampRequest,
  UserDataAddMessage,
  UserDataType,
  VerificationAddAddressMessage,
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
const timestamp = getFarcasterTime()._unsafeUnwrap();

let custodyEvent: OnChainEvent;
let signerEvent: OnChainEvent;
let storageEvent: OnChainEvent;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
  signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signerKey } });
  storageEvent = Factories.StorageRentOnChainEvent.build({ fid });
});

const assertMessagesMatchResult = (result: HubResult<MessagesResponse>, messages: Message[]) => {
  expect(result._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(messages.map((m) => Message.toJSON(m)));
};

describe("getAllCastMessagesByFid", () => {
  let castAdd: CastAddMessage;
  let castRemove: CastRemoveMessage;

  beforeAll(async () => {
    castAdd = await Factories.CastAddMessage.create({ data: { fid, network, timestamp } }, { transient: { signer } });

    castRemove = await Factories.CastRemoveMessage.create(
      { data: { fid, network, timestamp: castAdd.data.timestamp + 1 } },
      { transient: { signer } },
    );
  });

  beforeEach(async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
  });

  test("succeeds", async () => {
    await engine.mergeMessage(castAdd);
    await engine.mergeMessage(castRemove);
    const result = await client.getAllCastMessagesByFid(FidTimestampRequest.create({ fid }));
    assertMessagesMatchResult(result, [castAdd, castRemove]);
  });

  test("returns empty array without messages", async () => {
    const result = await client.getAllCastMessagesByFid(FidTimestampRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });

  test("applies time filter", async () => {
    await engine.mergeMessage(castAdd);
    await engine.mergeMessage(castRemove);
    // Start timestamp is applied and it's inclusive
    const result1 = await client.getAllCastMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result1, [castRemove]);

    // If there's no stop time, we include everything past start time
    const result2 = await client.getAllCastMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: timestamp }),
    );
    assertMessagesMatchResult(result2, [castAdd, castRemove]);
    getFarcasterTime;

    // Stop timestamp is applied and it's inclusive
    const result3 = await client.getAllCastMessagesByFid(FidTimestampRequest.create({ fid, stopTimestamp: timestamp }));
    assertMessagesMatchResult(result3, [castAdd]);

    // If there's no start time, we include everything before stop time
    const result4 = await client.getAllCastMessagesByFid(
      FidTimestampRequest.create({ fid, stopTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result4, [castAdd, castRemove]);

    // If the start time is 0, we include everything before stop time
    const result5 = await client.getAllCastMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: 0, stopTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result5, [castAdd, castRemove]);
  });
});

describe("getAllReactionMessagesByFid", () => {
  let reactionAdd: ReactionAddMessage;
  let reactionRemove: ReactionRemoveMessage;

  beforeAll(async () => {
    reactionAdd = await Factories.ReactionAddMessage.create(
      { data: { fid, network, timestamp } },
      { transient: { signer } },
    );

    reactionRemove = await Factories.ReactionRemoveMessage.create(
      { data: { fid, network, timestamp: reactionAdd.data.timestamp + 1 } },
      { transient: { signer } },
    );
  });

  beforeEach(async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
  });

  test("succeeds", async () => {
    await engine.mergeMessage(reactionAdd);
    await engine.mergeMessage(reactionRemove);
    const result = await client.getAllReactionMessagesByFid(FidTimestampRequest.create({ fid }));
    assertMessagesMatchResult(result, [reactionAdd, reactionRemove]);
  });

  test("returns empty array without messages", async () => {
    const result = await client.getAllReactionMessagesByFid(FidTimestampRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });

  test("applies time filter", async () => {
    await engine.mergeMessage(reactionAdd);
    await engine.mergeMessage(reactionRemove);
    // Start timestamp is applied and it's inclusive
    const result1 = await client.getAllReactionMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result1, [reactionRemove]);

    // If there's no stop time, we include everything past start time
    const result2 = await client.getAllReactionMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: timestamp }),
    );
    assertMessagesMatchResult(result2, [reactionAdd, reactionRemove]);
    getFarcasterTime;

    // Stop timestamp is applied and it's inclusive
    const result3 = await client.getAllReactionMessagesByFid(
      FidTimestampRequest.create({ fid, stopTimestamp: timestamp }),
    );
    assertMessagesMatchResult(result3, [reactionAdd]);

    // If there's no start time, we include everything before stop time
    const result4 = await client.getAllReactionMessagesByFid(
      FidTimestampRequest.create({ fid, stopTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result4, [reactionAdd, reactionRemove]);

    // If the start time is 0, we include everything before stop time
    const result5 = await client.getAllReactionMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: 0, stopTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result5, [reactionAdd, reactionRemove]);
  });
});

describe("getAllVerificationMessagesByFid", () => {
  let verificationAdd: VerificationAddAddressMessage;
  let verificationRemove: VerificationRemoveMessage;

  beforeAll(async () => {
    verificationAdd = await Factories.VerificationAddEthAddressMessage.create(
      { data: { fid, network, timestamp } },
      { transient: { signer } },
    );

    verificationRemove = await Factories.VerificationRemoveMessage.create(
      { data: { fid, network, timestamp: verificationAdd.data.timestamp + 1 } },
      { transient: { signer } },
    );
  });

  beforeEach(async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
  });

  test("succeeds", async () => {
    await engine.mergeMessage(verificationAdd);
    await engine.mergeMessage(verificationRemove);
    const result = await client.getAllVerificationMessagesByFid(FidTimestampRequest.create({ fid }));
    assertMessagesMatchResult(result, [verificationAdd, verificationRemove]);
  });

  test("returns empty array without messages", async () => {
    const result = await client.getAllVerificationMessagesByFid(FidTimestampRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });

  test("applies time filter", async () => {
    await engine.mergeMessage(verificationAdd);
    await engine.mergeMessage(verificationRemove);
    // Start timestamp is applied and it's inclusive
    const result1 = await client.getAllVerificationMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result1, [verificationRemove]);

    // If there's no stop time, we include everything past start time
    const result2 = await client.getAllVerificationMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: timestamp }),
    );
    assertMessagesMatchResult(result2, [verificationAdd, verificationRemove]);
    getFarcasterTime;

    // Stop timestamp is applied and it's inclusive
    const result3 = await client.getAllVerificationMessagesByFid(
      FidTimestampRequest.create({ fid, stopTimestamp: timestamp }),
    );
    assertMessagesMatchResult(result3, [verificationAdd]);

    // If there's no start time, we include everything before stop time
    const result4 = await client.getAllVerificationMessagesByFid(
      FidTimestampRequest.create({ fid, stopTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result4, [verificationAdd, verificationRemove]);

    // If the start time is 0, we include everything before stop time
    const result5 = await client.getAllVerificationMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: 0, stopTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result5, [verificationAdd, verificationRemove]);
  });
});

describe("getAllUserDataMessagesByFid", () => {
  let userDataAdd1: UserDataAddMessage;
  let userDataAdd2: UserDataAddMessage;

  beforeAll(async () => {
    userDataAdd1 = await Factories.UserDataAddMessage.create(
      { data: { fid, network, timestamp, userDataBody: { type: UserDataType.BIO } } },
      { transient: { signer } },
    );
    userDataAdd2 = await Factories.UserDataAddMessage.create(
      { data: { fid, network, timestamp: userDataAdd1.data.timestamp + 1, userDataBody: { type: UserDataType.PFP } } },
      { transient: { signer } },
    );
  });

  beforeEach(async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
  });

  test("succeeds", async () => {
    await engine.mergeMessage(userDataAdd1);
    const result = await client.getAllUserDataMessagesByFid(FidTimestampRequest.create({ fid }));
    assertMessagesMatchResult(result, [userDataAdd1]);
  });

  test("returns empty array without messages", async () => {
    const result = await client.getAllUserDataMessagesByFid(FidTimestampRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });

  test("applies time filter", async () => {
    await engine.mergeMessage(userDataAdd1);
    await engine.mergeMessage(userDataAdd2);

    // Start timestamp is applied and it's inclusive
    const result1 = await client.getAllUserDataMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result1, [userDataAdd2]);

    // If there's no stop time, we include everything past start time
    const result2 = await client.getAllUserDataMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: timestamp }),
    );
    assertMessagesMatchResult(result2, [userDataAdd1, userDataAdd2]);

    // Stop timestamp is applied and it's inclusive
    const result3 = await client.getAllUserDataMessagesByFid(
      FidTimestampRequest.create({ fid, stopTimestamp: timestamp }),
    );
    assertMessagesMatchResult(result3, [userDataAdd1]);

    // If there's no start time, we include everything before stop time
    const result4 = await client.getAllUserDataMessagesByFid(
      FidTimestampRequest.create({ fid, stopTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result4, [userDataAdd1, userDataAdd2]);

    // If the start time is 0, we include everything before stop time
    const result5 = await client.getAllUserDataMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: 0, stopTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result5, [userDataAdd1, userDataAdd2]);
  });
});

describe("getAllLinkMessagesByFid", () => {
  let linkAdd: LinkAddMessage;
  let linkRemove: LinkRemoveMessage;

  beforeAll(async () => {
    linkAdd = await Factories.LinkAddMessage.create({ data: { fid, timestamp } }, { transient: { signer } });

    linkRemove = await Factories.LinkRemoveMessage.create(
      {
        data: {
          fid,
          timestamp: linkAdd.data.timestamp + 1,
        },
      },
      { transient: { signer } },
    );
  });

  beforeEach(async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
  });

  test("succeeds", async () => {
    await engine.mergeMessage(linkAdd);
    await engine.mergeMessage(linkRemove);
    const result = await client.getAllLinkMessagesByFid(FidTimestampRequest.create({ fid }));
    assertMessagesMatchResult(result, [linkAdd, linkRemove]);
  });

  test("returns empty array without messages", async () => {
    const result = await client.getAllLinkMessagesByFid(FidTimestampRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });

  test("applies time filter", async () => {
    await engine.mergeMessage(linkAdd);
    await engine.mergeMessage(linkRemove);
    // Start timestamp is applied and it's inclusive
    const result1 = await client.getAllLinkMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result1, [linkRemove]);

    // If there's no stop time, we include everything past start time
    const result2 = await client.getAllLinkMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: timestamp }),
    );
    assertMessagesMatchResult(result2, [linkAdd, linkRemove]);
    getFarcasterTime;

    // Stop timestamp is applied and it's inclusive
    const result3 = await client.getAllLinkMessagesByFid(FidTimestampRequest.create({ fid, stopTimestamp: timestamp }));
    assertMessagesMatchResult(result3, [linkAdd]);

    // If there's no start time, we include everything before stop time
    const result4 = await client.getAllLinkMessagesByFid(
      FidTimestampRequest.create({ fid, stopTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result4, [linkAdd, linkRemove]);

    // If the start time is 0, we include everything before stop time
    const result5 = await client.getAllLinkMessagesByFid(
      FidTimestampRequest.create({ fid, startTimestamp: 0, stopTimestamp: timestamp + 1 }),
    );
    assertMessagesMatchResult(result5, [linkAdd, linkRemove]);
  });
});
