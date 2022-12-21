import { ByteBuffer } from 'flatbuffers';
import { NameRegistryEvent, NameRegistryEventType } from '~/utils/generated/name_registry_event_generated';
import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import { RootPrefix } from './types';
import { HubError } from '~/utils/hubErrors';

/** NameRegistryEventModel provides helpers to read and write Flatbuffers NameRegistryEvents from RocksDB */
export default class NameRegistryEventModel {
  public readonly event: NameRegistryEvent;

  constructor(event: NameRegistryEvent) {
    if (!Object.values(NameRegistryEventType).includes(event.type())) {
      throw new HubError('bad_request.invalid_param', 'type is invalid');
    }

    this.event = event;
  }

  static from(bytes: Uint8Array) {
    const event = NameRegistryEvent.getRootAsNameRegistryEvent(new ByteBuffer(bytes));
    return new this(event);
  }

  /** <name registry root prefix byte, fname> */
  static primaryKey(fname: Uint8Array): Buffer {
    return Buffer.concat([Buffer.from([RootPrefix.NameRegistryEvent]), Buffer.from(fname)]);
  }

  static async get<T extends NameRegistryEventModel>(db: RocksDB, fname: Uint8Array): Promise<T> {
    const buffer = await db.get(NameRegistryEventModel.primaryKey(fname));
    return NameRegistryEventModel.from(new Uint8Array(buffer)) as T;
  }

  static putTransaction(tsx: Transaction, event: NameRegistryEventModel): Transaction {
    return tsx.put(event.primaryKey(), event.toBuffer());
  }

  static deleteTransaction(tsx: Transaction, event: NameRegistryEventModel): Transaction {
    return tsx.del(event.primaryKey());
  }

  async put(db: RocksDB): Promise<void> {
    const tsx = this.putTransaction(db.transaction());
    return db.commit(tsx);
  }

  putTransaction(tsx: Transaction): Transaction {
    return NameRegistryEventModel.putTransaction(tsx, this);
  }

  primaryKey(): Buffer {
    return NameRegistryEventModel.primaryKey(this.fname());
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

  fname(): Uint8Array {
    return this.event.fnameArray() ?? new Uint8Array();
  }

  from(): Uint8Array {
    return this.event.fromArray() ?? new Uint8Array();
  }

  to(): Uint8Array {
    return this.event.toArray() ?? new Uint8Array();
  }

  type(): NameRegistryEventType {
    return this.event.type();
  }

  typeName(): string {
    return NameRegistryEventType[this.type()] as string;
  }
}
