import { bytesToHexString, HubAsyncResult, HubError, Message } from "@farcaster/hub-nodejs";
import { err, ok, Result } from "neverthrow";
import cron from "node-cron";
import { logger } from "../../utils/logger.js";
import { FID_BYTES, TSHASH_LENGTH, UserMessagePostfixMax } from "../db/types.js";
import RocksDB from "../db/rocksdb.js";
import Engine from "../engine/index.js";
import { makeUserKey } from "../db/message.js";
import { statsd } from "../../utils/statsd.js";

export const DEFAULT_VALIDATE_AND_REVOKE_MESSAGES_CRON = "0 1 * * *"; // Every day at 01:00 UTC

const log = logger.child({
  component: "ValidateOrRevokeMessagesJob",
});

type SchedulerStatus = "started" | "stopped";

export class ValidateOrRevokeMessagesJobScheduler {
  private _db: RocksDB;
  private _engine: Engine;
  private _cronTask?: cron.ScheduledTask;
  private _running = false;

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
    return this._cronTask ? "started" : "stopped";
  }

  async doJobs(): HubAsyncResult<void> {
    if (this._running) {
      log.info({}, "ValidateOrRevokeMessagesJob already running, skipping");
      return ok(undefined);
    }

    log.info({}, "starting ValidateOrRevokeMessagesJob");
    this._running = true;

    const start = Date.now();

    const allFids = [];
    let finished = false;
    let pageToken: Uint8Array | undefined;
    do {
      const fidsPage = await this._engine.getFids({ pageToken, pageSize: 100 });
      if (fidsPage.isErr()) {
        return err(fidsPage.error);
      }
      const { fids, nextPageToken } = fidsPage.value;
      if (!nextPageToken) {
        finished = true;
      } else {
        pageToken = nextPageToken;
      }
      allFids.push(...fids);
    } while (!finished);

    let totalMessagesChecked = 0;

    const numFids = allFids.length;
    const scheduledTimePerFidMs = (6 * 60 * 60 * 1000) / numFids; // 6 hours for all FIDs
    log.info({ numFids, scheduledTimePerFidMs }, "ValidateOrRevokeMessagesJob: got FIDs");

    for (let i = 0; i < numFids; i++) {
      const fid = allFids[i] as number;
      const numChecked = await this.doJobForFid(fid);
      totalMessagesChecked += numChecked.unwrapOr(0);

      if (i % 1000 === 0) {
        log.info({ fid, totalMessagesChecked }, "ValidateOrRevokeMessagesJob: progress");
      }

      // If we are running ahead of schedule, sleep for a bit to let the other jobs catch up.
      if (Date.now() - start < (i + 1) * scheduledTimePerFidMs) {
        await new Promise((resolve) => setTimeout(resolve, scheduledTimePerFidMs));
      }
    }

    const timeTakenMs = Date.now() - start;
    log.info({ timeTakenMs, numFids, totalMessagesChecked }, "finished ValidateOrRevokeMessagesJob");

    // StatsD metrics
    statsd().timing("validateOrRevokeMessagesJob.timeTakenMs", timeTakenMs);
    statsd().gauge("validateOrRevokeMessagesJob.totalMessagesChecked", totalMessagesChecked);

    this._running = false;
    return ok(undefined);
  }

  async doJobForFid(fid: number): HubAsyncResult<number> {
    const prefix = makeUserKey(fid);
    let count = 0;

    await this._db.forEachIteratorByPrefix(
      prefix,
      async (key, value) => {
        if ((key as Buffer).length !== 1 + FID_BYTES + 1 + TSHASH_LENGTH) {
          // Not a message key, so we can skip it.
          return; // continue
        }

        // Get the UserMessagePostfix from the key, which is the 1 + 32 bytes from the start
        const postfix = (key as Buffer).readUint8(1 + FID_BYTES);
        if (postfix > UserMessagePostfixMax) {
          // Not a message key, so we can skip it.
          return; // continue
        }

        const message = Result.fromThrowable(
          () => Message.decode(new Uint8Array(value as Buffer)),
          (e) => e as HubError,
        )();

        if (message.isOk()) {
          const result = await this._engine.validateOrRevokeMessage(message.value);
          count += 1;
          result.match(
            (result) => {
              if (result !== undefined) {
                log.info({ fid, hash: bytesToHexString(message.value.hash)._unsafeUnwrap() }, "revoked message");
              }
            },
            (e) => {
              log.error({ errCode: e.errCode }, `error validating and revoking message: ${e.message}`);
            },
          );
        }
      },
      {},
      15 * 60 * 1000, // 15 minutes
    );

    return ok(count);
  }
}
