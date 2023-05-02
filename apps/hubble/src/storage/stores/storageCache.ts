import {
  HubError,
  HubEvent,
  HubResult,
  isMergeMessageHubEvent,
  isPruneMessageHubEvent,
  isRevokeMessageHubEvent,
  Message,
} from '@farcaster/hub-nodejs';
import { err, ok } from 'neverthrow';
import RocksDB from '~/storage/db/rocksdb';
import { FID_BYTES, RootPrefix, UserMessagePostfix, UserMessagePostfixMax } from '~/storage/db/types';
import { logger } from '~/utils/logger';
import { getMessagesPruneIterator, makeFidKey, makeTsHash, typeToSetPostfix } from '~/storage/db/message';
import { bytesCompare, HubAsyncResult } from '@farcaster/core';

const makeKey = (fid: number, set: UserMessagePostfix): string => {
  return Buffer.concat([makeFidKey(fid), Buffer.from([set])]).toString('hex');
};

const log = logger.child({ component: 'StorageCache' });

export class StorageCache {
  private _db: RocksDB;
  private _counts: Map<string, number>;
  private _earliestTsHashes: Map<string, Uint8Array>;
  private _synced = false;

  constructor(db: RocksDB, usage?: Map<string, number>) {
    this._counts = usage ?? new Map();
    this._earliestTsHashes = new Map();
    this._db = db;
  }

  async syncFromDb(): Promise<void> {
    log.info('starting storage cache sync');
    const usage = new Map<string, number>();

    const prefix = Buffer.from([RootPrefix.User]);

    const iterator = this._db.iteratorByPrefix(prefix);

    for await (const [key] of iterator) {
      const postfix = (key as Buffer).readUint8(1 + FID_BYTES);
      if (postfix < UserMessagePostfixMax) {
        const lookupKey = (key as Buffer).subarray(1, 1 + FID_BYTES + 1).toString('hex');
        const count = usage.get(lookupKey) ?? 0;
        if (this._earliestTsHashes.get(lookupKey) === undefined) {
          this._earliestTsHashes.set(lookupKey, (key as Buffer).subarray(1 + FID_BYTES + 1));
        }
        usage.set(lookupKey, count + 1);
      }
    }

    this._counts = usage;
    this._earliestTsHashes = new Map();
    this._synced = true;
    log.info('storage cache synced');
  }

  async getMessageCount(fid: number, set: UserMessagePostfix): HubAsyncResult<number> {
    const key = makeKey(fid, set);
    if (this._counts.get(key) === undefined) {
      const iterator = getMessagesPruneIterator(this._db, fid, set);
      for await (const [,] of iterator) {
        const count = this._counts.get(key) ?? 0;
        this._counts.set(key, count + 1);
      }
    }
    return ok(this._counts.get(key) ?? 0);
  }

  async getEarliestMessageTimestamp(fid: number, set: UserMessagePostfix): HubAsyncResult<Uint8Array | undefined> {
    // sync on initial load
    const key = makeKey(fid, set);
    const messageCount = await this.getMessageCount(fid, set);
    if (messageCount.isErr()) {
      return err(messageCount.error);
    }
    if (messageCount.value === 0) {
      return ok(undefined);
    }
    if (this._earliestTsHashes.get(key) === undefined) {
      const pruneIterator = getMessagesPruneIterator(this._db, fid, set);
      const [firstKey] = await pruneIterator.next();
      await pruneIterator.end();
      if (firstKey === undefined) {
        // todo: this might be normal (empty sets)
        return err(new HubError('unavailable.storage_failure', 'could not read earliest message from db'));
      }

      const tsHash = firstKey.subarray(1 + FID_BYTES + 1);
      const lookupKey = firstKey.subarray(1, 1 + FID_BYTES + 1).toString('hex');
      this._earliestTsHashes.set(lookupKey, tsHash);
      return ok(tsHash);
    } else {
      return ok(this._earliestTsHashes.get(key));
    }
  }

  processEvent(event: HubEvent): HubResult<void> {
    if (this._synced !== true) {
      const error = new HubError('unavailable.storage_failure', 'storage cache is not synced with db');
      log.error({ errCode: error.errCode }, `processEvent error: ${error.message}`);
      return err(error);
    }
    if (isMergeMessageHubEvent(event)) {
      this.addMessage(event.mergeMessageBody.message);
      for (const message of event.mergeMessageBody.deletedMessages) {
        this.removeMessage(message);
      }
    } else if (isPruneMessageHubEvent(event)) {
      this.removeMessage(event.pruneMessageBody.message);
    } else if (isRevokeMessageHubEvent(event)) {
      this.removeMessage(event.revokeMessageBody.message);
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
      if (tsHashResult.isOk()) {
        const currentEarliest = this._earliestTsHashes.get(key);
        // todo: check direction on the compare
        if (currentEarliest === undefined || bytesCompare(currentEarliest, tsHashResult.value) > 0) {
          this._earliestTsHashes.set(key, tsHashResult.value);
        }
      } else {
        log.error(`error: could not make ts hash for message ${message.hash}`);
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
      if (tsHashResult.isOk()) {
        const currentEarliest = this._earliestTsHashes.get(key);
        // todo: Should this be an exact match? Is there an ordering issue here when two messages have the same timestamp?
        if (currentEarliest === undefined || bytesCompare(currentEarliest, tsHashResult.value) === 0) {
          this._earliestTsHashes.delete(key);
        }
      } else {
        log.error(`error: could not make ts hash for message ${message.hash}`);
      }
    }
  }
}
