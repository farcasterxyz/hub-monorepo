import { HubEvent, HubEventType, HubRpcClient, OnChainEvent, isHubError } from "@farcaster/hub-nodejs";
import humanizeDuration from "humanize-duration";
import { Redis, RedisKey } from "ioredis";
import { Logger } from "pino";
import { DB, Tables, getEstimateOfTablesRowCount, executeTx } from "./db.js";
import { AssertionError } from "./error.js";
import { HubSubscriber } from "./hubSubscriber.js";
import { BackfillFidData } from "./jobs/backfillFidData.js";
import { BackfillFidRegistration } from "./jobs/backfillFidRegistration.js";
import { ProcessHubEvent } from "./jobs/processHubEvent.js";
import { processOnChainEvent } from "./processors/onChainEvent.js";
import { statsd } from "./statsd.js";
import { sleep } from "./util.js";
import { STATSD_HOST } from "./env.js";

export class HubReplicator {
  private eventsSubscriber: HubSubscriber;
  private lastHubEventIdKey: RedisKey;

  constructor(
    private hub: HubRpcClient,
    private hubAddress: string,
    private db: DB,
    private log: Logger,
    private redis: Redis,
  ) {
    this.eventsSubscriber = new HubSubscriber("all-events", this.hub, log, [
      HubEventType.MERGE_ON_CHAIN_EVENT,
      HubEventType.MERGE_MESSAGE,
      HubEventType.MERGE_USERNAME_PROOF,
      HubEventType.PRUNE_MESSAGE,
      HubEventType.REVOKE_MESSAGE,
    ]);
    this.lastHubEventIdKey = `hub:${this.hubAddress}:last-hub-event-id`;

    this.eventsSubscriber.on("event", async (hubEvent) => {
      this.processHubEvent(hubEvent);
      await this.redis.set(this.lastHubEventIdKey, hubEvent.id);
    });
  }

  public async start() {
    if (STATSD_HOST) {
      setInterval(() => {
        this.updateTableMetrics();
      }, 5_000);
    }
    await this.backfill();
  }

  public stop() {
    this.eventsSubscriber.stop();
  }

  public destroy() {
    this.eventsSubscriber.destroy();
  }

  private async processHubEvent(hubEvent: HubEvent) {
    // Immediately enqueue so that we don't block consumption of the event stream
    // (hub will close connection if we get too far behind)
    await ProcessHubEvent.enqueue({ hubEventJsonStr: JSON.stringify(HubEvent.toJSON(hubEvent)) });
  }

  private async updateTableMetrics() {
    const tablesToMonitor: Array<keyof Tables> = [
      "chainEvents",
      "fids",
      "signers",
      "usernameProofs",
      "fnames",
      "messages",
      "casts",
      "reactions",
      "links",
      "verifications",
      "userData",
      "storageAllocations",
    ];
    const stats = await getEstimateOfTablesRowCount(this.db, tablesToMonitor);
    for (const row of stats.rows) {
      if (row.estimate < 0) {
        row.estimate = 0;
      }
      statsd().gauge(`db.${row.tableName}.rows`, row.estimate as number);
    }
  }

  private async backfill() {
    const infoResult = await this.hub.getInfo({ dbStats: true });
    if (infoResult.isErr() || infoResult.value.dbStats === undefined) {
      throw new Error(`Unable to communicate with hub ${this.hubAddress}`);
    }

    const maxFidResult = await this.hub.getFids({ pageSize: 1, reverse: true });
    if (maxFidResult.isErr()) throw new Error("Unable to get latest FID", { cause: maxFidResult.error });

    const maxFid = maxFidResult.value.fids[0];
    if (!maxFid) throw new AssertionError("Max FID was undefined");

    // If the last event we processed no longer exists on the hub, then we're too
    // far behind to catch up using the event stream alone.
    const lastEventId = Number((await this.redis.get(this.lastHubEventIdKey)) ?? "0");
    let tooFarBehind = false;
    try {
      this.hub.getEvent({ id: lastEventId });
    } catch (e) {
      if (isHubError(e) && e.errCode === "not_found") {
        tooFarBehind = true;
      } else {
        throw e;
      }
    }

    if (tooFarBehind) {
      // Force a full backfill again. We don't clear the backfilled-registrations set
      // since registrations are a single immutable event, but clear everything else.
      await Promise.all(
        [
          "backfilled-signers",
          "backfilled-casts",
          "backfilled-reactions",
          "backfilled-links",
          "backfilled-verifications",
          "backfilled-userdata",
          "backfilled-username-proofs",
          "backfilled-other-onchain-events",
        ].map((key) => this.redis.del(key)),
      );
    }

    // First ensure all current FIDs are backfilled, since many messages have a foreign key to fids table
    // await this.waitForFidRegistrationsBackfill({ maxFid });

    // Then kick off backfill of all other data
    // await Promise.all([this.enqueueBackfillJobs({ maxFid }), this.waitForOtherChainEventsBackfill({ maxFid })]);

    // Finally, once all events have been processed, we can start subscribing to the event stream
    // and processing new events as they come in while backfilling messages.
    void this.eventsSubscriber.start();
  }

  private async waitForFidRegistrationsBackfill({ maxFid }: { maxFid: number }) {
    this.log.info(`Enqueuing jobs for backfilling FID registrations for ${maxFid} FIDs...`);

    const jobs: Parameters<typeof BackfillFidRegistration.enqueueBulk>[0] = [];
    for (let fid = maxFid; fid > 0; fid--) {
      const alreadyBackfilled = await this.redis.sismember("backfilled-registrations", fid);
      if (alreadyBackfilled) continue;
      jobs.push({
        args: { fid },
        bulkJobOptions: { lifo: true },
      });
    }
    await BackfillFidRegistration.enqueueBulk(jobs);

    const startTime = Date.now();
    const alreadyBackfilled = await this.redis.scard("backfilled-registrations");
    for (;;) {
      const dataBackfilled = await this.redis.scard("backfilled-registrations");
      if (dataBackfilled >= maxFid) break;

      const elapsedMs = Date.now() - startTime;
      const millisRemaining = Math.ceil(
        (elapsedMs / (dataBackfilled - alreadyBackfilled)) * (maxFid - alreadyBackfilled - dataBackfilled),
      );
      const timeRemaining =
        millisRemaining === Infinity || millisRemaining > 864000000
          ? "Calculating..."
          : humanizeDuration(millisRemaining, { round: true });

      this.log.info(
        `Backfilled registrations for ${dataBackfilled} of ${maxFid} FIDs. Estimated time remaining: ${timeRemaining}`,
      );
      await sleep(5_000);
    }
    this.log.info(
      `Finished backfilling registrations for ${maxFid} FIDs. Total time: ${humanizeDuration(Date.now() - startTime)}`,
    );
  }

  private async enqueueBackfillJobs({ maxFid }: { maxFid: number }) {
    this.log.info(`Enqueuing jobs for backfilling data for ${maxFid} FIDs...`);
    for (let fid = 1; fid <= maxFid; fid++) {
      // Enqueue one at a time so we allow other job types to be enqueued/processed.
      // This spreads load better since we write to multiple tables in parallel instead
      // of a single table. This job will kick off other jobs for fetching different data.
      await BackfillFidData.enqueue({ fid });
    }
  }

  private async waitForOtherChainEventsBackfill({ maxFid }: { maxFid: number }) {
    let startTime = Date.now();
    const alreadyBackfilled = await this.redis.scard("backfilled-other-onchain-events");

    for (;;) {
      const dataBackfilled = await this.redis.scard("backfilled-other-onchain-events");
      if (dataBackfilled >= maxFid) break;

      const elapsedMs = Date.now() - startTime;
      const millisRemaining = Math.ceil(
        (elapsedMs / (dataBackfilled - alreadyBackfilled)) * (maxFid - alreadyBackfilled - dataBackfilled),
      );
      const timeRemaining =
        millisRemaining === Infinity || millisRemaining > 864000000
          ? "Calculating..."
          : humanizeDuration(millisRemaining, { round: true });
      this.log.info(
        `Backfilled events for ${dataBackfilled} of ${maxFid} FIDs. Estimated time remaining: ${timeRemaining}`,
      );
      await sleep(5_000);
    }
    this.log.info(
      `Finished backfilling events for ${maxFid} FIDs. Total time: ${humanizeDuration(Date.now() - startTime)}`,
    );

    // Now that all other onchain events are backfilled, we are safe to process them in order.
    // These must be processed in linear order since transfers, changing recovery addresses, and
    // storage allocations require linear ordering.
    startTime = Date.now();
    this.log.info(`Beginning in-order processing of events for ${maxFid} FIDs`);
    const { blockNumber, logIndex } = await this.redis.hgetall("processed-onchain-events-watermark");
    for await (const { raw } of this.db
      .selectFrom("chainEvents")
      .select("raw")
      .$call((qb) =>
        blockNumber && logIndex
          ? // Start from the after the last event we processed if there was one
            qb
              .where("blockNumber", ">=", Number(blockNumber))
              .where("logIndex", ">", Number(logIndex))
          : qb,
      )
      .stream()) {
      const onChainEvent = OnChainEvent.decode(raw);

      await executeTx(this.db, async (trx) => {
        await processOnChainEvent(onChainEvent, trx, false);
      });

      await this.redis.hset("processed-onchain-events-watermark", {
        blockNumber: onChainEvent.blockNumber,
        logIndex: onChainEvent.logIndex,
      });
    }

    this.log.info(
      `Completed in-order processing of onchain events. Total time: ${humanizeDuration(Date.now() - startTime)}`,
    );
  }
}
