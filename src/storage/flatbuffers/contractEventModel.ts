import { ByteBuffer } from 'flatbuffers';
import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import { UserPrefix } from '~/storage/flatbuffers/types';
import { ContractEvent } from '~/utils/generated/contract_event_generated';
import MessageModel from './model';

export default class ContractEventModel {
  public event: ContractEvent;

  constructor(event: ContractEvent) {
    this.event = event;
  }

  static from(bytes: Uint8Array) {
    const event = ContractEvent.getRootAsContractEvent(new ByteBuffer(bytes));
    return new this(event);
  }

  /** <user prefix byte, fid, ID Registry event prefix byte> */
  static primaryKey(fid: Uint8Array): Buffer {
    return Buffer.concat([MessageModel.userKey(fid), Buffer.from([UserPrefix.IDRegistryEvent])]);
  }

  static async get<T extends ContractEventModel>(db: RocksDB, fid: Uint8Array): Promise<T> {
    const buffer = await db.get(ContractEventModel.primaryKey(fid));
    return ContractEventModel.from(new Uint8Array(buffer)) as T;
  }

  static putTransaction(tsx: Transaction, event: ContractEventModel): Transaction {
    return tsx.put(event.primaryKey(), event.toBuffer());
  }

  static deleteTransaction(tsx: Transaction, event: ContractEventModel): Transaction {
    return tsx.del(event.primaryKey());
  }

  async put(db: RocksDB): Promise<void> {
    const tsx = this.putTransaction(db.transaction());
    return db.commit(tsx);
  }

  putTransaction(tsx: Transaction): Transaction {
    return ContractEventModel.putTransaction(tsx, this);
  }

  primaryKey(): Buffer {
    return ContractEventModel.primaryKey(this.fid());
  }

  toBuffer(): Buffer {
    return Buffer.from(this.toBytes());
  }

  toBytes(): Uint8Array {
    return this.event.bb?.bytes() || new Uint8Array();
  }

  blockNumber(): number {
    return this.event.blockNumber();
  }

  blockHash(): Uint8Array {
    return this.event.blockHashArray() ?? new Uint8Array();
  }

  transactionHash(): Uint8Array {
    return this.event.transactionHashArray() ?? new Uint8Array();
  }

  logIndex(): number {
    return this.event.logIndex();
  }

  fid(): Uint8Array {
    return this.event.fidArray() ?? new Uint8Array();
  }

  to(): Uint8Array {
    return this.event.toArray() ?? new Uint8Array();
  }
}
