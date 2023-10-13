import { HubAsyncResult } from "@farcaster/hub-nodejs";
import { err, ok } from "neverthrow";
import cron from "node-cron";
import { logger } from "../../utils/logger.js";
import Engine from "../engine/index.js";
import { statsd } from "../../utils/statsd.js";
import SyncEngine from "../../network/sync/syncEngine.js";
import { SyncId } from "../../network/sync/syncId.js";

export const DEFAULT_REMOVE_FIDS_WITH_NO_STORAGE_CRON = "0 */3 * * *"; // Every 3 hours

const log = logger.child({
  component: "RemoveFidsWithNoStorageJob",
});

type SchedulerStatus = "started" | "stopped";

export class RemoveFidsWithNoStorageJobScheduler {
  private _engine: Engine;
  private _syncEngine: SyncEngine;
  private _cronTask?: cron.ScheduledTask;
  private _running = false;

  constructor(engine: Engine, syncEngine: SyncEngine) {
    this._engine = engine;
    this._syncEngine = syncEngine;
  }

  start(cronSchedule?: string) {
    this._cronTask = cron.schedule(cronSchedule ?? DEFAULT_REMOVE_FIDS_WITH_NO_STORAGE_CRON, () => this.doJobs());

    // Run once on startup
    setTimeout(() => {
      this.doJobs();
    }, 10 * 1000);
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
      log.info({}, "RemoveFidsWithNoStorageJobScheduler already running, skipping");
      return ok(undefined);
    }

    log.info({}, "starting RemoveFidsWithNoStorageJobScheduler");
    this._running = true;

    const start = Date.now();

    let totalFidsRemoved = 0;
    let totalFidsChecked = 0;
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

      for (let i = 0; i < fids.length; i++) {
        const numChecked = await this.doJobForFid(fids[i] as number);
        totalFidsRemoved += numChecked.unwrapOr(0);
      }
      totalFidsChecked += fids.length;
    } while (!finished);

    const timeTakenMs = Date.now() - start;
    log.info({ timeTakenMs, totalFidsChecked, totalFidsRemoved }, "finished RemoveFidsWithNoStorageJobScheduler");

    // StatsD metrics
    statsd().timing("RemoveFidsWithNoStorageJobScheduler.timeTakenMs", timeTakenMs);
    statsd().gauge("RemoveFidsWithNoStorageJobScheduler.totalMessagesChecked", totalFidsRemoved);

    this._running = false;
    return ok(undefined);
  }

  async doJobForFid(fid: number): HubAsyncResult<number> {
    // See if this FID has any storage
    const storage = await this._engine.getCurrentStorageLimitsByFid(fid);
    if (storage.isOk() && storage.value.limits[0]?.limit === 0) {
      const onChainEvent = await this._engine.getIdRegistryOnChainEvent(fid);
      if (onChainEvent.isOk()) {
        const syncId = SyncId.fromOnChainEvent(onChainEvent.value);
        const result = await this._syncEngine.trie.deleteBySyncId(syncId);
        if (!result) {
          log.error({ fid }, "RemoveFidsWithNoStorageJobScheduler trie.deleteBySyncId failed");
        }
        await this._engine.removeOnChainIdRegisterEventByFid(onChainEvent.value);
      }

      log.info({ fid }, "RemoveFids removed OnChainIdRegisterEvent for FID with no storage");
    }

    return ok(1);
  }
}
