import { HubState } from '@farcaster/hub-nodejs';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import { RootPrefix } from '~/storage/db/types';

export const makeHubStatePrimaryKey = (): Buffer => {
  return Buffer.from([RootPrefix.HubState]);
};

export const getHubState = async (db: RocksDB): Promise<HubState> => {
  const buffer = await db.get(makeHubStatePrimaryKey());
  return HubState.decode(new Uint8Array(buffer));
};

export const putHubState = (db: RocksDB, hubState: HubState): Promise<void> => {
  const txn = putHubStateTransaction(db.transaction(), hubState);
  return db.commit(txn);
};

export const putHubStateTransaction = (txn: Transaction, hubState: HubState): Transaction => {
  const hubStateBuffer = Buffer.from(HubState.encode(hubState).finish());
  return txn.put(makeHubStatePrimaryKey(), hubStateBuffer);
};
