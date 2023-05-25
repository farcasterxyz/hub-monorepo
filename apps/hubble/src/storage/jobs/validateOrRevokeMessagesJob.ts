import { bytesToHexString, HubAsyncResult, HubError, Message } from '@farcaster/hub-nodejs';
import { ok, Result } from 'neverthrow';
import cron from 'node-cron';
import { logger } from '../../utils/logger.js';
import { FID_BYTES, RootPrefix, TSHASH_LENGTH, UserMessagePostfixMax } from '../db/types.js';
import RocksDB from '../db/rocksdb.js';
import Engine from '../engine/index.js';

export const DEFAULT_VALIDATE_AND_REVOKE_MESSAGES_CRON = '0 1 * * *'; // Every day at 01:00 UTC

const log = logger.child({
  component: 'ValidateOrRevokeMessagesJob',
});

type SchedulerStatus = 'started' | 'stopped';

export class ValidateOrRevokeMessagesJobScheduler {
  private _db: RocksDB;
  private _engine: Engine;
  private _cronTask?: cron.ScheduledTask;

  constructor(db: RocksDB, engine: Engine) {
    this._db = db;
    this._engine = engine;
  }

  start(cronSchedule?: string) {
    this._cronTask = cron.schedule(cronSchedule ?? DEFAULT_VALIDATE_AND_REVOKE_MESSAGES_CRON, () => this.doJobs());
  }

  stop() {
    if (this._cronTask) {
      this._cronTask.stop();
    }
  }

  status(): SchedulerStatus {
    return this._cronTask ? 'started' : 'stopped';
  }

  async doJobs(): HubAsyncResult<void> {
    log.info({}, 'starting ValidateOrRevokeMessagesJob');

    const allUserPrefix = Buffer.from([RootPrefix.User]);

    for await (const [key, value] of this._db.iteratorByPrefix(allUserPrefix)) {
      if ((key as Buffer).length !== 1 + FID_BYTES + 1 + TSHASH_LENGTH) {
        // Not a message key, so we can skip it.
        continue;
      }

      // Get the UserMessagePostfix from the key, which is the 1 + 32 bytes from the start
      const postfix = (key as Buffer).readUint8(1 + FID_BYTES);
      if (postfix > UserMessagePostfixMax) {
        // Not a message key, so we can skip it.
        continue;
      }

      const message = Result.fromThrowable(
        () => Message.decode(new Uint8Array(value as Buffer)),
        (e) => e as HubError
      )();

      if (message.isOk()) {
        const result = await this._engine.validateOrRevokeMessage(message.value);
        result.match(
          (result) => {
            if (result !== undefined) {
              log.info(
                `revoked message ${bytesToHexString(message.value.hash)._unsafeUnwrap()} from fid ${
                  message.value.data?.fid
                }`
              );
            }
          },
          (e) => {
            log.error({ errCode: e.errCode }, `error validating and revoking message: ${e.message}`);
          }
        );
      }
    }

    log.info({}, 'finished ValidateOrRevokeMessagesJob');

    return ok(undefined);
  }
}
