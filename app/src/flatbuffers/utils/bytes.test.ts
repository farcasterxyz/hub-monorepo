import {
  bytesCompare,
  bytesDecrement,
  bytesIncrement,
  bytesToHexString,
  bytesToNumber,
  bytesToUtf8String,
  hexStringToBytes,
  numberToBytes,
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

describe('hexStringToBytes', () => {
  describe('little endian', () => {
    const passingCases: [string, Uint8Array][] = [
      [
        '0xda107a1caf36d198b12c16c7b6a1d1c795978c42',
        new Uint8Array([66, 140, 151, 149, 199, 209, 161, 182, 199, 22, 44, 177, 152, 209, 54, 175, 28, 122, 16, 218]),
      ],
      ['0x3e8', new Uint8Array([232, 3])],
      ['3e8', new Uint8Array([232, 3])],
      ['0x03e8', new Uint8Array([232, 3])],
      ['0x003e8', new Uint8Array([232, 3])],
      ['0x0003e8', new Uint8Array([232, 3])],
      ['0x00000000000003e8', new Uint8Array([232, 3])],
      ['0x3e800', new Uint8Array([0, 232, 3])],
    ];

    for (const [input, output] of passingCases) {
      test(`converts hex string to little endian byte array: ${input}`, () => {
        expect(hexStringToBytes(input)._unsafeUnwrap()).toEqual(output);
      });
    }
  });

  describe('big endian', () => {
    const passingCases: [string, Uint8Array][] = [
      [
        '0xda107a1caf36d198b12c16c7b6a1d1c795978c42',
        new Uint8Array([218, 16, 122, 28, 175, 54, 209, 152, 177, 44, 22, 199, 182, 161, 209, 199, 149, 151, 140, 66]),
      ],
      ['0x3e8', new Uint8Array([3, 232])],
      ['3e8', new Uint8Array([3, 232])],
      ['0x03e8', new Uint8Array([3, 232])],
      ['0x003e8', new Uint8Array([3, 232])],
      ['0x0003e8', new Uint8Array([3, 232])],
      ['0x00000000000003e8', new Uint8Array([3, 232])],
      ['0x3e800', new Uint8Array([3, 232, 0])],
    ];

    for (const [input, output] of passingCases) {
      test(`converts hex string to big endian byte array: ${input}`, () => {
        expect(hexStringToBytes(input, { endianness: 'big' })._unsafeUnwrap()).toEqual(output);
      });
    }
  });
});

describe('bytesToHexString', () => {
  describe('little endian', () => {
    const passingCases: [Uint8Array, string][] = [
      [new Uint8Array([232, 3]), '0x03e8'],
      [new Uint8Array([232, 3, 0]), '0x03e8'],
      [new Uint8Array([0, 232, 3, 0]), '0x03e800'],
    ];

    for (const [input, output] of passingCases) {
      test(`converts little endian byte array to hex string: ${input}`, () => {
        expect(bytesToHexString(input)._unsafeUnwrap()).toEqual(output);
      });
    }
  });
});

describe('bytesToUtf8String', () => {
  describe('little endian', () => {
    const passingCases: [Uint8Array, string][] = [
      [new Uint8Array([104, 102, 112]), 'pfh'],
      // [new Uint8Array([104, 102, 112, 0, 0]), 'pfh'],
    ];

    for (const [input, output] of passingCases) {
      test(`converts little endian byte array to utf8 string: ${input}`, () => {
        expect(bytesToUtf8String(input)._unsafeUnwrap()).toEqual(output);
      });
    }
  });

  describe('big endian', () => {
    const passingCases: [Uint8Array, string][] = [[new Uint8Array([104, 102, 112]), 'hfp']];

    for (const [input, output] of passingCases) {
      test(`converts big endian byte array to utf8 string: ${input}`, () => {
        expect(bytesToUtf8String(input, { endianness: 'big' })._unsafeUnwrap()).toEqual(output);
      });
    }
  });
});

describe('bytesToNumber', () => {
  const passingCases: [Uint8Array, number][] = [[new Uint8Array([148, 113, 145, 1]), 26_309_012]];

  for (const [input, output] of passingCases) {
    test(`converts little endian byte array to number: ${input}`, () => {
      expect(bytesToNumber(input, { endianness: 'little' })._unsafeUnwrap()).toEqual(output);
    });
  }

  test('fails when number is larger than 48 bits', () => {
    const maxSafeInt = new Uint8Array([255, 255, 255, 255, 255, 255, 31]);
    expect(bytesToNumber(maxSafeInt)._unsafeUnwrapErr().errCode).toEqual('bad_request.invalid_param');
  });
});

describe('numberToBytes', () => {
  describe('little endian', () => {
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
          expect(numberToBytes(input, { endianness: 'little' })._unsafeUnwrap()).toEqual(output);
        });
      }

      const failingCases: number[] = [-1, 0, -26_309_012];

      for (const input of failingCases) {
        test(`fails with number: ${input}`, () => {
          expect(numberToBytes(input, { endianness: 'little' })._unsafeUnwrapErr()).toBeInstanceOf(HubError);
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
          expect(numberToBytes(input, { size, endianness: 'little' })._unsafeUnwrap()).toEqual(output);
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
          expect(numberToBytes(input, { size, endianness: 'little' })._unsafeUnwrapErr()).toBeInstanceOf(HubError);
        });
      }
    });
  });

  describe('big endian', () => {
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
          expect(numberToBytes(input, { endianness: 'big' })._unsafeUnwrap()).toEqual(output);
        });
      }

      const failingCases: number[] = [-1, 0, -26_309_012];

      for (const input of failingCases) {
        test(`fails with number: ${input}`, () => {
          expect(numberToBytes(input, { endianness: 'big' })._unsafeUnwrapErr()).toBeInstanceOf(HubError);
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
          expect(numberToBytes(input, { size, endianness: 'big' })._unsafeUnwrap()).toEqual(output);
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
          expect(numberToBytes(input, { size, endianness: 'big' })._unsafeUnwrapErr()).toBeInstanceOf(HubError);
        });
      }
    });
  });
});
