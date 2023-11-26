import { getReactionsByFidInBatchesOf } from "../hub.js";
import { registerJob } from "../jobs.js";
import { mergeMessage } from "../processors/index.js";
import { executeTx } from "../db.js";

const MAX_PAGE_SIZE = 1_000;

export const BackfillFidReactions = registerJob({
  name: "BackfillFidReactions",
  run: async ({ fid }: { fid: number }, { db, log, redis, hub }) => {
    for await (const messages of getReactionsByFidInBatchesOf(hub, fid, MAX_PAGE_SIZE)) {
      for (const message of messages) {
        await executeTx(db, async (trx) => {
          await mergeMessage(message, trx, log, redis);
        });
      }
    }

    await redis.sadd("backfilled-reactions", fid);
  },
});
