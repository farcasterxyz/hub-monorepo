/* eslint-disable @typescript-eslint/no-non-null-assertion */
import semver from 'semver';
import {
  getMinFarcasterVersion,
  ensureAboveMinFarcasterVersion,
  setReferenceDateForTest,
  ensureAboveTargetFarcasterVersion,
} from '../utils/versions.js';
import { ok } from 'neverthrow';
import { FARCASTER_VERSION, FARCASTER_VERSIONS_SCHEDULE } from '../hubble.js';

describe('versions tests', () => {
  describe('isBelowMinFarcasterVersion', () => {
    test('returns ok if version is equal to min version', () => {
      const minVersion = getMinFarcasterVersion();
      const result = ensureAboveMinFarcasterVersion(minVersion._unsafeUnwrap());
      expect(result).toEqual(ok(undefined));
    });

    test('returns ok if version is greater than min version', () => {
      const minVersion = getMinFarcasterVersion();
      const higherVersion = semver.inc(minVersion._unsafeUnwrap(), 'patch');
      const result = ensureAboveMinFarcasterVersion(higherVersion!);
      expect(result).toEqual(ok(undefined));
    });

    test('returns err if version is below min version', () => {
      const theirVersion = '2023.1.1';
      const result = ensureAboveMinFarcasterVersion(theirVersion);
      expect(result.isErr()).toBeTruthy();
      expect(result._unsafeUnwrapErr().message).toEqual('version too low');
    });

    test('returns err if version is empty', () => {
      const result = ensureAboveMinFarcasterVersion('');
      expect(result.isErr()).toBeTruthy();
      expect(result._unsafeUnwrapErr().message).toEqual('invalid version');
    });
  });

  describe('version is current', () => {
    // If this test fails, that means we haven't released a new version of hubble in a while and existing
    // versions will shut down in about a week. Create a new version to fix the test and release it so existing hubs can
    // update and keep running
    test('fails if current release is too close to expiry', async () => {
      const current = FARCASTER_VERSIONS_SCHEDULE.find((value) => value.version === FARCASTER_VERSION);
      expect(current).toBeTruthy();
      const seven_days_in_ms = 7 * 24 * 60 * 60 * 1000;
      expect(current!.expiresAt - Date.now()).toBeGreaterThan(seven_days_in_ms);
    });
  });

  describe('above target version', () => {
    test('fails if target version has not expired', async () => {
      const current = FARCASTER_VERSIONS_SCHEDULE.find((value) => value.version === FARCASTER_VERSION);
      expect(current).toBeTruthy();
      setReferenceDateForTest(0);
      const result = ensureAboveTargetFarcasterVersion(current!.version);
      expect(result.isErr()).toBeTruthy();
      expect(result._unsafeUnwrapErr().message).toEqual('target version has not expired');
    });

    test('returns if target version has expired', async () => {
      const current = FARCASTER_VERSIONS_SCHEDULE.find((value) => value.version === FARCASTER_VERSION);
      expect(current).toBeTruthy();
      setReferenceDateForTest(100000000000000000000000);
      const result = ensureAboveTargetFarcasterVersion(current!.version);
      expect(result).toEqual(ok(undefined));
    });
  });
});
