import { IdRegistryEvent } from '@farcaster/protobufs';
import { bytesCompare, HubError } from '@farcaster/protoutils';

// TODO: add NameRegistryEvent when it's exported from protobufs
/** Compares two events that happened on the blockchain based on block number/hash, log index */
export const eventCompare = (a: IdRegistryEvent, b: IdRegistryEvent): number => {
  // Compare blockNumber
  if (a.blockNumber < b.blockNumber) {
    return -1;
  } else if (a.blockNumber > b.blockNumber) {
    return 1;
  }

  // Cannot happen unless we do not filter out uncle blocks correctly upstream
  if (bytesCompare(a.blockHash, b.blockHash) !== 0) {
    throw new HubError('bad_request.validation_failure', 'block hash mismatch');
  }

  // Compare logIndex
  if (a.logIndex < b.logIndex) {
    return -1;
  } else if (a.logIndex > b.logIndex) {
    return 1;
  }

  // Cannot happen unless we pass in malformed data
  if (bytesCompare(a.transactionHash, b.transactionHash) !== 0) {
    throw new HubError('bad_request.validation_failure', 'tx hash mismatch');
  }

  return 0;
};
