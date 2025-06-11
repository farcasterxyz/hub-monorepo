import { err, ok } from "neverthrow";
import { HubError, HubResult } from "./errors";

export const FARCASTER_EPOCH = 1609459200000; // January 1, 2021 UTC

/**
 * Get the current Farcaster time.
 * @returns seconds since the Farcaster Epoch
 */
export const getFarcasterTime = (): HubResult<number> => {
  return toFarcasterTime(Date.now());
};

/**
 * Converts from a Unix to Farcaster timestamp.
 * @param time unix milliseconds
 * @returns seconds since the Farcaster Epoch
 */
export const toFarcasterTime = (time: number): HubResult<number> => {
  if (time < FARCASTER_EPOCH) {
    return err(new HubError("bad_request.invalid_param", "time must be after Farcaster epoch (01/01/2021)"));
  }
  const secondsSinceEpoch = Math.round((time - FARCASTER_EPOCH) / 1000);
  if (secondsSinceEpoch > 2 ** 32 - 1) {
    return err(new HubError("bad_request.invalid_param", "time too far in future"));
  }
  return ok(secondsSinceEpoch);
};

/**
 * Converts from a Farcaster to Unix timestamp.
 * @param time seconds since the Farcaster Epoch
 * @returns unix milliseconds
 */
export const fromFarcasterTime = (time: number): HubResult<number> => {
  return ok(time * 1000 + FARCASTER_EPOCH);
};

// Chosen to keep number under Number.MAX_SAFE_INTEGER
const TIMESTAMP_BITS = 41;
const SEQUENCE_BITS = 12;

/** Extracts a unix timestamp (ms resolution) from an event ID.
 * @deprecated: Snapchain event ids use block numbers. Use the timestamp field in the event instead.
 * */
export const extractEventTimestamp = (eventId: number): number => {
  const binaryEventId = eventId.toString(2);
  const binaryTimestamp = binaryEventId.slice(0, binaryEventId.length - SEQUENCE_BITS);
  return parseInt(binaryTimestamp, 2) + FARCASTER_EPOCH;
};

/** Extracts a unix timestamp (ms resolution) from an hub event. */
export const extractTimestampFromEvent = (event: { timestamp: number }): number => {
  // Hub event timestamp is in seconds since the Farcaster epoch
  return event.timestamp * 1000 + FARCASTER_EPOCH;
};

/** Generates a hub event id from a unix timestamp (ms resolution) and an optional sequence number
 * @deprecated: Event ids are now based on block numbers. Do not use this function to generate event ids.
 * */
export const makeEventId = (timestamp: number, seq = 0): number => {
  const binaryTimestamp = (timestamp - FARCASTER_EPOCH).toString(2);
  let binarySeq = seq.toString(2);
  if (binarySeq.length) {
    while (binarySeq.length < SEQUENCE_BITS) {
      binarySeq = `0${binarySeq}`;
    }
  }

  return parseInt(binaryTimestamp + binarySeq, 2);
};
