import { OnChainEventType } from "@farcaster/hub-nodejs";
import { getOnChainEventsByFidInBatchesOf } from "../hub.js";
import { registerJob } from "../jobs.js";
import { processOnChainEvents } from "../processors/index.js";

export const BackfillFidStorageAllocations = registerJob({
  name: "BackfillFidStorageAllocations",
  run: async ({ fid }: { fid: number }, { db, log, redis, hub }) => {
    const registrationEvents = getOnChainEventsByFidInBatchesOf(hub, {
      fid,
      pageSize: 3_000,
      eventTypes: [OnChainEventType.EVENT_TYPE_STORAGE_RENT],
    });

    for await (const events of registrationEvents) {
      await processOnChainEvents(events, db, log, redis);
    }

    await redis.sadd("backfilled-storage-allocations", fid);
  },
});
