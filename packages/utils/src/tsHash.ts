import { err, ok } from 'neverthrow';
import { HubError, HubResult } from './errors';

/** Generate tsHash from timestamp and hash */
export const toTsHash = (timestamp: number, hash: Uint8Array): HubResult<Uint8Array> => {
  if (timestamp >= 2 ** 32) {
    return err(new HubError('bad_request.invalid_param', 'timestamp > 4 bytes'));
  }
  const buffer = new ArrayBuffer(4 + hash.length);
  const view = new DataView(buffer);

  // Store timestamp as big-endian in first 4 bytes
  view.setUint32(0, timestamp, false);

  // Iterate through little-endian hash, storing as big-endian in tsHash
  for (let i = 0; i < hash.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    view.setUint8(4 + i, hash[hash.length - 1 - i]!);
  }

  return ok(new Uint8Array(buffer));
};
