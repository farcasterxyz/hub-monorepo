import { BigNumber } from 'ethers';
import { bigNumberToBytes, bytes32ToBytes } from '~/eth/utils';

describe('bytes32ToBytes', () => {
  const passingCases: [BigNumber, Uint8Array][] = [
    [
      BigNumber.from('50839975223553296918063695500986414185067076564032165621192833738513116561408'),
      new Uint8Array([104, 102, 112]),
    ],
  ];

  for (const [input, output] of passingCases) {
    test(`converts BigNumber bytes32 to little endian byte array: ${input.toString()}`, () => {
      expect(bytes32ToBytes(input, { endianness: 'little' })._unsafeUnwrap()).toEqual(output);
    });
  }
});

describe('bigNumberToBytes', () => {
  describe('little endian', () => {
    const passingCases: [BigNumber, Uint8Array][] = [
      [BigNumber.from(1000), new Uint8Array([232, 3])],
      [BigNumber.from(`${Number.MAX_SAFE_INTEGER}`).add(BigNumber.from(1)), new Uint8Array([0, 0, 0, 0, 0, 0, 32])],
    ];

    for (const [input, output] of passingCases) {
      test(`converts BigNumber to little endian byte array: ${input?.toString()}`, () => {
        expect(bigNumberToBytes(input, { endianness: 'little' })._unsafeUnwrap()).toEqual(output);
      });
    }
  });
});
