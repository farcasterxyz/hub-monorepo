import { err, ok } from "neverthrow";
import { HubError } from "./errors";
import { FARCASTER_EPOCH, farcasterTimeToDate, fromFarcasterTime, toFarcasterTime } from "./time";

describe("toFarcasterTime", () => {
  test("returns seconds since 01/01/2021", () => {
    const time = Date.now();
    const farcasterTime = toFarcasterTime(time)._unsafeUnwrap();
    expect(farcasterTime).toBeLessThan(2 ** 32 - 1); // uint32 max value
    expect(fromFarcasterTime(farcasterTime)).toEqual(ok(Math.round(time / 1000) * 1000));
  });

  test("fails for time before 01/01/2021", () => {
    expect(toFarcasterTime(FARCASTER_EPOCH - 1)).toEqual(
      err(new HubError("bad_request.invalid_param", "time must be after Farcaster epoch (01/01/2021)")),
    );
  });

  test("fails when farcaster time does not fit in uint32", () => {
    const time = (FARCASTER_EPOCH / 1000 + 2 ** 32) * 1000;
    expect(toFarcasterTime(time)).toEqual(err(new HubError("bad_request.invalid_param", "time too far in future")));
  });
});

describe("fromFarcasterTime", () => {
  test("returns ms since unix epoch", () => {
    const time = Date.now();
    const farcasterTime = toFarcasterTime(time)._unsafeUnwrap();
    const roundedTime = Math.round(time / 1000) * 1000;
    expect(fromFarcasterTime(farcasterTime)).toEqual(ok(roundedTime));
  });
});

describe("farcasterTimeToDate", () => {
  test("returns a Date object from Farcaster time", () => {
    const now = Date.now();
    const farcasterTime = toFarcasterTime(now)._unsafeUnwrap();
    const result = farcasterTimeToDate(farcasterTime)._unsafeUnwrap();

    expect(result).toBeInstanceOf(Date);
    // Should match within 1 second due to rounding
    expect(Math.abs(result.getTime() - now)).toBeLessThan(1000);
  });

  test("converts known Farcaster timestamp correctly", () => {
    // 0 seconds since Farcaster epoch = January 1, 2021 UTC
    const result = farcasterTimeToDate(0)._unsafeUnwrap();
    expect(result.toISOString()).toBe("2021-01-01T00:00:00.000Z");
  });

  test("handles roundtrip conversion", () => {
    const originalDate = new Date("2024-06-15T12:30:00.000Z");
    const farcasterTime = toFarcasterTime(originalDate.getTime())._unsafeUnwrap();
    const resultDate = farcasterTimeToDate(farcasterTime)._unsafeUnwrap();

    // Should match within 1 second due to rounding to seconds
    expect(Math.abs(resultDate.getTime() - originalDate.getTime())).toBeLessThan(1000);
  });
});
