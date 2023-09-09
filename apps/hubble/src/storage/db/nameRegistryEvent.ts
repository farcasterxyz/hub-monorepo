import { UserNameProof } from "@farcaster/hub-nodejs";
import RocksDB, { Transaction } from "../db/rocksdb.js";
import { RootPrefix } from "../db/types.js";
import { makeFidKey } from "./message.js";

export const makeFNameUserNameProofKey = (name: Uint8Array): Buffer => {
  return Buffer.concat([Buffer.from([RootPrefix.FNameUserNameProof]), Buffer.from(name)]);
};

export const makeFNameUserNameProofByFidKey = (fid: number): Buffer => {
  return Buffer.concat([Buffer.from([RootPrefix.FNameUserNameProofByFid]), makeFidKey(fid)]);
};

export const getUserNameProof = async (db: RocksDB, name: Uint8Array): Promise<UserNameProof> => {
  const primaryKey = makeFNameUserNameProofKey(name);
  const buffer = await db.get(primaryKey);
  return UserNameProof.decode(new Uint8Array(buffer));
};

export const getFNameProofByFid = async (db: RocksDB, fid: number): Promise<UserNameProof> => {
  const secondaryKey = makeFNameUserNameProofByFidKey(fid);
  const primaryKey = await db.get(secondaryKey);
  const buffer = await db.get(primaryKey);
  return UserNameProof.decode(new Uint8Array(buffer));
};

export const putUserNameProofTransaction = (txn: Transaction, usernameProof: UserNameProof): Transaction => {
  const proofBuffer = Buffer.from(UserNameProof.encode(usernameProof).finish());

  const primaryKey = makeFNameUserNameProofKey(usernameProof.name);
  const secondaryKey = makeFNameUserNameProofByFidKey(usernameProof.fid);
  const putTxn = txn.put(primaryKey, proofBuffer);
  putTxn.put(secondaryKey, primaryKey);

  return putTxn;
};

export const deleteUserNameProofTransaction = (txn: Transaction, usernameProof: UserNameProof): Transaction => {
  const primaryKey = makeFNameUserNameProofKey(usernameProof.name);
  const secondaryKey = makeFNameUserNameProofByFidKey(usernameProof.fid);
  const deleteTxn = txn.del(primaryKey);
  deleteTxn.del(secondaryKey);

  return deleteTxn;
};
