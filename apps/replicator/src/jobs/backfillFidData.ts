import { OnChainEvent, OnChainEventType } from "@farcaster/hub-nodejs";
import { getOnChainEventsByFidInBatchesOf } from "../hub.js";
import { registerJob } from "../jobs.js";
import { processOnChainEvents } from "../processors/index.js";
import { BackfillFidCasts } from "./backfillFidCasts.js";
import { BackfillFidVerifications } from "./backfillFidVerifications.js";
import { BackfillFidLinks } from "./backfillFidLinks.js";
import { BackfillFidUserNameProofs } from "./backfillFidUserNameProofs.js";
import { BackfillFidOtherOnChainEvents } from "./backfillFidOtherOnChainEvents.js";
import { BackfillFidReactions } from "./backfillFidReactions.js";
import { BackfillFidStorageAllocations } from "./backfillFidStorageAllocations.js";

const MAX_PAGE_SIZE = 1_000;

export const BackfillFidData = registerJob({
  name: "BackfillFidData",
  run: async ({ fid }: { fid: number }, { db, log, redis, hub }) => {
    const alreadyBackfilledSigners = await redis.sismember("backfilled-signers", fid);
    if (!alreadyBackfilledSigners) {
      let signerEvents: OnChainEvent[] = [];
      for await (const events of getOnChainEventsByFidInBatchesOf(hub, {
        fid,
        pageSize: MAX_PAGE_SIZE,
        eventTypes: [OnChainEventType.EVENT_TYPE_SIGNER],
      })) {
        signerEvents = signerEvents.concat(...events);
      }

      // Since there could be many events, ensure we process them in sorted order
      const sortedEventsForFid = signerEvents.sort((a, b) =>
        a.blockNumber === b.blockNumber ? a.logIndex - b.logIndex : a.blockNumber - b.blockNumber,
      );
      await processOnChainEvents(sortedEventsForFid, db, log, redis);
      await redis.sadd("backfilled-signers", fid);
    }

    // Now that this FID's signers are backfilled, we can start backfilling some message types
    if (!(await redis.sismember("backfilled-casts", fid))) {
      await BackfillFidCasts.enqueue({ fid });
    }
    if (!(await redis.sismember("backfilled-links", fid))) {
      await BackfillFidLinks.enqueue({ fid });
    }
    if (!(await redis.sismember("backfilled-reactions", fid))) {
      await BackfillFidReactions.enqueue({ fid });
    }
    if (!(await redis.sismember("backfilled-verifications", fid))) {
      await BackfillFidVerifications.enqueue({ fid });
    }
    if (!(await redis.sismember("backfilled-username-proofs", fid))) {
      await BackfillFidUserNameProofs.enqueue({ fid });
    }
    if (!(await redis.sismember("backfilled-storage-allocations", fid))) {
      await BackfillFidStorageAllocations.enqueue({ fid });
    }
    if (!(await redis.sismember("backfilled-other-onchain-events", fid))) {
      await BackfillFidOtherOnChainEvents.enqueue({ fid });
    }
  },
});
