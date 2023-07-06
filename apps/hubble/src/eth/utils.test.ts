import { bytes32ToBytes, bytesToBytes32 } from "./utils.js";

const passingCases: [bigint, Uint8Array][] = [
  [
    BigInt("50839975223553296918063695500986414185067076564032165621192833738513116561408"),
    new Uint8Array([112, 102, 104]),
  ],
  [BigInt("0x7066680000000000000000000000000000000000000000000000000000000000"), new Uint8Array([112, 102, 104])],
];

describe("bytes32ToBytes", () => {
  for (const [input, output] of passingCases) {
    test(`converts BigInt bytes32 to unpadded byte array: ${input.toString()}`, () => {
      expect(bytes32ToBytes(input)._unsafeUnwrap()).toEqual(output);
    });
  }
});

describe("bytesToBytes32", () => {
  for (const [output, input] of passingCases) {
    test(`converts byte array to BigInt bytes32: ${input.toString()}`, () => {
      expect(bytesToBytes32(input)._unsafeUnwrap()).toEqual(output);
    });
  }
});
