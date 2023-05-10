import { blake3 } from '@noble/hashes/blake3';
import { randomBytes } from 'ethers';
import { Factories } from '../factories';
import { NobleEd25519Signer } from './nobleEd25519Signer';
import { ed25519 } from '@noble/curves/ed25519';

describe('NobleEd25519Signer', () => {
  const privateKey = Factories.Ed25519PrivateKey.build();
  const signer = new NobleEd25519Signer(privateKey);
  let signerKey: Uint8Array;

  beforeAll(async () => {
    signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  });

  describe('signMessageHash', () => {
    test('generates valid signature', async () => {
      const bytes = randomBytes(32);
      const hash = blake3(bytes, { dkLen: 20 });
      const signature = await signer.signMessageHash(hash);
      expect(signature.isOk()).toBeTruthy();
      const isValid = ed25519.verify(signature._unsafeUnwrap(), hash, signerKey);
      expect(isValid).toEqual(true);
    });
  });
});
