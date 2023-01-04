import * as ed from '@noble/ed25519';
import { ResultAsync } from 'neverthrow';
import { HubAsyncResult, HubError } from '~/utils/hubErrors';

export const signMessageHash = async (hash: Uint8Array, privateKey: Uint8Array): HubAsyncResult<Uint8Array> => {
  return ResultAsync.fromPromise(ed.sign(hash, privateKey), (err) => new HubError('bad_request', err as Error));
};
