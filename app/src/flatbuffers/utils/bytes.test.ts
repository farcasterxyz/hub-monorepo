import {
  bytesCompare,
  bytesDecrement,
  bytesIncrement,
  numberToBigEndianBytes,
  numberToLittleEndianBytes,
} from '~/flatbuffers/utils/bytes';
import { HubError } from '~/utils/hubErrors';

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
    test(`returns byte-wise order for two byte arrays: ${a}, ${b}`, () => {
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

describe('bytesDecrement', () => {
  const passingCases: [Uint8Array, Uint8Array][] = [
    [new Uint8Array([1]), new Uint8Array([0])],
    [new Uint8Array([1, 2]), new Uint8Array([1, 1])],
    [new Uint8Array([1, 0]), new Uint8Array([0, 255])],
    [new Uint8Array([1, 0, 1, 0]), new Uint8Array([1, 0, 0, 255])],
    [new Uint8Array([0, 0, 2]), new Uint8Array([0, 0, 1])],
    [new Uint8Array([1, 0, 0, 0]), new Uint8Array([0, 255, 255, 255])],
  ];

  const failingCases: Uint8Array[] = [new Uint8Array([0]), new Uint8Array([0, 0])];

  for (const [input, output] of passingCases) {
    test(`decrements byte array: ${input}`, () => {
      expect(bytesDecrement(input)).toEqual(output);
    });
  }

  for (const input of failingCases) {
    test(`fails when decrementing byte array: ${input}`, () => {
      expect(() => bytesDecrement(input)).toThrow(HubError);
    });
  }
});

describe('numberToLittleEndianBytes', () => {
  describe('without size', () => {
    const passingCases: [number, Uint8Array][] = [
      [1, new Uint8Array([1])],
      [255, new Uint8Array([255])],
      [256, new Uint8Array([0, 1])],
      [257, new Uint8Array([1, 1])],
      [26_309_012, new Uint8Array([148, 113, 145, 1])],
      [1_672_260_013_391, new Uint8Array([79, 205, 118, 90, 133, 1])],
      [Number.MAX_SAFE_INTEGER, new Uint8Array([255, 255, 255, 255, 255, 255, 31])],
    ];

    for (const [input, output] of passingCases) {
      test(`converts number to little endian byte array: ${input}`, () => {
        expect(numberToLittleEndianBytes(input)._unsafeUnwrap()).toEqual(output);
      });
    }

    const failingCases: number[] = [-1, 0, -26_309_012];

    for (const input of failingCases) {
      test(`fails with number: ${input}`, () => {
        expect(numberToLittleEndianBytes(input)._unsafeUnwrapErr()).toBeInstanceOf(HubError);
      });
    }
  });

  describe('with size', () => {
    const passingCases: [number, number, Uint8Array][] = [
      [1, 4, new Uint8Array([1, 0, 0, 0])],
      [255, 1, new Uint8Array([255])],
      [256, 3, new Uint8Array([0, 1, 0])],
      [257, 2, new Uint8Array([1, 1])],
      [26_309_012, 6, new Uint8Array([148, 113, 145, 1, 0, 0])],
      [1_516_072_972, 6, new Uint8Array([12, 112, 93, 90, 0, 0])],
    ];

    for (const [input, size, output] of passingCases) {
      test(`converts number to fixed size little endian byte array: ${input}`, () => {
        expect(numberToLittleEndianBytes(input, size)._unsafeUnwrap()).toEqual(output);
      });
    }

    const failingCases: [number, number][] = [
      [1, 0],
      [256, 1],
      [257, 1],
      [26_309_012, 3],
    ];

    for (const [input, size] of failingCases) {
      test(`fails with number: ${input}`, () => {
        expect(numberToLittleEndianBytes(input, size)._unsafeUnwrapErr()).toBeInstanceOf(HubError);
      });
    }
  });
});

describe('numberToBigEndianBytes', () => {
  describe('without size', () => {
    const passingCases: [number, Uint8Array][] = [
      [1, new Uint8Array([1])],
      [255, new Uint8Array([255])],
      [256, new Uint8Array([1, 0])],
      [257, new Uint8Array([1, 1])],
      [26_309_012, new Uint8Array([1, 145, 113, 148])],
      [1_672_260_013_391, new Uint8Array([1, 133, 90, 118, 205, 79])],
      [Number.MAX_SAFE_INTEGER, new Uint8Array([31, 255, 255, 255, 255, 255, 255])],
    ];

    for (const [input, output] of passingCases) {
      test(`converts number to big endian byte array: ${input}`, () => {
        expect(numberToBigEndianBytes(input)._unsafeUnwrap()).toEqual(output);
      });
    }

    const failingCases: number[] = [-1, 0, -26_309_012];

    for (const input of failingCases) {
      test(`fails with number: ${input}`, () => {
        expect(numberToBigEndianBytes(input)._unsafeUnwrapErr()).toBeInstanceOf(HubError);
      });
    }
  });

  describe('with size', () => {
    const passingCases: [number, number, Uint8Array][] = [
      [1, 4, new Uint8Array([0, 0, 0, 1])],
      [255, 1, new Uint8Array([255])],
      [256, 3, new Uint8Array([0, 1, 0])],
      [257, 2, new Uint8Array([1, 1])],
      [26_309_012, 6, new Uint8Array([0, 0, 1, 145, 113, 148])],
      [1_516_072_972, 6, new Uint8Array([0, 0, 90, 93, 112, 12])],
    ];

    for (const [input, size, output] of passingCases) {
      test(`converts number to fixed size big endian byte array: ${input}`, () => {
        expect(numberToBigEndianBytes(input, size)._unsafeUnwrap()).toEqual(output);
      });
    }

    const failingCases: [number, number][] = [
      [1, 0],
      [256, 1],
      [257, 1],
      [26_309_012, 3],
    ];

    for (const [input, size] of failingCases) {
      test(`fails with number: ${input}`, () => {
        expect(numberToBigEndianBytes(input, size)._unsafeUnwrapErr()).toBeInstanceOf(HubError);
      });
    }
  });
});
