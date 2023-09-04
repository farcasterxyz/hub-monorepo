import {
  HubError,
  HubEvent,
  HubResult,
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

  constructor(db: RocksDB, usage?: Map<string, number>) {
    this._counts = usage ?? new Map();
    this._earliestTsHashes = new Map();
    this._activeStorageSlots = new Map();
    this._db = db;
  }

  async syncFromDb(): Promise<void> {
    log.info("starting storage cache sync");
    const usage = new Map<string, number>();

    const start = Date.now();

    let totalFids = 0;

    await this._db.forEachIteratorByPrefix(
      Buffer.concat([Buffer.from([RootPrefix.OnChainEvent, OnChainEventPostfix.IdRegisterByFid])]),
      async () => {
        totalFids++;
      },
      { keys: false, values: false },
    );

    const progressBar = addProgressBar("Syncing storage cache", totalFids * 2);

    let lastFid = 0;
    const prefix = Buffer.from([RootPrefix.User]);
    await this._db.forEachIteratorByPrefix(
      prefix,
      async (key) => {
        const postfix = (key as Buffer).readUint8(1 + FID_BYTES);
        if (postfix < UserMessagePostfixMax) {
          const lookupKey = (key as Buffer).subarray(1, 1 + FID_BYTES + 1).toString("hex");
          const fid = (key as Buffer).subarray(1, 1 + FID_BYTES).readUInt32BE();
          const count = usage.get(lookupKey) ?? 0;
          if (this._earliestTsHashes.get(lookupKey) === undefined) {
            const tsHash = Uint8Array.from((key as Buffer).subarray(1 + FID_BYTES + 1));
            this._earliestTsHashes.set(lookupKey, tsHash);
          }
          usage.set(lookupKey, count + 1);

          if (lastFid !== fid) {
            progressBar?.increment();
            lastFid = fid;
          }
        }
      },
      { values: false },
      15 * 60 * 1000, // 15 minutes
    );

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

    this._counts = usage;
    this._earliestTsHashes = new Map();
    log.info({ timeTakenMs: Date.now() - start }, "storage cache synced");
  }

  async getMessageCount(fid: number, set: UserMessagePostfix): HubAsyncResult<number> {
    const key = makeKey(fid, set);
    if (this._counts.get(key) === undefined) {
      await this._db.forEachIteratorByPrefix(
        makeMessagePrimaryKey(fid, set),
        () => {
          const count = this._counts.get(key) ?? 0;
          this._counts.set(key, count + 1);
        },
        { keys: false, valueAsBuffer: true },
      );
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
      const iterator = this._db.iteratorByPrefix(prefix, { values: false });
      const [firstKey] = await iterator.next();
      await iterator.end();

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

  processEvent(event: HubEvent): HubResult<void> {
    if (isMergeMessageHubEvent(event)) {
      this.addMessage(event.mergeMessageBody.message);
      for (const message of event.mergeMessageBody.deletedMessages) {
        this.removeMessage(message);
      }
    } else if (isPruneMessageHubEvent(event)) {
      this.removeMessage(event.pruneMessageBody.message);
    } else if (isRevokeMessageHubEvent(event)) {
      this.removeMessage(event.revokeMessageBody.message);
    } else if (isMergeUsernameProofHubEvent(event)) {
      if (event.mergeUsernameProofBody.usernameProofMessage) {
        this.addMessage(event.mergeUsernameProofBody.usernameProofMessage);
      } else if (event.mergeUsernameProofBody.deletedUsernameProofMessage) {
        this.removeMessage(event.mergeUsernameProofBody.deletedUsernameProofMessage);
      }
    } else if (isMergeOnChainHubEvent(event) && isStorageRentOnChainEvent(event.mergeOnChainEventBody.onChainEvent)) {
      this.addRent(event.mergeOnChainEventBody.onChainEvent);
    }
    return ok(undefined);
  }

  private addMessage(message: Message): void {
    if (message.data !== undefined) {
      const set = typeToSetPostfix(message.data.type);
      const fid = message.data.fid;
      const key = makeKey(fid, set);
      const count = this._counts.get(key) ?? 0;
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

  private removeMessage(message: Message): void {
    if (message.data !== undefined) {
      const set = typeToSetPostfix(message.data.type);
      const fid = message.data.fid;
      const key = makeKey(fid, set);
      const count = this._counts.get(key) ?? 0;
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
