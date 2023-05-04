import { ed25519 as ed } from '@noble/curves/ed25519';

export const getPublicKey = (privateKey: Uint8Array): Uint8Array => {
  return ed.getPublicKey(privateKey);
};

export const signMessageHash = (hash: Uint8Array, privateKey: Uint8Array): Uint8Array => {
  return ed.sign(hash, privateKey);
};

export const verifyMessageHashSignature = (signature: Uint8Array, hash: Uint8Array, publicKey: Uint8Array): boolean => {
  return ed.verify(signature, hash, publicKey);
};
