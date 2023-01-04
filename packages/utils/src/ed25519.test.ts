import * as ed from '@noble/ed25519';
import { blake3 } from '@noble/hashes/blake3';
import * as ed25519 from '~/flatbuffers/utils/ed25519';
import { generateEd25519KeyPair } from '~/utils/crypto';
import Factories from '../factories';
import { KeyPair } from '../models/types';

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
