import {
  HubEvent,
  isMergeMessageHubEvent,
  isPruneMessageHubEvent,
  isRevokeMessageHubEvent,
  Message,
  HubError,
  HubResult,
} from '@farcaster/hub-nodejs';
import { ok, err } from 'neverthrow';
import RocksDB from '~/storage/db/rocksdb';
import { FID_BYTES, RootPrefix, UserMessagePostfix, UserMessagePostfixMax } from '~/storage/db/types';
import { logger } from '~/utils/logger';
import { makeFidKey, typeToSetPostfix } from '~/storage/db/message';

const makeKey = (fid: number, set: UserMessagePostfix): string => {
  return Buffer.concat([makeFidKey(fid), Buffer.from([set])]).toString('hex');
};

const log = logger.child({ component: 'StorageCache' });

export class StorageCache {
  private _usage: Map<string, number>;
  private _synced = false;

  constructor(usage?: Map<string, number>) {
    this._usage = usage ?? new Map();
  }

  async syncFromDb(db: RocksDB): Promise<void> {
    log.info('starting storage cache sync');
    const usage = new Map<string, number>();

    const prefix = Buffer.from([RootPrefix.User]);

    const iterator = db.iteratorByPrefix(prefix);

    for await (const [key] of iterator) {
      const postfix = (key as Buffer).readUint8(1 + FID_BYTES);
      if (postfix < UserMessagePostfixMax) {
        const usageKey = (key as Buffer).subarray(1, 1 + FID_BYTES + 1).toString('hex');
        const count = usage.get(usageKey) ?? 0;
        usage.set(usageKey, count + 1);
      }
    }

    this._usage = usage;
    this._synced = true;
    log.info('storage cache synced');
  }

  getMessageCount(fid: number, set: UserMessagePostfix): HubResult<number> {
    if (this._synced !== true) {
      const error = new HubError('unavailable.storage_failure', 'storage cache is not synced with db');
      log.warn({ errCode: error.errCode }, `getMessageCount error: ${error.message}`);
      return err(error);
    }
    const key = makeKey(fid, set);
    return ok(this._usage.get(key) ?? 0);
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
      const count = this._usage.get(key) ?? 0;
      this._usage.set(key, count + 1);
    }
  }

  private removeMessage(message: Message): void {
    if (message.data !== undefined) {
      const set = typeToSetPostfix(message.data.type);
      const fid = message.data.fid;
      const key = makeKey(fid, set);
      const count = this._usage.get(key) ?? 0;
      if (count === 0) {
        log.error(`error: ${set} store message count is already at 0 for fid ${fid}`);
      } else {
        this._usage.set(key, count - 1);
      }
    }
  }
}
