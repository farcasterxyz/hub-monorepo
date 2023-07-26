import { HubError, KeyRegistryOnChainEvent, OnChainEvent, OnChainEventType } from "@farcaster/hub-nodejs";
import RocksDB from "../db/rocksdb.js";
import StoreEventHandler from "./storeEventHandler.js";
import AsyncLock from "async-lock";

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
class OnChainEventStore {
  protected _db: RocksDB;
  protected _eventHandler: StoreEventHandler;
  private _mergeLock: AsyncLock;

  constructor(db: RocksDB, eventHandler: StoreEventHandler) {
    this._db = db;
    this._eventHandler = eventHandler;
    this._mergeLock = new AsyncLock();
  }

  async mergeOnChainEvent(event: OnChainEvent): Promise<number> {
    if (event.type === OnChainEventType.EVENT_TYPE_SIGNER) {
      return this.mergeKeyRegistryEvent(event as KeyRegistryOnChainEvent);
    }
    throw new HubError("bad_request", `invalid on chain event type: ${event.type}`);
  }

  async getOnChainEvents(fid: number): Promise<OnChainEvent[]> {
    return [];
  }

  /**
   * Merges a rent ContractEvent into the StorageEventStore
   */
  async mergeKeyRegistryEvent(event: KeyRegistryOnChainEvent): Promise<number> {
    return event.chainId;
  }
}

export default OnChainEventStore;
