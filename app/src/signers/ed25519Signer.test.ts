import { blake3 } from '@noble/hashes/blake3';
import { randomBytes } from 'ethers/lib/utils';
import Factories from '~/flatbuffers/factories';
import * as ed25519 from '~/flatbuffers/utils/ed25519';
import Ed25519Signer from './ed25519Signer';

describe('Ed25519Signer', () => {
  let signer: Ed25519Signer;
  const privateKey = Factories.Ed25519PrivateKey.build();

  beforeAll(async () => {
    signer = new Ed25519Signer(privateKey);
  });

  describe('static methods', () => {
    describe('constructor', () => {
      test('derives signer key', () => {
        expect(signer.signerKey).toEqual(ed25519.getPublicKeySync(privateKey));
      });
    });
  });

  describe('instanceMethods', () => {
    describe('signMessageHash', () => {
      test('generates valid signature', async () => {
        const bytes = randomBytes(32);
        const hash = blake3(bytes, { dkLen: 16 });
        const signature = await signer.signMessageHash(hash);
        const isValid = await ed25519.verifyMessageHashSignature(signature._unsafeUnwrap(), hash, signer.signerKey);
        expect(isValid._unsafeUnwrap()).toBe(true);
      });
    });
  });
});
