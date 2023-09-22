import { Message } from "@farcaster/hub-nodejs";
import { executeTx } from "../db.js";
import { registerJob } from "../jobs.js";
import { mergeMessage } from "../processors/index.js";

export const MergeMessage = registerJob({
  name: "MergeMessage",
  run: async ({ messageJsonStr }: { messageJsonStr: string }, { db, log, redis }) => {
    const message = Message.fromJSON(JSON.parse(messageJsonStr));
    await executeTx(db, async (trx) => {
      await mergeMessage(message, trx, log, redis);
    });
  },
});
