import { NameRegistryEvent, UserNameProof } from '@farcaster/hub-nodejs';
import RocksDB, { Iterator, Transaction } from '../db/rocksdb.js';
import { RootPrefix } from '../db/types.js';

const EXPIRY_BYTES = 4;

export const makeNameRegistryEventPrimaryKey = (fname: Uint8Array): Buffer => {
  return Buffer.concat([Buffer.from([RootPrefix.NameRegistryEvent]), Buffer.from(fname)]);
};

export const makeUserNameProofPrimaryKey = (name: Uint8Array): Buffer => {
  return Buffer.concat([Buffer.from([RootPrefix.UserNameProof]), Buffer.from(name)]);
};

export const makeNameRegistryEventByExpiryKey = (expiry: number, fname?: Uint8Array): Buffer => {
  const buffer = Buffer.alloc(1 + EXPIRY_BYTES + (fname ? fname.length : 0));
  buffer.writeUint8(RootPrefix.NameRegistryEventsByExpiry, 0);
  buffer.writeUint32BE(expiry, 1);
  if (fname) {
    buffer.set(fname, 1 + EXPIRY_BYTES);
  }
  return buffer;
};

export const getNameRegistryEvent = async (db: RocksDB, fname: Uint8Array): Promise<NameRegistryEvent> => {
  const primaryKey = makeNameRegistryEventPrimaryKey(fname);
  const buffer = await db.get(primaryKey);
  return NameRegistryEvent.decode(new Uint8Array(buffer));
};

export const getUserNameProof = async (db: RocksDB, name: Uint8Array): Promise<UserNameProof> => {
  const primaryKey = makeUserNameProofPrimaryKey(name);
  const buffer = await db.get(primaryKey);
  return UserNameProof.decode(new Uint8Array(buffer));
};

export const getNameRegistryEventsByExpiryIterator = (db: RocksDB): Iterator => {
  const prefix = Buffer.from([RootPrefix.NameRegistryEventsByExpiry]);
  return db.iteratorByPrefix(prefix, { keys: false });
};

export const getNextNameRegistryEventFromIterator = async (iterator: Iterator): Promise<NameRegistryEvent> => {
  const [, value] = await iterator.next();
  return NameRegistryEvent.decode(Uint8Array.from(value as Buffer));
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
  txn = txn.put(primaryKey, eventBuffer);

  if (event.expiry) {
    const byExpiryKey = makeNameRegistryEventByExpiryKey(event.expiry, event.fname);
    txn = txn.put(byExpiryKey, eventBuffer);
  }

  return txn;
};

export const putUserNameProofTransaction = (txn: Transaction, usernameProof: UserNameProof): Transaction => {
  const proofBuffer = Buffer.from(UserNameProof.encode(usernameProof).finish());

  const primaryKey = makeUserNameProofPrimaryKey(usernameProof.name);
  txn = txn.put(primaryKey, proofBuffer);

  return txn;
};

export const deleteUserNameProofTransaction = (txn: Transaction, usernameProof: UserNameProof): Transaction => {
  const primaryKey = makeUserNameProofPrimaryKey(usernameProof.name);
  txn = txn.del(primaryKey);

  return txn;
};

export const deleteNameRegistryEventTransaction = (txn: Transaction, event: NameRegistryEvent): Transaction => {
  if (event.expiry) {
    const byExpiryKey = makeNameRegistryEventByExpiryKey(event.expiry, event.fname);
    txn = txn.del(byExpiryKey);
  }

  const primaryKey = makeNameRegistryEventPrimaryKey(event.fname);

  return txn.del(primaryKey);
};
