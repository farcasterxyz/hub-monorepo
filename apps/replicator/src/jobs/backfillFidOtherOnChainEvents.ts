import { IdRegisterEventType, OnChainEventType } from "@farcaster/hub-nodejs";
import { getOnChainEventsByFidInBatchesOf } from "../hub.js";
import { registerJob } from "../jobs.js";
import { storeChainEvent } from "../processors/onChainEvent.js";
import { executeTx } from "../db.js";

const MAX_PAGE_SIZE = 3_000;

export const BackfillFidOtherOnChainEvents = registerJob({
  name: "BackfillFidOtherOnChainEvents",
  run: async ({ fid }: { fid: number }, { db, redis, hub }) => {
    for await (const events of getOnChainEventsByFidInBatchesOf(hub, {
      fid,
      pageSize: MAX_PAGE_SIZE,
      eventTypes: [OnChainEventType.EVENT_TYPE_ID_REGISTER],
      idRegisterEventTypes: [
        // We've already processed REGISTER events by this point, so skip them
        IdRegisterEventType.TRANSFER,
        IdRegisterEventType.CHANGE_RECOVERY,
      ],
    })) {
      await executeTx(db, async (trx) => {
        for (const event of events) {
          await storeChainEvent(event, trx);
        }
      });
    }

    await redis.sadd("backfilled-other-onchain-events", fid);
  },
});
