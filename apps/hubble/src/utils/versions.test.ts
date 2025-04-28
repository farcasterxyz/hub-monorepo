import semver from "semver";
import {
  getMinFarcasterVersion,
  ensureAboveMinFarcasterVersion,
  setReferenceDateForTest,
  ensureAboveTargetFarcasterVersion,
} from "../utils/versions.js";
import { ok } from "neverthrow";
import { FARCASTER_VERSION, FARCASTER_VERSIONS_SCHEDULE } from "../hubble.js";

describe("versions tests", () => {
  describe("isBelowMinFarcasterVersion", () => {
    test("returns ok if version is equal to min version", () => {
      const minVersion = getMinFarcasterVersion();
      const result = ensureAboveMinFarcasterVersion(minVersion._unsafeUnwrap());
      expect(result).toEqual(ok(undefined));
    });

    test("returns ok if version is greater than min version", () => {
      const minVersion = getMinFarcasterVersion();
      const higherVersion = semver.inc(minVersion._unsafeUnwrap(), "patch");
      // biome-ignore lint/style/noNonNullAssertion: legacy code, avoid using ignore for new code
      const result = ensureAboveMinFarcasterVersion(higherVersion!);
      expect(result).toEqual(ok(undefined));
    });

    test("returns err if version is below min version", () => {
      const theirVersion = "2023.1.1";
      const result = ensureAboveMinFarcasterVersion(theirVersion);
      expect(result.isErr()).toBeTruthy();
      expect(result._unsafeUnwrapErr().message).toEqual("version too low");
    });

    test("returns err if version is empty", () => {
      const result = ensureAboveMinFarcasterVersion("");
      expect(result.isErr()).toBeTruthy();
      expect(result._unsafeUnwrapErr().message).toEqual("invalid version");
    });
  });

  describe("above target version", () => {
    test("fails if target version has not expired", async () => {
      const current = FARCASTER_VERSIONS_SCHEDULE.find((value) => value.version === FARCASTER_VERSION);
      expect(current).toBeTruthy();
      setReferenceDateForTest(0);
      // biome-ignore lint/style/noNonNullAssertion: legacy code, avoid using ignore for new code
      const result = ensureAboveTargetFarcasterVersion(current!.version);
      expect(result.isErr()).toBeTruthy();
      expect(result._unsafeUnwrapErr().message).toEqual("target version has not expired");
    });

    test("returns if target version has expired", async () => {
      const current = FARCASTER_VERSIONS_SCHEDULE.find((value) => value.version === FARCASTER_VERSION);
      expect(current).toBeTruthy();
      setReferenceDateForTest(100000000000000000000000);
      // biome-ignore lint/style/noNonNullAssertion: legacy code, avoid using ignore for new code
      const result = ensureAboveTargetFarcasterVersion(current!.version);
      expect(result).toEqual(ok(undefined));
    });
  });
});
