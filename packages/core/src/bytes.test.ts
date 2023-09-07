import { err, ok } from "neverthrow";
import {
  bigIntToBytes,
  bytesCompare,
  bytesDecrement,
  bytesIncrement,
  bytesStartsWith,
  bytesToHexString,
  bytesToUtf8String,
  hexStringToBytes,
  utf8StringToBytes,
} from "./bytes";
import { HubError } from "./errors";

describe("bytesCompare", () => {
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

describe("bytesIncrement", () => {
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
    test(`increments big endian byte array: ${input}`, () => {
      expect(bytesIncrement(input)).toEqual(ok(output));
    });
  }

  test("input byte array is not mutated", () => {
    const input = new Uint8Array([112, 102, 104]);
    const inputClone = new Uint8Array([112, 102, 104]);

    bytesIncrement(input);
    expect(bytesCompare(input, inputClone)).toBe(0);
  });
});

describe("bytesDecrement", () => {
  const passingCases: [Uint8Array, Uint8Array][] = [
    [new Uint8Array([1]), new Uint8Array([0])],
    [new Uint8Array([1, 2]), new Uint8Array([1, 1])],
    [new Uint8Array([1, 0]), new Uint8Array([0, 255])],
    [new Uint8Array([1, 0, 1, 0]), new Uint8Array([1, 0, 0, 255])],
    [new Uint8Array([0, 0, 2]), new Uint8Array([0, 0, 1])],
    [new Uint8Array([1, 0, 0, 0]), new Uint8Array([0, 255, 255, 255])],
  ];

  for (const [input, output] of passingCases) {
    test(`decrements byte array: ${input}`, () => {
      expect(bytesDecrement(input)).toEqual(ok(output));
    });
  }

  const failingCases: Uint8Array[] = [new Uint8Array([0]), new Uint8Array([0, 0])];

  for (const input of failingCases) {
    test(`fails when decrementing byte array: ${input}`, () => {
      expect(bytesDecrement(input)).toEqual(err(new HubError("bad_request.invalid_param", "Cannot decrement zero")));
    });
  }

  test("input byte array is not mutated", () => {
    const input = new Uint8Array([112, 102, 104]);
    const inputClone = new Uint8Array([112, 102, 104]);

    bytesDecrement(input);
    expect(bytesCompare(input, inputClone)).toBe(0);
  });
});

describe("hexStringToBytes", () => {
  const passingCases: [string, Uint8Array][] = [
    [
      "0xda107a1caf36d198b12c16c7b6a1d1c795978c42",
      new Uint8Array([218, 16, 122, 28, 175, 54, 209, 152, 177, 44, 22, 199, 182, 161, 209, 199, 149, 151, 140, 66]),
    ],
    ["0x03e8", new Uint8Array([3, 232])],
    ["03e8", new Uint8Array([3, 232])],
    ["0x0003e8", new Uint8Array([0, 3, 232])],
    ["0x00000000000003e8", new Uint8Array([0, 0, 0, 0, 0, 0, 3, 232])],
  ];

  for (const [input, output] of passingCases) {
    test(`converts hex string to byte array: ${input}`, () => {
      expect(hexStringToBytes(input)).toEqual(ok(output));
    });
  }

  const failingCases: string[] = [
    "0x003e8", // odd number of chars
  ];

  for (const input of failingCases) {
    test(`fails: ${input}`, () => {
      expect(hexStringToBytes(input).isErr).toBeTruthy();
    });
  }
});

describe("bytesToHexString", () => {
  const passingCases: [Uint8Array, string][] = [
    [new Uint8Array([232, 3]), "0xe803"],
    [new Uint8Array([232, 3, 0]), "0xe80300"],
    [new Uint8Array([0, 232, 3, 0]), "0x00e80300"],
  ];

  for (const [input, output] of passingCases) {
    test(`converts byte array to hex string: ${input}`, () => {
      expect(bytesToHexString(input)).toEqual(ok(output));
    });
  }

  test("input byte array is not mutated", () => {
    const input = new Uint8Array([112, 102, 104]);
    const inputClone = new Uint8Array([112, 102, 104]);

    bytesToHexString(input);
    expect(bytesCompare(input, inputClone)).toBe(0);
  });
});

describe("bytesToUtf8String", () => {
  const passingCases: [Uint8Array, string][] = [
    [new Uint8Array([104, 102, 112]), "hfp"],
    [new Uint8Array([112, 102, 104]), "pfh"],
    [new Uint8Array([0, 0, 0, 112, 102, 104]), "\0\0\0pfh"],
  ];

  for (const [input, output] of passingCases) {
    test(`converts byte array to utf8 string: ${input}`, () => {
      expect(bytesToUtf8String(input)).toEqual(ok(output));
    });
  }

  test("input byte array is not mutated", () => {
    const input = new Uint8Array([112, 102, 104]);
    const inputClone = new Uint8Array([112, 102, 104]);

    bytesToUtf8String(input);
    expect(bytesCompare(input, inputClone)).toBe(0);
  });
});

describe("utf8StringToBytes", () => {
  const passingCases: [string, Uint8Array][] = [
    ["pfh", new Uint8Array([112, 102, 104])],
    ["farcaster", new Uint8Array([102, 97, 114, 99, 97, 115, 116, 101, 114])],
    ["", new Uint8Array([])],
    [" ", new Uint8Array([32])],
    [" a", new Uint8Array([32, 97])],
  ];

  for (const [input, output] of passingCases) {
    test(`converts utf8 string to byte array: ${input}`, () => {
      expect(utf8StringToBytes(input)).toEqual(ok(output));
    });
  }
});

describe("bigIntToBytes", () => {
  const passingCases: [bigint, Uint8Array][] = [
    [BigInt(1000), new Uint8Array([3, 232])],
    [BigInt(`${Number.MAX_SAFE_INTEGER}`) + BigInt(1), new Uint8Array([32, 0, 0, 0, 0, 0, 0])],
  ];

  for (const [input, output] of passingCases) {
    test(`converts bigint to byte array: ${input?.toString()}`, () => {
      expect(bigIntToBytes(input)).toEqual(ok(output));
    });
  }
});

describe("bytesStartsWith", () => {
  const passingCases: [Uint8Array, Uint8Array, boolean][] = [
    [new Uint8Array([1, 2, 3]), new Uint8Array([]), true],
    [new Uint8Array([1, 2, 3]), new Uint8Array([1]), true],
    [new Uint8Array([1, 2, 3]), new Uint8Array([1, 2]), true],
    [new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]), true],
    [new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3, 4]), false],
    [new Uint8Array([1, 2, 3]), new Uint8Array([2]), false],
    [new Uint8Array([1, 2, 3]), new Uint8Array([2, 3]), false],
    [new Uint8Array([1, 2, 3]), new Uint8Array([3]), false],
  ];

  for (const [input, prefix, output] of passingCases) {
    test(`checks if byte array starts with prefix: ${input} ${prefix}`, () => {
      expect(bytesStartsWith(input, prefix)).toEqual(output);
    });
  }
});
