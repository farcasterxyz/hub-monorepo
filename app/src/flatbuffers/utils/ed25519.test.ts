import * as ed from '@noble/ed25519';
import { blake3 } from '@noble/hashes/blake3';
import { randomBytes } from 'ethers/lib/utils';
import * as ed25519 from '~/flatbuffers/utils/ed25519';
import { generateEd25519KeyPair } from '~/utils/crypto';
import { HubError } from '~/utils/hubErrors';
import Factories from '../factories';
import { KeyPair } from '../models/types';

describe('getPublicKey', () => {
  let keyPair: KeyPair;

  beforeAll(async () => {
    keyPair = await generateEd25519KeyPair();
  });

  test('succeeds with valid signature', async () => {
    const publicKey = await ed25519.getPublicKey(keyPair.privateKey);
    expect(publicKey._unsafeUnwrap()).toEqual(keyPair.publicKey);
  });
});

describe('signMessageHash', () => {
  let keyPair: KeyPair;

  beforeAll(async () => {
    keyPair = await generateEd25519KeyPair();
  });

  test('succeeds', async () => {
    const messageData = await Factories.SignerAddData.create();
    const bytes = messageData.bb?.bytes() ?? new Uint8Array();
    const hash = blake3(bytes, { dkLen: 16 });
    const signature = await ed25519.signMessageHash(hash, keyPair.privateKey);
    const isValid = await ed.verify(signature._unsafeUnwrap(), hash, keyPair.publicKey);
    expect(isValid).toBe(true);
  });
});

describe('verifyMessageHashSignature', () => {
  let keyPair: KeyPair;

  beforeAll(async () => {
    keyPair = await generateEd25519KeyPair();
  });

  test('succeeds with valid signature', async () => {
    const messageData = await Factories.SignerAddData.create();
    const bytes = messageData.bb?.bytes() ?? new Uint8Array();
    const hash = blake3(bytes, { dkLen: 16 });
    const signature = await ed25519.signMessageHash(hash, keyPair.privateKey);
    const isValid = await ed25519.verifyMessageHashSignature(signature._unsafeUnwrap(), hash, keyPair.publicKey);
    expect(isValid._unsafeUnwrap()).toBe(true);
  });

  test('fails with invalid signature', async () => {
    const messageData = await Factories.SignerAddData.create();
    const bytes = messageData.bb?.bytes() ?? new Uint8Array();
    const hash = blake3(bytes, { dkLen: 16 });
    const isValid = await ed25519.verifyMessageHashSignature(randomBytes(32), hash, keyPair.privateKey);
    expect(isValid._unsafeUnwrapErr()).toBeInstanceOf(HubError);
  });
});
