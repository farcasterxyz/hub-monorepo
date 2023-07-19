import {
  HubError,
  HubEvent,
  HubResult,
  isMergeMessageHubEvent,
  isMergeUsernameProofHubEvent,
  isPruneMessageHubEvent,
  isRevokeMessageHubEvent,
  Message,
} from "@farcaster/hub-nodejs";
import { err, ok } from "neverthrow";
import RocksDB from "../db/rocksdb.js";
import { FID_BYTES, RootPrefix, UserMessagePostfix, UserMessagePostfixMax } from "../db/types.js";
import { logger } from "../../utils/logger.js";
import { makeFidKey, makeMessagePrimaryKey, makeTsHash, typeToSetPostfix } from "../db/message.js";
import {
  bytesCompare,
  getFarcasterTime,
  HubAsyncResult,
  isMergeRentRegistryEventHubEvent,
  RentRegistryEvent,
  StorageRegistryEventType,
} from "@farcaster/core";

const makeKey = (fid: number, set: UserMessagePostfix): string => {
  return Buffer.concat([makeFidKey(fid), Buffer.from([set])]).toString("hex");
};

const log = logger.child({ component: "StorageCache" });

type StorageSlot = {
  from: number;
  to: number;
  units: number;
};

export class StorageCache {
  private _db: RocksDB;
  private _counts: Map<string, number>;
  private _earliestTsHashes: Map<string, Uint8Array>;
  private _activeStorageSlots: Map<number, StorageSlot[]>;

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

    const prefix = Buffer.from([RootPrefix.User]);
    await this._db.forEachIteratorByPrefix(
      prefix,
      async (key) => {
        const postfix = (key as Buffer).readUint8(1 + FID_BYTES);
        if (postfix < UserMessagePostfixMax) {
          const lookupKey = (key as Buffer).subarray(1, 1 + FID_BYTES + 1).toString("hex");
          const count = usage.get(lookupKey) ?? 0;
          if (this._earliestTsHashes.get(lookupKey) === undefined) {
            const tsHash = Uint8Array.from((key as Buffer).subarray(1 + FID_BYTES + 1));
            this._earliestTsHashes.set(lookupKey, tsHash);
          }
          usage.set(lookupKey, count + 1);
        }
      },
      { values: false },
      15 * 60 * 1000, // 15 minutes
    );

    await this._db.forEachIteratorByPrefix(
      Buffer.from([RootPrefix.RentRegistryEvent]),
      async (_, value) => {
        if (!value) {
          return;
        }

        const event = RentRegistryEvent.decode(value);
        const existingSlots = this._activeStorageSlots.get(event.fid) ?? [];
        if (event.type === StorageRegistryEventType.RENT) {
          this._activeStorageSlots.set(event.fid, [
            ...existingSlots,
            {
              from: event.expiry - 365 * 24 * 60 * 60,
              to: event.expiry,
              units: event.units,
            },
          ]);
        }
      },
      { values: true },
      15 * 60 * 1000,
    );

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

  getCurrentStorageUnitsForFid(fid: number): HubResult<number> {
    const slots = this._activeStorageSlots.get(fid);

    if (!slots) {
      return ok(0);
    }

    const time = getFarcasterTime();

    if (time.isErr()) {
      return err(time.error);
    }

    return ok(slots.filter((s) => s.from <= time.value && s.to >= time.value).reduce((accum, s) => accum + s.units, 0));
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
    } else if (isMergeRentRegistryEventHubEvent(event)) {
      this.addRent(event.mergeRentRegistryEventBody.rentRegistryEvent);
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

  private addRent(event: RentRegistryEvent): void {
    if (event !== undefined) {
      const slots = this._activeStorageSlots.get(event.fid) ?? [];
      this._activeStorageSlots.set(event.fid, [
        ...slots,
        {
          from: event.expiry - 365 * 24 * 60 * 60,
          to: event.expiry,
          units: event.units,
        },
      ]);
    }
  }
}
