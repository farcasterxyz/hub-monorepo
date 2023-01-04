import { hexStringToBytes } from '@hub/bytes';
import { blake3 } from '@noble/hashes/blake3';
import { ethers } from 'ethers';
import { randomBytes } from 'ethers/lib/utils';
import * as eip712 from '~/flatbuffers/utils/eip712';
import Eip712Signer from './eip712Signer';

describe('Eip712Signer', () => {
  let signer: Eip712Signer;
  let privateKey: Uint8Array;

  beforeAll(async () => {
    privateKey = randomBytes(32);
    signer = new Eip712Signer(privateKey);
  });

  describe('static methods', () => {
    describe('constructor', () => {
      test('derives signer key', () => {
        expect(signer.signerKey).toEqual(hexStringToBytes(ethers.utils.computeAddress(privateKey))._unsafeUnwrap());
      });
    });
  });

  describe('instanceMethods', () => {
    describe('signMessageHash', () => {
      test('generates valid signature', async () => {
        const bytes = randomBytes(32);
        const hash = blake3(bytes, { dkLen: 16 });
        const signature = await signer.signMessageHash(hash);
        const recoveredAddress = await eip712.verifyMessageHashSignature(hash, signature._unsafeUnwrap());
        expect(recoveredAddress._unsafeUnwrap()).toEqual(signer.signerKey);
      });
    });
  });
});
