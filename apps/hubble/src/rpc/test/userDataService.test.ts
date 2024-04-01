import {
  bytesToHexString,
  bytesToUtf8String,
  Factories,
  FarcasterNetwork,
  FidRequest,
  getInsecureHubRpcClient,
  HubError,
  HubRpcClient,
  Message,
  OnChainEvent,
  UserDataAddMessage,
  UserDataRequest,
  UserDataType,
  UserNameProof,
  UsernameProofMessage,
  UsernameProofRequest,
  UsernameProofsResponse,
  UserNameType,
} from "@farcaster/hub-nodejs";
import { Ok } from "neverthrow";
import SyncEngine from "../../network/sync/syncEngine.js";
import Server from "../server.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import Engine from "../../storage/engine/index.js";
import { MockHub } from "../../test/mocks.js";
import { jest } from "@jest/globals";
import { publicClient } from "../../test/utils.js";

const db = jestRocksDB("protobufs.rpc.userdataservice.test");
const network = FarcasterNetwork.TESTNET;
const engine = new Engine(db, network, undefined, publicClient);
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
const fname = Factories.Fname.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodySignerKey: Uint8Array;
let custodyEvent: OnChainEvent;
let signerEvent: OnChainEvent;
let storageEvent: OnChainEvent;

let pfpAdd: UserDataAddMessage;
let displayAdd: UserDataAddMessage;
let addFname: UserDataAddMessage;

let ensNameProof: UsernameProofMessage;
let addEnsName: UserDataAddMessage;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
  signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signerKey } });
  storageEvent = Factories.StorageRentOnChainEvent.build({ fid });

  pfpAdd = await Factories.UserDataAddMessage.create(
    { data: { fid, userDataBody: { type: UserDataType.PFP } } },
    { transient: { signer } },
  );

  displayAdd = await Factories.UserDataAddMessage.create(
    { data: { fid, userDataBody: { type: UserDataType.DISPLAY }, timestamp: pfpAdd.data.timestamp + 1 } },
    { transient: { signer } },
  );

  addFname = await Factories.UserDataAddMessage.create(
    {
      data: {
        fid,
        userDataBody: {
          type: UserDataType.USERNAME,
          value: bytesToUtf8String(fname)._unsafeUnwrap(),
        },
        timestamp: pfpAdd.data.timestamp + 2,
      },
    },
    { transient: { signer } },
  );

  const custodySignerAddress = bytesToHexString(custodySignerKey)._unsafeUnwrap();

  jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
    return Promise.resolve(custodySignerAddress);
  });
  ensNameProof = await Factories.UsernameProofMessage.create(
    {
      data: {
        fid,
        usernameProofBody: Factories.UserNameProof.build({
          fid,
          owner: custodySignerKey,
          name: Factories.EnsName.build(),
          type: UserNameType.USERNAME_TYPE_ENS_L1,
        }),
      },
    },
    { transient: { signer } },
  );
  addEnsName = await Factories.UserDataAddMessage.create(
    {
      data: {
        fid,
        userDataBody: {
          type: UserDataType.USERNAME,
          value: bytesToUtf8String(ensNameProof.data.usernameProofBody.name)._unsafeUnwrap(),
        },
        timestamp: addFname.data.timestamp + 2,
      },
    },
    { transient: { signer } },
  );
});

describe("getUserData", () => {
  beforeEach(async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
  });

  test("succeeds", async () => {
    expect(await engine.mergeMessage(pfpAdd)).toBeInstanceOf(Ok);
    expect(await engine.mergeMessage(displayAdd)).toBeInstanceOf(Ok);

    const pfp = await client.getUserData(UserDataRequest.create({ fid, userDataType: UserDataType.PFP }));
    expect(Message.toJSON(pfp._unsafeUnwrap())).toEqual(Message.toJSON(pfpAdd));

    const display = await client.getUserData(UserDataRequest.create({ fid, userDataType: UserDataType.DISPLAY }));
    expect(Message.toJSON(display._unsafeUnwrap())).toEqual(Message.toJSON(displayAdd));

    const fnameProof = Factories.UserNameProof.build({ name: fname, fid });
    await engine.mergeUserNameProof(fnameProof);

    expect(await engine.mergeMessage(addFname)).toBeInstanceOf(Ok);
    const fnameData = await client.getUserData(UserDataRequest.create({ fid, userDataType: UserDataType.USERNAME }));
    expect(Message.toJSON(fnameData._unsafeUnwrap())).toEqual(Message.toJSON(addFname));

    const usernameProof = await client.getUsernameProof(UsernameProofRequest.create({ name: fnameProof.name }));
    expect(UserNameProof.toJSON(usernameProof._unsafeUnwrap())).toEqual(UserNameProof.toJSON(fnameProof));

    expect(await engine.mergeMessage(ensNameProof)).toBeInstanceOf(Ok);
    const usernameProofs = await client.getUserNameProofsByFid(FidRequest.create({ fid }));
    expect(UsernameProofsResponse.toJSON(usernameProofs._unsafeUnwrap())).toEqual(
      UsernameProofsResponse.toJSON({ proofs: [fnameProof, ensNameProof.data.usernameProofBody] }),
    );

    expect(await engine.mergeMessage(addEnsName)).toBeInstanceOf(Ok);
    const ensNameData = await client.getUserData(UserDataRequest.create({ fid, userDataType: UserDataType.USERNAME }));
    expect(Message.toJSON(ensNameData._unsafeUnwrap())).toEqual(Message.toJSON(addEnsName));
  });

  test("fails when user data is missing", async () => {
    const pfp = await client.getUserData(UserDataRequest.create({ fid, userDataType: UserDataType.PFP }));
    expect(pfp._unsafeUnwrapErr().errCode).toEqual("not_found");
    const fname = await client.getUserData(UserDataRequest.create({ fid, userDataType: UserDataType.USERNAME }));
    expect(fname._unsafeUnwrapErr().errCode).toEqual("not_found");
  });

  test("fails without fid", async () => {
    const result = await client.getUserData(UserDataRequest.create({ fid: 0, userDataType: UserDataType.PFP }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "fid is missing"));
  });
});

describe("getUserDataByFid", () => {
  beforeEach(async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
  });

  test("succeeds", async () => {
    await engine.mergeMessage(pfpAdd);
    await engine.mergeMessage(displayAdd);
    const result = await client.getUserDataByFid(FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
      [pfpAdd, displayAdd].map((m) => Message.toJSON(m)),
    );
  });

  test("returns empty array without messages", async () => {
    const result = await client.getUserDataByFid(FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });
});
