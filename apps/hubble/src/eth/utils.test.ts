import { bytes32ToBytes } from '~/eth/utils';

describe('bytes32ToBytes', () => {
  const passingCases: [bigint, Uint8Array][] = [
    [
      BigInt('50839975223553296918063695500986414185067076564032165621192833738513116561408'),
      new Uint8Array([112, 102, 104]),
    ],
  ];

  for (const [input, output] of passingCases) {
    test(`converts BigNumber bytes32 to unpadded byte array: ${input.toString()}`, () => {
      expect(bytes32ToBytes(input)._unsafeUnwrap()).toEqual(output);
    });
  }
});
