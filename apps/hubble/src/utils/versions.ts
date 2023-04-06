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

export const ensureAboveMinFarcasterVersion = (version: string): HubResult<void> => {
  const minVersion = getMinFarcasterVersion();
  if (minVersion.isErr()) {
    return err(minVersion.error);
  }

  if (!semver.valid(version)) {
    return err(new HubError('bad_request.invalid_param', 'invalid version'));
  }

  if (semver.lt(version, minVersion.value)) {
    return err(new HubError('bad_request.validation_failure', 'version too low'));
  }
  return ok(undefined);
};
