import {
  HubAsyncResult,
  HubError,
  HubEventType,
  IdRegisterEventType,
  IdRegisterOnChainEvent,
  isIdRegisterOnChainEvent,
  isSignerOnChainEvent,
  OnChainEvent,
  OnChainEventType,
  SignerEventType,
  SignerMigratedOnChainEvent,
  SignerOnChainEvent,
} from "@farcaster/hub-nodejs";
import RocksDB, { RocksDbTransaction } from "../db/rocksdb.js";
import StoreEventHandler from "./storeEventHandler.js";
import {
  getManyOnChainEvents,
  getOnChainEvent,
  getOnChainEventByKey,
  getOnChainEventsPageByPrefix,
  makeIdRegisterEventByCustodyKey,
  makeIdRegisterEventByFidKey,
  makeOnChainEventIteratorPrefix,
  makeOnChainEventPrimaryKey,
  makeOnChainEventSecondaryIteratorPrefix,
  makeSignerOnChainEventBySignerKey,
  putOnChainEventTransaction,
} from "../db/onChainEvent.js";
import { ok, ResultAsync } from "neverthrow";
import { OnChainEventPostfix, RootPrefix } from "../db/types.js";
import { getHubState, putHubState } from "../db/hubState.js";
import { PageOptions } from "./types.js";
import { logger } from "../../utils/logger.js";
import { bytesCompare } from "@farcaster/core";
import { LRUCache } from "../../utils/lruCache.js";

const SUPPORTED_SIGNER_SCHEMES = [1];
const LRU_CACHE_SIZE = 50_000;

/**
 * OnChainStore persists On Chain Event messages in RocksDB using a grow only CRDT set
 * to guarantee eventual consistency.
 *
 * It build custom secondary indexes based on the type of the on chain event to allow querying for
 * current status (e.g. active signer for an fid).
 */
class OnChainEventStore {
  protected _db: RocksDB;
  protected _eventHandler: StoreEventHandler;

  // Store the last few active signers in memory to avoid hitting the database
  protected _activeSignerCache = new LRUCache<string, SignerOnChainEvent>(LRU_CACHE_SIZE);

  // Store the last few ID register events in memory to avoid hitting the database
  protected _idRegisterByFidCache = new LRUCache<number, IdRegisterOnChainEvent>(LRU_CACHE_SIZE);

  constructor(db: RocksDB, eventHandler: StoreEventHandler) {
    this._db = db;
    this._eventHandler = eventHandler;
  }

  async mergeOnChainEvent(event: OnChainEvent): Promise<number> {
    return this._mergeEvent(event);
  }

  async getOnChainEvents<T extends OnChainEvent>(type: OnChainEventType, fid: number): Promise<T[]> {
    const keys: Buffer[] = [];
    await this._db.forEachIteratorByPrefix(makeOnChainEventIteratorPrefix(type, fid), (key) => {
      if (key) {
        keys.push(key);
      }
    });
    return getManyOnChainEvents(this._db, keys);
  }

  getActiveSignerCacheKey = (fid: number, signer: Uint8Array): string => {
    return `${fid}:${Buffer.from(signer).toString("hex")}`;
  };

  clearCaches() {
    this._activeSignerCache.clear();
    this._idRegisterByFidCache.clear();
  }

  async getActiveSigner(fid: number, signer: Uint8Array): Promise<SignerOnChainEvent> {
    // See if we have this in the cache
    const cacheKey = this.getActiveSignerCacheKey(fid, signer);

    return await this._activeSignerCache.get(cacheKey, async () => {
      // Otherwise, look it up in the database
      const signerEventPrimaryKey = await this._db.get(makeSignerOnChainEventBySignerKey(fid, signer));
      const event = await getOnChainEventByKey<SignerOnChainEvent>(this._db, signerEventPrimaryKey);
      if (
        event.signerEventBody.eventType === SignerEventType.ADD &&
        SUPPORTED_SIGNER_SCHEMES.includes(event.signerEventBody.keyType)
      ) {
        return event;
      } else {
        throw new HubError("not_found", "no such active signer");
      }
    });
  }

  async getFids(pageOptions: PageOptions = {}): Promise<{
    fids: number[];
    nextPageToken: Uint8Array | undefined;
  }> {
    const filter = (event: OnChainEvent): event is OnChainEvent => {
      return isIdRegisterOnChainEvent(event);
    };
    const result = await getOnChainEventsPageByPrefix(
      this._db,
      makeOnChainEventSecondaryIteratorPrefix(OnChainEventPostfix.IdRegisterByFid),
      filter,
      pageOptions,
    );
    return { fids: result.events.map((event) => event.fid), nextPageToken: result.nextPageToken };
  }

  async getSignersByFid(
    fid: number,
    pageOptions: PageOptions = {},
  ): Promise<{ events: OnChainEvent[]; nextPageToken: Uint8Array | undefined }> {
    const filter = (event: OnChainEvent): event is OnChainEvent => {
      // Return only active signers
      return isSignerOnChainEvent(event) && event.signerEventBody.eventType === SignerEventType.ADD;
    };
    return getOnChainEventsPageByPrefix(
      this._db,
      makeOnChainEventSecondaryIteratorPrefix(OnChainEventPostfix.SignerByFid, fid),
      filter,
      pageOptions,
    );
  }

  async getIdRegisterEventByFid(fid: number): Promise<IdRegisterOnChainEvent> {
    return await this._idRegisterByFidCache.get(fid, async () => {
      const idRegisterEventPrimaryKey = await this._db.get(makeIdRegisterEventByFidKey(fid));
      return getOnChainEventByKey(this._db, idRegisterEventPrimaryKey);
    });
  }

  async getIdRegisterEventByCustodyAddress(address: Uint8Array): Promise<IdRegisterOnChainEvent> {
    const idRegisterEventPrimaryKey = await this._db.get(makeIdRegisterEventByCustodyKey(address));
    return getOnChainEventByKey(this._db, idRegisterEventPrimaryKey);
  }

  async getSignerMigratedAt(): HubAsyncResult<number> {
    const signerMigrated = await this.getOnChainEvents<SignerMigratedOnChainEvent>(
      OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED,
      0,
    );
    const byHighestBlock = signerMigrated.sort((a, b) => b.blockNumber - a.blockNumber);
    if (byHighestBlock[0]) {
      return ok(byHighestBlock[0].signerMigratedEventBody?.migratedAt);
    }
    return ok(0);
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

  private async _handleSignerEvent(txn: RocksDbTransaction, event: SignerOnChainEvent): Promise<RocksDbTransaction> {
    const secondaryKey = makeSignerOnChainEventBySignerKey(event.fid, event.signerEventBody.key);
    const existingEvent = await this._getEventBySecondaryKey<SignerOnChainEvent>(secondaryKey);
    if (existingEvent) {
      if (existingEvent.blockNumber > event.blockNumber) {
        // If our existing event is newer, don't update the secondary index.
        return txn;
      } else if (
        existingEvent.signerEventBody.eventType === SignerEventType.REMOVE &&
        event.signerEventBody.eventType === SignerEventType.ADD &&
        event.version === existingEvent.version
      ) {
        throw new HubError("bad_request.conflict", "attempting to re-add removed key");
      }
    }

    if (event.signerEventBody.eventType === SignerEventType.REMOVE) {
      // Remove the signer from the cache
      this._activeSignerCache.invalidate(this.getActiveSignerCacheKey(event.fid, event.signerEventBody.key));
    }

    if (event.signerEventBody.eventType === SignerEventType.ADMIN_RESET) {
      const signerEvents = await this.getOnChainEvents<SignerOnChainEvent>(
        OnChainEventType.EVENT_TYPE_SIGNER,
        event.fid,
      );
      const signerAdd = signerEvents.find(
        (value) =>
          value.signerEventBody.eventType === SignerEventType.ADD &&
          bytesCompare(value.signerEventBody.key, event.signerEventBody.key) === 0,
      );
      if (signerAdd) {
        logger.info(
          { fid: event.fid },
          `Admin reset of signer from block ${existingEvent?.blockNumber || -1} with ${signerAdd.blockNumber}`,
        );
        return txn.put(
          secondaryKey,
          makeOnChainEventPrimaryKey(signerAdd.type, signerAdd.fid, signerAdd.blockNumber, signerAdd.logIndex),
        );
      }
    }

    // Add to the secondary index if this is the first time add, or if it's an admin reset.
    return txn.put(secondaryKey, makeOnChainEventPrimaryKey(event.type, event.fid, event.blockNumber, event.logIndex));
  }

  private async _handleIdRegisterEvent(
    txn: RocksDbTransaction,
    event: IdRegisterOnChainEvent,
  ): Promise<RocksDbTransaction> {
    if (event.idRegisterEventBody.eventType === IdRegisterEventType.CHANGE_RECOVERY) {
      // change recovery events are not indexed (id and custody address are the same)
      return txn;
    }

    this._idRegisterByFidCache.invalidate(event.fid);

    const byFidKey = makeIdRegisterEventByFidKey(event.fid);
    const existingEvent = await this._getEventBySecondaryKey<IdRegisterOnChainEvent>(byFidKey);
    if (existingEvent && existingEvent.blockNumber > event.blockNumber) {
      // If our existing event is newer, don't update the secondary index.
      return txn;
    }
    const byCustodyAddressKey = makeIdRegisterEventByCustodyKey(event.idRegisterEventBody.to);
    const primaryKey = makeOnChainEventPrimaryKey(event.type, event.fid, event.blockNumber, event.logIndex);
    return txn.put(byFidKey, primaryKey).put(byCustodyAddressKey, primaryKey);
  }

  private async _getEventBySecondaryKey<T extends OnChainEvent>(secondaryKey: Buffer): Promise<T | undefined> {
    const existingEventKey = await ResultAsync.fromPromise(this._db.get(secondaryKey), () => undefined);
    if (existingEventKey.isOk()) {
      const primaryKey = existingEventKey.value;
      const existingEventResult = await ResultAsync.fromPromise(
        getOnChainEventByKey<T>(this._db, primaryKey),
        () => undefined,
      );
      if (existingEventResult.isErr()) {
        logger.warn(`secondary index corrupted for ${secondaryKey.toString("hex")}`);
      } else {
        return existingEventResult.value;
      }
    }
    return undefined;
  }

  static async clearEvents(db: RocksDB) {
    let count = 0;
    await db.forEachIteratorByPrefix(Buffer.from([RootPrefix.OnChainEvent]), async (key, value) => {
      if (!key || !value) {
        return;
      }
      await db.del(key);
      count++;
    });
    const result = await ResultAsync.fromPromise(getHubState(db), (e) => e as HubError);
    if (result.isOk()) {
      result.value.lastL2Block = 0;
      await putHubState(db, result.value);
    } else {
      logger.warn(result.error, "Could not reset hub state when clearing events");
    }
    return count;
  }
}

export default OnChainEventStore;
