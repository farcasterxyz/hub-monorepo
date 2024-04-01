import {
  Factories,
  HubError,
  HubResult,
  getInsecureHubRpcClient,
  HubRpcClient,
  FarcasterNetwork,
  SignerRequest,
  FidRequest,
  FidsRequest,
  OnChainEvent,
  OnChainEventResponse,
  SignerEventType,
  IdRegistryEventByAddressRequest,
} from "@farcaster/hub-nodejs";
import { ok } from "neverthrow";
import SyncEngine from "../../network/sync/syncEngine.js";
import Server from "../server.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import Engine from "../../storage/engine/index.js";
import { MockHub } from "../../test/mocks.js";
import { IdRegisterOnChainEvent } from "@farcaster/core";

const db = jestRocksDB("protobufs.rpc.signerService.test");
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

beforeEach(async () => {
  engine.clearCache();
});

afterAll(async () => {
  client.close();
  await syncEngine.stop();
  await server.stop();
  await engine.stop();
});

const assertOnChainEventsMatchResult = (result: HubResult<OnChainEventResponse>, events: OnChainEvent[]) => {
  expect(
    result
      ._unsafeUnwrap()
      .events.sort((a, b) => a.blockNumber - b.blockNumber)
      .map((e: OnChainEvent) => OnChainEvent.toJSON(e)),
  ).toEqual(events.map((e) => OnChainEvent.toJSON(e)));
};

const fid = Factories.Fid.build();
const fid2 = fid + 1;
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();
const custodySigner2 = Factories.Eip712Signer.build();
let custodyEvent: IdRegisterOnChainEvent;
let custodyEvent2: OnChainEvent;
let signerEvent: OnChainEvent;
let signerKey: Uint8Array;

beforeAll(async () => {
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  const custodySignerKey2 = (await custodySigner2.getSignerKey())._unsafeUnwrap();
  signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
  custodyEvent2 = Factories.IdRegistryOnChainEvent.build({ fid: fid2 }, { transient: { to: custodySignerKey2 } });
  signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signerKey } });
});

describe("getSigner", () => {
  beforeEach(async () => {
    await engine.mergeOnChainEvent(custodyEvent);
  });

  test("succeeds", async () => {
    await engine.mergeOnChainEvent(signerEvent);
    const result = await client.getOnChainSigner(SignerRequest.create({ fid, signer: signerKey }));
    expect(OnChainEvent.toJSON(result._unsafeUnwrap())).toEqual(OnChainEvent.toJSON(signerEvent));
  });

  test("fails if signer is missing", async () => {
    const result = await client.getOnChainSigner(SignerRequest.create({ fid, signer: signerKey }));
    expect(result._unsafeUnwrapErr().errCode).toEqual("not_found");
  });

  test("fails without signer key", async () => {
    const result = await client.getOnChainSigner(SignerRequest.create({ fid, signer: new Uint8Array() }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "publicKey is missing"));
  });

  test("fails without fid", async () => {
    const result = await client.getOnChainSigner(SignerRequest.create({ fid: 0, signer: signerKey }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "fid is missing"));
  });
});

describe("getOnChainSignersByFid", () => {
  let signer2Key: Uint8Array;
  let signerEvent2: OnChainEvent;
  let differentFidSignerEvent: OnChainEvent;
  beforeEach(async () => {
    signer2Key = (await Factories.Ed25519Signer.build().getSignerKey())._unsafeUnwrap();
    signerEvent2 = Factories.SignerOnChainEvent.build(
      {
        fid: fid,
        blockNumber: signerEvent.blockNumber + 1,
      },
      { transient: { signer: signer2Key } },
    );
    differentFidSignerEvent = Factories.SignerOnChainEvent.build(
      {
        fid: fid + 1,
      },
      { transient: { signer: (await Factories.Ed25519Signer.build().getSignerKey())._unsafeUnwrap() } },
    );

    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(signerEvent2);
    await engine.mergeOnChainEvent(differentFidSignerEvent);
  });
  test("succeeds", async () => {
    const result = await client.getOnChainSignersByFid(FidRequest.create({ fid }));
    assertOnChainEventsMatchResult(result, [signerEvent, signerEvent2]);
  });

  test("returns pageSize messages", async () => {
    const result = await client.getOnChainSignersByFid(FidRequest.create({ fid, pageSize: 1 }));
    expect(result._unsafeUnwrap().events).toHaveLength(1);
  });

  test("returns all messages when pageSize > messages count", async () => {
    const result = await client.getOnChainSignersByFid(FidRequest.create({ fid, pageSize: 3 }));
    assertOnChainEventsMatchResult(result, [signerEvent, signerEvent2]);
  });

  test("returns results after pageToken", async () => {
    const page1Result = await client.getOnChainSignersByFid(FidRequest.create({ fid, pageSize: 1 }));
    const page2Result = await client.getOnChainSignersByFid(
      FidRequest.create({ fid, pageToken: page1Result._unsafeUnwrap().nextPageToken }),
    );
    expect(page2Result._unsafeUnwrap().events).toHaveLength(1);
    expect(page2Result._unsafeUnwrap().events).not.toContainEqual(page1Result._unsafeUnwrap().events[0]);
  });

  test("returns empty array without messages", async () => {
    const result = await client.getOnChainSignersByFid(FidRequest.create({ fid: fid - 1 }));
    expect(result._unsafeUnwrap().events).toEqual([]);
  });

  test("returns only active signers", async () => {
    const revokeSigner1 = Factories.SignerOnChainEvent.build({
      fid: fid,
      blockNumber: signerEvent.blockNumber + 2,
      signerEventBody: Factories.SignerEventBody.build({
        key: signerKey,
        eventType: SignerEventType.REMOVE,
      }),
    });
    await engine.mergeOnChainEvent(revokeSigner1);
    const result = await client.getOnChainSignersByFid(FidRequest.create({ fid }));
    assertOnChainEventsMatchResult(result, [signerEvent2]);
  });
});

describe("getIdRegistryOnChainEvent", () => {
  test("succeeds", async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    const result = await client.getIdRegistryOnChainEvent(FidRequest.create({ fid }));
    expect(OnChainEvent.toJSON(result._unsafeUnwrap())).toEqual(OnChainEvent.toJSON(custodyEvent));
  });

  test("fails when event is missing", async () => {
    const result = await client.getIdRegistryOnChainEvent(FidRequest.create({ fid }));
    expect(result._unsafeUnwrapErr().errCode).toEqual("not_found");
  });
});

describe("getIdRegistryOnChainEventByAddress", () => {
  test("succeeds", async () => {
    const onChainCustodyEvent = Factories.IdRegistryOnChainEvent.build();
    await engine.mergeOnChainEvent(onChainCustodyEvent);
    const result = await client.getIdRegistryOnChainEventByAddress(
      IdRegistryEventByAddressRequest.create({ address: onChainCustodyEvent.idRegisterEventBody.to }),
    );
    expect(OnChainEvent.toJSON(result._unsafeUnwrap())).toEqual(OnChainEvent.toJSON(onChainCustodyEvent));
  });

  test("fails when event is missing", async () => {
    const result = await client.getIdRegistryOnChainEventByAddress(
      IdRegistryEventByAddressRequest.create({ address: custodyEvent.idRegisterEventBody.to }),
    );
    expect(result._unsafeUnwrapErr().errCode).toEqual("not_found");
  });
});

describe("getFids", () => {
  test("succeeds", async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(custodyEvent2);
    const result = await client.getFids(FidsRequest.create());
    expect(result).toEqual(ok({ fids: [custodyEvent.fid, custodyEvent2.fid], nextPageToken: undefined }));
  });

  test("returns pageSize results", async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(custodyEvent2);
    const result = await client.getFids(FidsRequest.create({ pageSize: 1 }));
    expect(result._unsafeUnwrap().fids).toEqual([custodyEvent.fid]);
  });

  test("returns all fids when pageSize > events", async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(custodyEvent2);
    const result = await client.getFids(FidsRequest.create({ pageSize: 3 }));
    expect(result._unsafeUnwrap().fids).toEqual([custodyEvent.fid, custodyEvent2.fid]);
  });

  test("returns results after pageToken", async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(custodyEvent2);
    const page1Result = await client.getFids(FidsRequest.create({ pageSize: 1 }));
    const page2Result = await client.getFids(
      FidsRequest.create({ pageSize: 1, pageToken: page1Result._unsafeUnwrap().nextPageToken }),
    );
    expect(page2Result._unsafeUnwrap().fids).toEqual([custodyEvent2.fid]);
  });

  test("returns empty array without events", async () => {
    const result = await client.getFids(FidsRequest.create());
    expect(result._unsafeUnwrap().fids).toEqual([]);
  });
});
