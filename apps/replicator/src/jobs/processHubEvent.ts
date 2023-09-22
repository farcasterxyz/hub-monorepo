import { HubEvent } from "@farcaster/hub-nodejs";
import { registerJob } from "../jobs.js";
import { processHubEvent } from "../processors/index.js";

export const ProcessHubEvent = registerJob({
  name: "ProcessHubEvent",
  run: async ({ hubEventJsonStr }: { hubEventJsonStr: string }, { db, log, redis }) => {
    const hubEvent = HubEvent.fromJSON(JSON.parse(hubEventJsonStr));
    await processHubEvent(hubEvent, db, log, redis);
  },
});
