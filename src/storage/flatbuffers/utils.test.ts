import {
  bytesCompare,
  bytesIncrement,
  FARCASTER_EPOCH,
  fromFarcasterTime,
  toFarcasterTime,
} from '~/storage/flatbuffers/utils';
import { BadRequestError } from '~/utils/errors';

describe('bytesCompare', () => {
  const cases: [Uint8Array, Uint8Array, number][] = [
    [new Uint8Array([1]), new Uint8Array([2]), -1],
    [new Uint8Array([255, 1]), new Uint8Array([255, 2]), -1],
    [new Uint8Array([1, 1]), new Uint8Array([2]), -1],
    [new Uint8Array([0, 1]), new Uint8Array([2]), -1],
    [new Uint8Array(), new Uint8Array([1]), -1],
    [new Uint8Array(), new Uint8Array(), 0],
    [new Uint8Array([0, 0, 0, 1, 0]), new Uint8Array([0, 0, 0, 0, 1]), 1],
    [new Uint8Array([1, 0, 0, 1, 0]), new Uint8Array([1, 0, 0, 2, 0]), -1],
  ];
  for (const [a, b, result] of cases) {
    test(`returns bytewise order for two byte arrays: ${a}, ${b}`, () => {
      expect(bytesCompare(a, b)).toEqual(result);
    });
  }
});

describe('bytesIncrement', () => {
  const cases: [Uint8Array, Uint8Array][] = [
    [new Uint8Array([1]), new Uint8Array([2])],
    [new Uint8Array([1, 1]), new Uint8Array([1, 2])],
    [new Uint8Array([0]), new Uint8Array([1])],
    [new Uint8Array([255]), new Uint8Array([1, 0])],
    [new Uint8Array([254]), new Uint8Array([255])],
    [new Uint8Array([1, 0, 0, 255]), new Uint8Array([1, 0, 1, 0])],
    [new Uint8Array([255, 255, 255]), new Uint8Array([1, 0, 0, 0])],
    [new Uint8Array([0, 0, 1]), new Uint8Array([0, 0, 2])],
  ];

  for (const [input, output] of cases) {
    test(`increments byte array: ${input}`, () => {
      expect(bytesIncrement(input)).toEqual(output);
    });
  }
});

describe('fromFarcasterTime', () => {
  test('returns seconds since 01/01/2022', () => {
    const time = Date.now();
    const farcasterTime = toFarcasterTime(time);
    expect(farcasterTime).toBeLessThan(2 ** 32 - 1); // uint32 max value
    expect(fromFarcasterTime(farcasterTime)).toEqual(Math.round(time / 1000) * 1000);
  });

  test('fails for time before 01/01/2022', () => {
    expect(() => toFarcasterTime(FARCASTER_EPOCH - 1)).toThrow(BadRequestError);
  });

  test('fails when farcaster time does not fit in uint32', () => {
    const time = (FARCASTER_EPOCH / 1000 + 2 ** 32) * 1000;
    expect(() => toFarcasterTime(time)).toThrow(BadRequestError);
  });
});
