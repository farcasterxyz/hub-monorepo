import { RateLimiterMemory } from "rate-limiter-flexible";
import { getRateLimiterForTotalMessages, rateLimitByIp, rateLimitByKey } from "./rateLimits.js";
import { sleep } from "./crypto.js";

describe("test rate limits", () => {
  const Limit10PerSecond = new RateLimiterMemory({
    points: 10,
    duration: 1,
  });

  test("test rate limiting", async () => {
    // 10 Requests should be fine
    for (let i = 0; i < 10; i++) {
      const result = await rateLimitByIp("testip:3000", Limit10PerSecond);
      expect(result.isOk()).toBeTruthy();
    }

    // Sleep for 1 second to reset the rate limiter
    await sleep(1100);

    // 11th+ request should fail
    for (let i = 0; i < 20; i++) {
      const result = await rateLimitByIp("testip:3000", Limit10PerSecond);
      if (i < 10) {
        expect(result.isOk()).toBeTruthy();
      } else {
        expect(result._unsafeUnwrapErr().message).toEqual("Too many requests");
      }
    }
  });

  test("test dynamic rate limiting", async () => {
    // 10 Requests should be fine for 1st set of messages
    const rateLimiter1 = getRateLimiterForTotalMessages(10, 1);
    const rateLimiter2 = getRateLimiterForTotalMessages(11, 1);

    for (let i = 0; i < 10; i++) {
      const result1 = await rateLimitByKey("3000", rateLimiter1);
      expect(result1.isOk()).toBeTruthy();

      // same key, but different rate limiter should also be fine
      const result2 = await rateLimitByKey("3000", rateLimiter2);
      expect(result2.isOk()).toBeTruthy();
    }

    // Sleep for 1 second to reset the rate limiter
    await sleep(1100);

    // 11th+ request should fail
    for (let i = 0; i < 20; i++) {
      const result1 = await rateLimitByKey("3000", rateLimiter1);
      if (i < 10) {
        expect(result1.isOk()).toBeTruthy();
      } else {
        expect(result1._unsafeUnwrapErr().message).toEqual("Too many requests");
      }

      // same key, but different rate limiter should pass till the 11th message
      const result2 = await rateLimitByKey("3000", rateLimiter2);
      if (i < 11) {
        expect(result2.isOk()).toBeTruthy();
      } else {
        expect(result2._unsafeUnwrapErr().message).toEqual("Too many requests");
      }
    }
  });
});
