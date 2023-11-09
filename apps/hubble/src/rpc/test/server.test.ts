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
} from "@farcaster/hub-nodejs";
import Engine from "../../storage/engine/index.js";
import { MockHub } from "../../test/mocks.js";
import Server from "../server.js";
import SyncEngine from "../../network/sync/syncEngine.js";
import { Ok } from "neverthrow";

const db = jestRocksDB("protobufs.rpc.server.test");
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

beforeAll(async () => {
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

      await engine.mergeMessage(verification);
      await engine.mergeMessage(olderCast);
      await engine.mergeMessage(newerCast);

      const result = await client.getCurrentStorageLimitsByFid(FidRequest.create({ fid }));

      const storageLimits = StorageLimitsResponse.fromJSON(result._unsafeUnwrap()).limits;
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
      const newLimits = StorageLimitsResponse.fromJSON(result2._unsafeUnwrap()).limits;
      expect(newLimits.length).toEqual(6);
      for (const limit of newLimits) {
        expect(limit.limit).toEqual(getDefaultStoreLimit(limit.storeType) * 3);
      }
    });
  });
});
