import {
  HubError,
  HubEvent,
  isMergeMessageHubEvent,
  isMergeOnChainHubEvent,
  isMergeUsernameProofHubEvent,
  isPruneMessageHubEvent,
  isRevokeMessageHubEvent,
  isStorageRentOnChainEvent,
  Message,
  OnChainEventType,
  StorageRentOnChainEvent,
} from "@farcaster/hub-nodejs";
import { err, ok } from "neverthrow";
import RocksDB from "../db/rocksdb.js";
import { FID_BYTES, OnChainEventPostfix, RootPrefix, UserMessagePostfix, UserMessagePostfixMax } from "../db/types.js";
import { logger } from "../../utils/logger.js";
import { makeFidKey, makeMessagePrimaryKey, makeTsHash, typeToSetPostfix } from "../db/message.js";
import { bytesCompare, getFarcasterTime, HubAsyncResult } from "@farcaster/core";
import { forEachOnChainEvent } from "../db/onChainEvent.js";
import { addProgressBar } from "../../utils/progressBars.js";
import { sleep } from "../../utils/crypto.js";

const MAX_PENDING_MESSAGE_COUNT_SCANS = 100;

const makeKey = (fid: number, set: UserMessagePostfix): string => {
  return Buffer.concat([makeFidKey(fid), Buffer.from([set])]).toString("hex");
};

const log = logger.child({ component: "StorageCache" });

type StorageSlot = {
  units: number;
  invalidateAt: number;
};

export class StorageCache {
  private _db: RocksDB;
  private _counts: Map<string, number>;
  private _earliestTsHashes: Map<string, Uint8Array>;
  private _activeStorageSlots: Map<number, StorageSlot>;
  private prepopulateComplete = false;
  private _pendingMessageCountScans = 0;

  constructor(db: RocksDB, usage?: Map<string, number>) {
    this._counts = usage ?? new Map();
    this._earliestTsHashes = new Map();
    this._activeStorageSlots = new Map();
    this._db = db;
  }

  async syncFromDb(): Promise<void> {
    log.info("starting storage cache sync");

    const start = Date.now();

    let totalFids = 0;

    await this._db.forEachIteratorByPrefix(
      Buffer.concat([Buffer.from([RootPrefix.OnChainEvent, OnChainEventPostfix.IdRegisterByFid])]),
      () => {
        totalFids++;
      },
    );

    const progressBar = addProgressBar("Syncing storage cache", totalFids * 2);

    const time = getFarcasterTime();
    if (time.isErr()) {
      log.error({ err: time.error }, "could not obtain time");
    } else {
      await forEachOnChainEvent(this._db, OnChainEventType.EVENT_TYPE_STORAGE_RENT, (event) => {
        const existingSlot = this._activeStorageSlots.get(event.fid);
        if (isStorageRentOnChainEvent(event) && event.storageRentEventBody.expiry > time.value) {
          const rentEventBody = event.storageRentEventBody;
          this._activeStorageSlots.set(event.fid, {
            units: rentEventBody.units + (existingSlot?.units ?? 0),
            invalidateAt:
              (existingSlot?.invalidateAt ?? rentEventBody.expiry) < rentEventBody.expiry
                ? existingSlot?.invalidateAt ?? rentEventBody.expiry
                : rentEventBody.expiry,
          });
          progressBar?.increment();
        }
      });
    }

    progressBar?.update(progressBar?.getTotal());
    progressBar?.stop();

    this._counts = new Map();
    this._earliestTsHashes = new Map();

    // Start prepopulating the cache in the background
    if (this._db.status !== "open") {
      log.error("cannot prepopulate message counts, db is not open");
      throw new HubError("unavailable.storage_failure", "cannot prepopulate message counts, db is not open");
    }

    // Run the prepopulation without waitinf for it to finish
    void this.prepopulateMessageCounts();

    log.info({ timeTakenMs: Date.now() - start }, "storage cache synced");
  }

  async prepopulateMessageCounts(): Promise<void> {
    if (this._db.status !== "open") {
      log.error("cannot prepopulate message counts, db is not open");
      return;
    }

    let prevFid = 0;
    let prevPostfix = 0;
    let totalFids = 0;

    const start = Date.now();
    log.info("starting storage cache prepopulation");

    const prefix = Buffer.from([RootPrefix.User]);
    await this._db.forEachIteratorByPrefix(prefix, async (key) => {
      if (this._db.status !== "open") {
        log.error("cannot iterate by prefix, db is not open");
        return;
      }

      const postfix = (key as Buffer).readUint8(1 + FID_BYTES);
      if (postfix < UserMessagePostfixMax) {
        const fid = (key as Buffer).subarray(1, 1 + FID_BYTES).readUInt32BE();

        if (prevFid !== fid || prevPostfix !== postfix) {
          await this.getMessageCount(fid, postfix);

          if (prevFid !== fid) {
            totalFids += 1;
            // Sleep to allow other threads to run between each fid
            await sleep(100);
          }

          prevFid = fid;
          prevPostfix = postfix;
        }
      }
    });
    this.prepopulateComplete = true;
    log.info({ timeTakenMs: Date.now() - start, totalFids }, "storage cache prepopulation finished");
  }

  async getMessageCount(fid: number, set: UserMessagePostfix, forceFetch = true): HubAsyncResult<number> {
    const key = makeKey(fid, set);
    if (this._counts.get(key) === undefined && forceFetch) {
      if (this._pendingMessageCountScans > MAX_PENDING_MESSAGE_COUNT_SCANS) {
        log.error({ pendingScans: this._pendingMessageCountScans }, "too many pending message count scans");
        return err(new HubError("unavailable.storage_failure", "too many pending message count scans"));
      }

      this._pendingMessageCountScans += 1;

      let total = 0;
      await this._db.forEachIteratorByPrefix(makeMessagePrimaryKey(fid, set), () => {
        total += 1;
      });

      // Recheck the count in case it was set by another thread (i.e. no race conditions)
      if (this._counts.get(key) === undefined) {
        this._counts.set(key, total);
        if (this.prepopulateComplete) {
          log.debug({ fid, set, total }, `storage cache miss for fid: ${fid}`);
        }
      }

      this._pendingMessageCountScans -= 1;
    }

    return ok(this._counts.get(key) ?? 0);
  }

  async getCurrentStorageUnitsForFid(fid: number): HubAsyncResult<number> {
    let slot = this._activeStorageSlots.get(fid);

    if (!slot) {
      return ok(0);
    }

    const time = getFarcasterTime();

    if (time.isErr()) {
      return err(time.error);
    }

    if (slot.invalidateAt < time.value) {
      const newSlot = { units: 0, invalidateAt: time.value + 365 * 24 * 60 * 60 };
      await forEachOnChainEvent(
        this._db,
        OnChainEventType.EVENT_TYPE_STORAGE_RENT,
        (event) => {
          if (isStorageRentOnChainEvent(event)) {
            const rentEventBody = event.storageRentEventBody;
            if (rentEventBody.expiry < time.value) return;
            if (newSlot.invalidateAt > rentEventBody.expiry) {
              newSlot.invalidateAt = rentEventBody.expiry;
            }

            newSlot.units += rentEventBody.units;
          }
        },
        fid,
      );
      slot = newSlot;
      this._activeStorageSlots.set(fid, slot);
    }

    return ok(slot.units);
  }

  async getEarliestTsHash(fid: number, set: UserMessagePostfix): HubAsyncResult<Uint8Array | undefined> {
    const key = makeKey(fid, set);
    const messageCount = await this.getMessageCount(fid, set);
    if (messageCount.isErr()) {
      return err(messageCount.error);
    }
    if (messageCount.value === 0) {
      return ok(undefined);
    }
    const value = this._earliestTsHashes.get(key);
    if (value === undefined) {
      const prefix = makeMessagePrimaryKey(fid, set);

      let firstKey: Buffer | undefined;
      await this._db.forEachIteratorByPrefix(prefix, (key) => {
        firstKey = key as Buffer;
        return true; // Finish the iteration after the first key-value pair
      });

      if (firstKey === undefined) {
        return ok(undefined);
      }

      if (firstKey && firstKey.length === 0) {
        return err(new HubError("unavailable.storage_failure", "could not read earliest message from db"));
      }

      const tsHash = Uint8Array.from(firstKey.subarray(1 + FID_BYTES + 1));
      this._earliestTsHashes.set(key, tsHash);
      return ok(tsHash);
    } else {
      return ok(value);
    }
  }

  async processEvent(event: HubEvent): HubAsyncResult<void> {
    if (isMergeMessageHubEvent(event)) {
      await this.addMessage(event.mergeMessageBody.message);
      for (const message of event.mergeMessageBody.deletedMessages) {
        await this.removeMessage(message);
      }
    } else if (isPruneMessageHubEvent(event)) {
      await this.removeMessage(event.pruneMessageBody.message);
    } else if (isRevokeMessageHubEvent(event)) {
      await this.removeMessage(event.revokeMessageBody.message);
    } else if (isMergeUsernameProofHubEvent(event)) {
      if (event.mergeUsernameProofBody.usernameProofMessage) {
        await this.addMessage(event.mergeUsernameProofBody.usernameProofMessage);
      } else if (event.mergeUsernameProofBody.deletedUsernameProofMessage) {
        await this.removeMessage(event.mergeUsernameProofBody.deletedUsernameProofMessage);
      }
    } else if (isMergeOnChainHubEvent(event) && isStorageRentOnChainEvent(event.mergeOnChainEventBody.onChainEvent)) {
      this.addRent(event.mergeOnChainEventBody.onChainEvent);
    }
    return ok(undefined);
  }

  private async addMessage(message: Message): Promise<void> {
    if (message.data !== undefined) {
      const set = typeToSetPostfix(message.data.type);
      const fid = message.data.fid;
      const key = makeKey(fid, set);
      const count = this._counts.get(key) ?? (await this.getMessageCount(fid, set)).unwrapOr(0);
      this._counts.set(key, count + 1);

      const tsHashResult = makeTsHash(message.data.timestamp, message.hash);
      if (!tsHashResult.isOk()) {
        log.error(`error: could not make ts hash for message ${message.hash}`);
        return;
      }
      const currentEarliest = this._earliestTsHashes.get(key);
      if (currentEarliest === undefined || bytesCompare(currentEarliest, tsHashResult.value) > 0) {
        this._earliestTsHashes.set(key, tsHashResult.value);
      }
    }
  }

  private async removeMessage(message: Message): Promise<void> {
    if (message.data !== undefined) {
      const set = typeToSetPostfix(message.data.type);
      const fid = message.data.fid;
      const key = makeKey(fid, set);
      const count = this._counts.get(key) ?? (await this.getMessageCount(fid, set)).unwrapOr(0);
      if (count === 0) {
        log.error(`error: ${set} store message count is already at 0 for fid ${fid}`);
      } else {
        this._counts.set(key, count - 1);
      }

      const tsHashResult = makeTsHash(message.data.timestamp, message.hash);
      if (!tsHashResult.isOk()) {
        log.error(`error: could not make ts hash for message ${message.hash}`);
        return;
      }
      const currentEarliest = this._earliestTsHashes.get(key);
      if (currentEarliest === undefined || bytesCompare(currentEarliest, tsHashResult.value) === 0) {
        this._earliestTsHashes.delete(key);
      }
    }
  }

  private addRent(event: StorageRentOnChainEvent): void {
    if (event !== undefined) {
      const existingSlot = this._activeStorageSlots.get(event.fid);
      const time = getFarcasterTime();
      if (time.isErr()) {
        log.error({ err: time.error }, "could not obtain time");
        return;
      }

      const rentEventBody = event.storageRentEventBody;
      if (time.value > (existingSlot?.invalidateAt ?? 0)) {
        this._activeStorageSlots.set(event.fid, {
          units: rentEventBody.units,
          invalidateAt: rentEventBody.expiry,
        });
      } else {
        this._activeStorageSlots.set(event.fid, {
          units: rentEventBody.units + (existingSlot?.units ?? 0),
          invalidateAt:
            (existingSlot?.invalidateAt ?? rentEventBody.expiry) < rentEventBody.expiry
              ? existingSlot?.invalidateAt ?? rentEventBody.expiry
              : rentEventBody.expiry,
        });
      }
    }
  }
}
