import { FarcasterNetwork } from '@hub/flatbuffers';
import { bytesToHexString, hexStringToBytes } from '@hub/utils';
import { blake3 } from '@noble/hashes/blake3';
import { BigNumber, ethers } from 'ethers';
import { randomBytes } from 'ethers/lib/utils';
import Factories from '~/flatbuffers/factories';
import { VerificationEthAddressClaim } from '~/flatbuffers/models/types';
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

    describe('signVerificationEthAddressClaim', () => {
      let claim: VerificationEthAddressClaim;
      let signature: Uint8Array;

      beforeAll(async () => {
        claim = {
          fid: BigNumber.from(Factories.FID.build()),
          address: signer.signerKeyHex,
          blockHash: Factories.BlockHash.build('', { transient: { case: 'mixed' } }),
          network: FarcasterNetwork.Testnet,
        };
        signature = (await signer.signVerificationEthAddressClaim(claim))._unsafeUnwrap();
      });

      test('succeeds', async () => {
        expect(signature).toBeTruthy();
        const recoveredAddress = eip712.verifyVerificationEthAddressClaimSignature(claim, signature);
        expect(recoveredAddress._unsafeUnwrap()).toEqual(signer.signerKey);
      });

      test('succeeds when encoding twice', async () => {
        const claim2: VerificationEthAddressClaim = { ...claim };
        const signature2 = await signer.signVerificationEthAddressClaim(claim2);
        expect(signature2._unsafeUnwrap()).toEqual(signature);
        expect(bytesToHexString(signature2._unsafeUnwrap())._unsafeUnwrap()).toEqual(
          bytesToHexString(signature)._unsafeUnwrap()
        );
      });
    });
  });
});
