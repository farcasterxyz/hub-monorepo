import { FarcasterNetwork } from '@farcaster/protobufs';
import { blake3 } from '@noble/hashes/blake3';
import { randomBytes } from 'ethers';
import { Wallet } from 'ethers5';
import { bytesToHexString } from '../bytes';
import { eip712 } from '../crypto';
import { Factories } from '../factories';
import { VerificationEthAddressClaim, makeVerificationEthAddressClaim } from '../verifications';
import { EthersV5Eip712Signer } from './ethersV5Eip712Signer';

describe('EthersV5Eip712Signer', () => {
  let signer: EthersV5Eip712Signer;
  let ethersSigner: Wallet;
  let signerKey: Uint8Array;

  beforeAll(async () => {
    ethersSigner = Wallet.createRandom();
    signer = new EthersV5Eip712Signer(ethersSigner);
    signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  });

  describe('instanceMethods', () => {
    describe('signMessageHash', () => {
      test('generates valid signature', async () => {
        const bytes = randomBytes(32);
        const hash = blake3(bytes, { dkLen: 20 });
        const signature = (await signer.signMessageHash(hash))._unsafeUnwrap();
        const recoveredAddress = (await eip712.verifyMessageHashSignature(hash, signature))._unsafeUnwrap();
        expect(recoveredAddress).toEqual(signerKey);
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
        signature = (await signer.signVerificationEthAddressClaim(claim))._unsafeUnwrap();
      });

      test('succeeds', async () => {
        expect(signature).toBeTruthy();
        const recoveredAddress = eip712.verifyVerificationEthAddressClaimSignature(claim, signature)._unsafeUnwrap();
        expect(recoveredAddress).toEqual(signerKey);
      });

      test('succeeds when encoding twice', async () => {
        const claim2: VerificationEthAddressClaim = { ...claim };
        const signature2 = (await signer.signVerificationEthAddressClaim(claim2))._unsafeUnwrap();
        expect(signature2).toEqual(signature);
        expect(bytesToHexString(signature2)).toEqual(bytesToHexString(signature));
      });
    });
  });
});
