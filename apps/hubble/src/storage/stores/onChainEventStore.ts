import {
  HubError,
  HubEventType,
  isSignerOnChainEvent,
  KeyRegistryOnChainEvent,
  OnChainEvent,
  OnChainEventType,
} from "@farcaster/hub-nodejs";
import RocksDB, { Transaction } from "../db/rocksdb.js";
import StoreEventHandler from "./storeEventHandler.js";
import {
  getManyOnChainEvents,
  makeOnChainEventIteratorPrefix,
  putOnChainEventTransaction,
} from "../db/onChainEvent.js";

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

  constructor(db: RocksDB, eventHandler: StoreEventHandler) {
    this._db = db;
    this._eventHandler = eventHandler;
  }

  async mergeOnChainEvent(event: OnChainEvent): Promise<number> {
    return this._mergeEvent(event);
  }

  async getOnChainEvents(type: OnChainEventType, fid: number): Promise<OnChainEvent[]> {
    const keys: Buffer[] = [];
    await this._db.forEachIteratorByPrefix(
      makeOnChainEventIteratorPrefix(type, fid),
      (key) => {
        if (key) {
          keys.push(key);
        }
      },
      { keys: true, values: false },
    );
    return getManyOnChainEvents(this._db, keys);
  }

  /**
   * Merges a rent ContractEvent into the StorageEventStore
   */
  async _mergeEvent(event: OnChainEvent): Promise<number> {
    let txn = putOnChainEventTransaction(this._db.transaction(), event);

    if (isSignerOnChainEvent(event)) {
      txn = await this._handleKeyRegistryEvent(txn, event);
    } else {
      throw new HubError("bad_request", `invalid on chain event type: ${event.type}`);
    }

    const result = await this._eventHandler.commitTransaction(txn, {
      type: HubEventType.MERGE_ON_CHAIN_EVENT,
      mergeOnChainEventBody: { onChainEvent: event, deletedOnChainEvent: undefined },
    });
    if (result.isErr()) {
      throw result.error;
    }
    return result.value;
  }

  private async _handleKeyRegistryEvent(txn: Transaction, _event: KeyRegistryOnChainEvent): Promise<Transaction> {
    return txn;
  }
}

export default OnChainEventStore;
