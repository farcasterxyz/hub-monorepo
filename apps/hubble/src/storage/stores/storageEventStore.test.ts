import {
  Factories,
  // getFarcasterTime,
  HubError,
  RentRegistryEvent,
  StorageAdminRegistryEvent,
  StorageRegistryEventType,
} from "@farcaster/hub-nodejs";
import { jestRocksDB } from "../db/jestUtils.js";
import StorageEventStore from "./storageEventStore.js";
import StoreEventHandler from "./storeEventHandler.js";
import { CAST_PRUNE_SIZE_LIMIT_DEFAULT } from "./castStore.js";
import { LINK_PRUNE_SIZE_LIMIT_DEFAULT } from "./linkStore.js";
import { REACTION_PRUNE_SIZE_LIMIT_DEFAULT } from "./reactionStore.js";
import { SIGNER_PRUNE_SIZE_LIMIT_DEFAULT } from "./signerStore.js";
import { USER_DATA_PRUNE_SIZE_LIMIT_DEFAULT } from "./userDataStore.js";
import { VERIFICATION_PRUNE_SIZE_LIMIT_DEFAULT } from "./verificationStore.js";

const db = jestRocksDB("protobufs.storageEventStore.test");
const eventHandler = new StoreEventHandler(db);
const set = new StorageEventStore(db, eventHandler);
// const signer = Factories.Ed25519Signer.build();
const fid = Factories.Fid.build();

let address1: Uint8Array;

let rentEvent: RentRegistryEvent;
let setDeprecationTimestampEvent: StorageAdminRegistryEvent;
let setGracePeriodEvent: StorageAdminRegistryEvent;
let setMaxUnitsEvent: StorageAdminRegistryEvent;
let setPriceEvent: StorageAdminRegistryEvent;

beforeAll(async () => {
  address1 = Factories.EthAddress.build();
  rentEvent = Factories.RentRegistryEvent.build({
    fid,
    payer: address1,
    units: 2,
  });
  setDeprecationTimestampEvent = Factories.StorageAdminRegistryEvent.build({
    from: address1,
    type: StorageRegistryEventType.SET_DEPRECATION_TIMESTAMP,
  });
  setGracePeriodEvent = Factories.StorageAdminRegistryEvent.build({
    from: address1,
    type: StorageRegistryEventType.SET_GRACE_PERIOD,
  });
  setMaxUnitsEvent = Factories.StorageAdminRegistryEvent.build({
    from: address1,
    type: StorageRegistryEventType.SET_MAX_UNITS,
  });
  setPriceEvent = Factories.StorageAdminRegistryEvent.build({
    from: address1,
    type: StorageRegistryEventType.SET_PRICE,
  });
});

beforeEach(async () => {
  await eventHandler.syncCache();
});

describe("getRentRegistryEvent", () => {
  test("returns contract event if it exists", async () => {
    await set.mergeRentRegistryEvent(rentEvent);
    await expect(set.getRentRegistryEvents(fid)).resolves.toEqual([rentEvent]);
  });

  test("fails if event is missing", async () => {
    await expect(set.getRentRegistryEvents(fid)).rejects.toThrow(HubError);
  });
});

describe("getStorageAdminRegistryEvent", () => {
  test("returns contract event if it exists", async () => {
    await set.mergeStorageAdminRegistryEvent(setDeprecationTimestampEvent);
    await set.mergeStorageAdminRegistryEvent(setGracePeriodEvent);
    await set.mergeStorageAdminRegistryEvent(setMaxUnitsEvent);
    await set.mergeStorageAdminRegistryEvent(setPriceEvent);
    await expect(set.getStorageAdminRegistryEvents()).resolves.toContainEqual(setDeprecationTimestampEvent);
    await expect(set.getStorageAdminRegistryEvents()).resolves.toContainEqual(setGracePeriodEvent);
    await expect(set.getStorageAdminRegistryEvents()).resolves.toContainEqual(setMaxUnitsEvent);
    await expect(set.getStorageAdminRegistryEvents()).resolves.toContainEqual(setPriceEvent);
  });

  test("fails if event is missing", async () => {
    await expect(set.getStorageAdminRegistryEvents()).rejects.toThrow(HubError);
  });
});

describe("getCurrentStorageLimitsForFid", () => {
  test("unit-scaled storage info", async () => {
    const limits = await set.getCurrentStorageLimitsForFid(fid);
    expect(limits.isErr()).toBe(false);
    expect(limits._unsafeUnwrap()).toEqual({
      limits: [
        {
          storeType: "casts",
          limit: CAST_PRUNE_SIZE_LIMIT_DEFAULT * 2,
        },
        {
          storeType: "links",
          limit: LINK_PRUNE_SIZE_LIMIT_DEFAULT * 2,
        },
        {
          storeType: "reactions",
          limit: REACTION_PRUNE_SIZE_LIMIT_DEFAULT * 2,
        },
        {
          storeType: "signers",
          limit: SIGNER_PRUNE_SIZE_LIMIT_DEFAULT * 2,
        },
        {
          storeType: "userData",
          limit: USER_DATA_PRUNE_SIZE_LIMIT_DEFAULT * 2,
        },
        {
          storeType: "verifications",
          limit: VERIFICATION_PRUNE_SIZE_LIMIT_DEFAULT * 2,
        },
      ],
    });
  });

  test("fails if event is missing", async () => {
    await expect(set.getStorageAdminRegistryEvents()).rejects.toThrow(HubError);
  });
});
