import { ok, err } from 'neverthrow';
import semver from 'semver';
import { HubError, HubResult } from '@farcaster/hub-nodejs';
import { FARCASTER_VERSIONS_SCHEDULE } from '~/hubble';

export type VersionSchedule = { version: string; expiresAt: number };

export const getMinFarcasterVersion = (): HubResult<string> => {
  const timestamp = Date.now();

  for (const { version, expiresAt } of FARCASTER_VERSIONS_SCHEDULE) {
    if (expiresAt > timestamp) {
      return ok(version);
    }
  }

  return err(new HubError('unavailable', 'no minimum Farcaster version available'));
};

export const isBelowMinFarcasterVersion = (version: string): HubResult<boolean> => {
  const minVersion = getMinFarcasterVersion();
  if (minVersion.isErr()) {
    return err(minVersion.error);
  }

  return ok(semver.lt(version, minVersion.value));
};
