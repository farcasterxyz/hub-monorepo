import { HubAsyncResult, HubError } from "@farcaster/hub-nodejs";
import { err, ok } from "neverthrow";
import { RateLimiterAbstract, RateLimiterMemory } from "rate-limiter-flexible";

// Number of submit messages (total) that can be merged per 60 seconds
export const SUBMIT_MESSAGE_RATE_LIMIT = {
  points: 20_000,
  duration: 60,
};

// We keep a map of rate limiters per total messages allowed, since each fid has a different limit
// The totalMessages are always num of storage units purchased * totalPruneSize limit, so there will
// be as many rate limiters as the number of distinct storage units purchased, which is a small number
const rateLimiters = new Map<number, RateLimiterMemory>();
export function getRateLimiterForTotalMessages(totalMessages: number, duration = 60 * 60 * 24): RateLimiterAbstract {
  if (rateLimiters.has(totalMessages)) {
    return rateLimiters.get(totalMessages) as RateLimiterAbstract;
  }

  const limiter = new RateLimiterMemory({
    points: totalMessages,
    duration,
  });
  rateLimiters.set(totalMessages, limiter);
  return limiter;
}

/** Rate limit by IP address */
export const rateLimitByIp = async (ip: string, limiter: RateLimiterAbstract): HubAsyncResult<boolean> => {
  // Get the IP part of the address
  const ipPart = ip.split(":")[0] ?? "";

  return rateLimitByKey(ipPart, limiter);
};

/** Rate limit by key for the limiter */
export const rateLimitByKey = async (fid: string, limiter: RateLimiterAbstract): HubAsyncResult<boolean> => {
  try {
    await limiter.consume(fid);
    return ok(true);
  } catch (e) {
    return err(new HubError("unavailable", "Too many requests"));
  }
};
