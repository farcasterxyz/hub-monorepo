import { err, ok } from "neverthrow";
import { HubError } from "./errors";
import { FARCASTER_EPOCH, fromFarcasterTime, toFarcasterTime } from "./time";

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
