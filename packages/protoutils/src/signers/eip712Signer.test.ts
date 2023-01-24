import { FarcasterNetwork } from '@farcaster/protobufs';
import { blake3 } from '@noble/hashes/blake3';
import { BigNumber, ethers } from 'ethers';
import { randomBytes } from 'ethers/lib/utils';
import { bytesToHexString, hexStringToBytes } from '../bytes';
import { eip712 } from '../crypto';
import { Factories } from '../factories';
import { VerificationEthAddressClaim } from '../verifications';
import { Eip712Signer, TypedDataSigner } from './eip712Signer';

describe('Eip712Signer', () => {
  let signer: Eip712Signer;
  let typedDataSigner: TypedDataSigner;
  let ethAddress: string;

  beforeAll(async () => {
    typedDataSigner = new ethers.Wallet(ethers.utils.randomBytes(32));
    ethAddress = await typedDataSigner.getAddress();
    signer = Eip712Signer.fromSigner(typedDataSigner, ethAddress)._unsafeUnwrap();
  });

  describe('static methods', () => {
    describe('constructor', () => {
      test('derives signer key', () => {
        expect(signer.signerKey).toEqual(hexStringToBytes(ethAddress)._unsafeUnwrap());
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
          fid: BigNumber.from(Factories.Fid.build()),
          address: signer.signerKeyHex,
          blockHash: Factories.BlockHashHex.build(undefined, { transient: { case: 'mixed' } }),
          network: FarcasterNetwork.FARCASTER_NETWORK_TESTNET,
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
