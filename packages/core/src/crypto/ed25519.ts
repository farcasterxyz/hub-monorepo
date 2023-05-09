import { ed25519 } from '@noble/curves/ed25519';
import { Result } from 'neverthrow';
import { HubAsyncResult, HubError } from '../errors';

const safeGetPublicKey = Result.fromThrowable(ed25519.getPublicKey, (err) => new HubError('bad_request', err as Error));
const safeSign = Result.fromThrowable(ed25519.sign, (err) => new HubError('bad_request', err as Error));
const safeVerify = Result.fromThrowable(ed25519.verify, (err) => new HubError('bad_request', err as Error));

export const getPublicKey = async (privateKey: Uint8Array): HubAsyncResult<Uint8Array> => {
  return safeGetPublicKey(privateKey);
};

export const signMessageHash = async (hash: Uint8Array, privateKey: Uint8Array): HubAsyncResult<Uint8Array> => {
  return safeSign(hash, privateKey);
};

export const verifyMessageHashSignature = async (
  signature: Uint8Array,
  hash: Uint8Array,
  publicKey: Uint8Array
): HubAsyncResult<boolean> => {
  return safeVerify(signature, hash, publicKey);
};
