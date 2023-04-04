import semver from 'semver';
import { getMinFarcasterVersion, isBelowMinFarcasterVersion } from '~/utils/versions';
import { ok } from 'neverthrow';

describe('versions tests', () => {
  describe('isBelowMinFarcasterVersion', () => {
    test('returns false if version is equal to min version', () => {
      const minVersion = getMinFarcasterVersion();
      const result = isBelowMinFarcasterVersion(minVersion.value);
      expect(result).toEqual(ok(false));
    });

    test('returns false if version is greater than min version', () => {
      const minVersion = getMinFarcasterVersion();
      const higherVersion = semver.inc(minVersion.value, 'patch');
      const result = isBelowMinFarcasterVersion(higherVersion);
      expect(result).toEqual(ok(false));
    });

    test('returns true if version is below min version', () => {
      const theirVersion = '2023.1.1';
      const result = isBelowMinFarcasterVersion(theirVersion);
      expect(result).toEqual(ok(true));
    });
  });
});
