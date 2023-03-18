import * as protobufs from '@farcaster/protobufs';
import * as ed from '@noble/ed25519';
import { blake3 } from '@noble/hashes/blake3';
import { randomBytes } from 'ethers/lib/utils';
import { Factories } from '../factories';
import * as ed25519 from './ed25519';

let publicKey: Uint8Array;
let privateKey: Uint8Array;

beforeAll(async () => {
  privateKey = ed.utils.randomPrivateKey();
  publicKey = await ed.getPublicKey(privateKey);
});

describe('signMessageHash', () => {
  test('succeeds', async () => {
    const messageData = Factories.SignerAddData.build();
    const bytes = protobufs.MessageData.encode(messageData).finish();
    const hash = blake3(bytes, { dkLen: 20 });
    const signature = await ed25519.signMessageHash(hash, privateKey);
    const isValid = await ed.verify(signature, hash, publicKey);
    expect(isValid).toBe(true);
  });
});

describe('verifyMessageHashSignature', () => {
  test('succeeds with valid signature', async () => {
    const messageData = Factories.SignerAddData.build();
    const bytes = protobufs.MessageData.encode(messageData).finish();
    const hash = blake3(bytes, { dkLen: 20 });
    const signature = await ed25519.signMessageHash(hash, privateKey);
    const isValid = await ed25519.verifyMessageHashSignature(signature, hash, publicKey);
    expect(isValid).toBe(true);
  });

  test('fails with invalid signature', async () => {
    const messageData = Factories.SignerAddData.build();
    const bytes = protobufs.MessageData.encode(messageData).finish();
    const hash = blake3(bytes, { dkLen: 20 });
    expect(ed25519.verifyMessageHashSignature(randomBytes(32), hash, privateKey)).rejects.toThrow();
  });
});
