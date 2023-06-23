import { blake3 } from '@noble/hashes/blake3';
import { ok } from 'neverthrow';
import { bytesToHexString } from '../bytes';
import { eip712 } from '../crypto';
import { Factories } from '../factories';
import { FarcasterNetwork } from '../protobufs';
import { makeVerificationEthAddressClaim, VerificationEthAddressClaim } from '../verifications';
import { Eip712Signer } from './eip712Signer';
import { UserNameProofClaim } from '../crypto/eip712';
import { bytesToHex } from 'viem';

export const testEip712Signer = async (signer: Eip712Signer) => {
  let signerKey: Uint8Array;

  beforeAll(async () => {
    signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  });

  describe('signMessageHash', () => {
    test('generates valid signature', async () => {
      const bytes = Factories.Bytes.build({}, { transient: { length: 32 } });
      const hash = blake3(bytes, { dkLen: 20 });
      const signature = await signer.signMessageHash(hash);
      expect(signature.isOk()).toBeTruthy();
      const valid = await eip712.verifyMessageHashSignature(hash, signature._unsafeUnwrap(), signerKey);
      expect(valid).toEqual(ok(true));
    });
  });

  describe('signVerificationEthAddressClaim', () => {
    let claim: VerificationEthAddressClaim;
    let signature: Uint8Array;

    beforeAll(async () => {
      claim = makeVerificationEthAddressClaim(
        Factories.Fid.build(),
        signerKey,
        FarcasterNetwork.TESTNET,
        Factories.BlockHash.build()
      )._unsafeUnwrap();
      const signatureResult = await signer.signVerificationEthAddressClaim(claim);
      expect(signatureResult.isOk()).toBeTruthy();
      signature = signatureResult._unsafeUnwrap();
    });

    test('succeeds', async () => {
      const valid = await eip712.verifyVerificationEthAddressClaimSignature(claim, signature, signerKey);
      expect(valid).toEqual(ok(true));
    });

    test('succeeds when encoding twice', async () => {
      const claim2: VerificationEthAddressClaim = { ...claim };
      const signature2 = await signer.signVerificationEthAddressClaim(claim2);
      expect(signature2).toEqual(ok(signature));
      expect(bytesToHexString(signature2._unsafeUnwrap())).toEqual(bytesToHexString(signature));
    });
  });

  describe('signUserNameProof', () => {
    let claim: UserNameProofClaim;
    let signature: Uint8Array;

    beforeAll(async () => {
      claim = {
        name: '0x000',
        timestamp: Date.now(),
        owner: bytesToHex(signerKey),
      };
      const signatureResult = await signer.signUserNameProof(claim);
      expect(signatureResult.isOk()).toBeTruthy();
      signature = signatureResult._unsafeUnwrap();
    });

    test('succeeds', async () => {
      const valid = await eip712.verifyUserNameProof(claim, signature, signerKey);
      expect(valid).toEqual(ok(true));
    });

    test('succeeds when encoding twice', async () => {
      const claim2: UserNameProofClaim = { ...claim };
      const signature2 = await signer.signUserNameProof(claim2);
      expect(signature2).toEqual(ok(signature));
      expect(bytesToHexString(signature2._unsafeUnwrap())).toEqual(bytesToHexString(signature));
    });
  });
};
