import { IdRegisterEventType, OnChainEventType } from "@farcaster/hub-nodejs";
import { getOnChainEventsByFidInBatchesOf } from "../hub.js";
import { registerJob } from "../jobs.js";
import { processOnChainEvents } from "../processors/index.js";

export const BackfillFidRegistration = registerJob({
  name: "BackfillFidRegistration",
  run: async ({ fid }: { fid: number }, { db, log, redis, hub }) => {
    const registrationEvents = getOnChainEventsByFidInBatchesOf(hub, {
      fid,
      // There is only 1 registration event per FID, but we might have to search
      // since hubs don't guarantee ordering of events returned
      pageSize: 3_000,
      eventTypes: [OnChainEventType.EVENT_TYPE_ID_REGISTER],
      idRegisterEventTypes: [IdRegisterEventType.REGISTER],
    });

    for await (const events of registrationEvents) {
      await processOnChainEvents(events, db, log, redis);
    }

    await redis.sadd("backfilled-registrations", fid);
  },
});
