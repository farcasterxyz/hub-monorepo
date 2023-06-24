import { blake3 } from '@noble/hashes/blake3';
import { ok } from 'neverthrow';
import { bytesToHexString } from '../bytes';
import { eip712 } from '../crypto';
import { Factories } from '../factories';
import { FarcasterNetwork } from '../protobufs';
import { makeVerificationEthAddressClaim, VerificationEthAddressClaim } from '../verifications';
import { Eip712Signer } from './eip712Signer';

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
      const recoveredAddress = eip712.verifyMessageHashSignature(hash, signature._unsafeUnwrap());
      expect(recoveredAddress).toEqual(ok(signerKey));
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
      const recoveredAddress = eip712.verifyVerificationEthAddressClaimSignature(claim, signature);
      expect(recoveredAddress).toEqual(ok(signerKey));
    });

    test('succeeds when encoding twice', async () => {
      const claim2: VerificationEthAddressClaim = { ...claim };
      const signature2 = await signer.signVerificationEthAddressClaim(claim2);
      expect(signature2).toEqual(ok(signature));
      expect(bytesToHexString(signature2._unsafeUnwrap())).toEqual(bytesToHexString(signature));
    });
  });
};
