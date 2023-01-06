import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { ResultAsync } from 'neverthrow';
import { HubAsyncResult, HubError } from '../errors';

/** Setup ed to hash synchronously */
ed.utils.sha512Sync = (...m) => sha512(ed.utils.concatBytes(...m));

export const getPublicKeySync = (privateKey: Uint8Array): Uint8Array => {
  return ed.sync.getPublicKey(privateKey);
};

export const getPublicKey = async (privateKey: Uint8Array): HubAsyncResult<Uint8Array> => {
  return ResultAsync.fromPromise(ed.getPublicKey(privateKey), (err) => new HubError('bad_request', err as Error));
};

export const signMessageHash = async (hash: Uint8Array, privateKey: Uint8Array): HubAsyncResult<Uint8Array> => {
  return ResultAsync.fromPromise(ed.sign(hash, privateKey), (err) => new HubError('bad_request', err as Error));
};

export const verifyMessageHashSignature = async (
  signature: Uint8Array,
  hash: Uint8Array,
  publicKey: Uint8Array
): HubAsyncResult<boolean> => {
  return ResultAsync.fromPromise(
    ed.verify(signature, hash, publicKey),
    (err) => new HubError('bad_request', err as Error)
  );
};
