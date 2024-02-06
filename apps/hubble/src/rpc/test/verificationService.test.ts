import {
  Factories,
  HubError,
  getInsecureHubRpcClient,
  HubRpcClient,
  Message,
  FarcasterNetwork,
  VerificationAddAddressMessage,
  VerificationRequest,
  FidRequest,
  OnChainEvent,
} from "@farcaster/hub-nodejs";
import SyncEngine from "../../network/sync/syncEngine.js";
import Server from "../server.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import Engine from "../../storage/engine/index.js";
import { MockHub } from "../../test/mocks.js";

const db = jestRocksDB("protobufs.rpc.verificationService.test");
const network = FarcasterNetwork.TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

let syncEngine: SyncEngine;
let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  syncEngine = new SyncEngine(hub, db);
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

let verificationAdd: VerificationAddAddressMessage;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
  signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signerKey } });
  storageEvent = Factories.StorageRentOnChainEvent.build({ fid });

  verificationAdd = await Factories.VerificationAddEthAddressMessage.create(
    { data: { fid, network } },
    { transient: { signer } },
  );
});

describe("getVerification", () => {
  beforeEach(async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
  });

  test("succeeds", async () => {
    const r = await engine.mergeMessage(verificationAdd);
    expect(r.isOk()).toBeTruthy();

    const result = await client.getVerification(
      VerificationRequest.create({
        fid,
        address: verificationAdd.data.verificationAddAddressBody.address ?? new Uint8Array(),
      }),
    );
    expect(Message.toJSON(result._unsafeUnwrap())).toEqual(Message.toJSON(verificationAdd));
  });

  test("fails if verification is missing", async () => {
    const result = await client.getVerification(
      VerificationRequest.create({
        fid,
        address: verificationAdd.data.verificationAddAddressBody.address ?? new Uint8Array(),
      }),
    );
    expect(result._unsafeUnwrapErr().errCode).toEqual("not_found");
  });

  test("fails without address", async () => {
    const result = await client.getVerification(
      VerificationRequest.create({
        fid,
        address: new Uint8Array(),
      }),
    );
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError("bad_request.validation_failure", "Ethereum address is missing"),
    );
  });

  test("fails without fid", async () => {
    const result = await client.getVerification(
      VerificationRequest.create({
        address: verificationAdd.data.verificationAddAddressBody.address ?? new Uint8Array(),
      }),
    );
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "fid is missing"));
  });
});

describe("getVerificationsByFid", () => {
  beforeEach(async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
  });

  test("succeeds", async () => {
    const result = await engine.mergeMessage(verificationAdd);
    expect(result.isOk()).toBeTruthy();

    const verifications = await client.getVerificationsByFid(FidRequest.create({ fid }));
    expect(verifications._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
      [verificationAdd].map((m) => Message.toJSON(m)),
    );
  });

  test("returns empty array without messages", async () => {
    const verifications = await client.getVerificationsByFid(FidRequest.create({ fid }));
    expect(verifications._unsafeUnwrap().messages).toEqual([]);
  });
});
