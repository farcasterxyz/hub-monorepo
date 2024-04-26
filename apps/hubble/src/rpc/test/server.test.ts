import { jestRocksDB } from "../../storage/db/jestUtils.js";
import {
  Factories,
  FarcasterNetwork,
  FidRequest,
  getInsecureHubRpcClient,
  HubResult,
  HubRpcClient,
  OnChainEvent,
  OnChainEventRequest,
  OnChainEventResponse,
  OnChainEventType,
  StorageLimit,
  StorageLimitsResponse,
  StoreType,
  getDefaultStoreLimit,
  HubError,
} from "@farcaster/hub-nodejs";
import Engine from "../../storage/engine/index.js";
import { MockHub } from "../../test/mocks.js";
import Server, { checkPort } from "../server.js";
import SyncEngine from "../../network/sync/syncEngine.js";
import { Err, Ok } from "neverthrow";
import { sleep } from "../../utils/crypto.js";
import * as http from "http";
import { AddressInfo, createServer } from "net";

const db = jestRocksDB("protobufs.rpc.server.test");
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

let fid: number;
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: OnChainEvent;
let signerEvent: OnChainEvent;
let storageEvent: OnChainEvent;

beforeEach(async () => {
  fid = Factories.Fid.build();
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
  signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signerKey } });
  storageEvent = Factories.StorageRentOnChainEvent.build({ fid }, { transient: { units: 1 } });
  await engine.mergeOnChainEvent(custodyEvent);
  await engine.mergeOnChainEvent(signerEvent);
  await engine.mergeOnChainEvent(storageEvent);
});

describe("server rpc tests", () => {
  describe("getOnChainEvents", () => {
    const assertEventsMatchResult = (result: HubResult<OnChainEventResponse>, events: OnChainEvent[]) => {
      expect(result._unsafeUnwrap().events.map((e) => OnChainEvent.toJSON(e))).toEqual(
        events.map((e) => OnChainEvent.toJSON(e)),
      );
    };

    test("succeeds", async () => {
      const idRegistryEvent2 = Factories.IdRegistryOnChainEvent.build({ fid: fid + 1 });
      const signerEvent2 = Factories.SignerOnChainEvent.build({ blockNumber: signerEvent.blockNumber + 1, fid });
      const signerMigratedEvent = Factories.SignerMigratedOnChainEvent.build();
      await expect(engine.mergeOnChainEvent(idRegistryEvent2)).resolves.toBeInstanceOf(Ok);
      await expect(engine.mergeOnChainEvent(signerEvent2)).resolves.toBeInstanceOf(Ok);
      await expect(engine.mergeOnChainEvent(signerMigratedEvent)).resolves.toBeInstanceOf(Ok);

      const idResult = await client.getOnChainEvents(
        OnChainEventRequest.create({ eventType: OnChainEventType.EVENT_TYPE_ID_REGISTER, fid }),
      );
      assertEventsMatchResult(idResult, [custodyEvent]);

      const signerResult = await client.getOnChainEvents(
        OnChainEventRequest.create({ eventType: OnChainEventType.EVENT_TYPE_SIGNER, fid }),
      );
      assertEventsMatchResult(signerResult, [signerEvent, signerEvent2]);

      const signerMigratedResult = await client.getOnChainEvents(
        OnChainEventRequest.create({ eventType: OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED, fid: 0 }),
      );
      assertEventsMatchResult(signerMigratedResult, [signerMigratedEvent]);

      const emptyResult = await client.getOnChainEvents(
        OnChainEventRequest.create({ eventType: OnChainEventType.EVENT_TYPE_STORAGE_RENT, fid: fid + 1 }),
      );
      expect(emptyResult._unsafeUnwrap().events.length).toEqual(0);
    });
  });

  describe("getCurrentStorageLimitsByFid", () => {
    test("succeeds for user with no storage", async () => {
      const result = await client.getCurrentStorageLimitsByFid(FidRequest.create({ fid: fid - 1 }));
      // zero storage
      expect(result._unsafeUnwrap().units).toEqual(0);
      expect(result._unsafeUnwrap().limits.map((l) => l.limit)).toEqual([0, 0, 0, 0, 0, 0]);
    });

    test("succeeds for user with storage", async () => {
      // Add some data, so we can test usage responses
      const verification = await Factories.VerificationAddEthAddressMessage.create(
        { data: { fid } },
        { transient: { signer } },
      );
      const olderCast = await Factories.CastAddMessage.create({ data: { fid } }, { transient: { signer } });
      const newerCast = await Factories.CastAddMessage.create(
        { data: { fid, timestamp: olderCast.data.timestamp + 10 } },
        { transient: { signer } },
      );

      expect(await engine.mergeMessage(verification)).toBeInstanceOf(Ok);
      expect(await engine.mergeMessage(olderCast)).toBeInstanceOf(Ok);
      expect(await engine.mergeMessage(newerCast)).toBeInstanceOf(Ok);

      await sleep(100); // Wait for events to be processed
      const result = await client.getCurrentStorageLimitsByFid(FidRequest.create({ fid }));

      expect((await client.getOnChainEvents({ fid: fid, eventType: 4 }))._unsafeUnwrap().events.length).toEqual(1);

      const limitsResponse = StorageLimitsResponse.fromJSON(result._unsafeUnwrap());
      expect(limitsResponse.units).toEqual(1);
      const storageLimits = limitsResponse.limits;
      expect(storageLimits).toContainEqual(
        StorageLimit.create({
          limit: getDefaultStoreLimit(StoreType.CASTS),
          storeType: StoreType.CASTS,
          name: "CASTS",
          used: 2,
          earliestHash: olderCast.hash,
          earliestTimestamp: olderCast.data.timestamp,
        }),
      );
      expect(storageLimits).toContainEqual(
        StorageLimit.create({
          limit: getDefaultStoreLimit(StoreType.REACTIONS),
          storeType: StoreType.REACTIONS,
          name: "REACTIONS",
          used: 0,
          earliestTimestamp: 0,
          earliestHash: new Uint8Array(),
        }),
      );
      expect(storageLimits).toContainEqual(
        StorageLimit.create({
          limit: getDefaultStoreLimit(StoreType.LINKS),
          storeType: StoreType.LINKS,
          name: "LINKS",
          used: 0,
          earliestHash: new Uint8Array(),
          earliestTimestamp: 0,
        }),
      );
      expect(storageLimits).toContainEqual(
        StorageLimit.create({
          limit: getDefaultStoreLimit(StoreType.USER_DATA),
          storeType: StoreType.USER_DATA,
          name: "USER_DATA",
          used: 0,
          earliestHash: new Uint8Array(),
          earliestTimestamp: 0,
        }),
      );
      expect(storageLimits).toContainEqual(
        StorageLimit.create({
          limit: getDefaultStoreLimit(StoreType.VERIFICATIONS),
          storeType: StoreType.VERIFICATIONS,
          name: "VERIFICATIONS",
          used: 1,
          earliestHash: verification.hash,
          earliestTimestamp: verification.data.timestamp,
        }),
      );
      expect(storageLimits).toContainEqual(
        StorageLimit.create({
          limit: getDefaultStoreLimit(StoreType.USERNAME_PROOFS),
          storeType: StoreType.USERNAME_PROOFS,
          name: "USERNAME_PROOFS",
          used: 0,
          earliestHash: new Uint8Array(),
          earliestTimestamp: 0,
        }),
      );

      // add 2 more units
      const rentEvent2 = Factories.StorageRentOnChainEvent.build({
        fid,
        storageRentEventBody: Factories.StorageRentEventBody.build({ units: 2 }),
      });
      await engine.mergeOnChainEvent(rentEvent2);
      const result2 = await client.getCurrentStorageLimitsByFid(FidRequest.create({ fid }));
      const limitsResponse2 = StorageLimitsResponse.fromJSON(result2._unsafeUnwrap());
      expect(limitsResponse2.units).toEqual(3);
      const newLimits = limitsResponse2.limits;
      expect(newLimits.length).toEqual(6);
      for (const limit of newLimits) {
        expect(limit.limit).toEqual(getDefaultStoreLimit(limit.storeType) * 3);
      }
    });
  });
});

describe("checkPort", () => {
  let server: http.Server;
  const testPort = 3111; // Example port

  beforeAll((done) => {
    server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end("Test Server");
    });

    server.listen(testPort, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  it("should verify the port is open", async () => {
    expect(await checkPort("127.0.0.1", testPort)).toBeInstanceOf(Ok<void, HubError>);
  });

  it("should verify the port is closed", async () => {
    const findAvailablePort = () =>
      new Promise<number>((resolve, reject) => {
        const server = createServer();
        server.unref();
        server.listen(0, () => {
          const port = (server.address() as AddressInfo).port;
          server.close(() => resolve(port));
        });
        server.on("error", reject);
      });

    const closedPort = await findAvailablePort();
    expect(await checkPort("127.0.0.1", closedPort)).toBeInstanceOf(Err<void, HubError>);
  });
});
