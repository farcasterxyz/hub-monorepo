import { getUserDataByFidInBatchesOf } from "../hub.js";
import { registerJob } from "../jobs.js";
import { mergeMessage } from "../processors/index.js";
import { executeTx } from "../db.js";

const MAX_PAGE_SIZE = 1_000;

export const BackfillFidUserData = registerJob({
  name: "BackfillFidUserData",
  run: async ({ fid }: { fid: number }, { db, log, redis, hub }) => {
    for await (const messages of getUserDataByFidInBatchesOf(hub, fid, MAX_PAGE_SIZE)) {
      for (const message of messages) {
        await executeTx(db, async (trx) => {
          await mergeMessage(message, trx, log, redis);
        });
      }
    }
    await redis.sadd("backfilled-userdata", fid);
  },
});
