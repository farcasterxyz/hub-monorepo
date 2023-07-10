import { RentRegistryEvent, StorageAdminRegistryEvent } from "@farcaster/hub-nodejs";
import RocksDB, { Iterator, Transaction } from "../db/rocksdb.js";
import { FID_BYTES, RootPrefix } from "../db/types.js";
import { makeTsHash } from "./message.js";

const EXPIRY_BYTES = 4;

export const makeRentRegistryEventPrimaryKey = (fid: number, expiry: number): Buffer => {
  const buffer = Buffer.alloc(1 + FID_BYTES + EXPIRY_BYTES);
  buffer.writeUint8(RootPrefix.RentRegistryEvent, 0);
  buffer.writeUint32BE(fid, 1); // Big endian for ordering
  buffer.writeUint32BE(expiry, 5);
  return buffer;
};

export const makeStorageAdminRegistryEventPrimaryKey = (tsHash: Uint8Array): Buffer => {
  return Buffer.concat([Buffer.from([RootPrefix.StorageAdminRegistryEvent]), Buffer.from(tsHash)]);
};

export const makeRentRegistryEventByExpiryKey = (expiry: number, fid: number): Buffer => {
  const buffer = Buffer.alloc(1 + EXPIRY_BYTES + FID_BYTES);
  buffer.writeUint8(RootPrefix.RentRegistryEventsByExpiry, 0);
  buffer.writeUint32BE(expiry, 1);
  buffer.writeUint32BE(fid, 5);
  return buffer;
};

export const getRentRegistryEventsIterator = (db: RocksDB, fid: number): Iterator => {
  const prefix = Buffer.alloc(1 + FID_BYTES);
  prefix.writeUint8(RootPrefix.RentRegistryEvent, 0);
  prefix.writeUint32BE(fid, 1);
  return db.iteratorByPrefix(prefix, { keys: false });
};

export const getStorageAdminRegistryEvent = async (
  db: RocksDB,
  tsHash: Uint8Array,
): Promise<StorageAdminRegistryEvent> => {
  const key = makeStorageAdminRegistryEventPrimaryKey(tsHash);
  return StorageAdminRegistryEvent.decode(await db.get(key));
};

export const getRentRegistryEventsByExpiryIterator = (db: RocksDB): Iterator => {
  const prefix = Buffer.from([RootPrefix.RentRegistryEventsByExpiry]);
  return db.iteratorByPrefix(prefix, { keys: false });
};

export const getStorageAdminRegistryEventsIterator = (db: RocksDB): Iterator => {
  const prefix = Buffer.from([RootPrefix.StorageAdminRegistryEvent]);
  return db.iteratorByPrefix(prefix, { keys: false });
};

export const getNextRentRegistryEventFromIterator = async (
  iterator: Iterator,
): Promise<RentRegistryEvent | undefined> => {
  try {
    const [, value] = await iterator.next();
    return value === undefined ? undefined : RentRegistryEvent.decode(Uint8Array.from(value as Buffer));
  } catch {
    return undefined;
  }
};

export const getNextStorageAdminRegistryEventFromIterator = async (
  iterator: Iterator,
): Promise<StorageAdminRegistryEvent | undefined> => {
  try {
    const [, value] = await iterator.next();
    return StorageAdminRegistryEvent.decode(Uint8Array.from(value as Buffer));
  } catch {
    return undefined;
  }
};

export const putRentRegistryEvent = (db: RocksDB, event: RentRegistryEvent): Promise<void> => {
  const txn = putRentRegistryEventTransaction(db.transaction(), event);
  return db.commit(txn);
};

export const putStorageAdminRegistryEvent = (db: RocksDB, event: StorageAdminRegistryEvent): Promise<void> => {
  const txn = putStorageAdminRegistryEventTransaction(db.transaction(), event);
  return db.commit(txn);
};

export const deleteStorageAdminRegistryEvent = (db: RocksDB, event: StorageAdminRegistryEvent): Promise<void> => {
  const txn = deleteStorageAdminRegistryEventTransaction(db.transaction(), event);
  return db.commit(txn);
};

export const putRentRegistryEventTransaction = (txn: Transaction, event: RentRegistryEvent): Transaction => {
  const eventBuffer = Buffer.from(RentRegistryEvent.encode(event).finish());

  const primaryKey = makeRentRegistryEventPrimaryKey(event.fid, event.expiry);
  let putTxn = txn.put(primaryKey, eventBuffer);

  if (event.expiry) {
    const byExpiryKey = makeRentRegistryEventByExpiryKey(event.expiry, event.fid);
    putTxn = txn.put(byExpiryKey, eventBuffer);
  }

  return putTxn;
};

export const putStorageAdminRegistryEventTransaction = (
  txn: Transaction,
  event: StorageAdminRegistryEvent,
): Transaction => {
  const eventBuffer = Buffer.from(StorageAdminRegistryEvent.encode(event).finish());
  const tsHash = makeTsHash(event.timestamp, event.transactionHash);
  if (tsHash.isErr()) throw tsHash.error;
  const primaryKey = makeStorageAdminRegistryEventPrimaryKey(tsHash.value);
  const putTxn = txn.put(primaryKey, eventBuffer);

  return putTxn;
};

export const deleteRentRegistryEventTransaction = (txn: Transaction, event: RentRegistryEvent): Transaction => {
  let putTxn = txn;
  if (event.expiry) {
    const byExpiryKey = makeRentRegistryEventByExpiryKey(event.expiry, event.fid);
    putTxn = putTxn.del(byExpiryKey);
  }

  const primaryKey = makeRentRegistryEventPrimaryKey(event.fid, event.expiry);

  return putTxn.del(primaryKey);
};

export const deleteStorageAdminRegistryEventTransaction = (
  txn: Transaction,
  event: StorageAdminRegistryEvent,
): Transaction => {
  const tsHash = makeTsHash(event.timestamp, event.transactionHash);
  if (tsHash.isErr()) throw tsHash.error;
  const primaryKey = makeStorageAdminRegistryEventPrimaryKey(tsHash.value);

  return txn.del(primaryKey);
};
