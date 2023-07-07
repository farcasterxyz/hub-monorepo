import { ok, err } from "neverthrow";
import semver from "semver";
import { HubError, HubResult } from "@farcaster/hub-nodejs";
import { FARCASTER_VERSIONS_SCHEDULE } from "../hubble.js";

export type VersionSchedule = { version: string; expiresAt: number };

let overrideDate: number | undefined = undefined;

// Helper method for tests which sets the date used for version checking
export const setReferenceDateForTest = (referenceDate: number | undefined) => {
  overrideDate = referenceDate;
};

export const getMinFarcasterVersion = (): HubResult<string> => {
  const timestamp = Date.now();

  for (const { version, expiresAt } of FARCASTER_VERSIONS_SCHEDULE) {
    if (expiresAt > timestamp) {
      return ok(version);
    }
  }

  return err(new HubError("unavailable", "no minimum Farcaster version available"));
};

export const ensureAboveMinFarcasterVersion = (version: string): HubResult<void> => {
  const minVersion = getMinFarcasterVersion();
  if (minVersion.isErr()) {
    return err(minVersion.error);
  }

  if (!semver.valid(version)) {
    return err(new HubError("bad_request.invalid_param", "invalid version"));
  }

  if (semver.lt(version, minVersion.value)) {
    return err(new HubError("bad_request.validation_failure", "version too low"));
  }
  return ok(undefined);
};

export const ensureAboveTargetFarcasterVersion = (targetVersion: string): HubResult<void> => {
  if (!semver.valid(targetVersion)) {
    return err(new HubError("bad_request.invalid_param", "invalid version"));
  }

  const referenceDate = overrideDate || Date.now();
  let targetVersionExpiresAt: number | undefined;
  for (const { version, expiresAt } of FARCASTER_VERSIONS_SCHEDULE) {
    if (version === targetVersion) {
      targetVersionExpiresAt = expiresAt;
      break;
    }
  }

  if (targetVersionExpiresAt === undefined) {
    return err(new HubError("bad_request.invalid_param", "invalid version"));
  }

  if (referenceDate < targetVersionExpiresAt) {
    return err(new HubError("bad_request.validation_failure", "target version has not expired"));
  }
  return ok(undefined);
};
