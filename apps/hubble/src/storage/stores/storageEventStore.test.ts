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

// describe('mergeIdRegistryEvent', () => {
//   let mergedContractEvents: RentRegistryEvent[];

//   const handleMergeEvent = (event: MergeRentRegistryEventHubEvent) => {
//     mergedContractEvents.push(event.mergeRentRegistryEvent.rentRegistryEvent);
//   };

//   beforeAll(() => {
//     eventHandler.on('mergeRentRegistryEvent', handleMergeEvent);
//   });

//   beforeEach(() => {
//     mergedContractEvents = [];
//   });

//   afterAll(() => {
//     eventHandler.off('mergeIdRegistryEvent', handleMergeEvent);
//   });

//   test('succeeds', async () => {
//     await expect(set.mergeIdRegistryEvent(custody1Event)).resolves.toBeGreaterThan(0);
//     await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(custody1Event);

//     expect(mergedContractEvents).toEqual([custody1Event]);
//   });

//   test('fails if events have the same blockNumber but different blockHashes', async () => {
//     const blockHashConflictEvent = Factories.IdRegistryEvent.build({
//       ...custody1Event,
//       blockHash: Factories.BlockHash.build(),
//     });

//     await set.mergeIdRegistryEvent(custody1Event);
//     await expect(set.mergeIdRegistryEvent(blockHashConflictEvent)).rejects.toThrow(
//       new HubError('bad_request.invalid_param', 'block hash mismatch')
//     );

//     expect(mergedContractEvents).toEqual([custody1Event]);
//   });

//   test('fails if events have the same blockNumber and logIndex but different transactionHashes', async () => {
//     const txHashConflictEvent = Factories.IdRegistryEvent.build({
//       ...custody1Event,
//       transactionHash: Factories.TransactionHash.build(),
//     });

//     await set.mergeIdRegistryEvent(custody1Event);
//     await expect(set.mergeIdRegistryEvent(txHashConflictEvent)).rejects.toThrow(HubError);

//     expect(mergedContractEvents).toEqual([custody1Event]);
//   });

//   describe('overwrites existing event', () => {
//     let newEvent: IdRegistryEvent;

//     beforeEach(async () => {
//       await set.mergeIdRegistryEvent(custody1Event);
//       // await expect(set.getSignerAdd(fid, signerKey)).resolves.toEqual(signerAdd);
//     });

//     afterEach(async () => {
//       await expect(set.mergeIdRegistryEvent(newEvent)).resolves.toBeGreaterThan(0);
//       await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(newEvent);
//       expect(mergedContractEvents).toEqual([custody1Event, newEvent]);
//       // SignerAdd should still be valid until messages signed by old custody address are revoked
//       // await expect(set.getSignerAdd(fid, signerKey)).resolves.toEqual(signerAdd);
//     });

//     test('when it has a higher block number', async () => {
//       newEvent = Factories.IdRegistryEvent.build({
//         ...custody1Event,
//         transactionHash: Factories.TransactionHash.build(),
//         to: custody2Address,
//         blockNumber: custody1Event.blockNumber + 1,
//       });
//     });

//     test('when it has the same block number and a higher log index', async () => {
//       newEvent = Factories.IdRegistryEvent.build({
//         ...custody1Event,
//         transactionHash: Factories.TransactionHash.build(),
//         to: custody2Address,
//         logIndex: custody1Event.logIndex + 1,
//       });
//     });
//   });

//   describe('does not overwrite existing event', () => {
//     let newEvent: IdRegistryEvent;

//     beforeEach(async () => {
//       await set.mergeIdRegistryEvent(custody1Event);
//       // await set.merge(signerAdd);
//       // await expect(set.getSignerAdd(fid, signerKey)).resolves.toEqual(signerAdd);
//     });

//     afterEach(async () => {
//       await expect(set.mergeIdRegistryEvent(newEvent)).rejects.toThrow(
//         new HubError('bad_request.conflict', 'event conflicts with a more recent IdRegistryEvent')
//       );
//       await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(custody1Event);
//       // await expect(set.getSignerAdd(fid, signerKey)).resolves.toEqual(signerAdd);

//       expect(mergedContractEvents).toEqual([custody1Event]);
//     });

//     test('when it has a lower block number', async () => {
//       newEvent = Factories.IdRegistryEvent.build({
//         ...custody1Event,
//         transactionHash: Factories.TransactionHash.build(),
//         to: custody2Address,
//         blockNumber: custody1Event.blockNumber - 1,
//       });
//     });

//     test('when it has the same block number and a lower log index', async () => {
//       newEvent = Factories.IdRegistryEvent.build({
//         ...custody1Event,
//         to: custody2Address,
//         logIndex: custody1Event.logIndex - 1,
//       });
//     });

//     test('when is a duplicate', async () => {
//       newEvent = custody1Event;
//     });
//   });
// });
