import { IdRegistryEvent } from '@farcaster/hub-nodejs';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import { FID_BYTES, RootPrefix } from '~/storage/db/types';

/** <ID Registry root prefix byte, fid> */
export const makeIdRegistryEventPrimaryKey = (fid: number): Buffer => {
  const buffer = Buffer.alloc(1 + FID_BYTES);
  buffer.writeUint8(RootPrefix.IdRegistryEvent, 0);
  buffer.writeUint32BE(fid, 1); // Big endian for ordering
  return buffer;
};

/**
 * Generates a unique key used to store the current custody address of a user -> IdRegistryEvent mapping
 *
 * @param address the custody address of the user
 *
 * @returns RocksDB key of the form <RootPrefix>:<address>
 */
export const makeIdRegistryEventByCustodyAddressKey = (address: Uint8Array): Buffer => {
  return Buffer.concat([Buffer.from([RootPrefix.IdRegistryEventByCustodyAddress]), Buffer.from(address)]);
};

export const getIdRegistryEvent = async (db: RocksDB, fid: number): Promise<IdRegistryEvent> => {
  const primaryKey = makeIdRegistryEventPrimaryKey(fid);
  const buffer = await db.get(primaryKey);
  return IdRegistryEvent.decode(new Uint8Array(buffer));
};

export const getIdRegistryEventByCustodyAddress = async (
  db: RocksDB,
  custodyAddress: Uint8Array
): Promise<IdRegistryEvent> => {
  const key = makeIdRegistryEventByCustodyAddressKey(custodyAddress);
  const buffer = await db.get(key);
  return IdRegistryEvent.decode(new Uint8Array(buffer));
};

export const putIdRegistryEvent = (db: RocksDB, event: IdRegistryEvent): Promise<void> => {
  const txn = putIdRegistryEventTransaction(db.transaction(), event);
  return db.commit(txn);
};

export const deleteIdRegistryEvent = (db: RocksDB, event: IdRegistryEvent): Promise<void> => {
  const txn = deleteIdRegistryEventTransaction(db.transaction(), event);
  return db.commit(txn);
};

export const putIdRegistryEventTransaction = (txn: Transaction, event: IdRegistryEvent): Transaction => {
  const eventBuffer = Buffer.from(IdRegistryEvent.encode(event).finish());

  const primaryKey = makeIdRegistryEventPrimaryKey(event.fid);
  const byCustodyAddressKey = makeIdRegistryEventByCustodyAddressKey(event.to);

  return txn.put(primaryKey, eventBuffer).put(byCustodyAddressKey, eventBuffer);
};

export const deleteIdRegistryEventTransaction = (txn: Transaction, event: IdRegistryEvent): Transaction => {
  const primaryKey = makeIdRegistryEventPrimaryKey(event.fid);
  const byCustodyAddressKey = makeIdRegistryEventByCustodyAddressKey(event.to);

  return txn.del(byCustodyAddressKey).del(primaryKey);
};
