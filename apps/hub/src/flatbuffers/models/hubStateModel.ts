import { HubState } from '@farcaster/flatbuffers';
import { ByteBuffer } from 'flatbuffers';
import { RootPrefix } from '~/flatbuffers/models/types';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';

/** Helpers to read/write flatbuffers for the state of the hub, including the last ETH block synced */
export default class HubStateModel {
  public state: HubState;

  constructor(state: HubState) {
    this.state = state;
  }

  static from(bytes: Uint8Array) {
    const state = HubState.getRootAsHubState(new ByteBuffer(bytes));
    return new this(state);
  }

  static primaryKey(): Buffer {
    return Buffer.from([RootPrefix.HubState]);
  }

  static async get<T extends HubStateModel>(db: RocksDB): Promise<T> {
    const buffer = await db.get(HubStateModel.primaryKey());
    return HubStateModel.from(new Uint8Array(buffer)) as T;
  }

  static putTransaction(tsx: Transaction, state: HubStateModel): Transaction {
    return tsx.put(state.primaryKey(), state.toBuffer());
  }

  primaryKey(): Buffer {
    return HubStateModel.primaryKey();
  }

  toBuffer(): Buffer {
    return Buffer.from(this.toBytes());
  }

  toBytes(): Uint8Array {
    return this.state.bb?.bytes() || new Uint8Array();
  }

  lastEthBlock(): bigint {
    return this.state.lastEthBlock();
  }
}
