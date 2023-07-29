import {
  HubAsyncResult,
  HubError,
  HubEventType,
  IdRegisterOnChainEvent,
  isIdRegisterOnChainEvent,
  isSignerOnChainEvent,
  OnChainEvent,
  OnChainEventType,
  SignerEventType,
  SignerOnChainEvent,
} from "@farcaster/hub-nodejs";
import RocksDB, { Transaction } from "../db/rocksdb.js";
import StoreEventHandler from "./storeEventHandler.js";
import {
  getManyOnChainEvents,
  getOnChainEvent,
  getOnChainEventByKey,
  makeSignerOnChainEventBySignerKey,
  makeOnChainEventIteratorPrefix,
  makeOnChainEventPrimaryKey,
  putOnChainEventTransaction,
  makeIdRegisterEventByFidKey,
  makeIdRegisterEventByCustodyKey,
} from "../db/onChainEvent.js";
import { ok, ResultAsync } from "neverthrow";

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

  async getActiveSigner(fid: number, signer: Uint8Array): Promise<SignerOnChainEvent> {
    const signerEventPrimaryKey = await this._db.get(makeSignerOnChainEventBySignerKey(fid, signer));
    return getOnChainEventByKey(this._db, signerEventPrimaryKey);
  }

  async getIdRegisterEventByFid(fid: number): Promise<IdRegisterOnChainEvent> {
    const idRegisterEventPrimaryKey = await this._db.get(makeIdRegisterEventByFidKey(fid));
    return getOnChainEventByKey(this._db, idRegisterEventPrimaryKey);
  }

  async getIdRegisterEventByCustodyAddress(address: Uint8Array): Promise<IdRegisterOnChainEvent> {
    const idRegisterEventPrimaryKey = await this._db.get(makeIdRegisterEventByCustodyKey(address));
    return getOnChainEventByKey(this._db, idRegisterEventPrimaryKey);
  }

  async isSignerMigrated(): HubAsyncResult<boolean> {
    const signerMigrated = await this.getOnChainEvents(OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED, 0);
    if (signerMigrated.length > 0) {
      return ok(true);
    }
    return ok(false);
  }

  /**
   * Merges a rent ContractEvent into the StorageEventStore
   */
  async _mergeEvent(event: OnChainEvent): Promise<number> {
    const _existingEvent = await ResultAsync.fromPromise(
      getOnChainEvent(this._db, event.type, event.fid, event.blockNumber, event.logIndex),
      () => undefined,
    );
    if (_existingEvent.isOk()) {
      throw new HubError("bad_request.duplicate", "onChainEvent already exists");
    }

    let txn = putOnChainEventTransaction(this._db.transaction(), event);

    if (isSignerOnChainEvent(event)) {
      txn = await this._handleSignerEvent(txn, event);
    } else if (isIdRegisterOnChainEvent(event)) {
      txn = await this._handleIdRegisterEvent(txn, event);
    }

    const result = await this._eventHandler.commitTransaction(txn, {
      type: HubEventType.MERGE_ON_CHAIN_EVENT,
      mergeOnChainEventBody: { onChainEvent: event },
    });
    if (result.isErr()) {
      throw result.error;
    }
    return result.value;
  }

  private async _handleSignerEvent(txn: Transaction, event: SignerOnChainEvent): Promise<Transaction> {
    const secondaryKey = makeSignerOnChainEventBySignerKey(event.fid, event.signerEventBody.key);
    const existingEventKey = await ResultAsync.fromPromise(this._db.get(secondaryKey), () => undefined);
    if (existingEventKey.isOk()) {
      const primaryKey = existingEventKey.value;
      const existingEventResult = await ResultAsync.fromPromise(
        getOnChainEventByKey<SignerOnChainEvent>(this._db, primaryKey),
        () => undefined,
      );
      if (existingEventResult.isErr()) {
        throw new HubError("unavailable.storage_failure", `secondary index corrupted for ${secondaryKey}`);
      } else {
        const existingResult = existingEventResult.value;
        if (
          existingResult.signerEventBody.eventType === SignerEventType.REMOVE &&
          event.signerEventBody.eventType === SignerEventType.ADD
        ) {
          throw new HubError("bad_request.conflict", "attempting to re-add removed key");
        }
      }
    }
    // Add to the secondary index if this is the first time add, or if it's an admin reset.
    return txn.put(secondaryKey, makeOnChainEventPrimaryKey(event.type, event.fid, event.blockNumber, event.logIndex));
  }

  private async _handleIdRegisterEvent(txn: Transaction, event: IdRegisterOnChainEvent): Promise<Transaction> {
    // TODO: Handle out of order events (register after a transfer)
    const byFidKey = makeIdRegisterEventByFidKey(event.fid);
    const byCustodyAddressKey = makeIdRegisterEventByCustodyKey(event.idRegisterEventBody.to);
    const primaryKey = makeOnChainEventPrimaryKey(event.type, event.fid, event.blockNumber, event.logIndex);
    return txn.put(byFidKey, primaryKey).put(byCustodyAddressKey, primaryKey);
  }
}

export default OnChainEventStore;
