import { HubError } from './errors';
import { FARCASTER_EPOCH, fromFarcasterTime, toFarcasterTime } from './time';

describe('fromFarcasterTime', () => {
  test('returns seconds since 01/01/2022', () => {
    const time = Date.now();
    const farcasterTime = toFarcasterTime(time);
    expect(farcasterTime).toBeLessThan(2 ** 32 - 1); // uint32 max value
    expect(fromFarcasterTime(farcasterTime)).toEqual(Math.round(time / 1000) * 1000);
  });

  test('fails for time before 01/01/2022', () => {
    expect(() => toFarcasterTime(FARCASTER_EPOCH - 1)).toThrow(HubError);
  });

  test('fails when farcaster time does not fit in uint32', () => {
    const time = (FARCASTER_EPOCH / 1000 + 2 ** 32) * 1000;
    expect(() => toFarcasterTime(time)).toThrow(HubError);
  });
});
