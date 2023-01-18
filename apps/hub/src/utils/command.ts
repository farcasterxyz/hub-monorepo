import { FarcasterNetwork } from '@farcaster/flatbuffers';
import { HubError, validations } from '@farcaster/utils';

export const parseNetwork = (network: string): FarcasterNetwork => {
  const networkId = Number(network);
  if (isNaN(networkId)) throw new HubError('bad_request.invalid_param', 'network must be a number');
  const isValidNetwork = validations.validateNetwork(networkId);
  if (isValidNetwork.isErr()) {
    throw isValidNetwork.error;
  }
  return isValidNetwork.value;
};
