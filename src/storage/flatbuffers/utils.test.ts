import { bytesCompare, bytesIncrement } from '~/storage/flatbuffers/utils';

describe('bytesCompare', () => {
  test('returns order for two byte arrays', () => {
    const cases: [Uint8Array, Uint8Array, number][] = [
      [new Uint8Array([1]), new Uint8Array([2]), -1],
      [new Uint8Array([255, 1]), new Uint8Array([255, 2]), -1],
      [new Uint8Array([1, 1]), new Uint8Array([2]), 1],
      [new Uint8Array([0, 1]), new Uint8Array([2]), -1],
      [new Uint8Array(), new Uint8Array([1]), -1],
      [new Uint8Array(), new Uint8Array(), 0],
      [new Uint8Array([0, 0, 0, 1, 0]), new Uint8Array([0, 0, 0, 0, 1]), 1],
      [new Uint8Array([1, 0, 0, 1, 0]), new Uint8Array([1, 0, 0, 2, 0]), -1],
    ];
    for (const [a, b, result] of cases) {
      expect(bytesCompare(a, b)).toEqual(result);
    }
  });
});

describe('bytesIncrement', () => {
  test('increments byte array', () => {
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
      expect(bytesIncrement(input)).toEqual(output);
    }
  });
});
