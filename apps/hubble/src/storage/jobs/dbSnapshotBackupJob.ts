import { FarcasterNetwork, HubAsyncResult, HubError } from "@farcaster/hub-nodejs";
import { Result, ResultAsync, err, ok } from "neverthrow";
import cron from "node-cron";
import { logger } from "../../utils/logger.js";
import { rsDbSnapshotBackup } from "../../rustfunctions.js";
import RocksDB from "../../storage/db/rocksdb.js";
import { uploadToS3 } from "../../utils/snapshot.js";
import SyncEngine from "../../network/sync/syncEngine.js";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import { HubOptions, S3_REGION, SNAPSHOT_S3_DEFAULT_BUCKET } from "../../hubble.js";

export const DEFAULT_DB_SNAPSHOT_BACKUP_JOB_CRON = "15 2 * * *"; // 2:15 am everyday

const log = logger.child({
  component: "DbSnapshotJob",
});

type SchedulerStatus = "started" | "stopped";

export class DbSnapshotBackupJobScheduler {
  private _cronTask?: cron.ScheduledTask;
  private _running = false;

  private _mainDb: RocksDB;
  private _trieDb: RocksDB;
  private _syncEngine: SyncEngine;
  private _options: HubOptions;

  constructor(mainDb: RocksDB, trieDb: RocksDB, syncEngine: SyncEngine, options: HubOptions) {
    this._mainDb = mainDb;
    this._trieDb = trieDb;
    this._syncEngine = syncEngine;
    this._options = options;
  }

  start(cronSchedule?: string) {
    this._cronTask = cron.schedule(cronSchedule ?? DEFAULT_DB_SNAPSHOT_BACKUP_JOB_CRON, () => this.doJobs(), {
      timezone: "Etc/UTC",
    });

    setTimeout(async () => {
      await this.doJobs();
    }, 1000);
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
    if (!this._options.enableSnapshotToS3) {
      return ok(undefined);
    }

    if (this._running) {
      log.info({}, "Db Snapshot Backup job already running, skipping");
      return ok(undefined);
    }
    this._running = true;

    log.info({}, "starting Db Snapshot Backup job");
    const start = Date.now();

    // Back up the DB before opening it
    const tarGzResult = await ResultAsync.fromPromise(
      rsDbSnapshotBackup(this._mainDb.rustDb, this._trieDb.rustDb),
      (e) => e as Error,
    );

    if (tarGzResult.isOk()) {
      const messageCount = await this._syncEngine.trie.items();

      // If snapshot to S3 flag is explicitly set, we throw an error if message count is zero,
      // since it would be atypical to set this flag when there are no messages in the trie
      if (messageCount <= 0) {
        log.error("no messages found in sync engine trie, cannot upload snapshot");
        throw new HubError("unavailable", "no messages found in sync engine trie, snapshot upload failed");
      }

      const s3Result = await uploadToS3(
        this._options.network,
        tarGzResult.value,
        this._options.s3SnapshotBucket,
        messageCount,
      );
      if (s3Result.isOk()) {
        // Delete the tar file chunks directory, ignore errors
        const deleteResult = Result.fromThrowable(
          () => fs.rmdirSync(tarGzResult.value, { recursive: true }),
          (e) => e as Error,
        )();
        if (deleteResult.isErr()) {
          log.warn(
            { error: deleteResult.error, errMessaeg: deleteResult.error.message },
            "failed to delete tar backup chunks",
          );
        }

        // Cleanup old files from S3
        this.deleteOldSnapshotsFromS3();
      } else {
        log.error({ error: s3Result.error, errMsg: s3Result.error.message }, "failed to upload snapshot to S3");
      }
    } else {
      log.error({ error: tarGzResult.error }, "failed to create tar backup for S3");
    }

    log.info({ timeTakenMs: Date.now() - start }, "finished Db Snapshot Backup job");
    this._running = false;

    return ok(undefined);
  }

  async deleteOldSnapshotsFromS3(): HubAsyncResult<void> {
    try {
      const fileListResult = await this.listS3Snapshots();

      if (!fileListResult.isOk()) {
        return err(new HubError("unavailable.network_failure", fileListResult.error.message));
      }

      if (fileListResult.value.length < 2) {
        log.warn({ fileList: fileListResult.value }, "Not enough snapshot files to delete");
        return ok(undefined);
      }

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const oldFiles = fileListResult.value
        .filter((file) => (file.LastModified ? new Date(file.LastModified) < oneMonthAgo : false))
        .slice(0, 10);

      if (oldFiles.length === 0) {
        return ok(undefined);
      }

      log.warn({ oldFiles }, "Deleting old snapshot files from S3");

      const s3Bucket = this._options.s3SnapshotBucket ?? SNAPSHOT_S3_DEFAULT_BUCKET;
      const deleteParams = {
        Bucket: s3Bucket,
        Delete: {
          Objects: oldFiles.map((file) => ({ Key: file.Key })),
        },
      };

      const s3 = new S3Client({
        region: S3_REGION,
      });

      await s3.send(new DeleteObjectsCommand(deleteParams));
      return ok(undefined);
    } catch (e: unknown) {
      return err(new HubError("unavailable.network_failure", (e as Error).message));
    }
  }

  async listS3Snapshots(): HubAsyncResult<
    Array<{
      Key: string | undefined;
      Size: number | undefined;
      LastModified: Date | undefined;
    }>
  > {
    const network = FarcasterNetwork[this._options.network].toString();

    const s3 = new S3Client({
      region: S3_REGION,
    });

    // Note: We get the snapshots across all DB_SCHEMA versions
    // when determining which snapshots to delete, we only delete snapshots from the current DB_SCHEMA version
    const s3Bucket = this._options.s3SnapshotBucket ?? SNAPSHOT_S3_DEFAULT_BUCKET;
    const params = {
      Bucket: s3Bucket,
      Prefix: `snapshots/${network}/`,
    };

    try {
      const response = await s3.send(new ListObjectsV2Command(params));

      if (response.Contents) {
        return ok(
          response.Contents.map((item) => ({
            Key: item.Key,
            Size: item.Size,
            LastModified: item.LastModified,
          })),
        );
      } else {
        return ok([]);
      }
    } catch (e: unknown) {
      return err(new HubError("unavailable.network_failure", (e as Error).message));
    }
  }
}
