import { RateLimiterMemory } from "rate-limiter-flexible";
import {
  isRateLimitedByKey,
  getRateLimiterForTotalMessages,
  rateLimitByIp,
  rateLimitByKey,
  consumeRateLimitByKey,
} from "./rateLimits.js";
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
        expect(result._unsafeUnwrapErr().message).toEqual("Too many requests for testip");
      }
    }
  });

  test("don't rate limit local requests", async () => {
    for (let i = 0; i < 100; i++) {
      const result = await rateLimitByIp("127.0.0.1:3000", Limit10PerSecond);
      expect(result.isOk()).toBeTruthy();
    }
  });

  test("test rate limiting via consumeRateLimit/isRateLimited", async () => {
    // 10 Requests should be fine
    for (let i = 0; i < 10; i++) {
      expect(await isRateLimitedByKey("3000", Limit10PerSecond)).toBeFalsy();
      await consumeRateLimitByKey("3000", Limit10PerSecond);
    }

    // Sleep for 1 second to reset the rate limiter
    await sleep(1100);

    // 11th+ request should fail
    for (let i = 0; i < 20; i++) {
      if (i < 10) {
        expect(await isRateLimitedByKey("3000", Limit10PerSecond)).toBeFalsy();
        await consumeRateLimitByKey("3000", Limit10PerSecond);
      } else {
        expect(await isRateLimitedByKey("3000", Limit10PerSecond)).toBeTruthy();
      }
    }
  });

  test("test dynamic rate limiting", async () => {
    // 10 Requests should be fine for 1st set of messages
    const rateLimiter1 = getRateLimiterForTotalMessages(10, 1);
    const rateLimiter2 = getRateLimiterForTotalMessages(11, 1);

    for (let i = 0; i < 10; i++) {
      expect(await isRateLimitedByKey("3000", rateLimiter1)).toBeFalsy();
      const result1 = await rateLimitByKey("3000", rateLimiter1);
      expect(result1.isOk()).toBeTruthy();

      // same key, but different rate limiter should also be fine
      expect(await isRateLimitedByKey("3000", rateLimiter2)).toBeFalsy();
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
        expect(result1._unsafeUnwrapErr().message).toEqual("Too many requests for 3000");
      }

      // same key, but different rate limiter should pass till the 11th message
      const result2 = await rateLimitByKey("3000", rateLimiter2);
      if (i < 11) {
        expect(result2.isOk()).toBeTruthy();
      } else {
        expect(await isRateLimitedByKey("3000", rateLimiter2)).toBeTruthy();
        expect(result2._unsafeUnwrapErr().message).toEqual("Too many requests for 3000");
      }
    }
  });
});
