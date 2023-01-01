import { HubError } from '~/utils/hubErrors';

export const FARCASTER_EPOCH = 1640995200000; // January 1, 2022 UTC
export const getFarcasterTime = (): number => {
  return toFarcasterTime(Date.now());
};

export const toFarcasterTime = (time: number): number => {
  if (time < FARCASTER_EPOCH) {
    throw new HubError('bad_request.invalid_param', 'time must be after Farcaster epoch (01/01/2022)');
  }
  const secondsSinceEpoch = Math.round((time - FARCASTER_EPOCH) / 1000);
  if (secondsSinceEpoch > 2 ** 32 - 1) {
    throw new HubError('bad_request.invalid_param', 'time too far in future');
  }
  return secondsSinceEpoch;
};

export const fromFarcasterTime = (time: number): number => {
  return time * 1000 + FARCASTER_EPOCH;
};
