import { NameRegistryEvent } from '@farcaster/protobufs';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import { RootPrefix } from '~/storage/db/types';

export const makeNameRegistryEventPrimaryKey = (fname: Uint8Array): Buffer => {
  return Buffer.concat([Buffer.from([RootPrefix.NameRegistryEvent]), Buffer.from(fname)]);
};

export const getNameRegistryEvent = async (db: RocksDB, fname: Uint8Array): Promise<NameRegistryEvent> => {
  const primaryKey = makeNameRegistryEventPrimaryKey(fname);
  const buffer = await db.get(primaryKey);
  return NameRegistryEvent.decode(new Uint8Array(buffer));
};

export const putNameRegistryEvent = (db: RocksDB, event: NameRegistryEvent): Promise<void> => {
  const txn = putNameRegistryEventTransaction(db.transaction(), event);
  return db.commit(txn);
};

export const deleteNameRegistryEvent = (db: RocksDB, event: NameRegistryEvent): Promise<void> => {
  const txn = deleteNameRegistryEventTransaction(db.transaction(), event);
  return db.commit(txn);
};

export const putNameRegistryEventTransaction = (txn: Transaction, event: NameRegistryEvent): Transaction => {
  const eventBuffer = Buffer.from(NameRegistryEvent.encode(event).finish());

  const primaryKey = makeNameRegistryEventPrimaryKey(event.fname);

  return txn.put(primaryKey, eventBuffer);
};

export const deleteNameRegistryEventTransaction = (txn: Transaction, event: NameRegistryEvent): Transaction => {
  const primaryKey = makeNameRegistryEventPrimaryKey(event.fname);

  return txn.del(primaryKey);
};
