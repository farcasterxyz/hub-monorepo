import { HubError, HubEventType, RentRegistryEvent, StorageAdminRegistryEvent } from "@farcaster/hub-nodejs";
import RocksDB from "../db/rocksdb.js";
import StoreEventHandler from "./storeEventHandler.js";
import AsyncLock from "async-lock";
import {
  getNextRentRegistryEventFromIterator,
  getNextStorageAdminRegistryEventFromIterator,
  getRentRegistryEventsIterator,
  getStorageAdminRegistryEventsIterator,
  putRentRegistryEventTransaction,
  putStorageAdminRegistryEventTransaction,
} from "../db/storageRegistryEvent.js";

/**
 * StorageEventStore persists Storage Event messages in RocksDB using two grow only CRDT sets
 * to guarantee eventual consistency.
 *
 * The StorageEventStore has a grow only CRDT set for each class of storage events, rent and
 * admin events. It stores each class of storage events under specialized key names
 * corresponding to the specific set. Rent event messages can only collide if they have the
 * same fid and timestamp, which should be infeasible unless a block reorg occurs and a new
 * event subsumes its place. Similarly, storage admin events should also be collision resistant
 * by nature of transaction hash and timestamp. That being said, to ensure even the unlikely
 * event of collisions between storage events, messages are resolved with Last-Write-Wins rules.
 *
 * The key-value entries created by the Storage Event Store are:
 *
 * 1. tsHash -> storage admin events
 * 2. fid:expiry -> rent events
 * 2. expiry:fid -> fid:expiry (Set Index)
 */
class StorageEventStore {
  protected _db: RocksDB;
  protected _eventHandler: StoreEventHandler;
  private _mergeLock: AsyncLock;

  constructor(db: RocksDB, eventHandler: StoreEventHandler) {
    this._db = db;
    this._eventHandler = eventHandler;
    this._mergeLock = new AsyncLock();
  }

  /** Returns the events from the RentRegistry contract that affected the fid  */
  async getRentRegistryEvents(fid: number): Promise<RentRegistryEvent[]> {
    const iterator = await getRentRegistryEventsIterator(this._db, fid);
    const events: RentRegistryEvent[] = [];
    let event: RentRegistryEvent | undefined;

    while (iterator.isOpen) {
      event = await getNextRentRegistryEventFromIterator(iterator);
      if (!event) break;

      events.push(event);
    }

    if (events.length === 0) throw new HubError("not_found", "record not found");

    return events;
  }

  /** Returns the events from the StorageAdminRegistry contract that affected the storage mechanics  */
  async getStorageAdminRegistryEvents(): Promise<StorageAdminRegistryEvent[]> {
    const iterator = await getStorageAdminRegistryEventsIterator(this._db);
    const events: StorageAdminRegistryEvent[] = [];
    let event: StorageAdminRegistryEvent | undefined;

    while (iterator.isOpen) {
      event = await getNextStorageAdminRegistryEventFromIterator(iterator);
      if (!event) break;

      events.push(event);
    }

    if (events.length === 0) throw new HubError("not_found", "record not found");

    return events;
  }

  /**
   * Merges a rent ContractEvent into the StorageEventStore
   */
  async mergeRentRegistryEvent(event: RentRegistryEvent): Promise<number> {
    const txn = putRentRegistryEventTransaction(this._db.transaction(), event);

    const result = await this._eventHandler.commitTransaction(txn, {
      type: HubEventType.MERGE_RENT_REGISTRY_EVENT,
      mergeRentRegistryEventBody: { rentRegistryEvent: event },
    });
    if (result.isErr()) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Merges a rent ContractEvent into the StorageEventStore
   */
  async mergeStorageAdminRegistryEvent(event: StorageAdminRegistryEvent): Promise<number> {
    const txn = putStorageAdminRegistryEventTransaction(this._db.transaction(), event);

    const result = await this._eventHandler.commitTransaction(txn, {
      type: HubEventType.MERGE_STORAGE_ADMIN_REGISTRY_EVENT,
      mergeStorageAdminRegistryEventBody: { storageAdminRegistryEvent: event },
    });
    if (result.isErr()) {
      throw result.error;
    }
    return result.value;
  }
}

export default StorageEventStore;
