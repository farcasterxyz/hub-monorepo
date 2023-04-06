import semver from 'semver';
import { getMinFarcasterVersion, ensureAboveMinFarcasterVersion } from '~/utils/versions';
import { ok } from 'neverthrow';

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
});
