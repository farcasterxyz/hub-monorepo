import { HubState } from "@farcaster/hub-nodejs";
import RocksDB, { RocksDbTransaction } from "./rocksdb.js";
import { RootPrefix } from "./types.js";
import { ResultAsync } from "neverthrow";

export const makeHubStatePrimaryKey = (): Buffer => {
  return Buffer.from([RootPrefix.HubState]);
};

export const getHubState = async (db: RocksDB): Promise<HubState> => {
  const hubState = await ResultAsync.fromPromise(db.get(makeHubStatePrimaryKey()), (e) => e);
  const buffer = hubState.unwrapOr(Buffer.from([]));
  return HubState.decode(new Uint8Array(buffer));
};

export const putHubState = (db: RocksDB, hubState: HubState): Promise<void> => {
  const txn = putHubStateTransaction(db.transaction(), hubState);
  return db.commit(txn);
};

export const putHubStateTransaction = (txn: RocksDbTransaction, hubState: HubState): RocksDbTransaction => {
  const hubStateBuffer = Buffer.from(HubState.encode(hubState).finish());
  return txn.put(makeHubStatePrimaryKey(), hubStateBuffer);
};
