import { RateLimiterMemory } from "rate-limiter-flexible";
import { rateLimitByIp } from "./rateLimits.js";
import { sleep } from "./crypto.js";

describe("test rate limits", () => {
  test("test rate limiting", async () => {
    const Limit10PerSecond = new RateLimiterMemory({
      points: 10,
      duration: 1,
    });

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
});
