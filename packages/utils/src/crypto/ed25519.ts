import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';

/** Setup ed to hash synchronously */
ed.utils.sha512Sync = (...m) => sha512(ed.utils.concatBytes(...m));

export const getPublicKeySync = (privateKey: Uint8Array): Uint8Array => {
  return ed.sync.getPublicKey(privateKey);
};

export const signMessageHash = async (hash: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> => {
  return ed.sign(hash, privateKey);
};

export const verifyMessageHashSignature = async (
  signature: Uint8Array,
  hash: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> => {
  return ed.verify(signature, hash, publicKey);
};
