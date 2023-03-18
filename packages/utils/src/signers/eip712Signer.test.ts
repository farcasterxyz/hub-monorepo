import { FarcasterNetwork } from '@farcaster/protobufs';
import { blake3 } from '@noble/hashes/blake3';
import { Signer as EthersSigner, Wallet, randomBytes } from 'ethers';
import { bytesToHexString, hexStringToBytes } from '../bytes';
import { eip712 } from '../crypto';
import { Factories } from '../factories';
import { VerificationEthAddressClaim, makeVerificationEthAddressClaim } from '../verifications';
import { Eip712Signer } from './eip712Signer';

describe('Eip712Signer', () => {
  let signer: Eip712Signer;
  let ethersSigner: EthersSigner;
  let ethAddress: string;

  beforeAll(async () => {
    ethersSigner = Wallet.createRandom();
    ethAddress = await ethersSigner.getAddress();
    signer = (await Eip712Signer.fromSigner(ethersSigner))._unsafeUnwrap();
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
        const hash = blake3(bytes, { dkLen: 20 });
        const signature = await signer.signMessageHash(hash);
        const recoveredAddress = await eip712.verifyMessageHashSignature(hash, signature._unsafeUnwrap());
        expect(recoveredAddress._unsafeUnwrap()).toEqual(signer.signerKey);
      });
    });

    describe('signVerificationEthAddressClaim', () => {
      let claim: VerificationEthAddressClaim;
      let signature: Uint8Array;

      beforeAll(async () => {
        claim = makeVerificationEthAddressClaim(
          Factories.Fid.build(),
          signer.signerKey,
          FarcasterNetwork.TESTNET,
          Factories.BlockHash.build()
        )._unsafeUnwrap();
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
