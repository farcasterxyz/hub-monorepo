import {
  IdRegistryEvent,
  NameRegistryEvent,
  UserNameProof,
  HubError,
  bytesCompare,
  bytesIncrement,
} from '@farcaster/hub-nodejs';

type Event = IdRegistryEvent | NameRegistryEvent;

// TODO: add NameRegistryEvent when it's exported from protobufs
/** Compares two events that happened on the blockchain based on block number/hash, log index */
export const eventCompare = (a: Event, b: Event): number => {
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

export const usernameProofCompare = (a: UserNameProof, b: UserNameProof): number => {
  // Compare timestamps
  if (a.timestamp < b.timestamp) {
    return -1;
  } else if (a.timestamp > b.timestamp) {
    return 1;
  }

  throw new HubError('bad_request.validation_failure', 'proofs have the same timestamp');
};

export const makeEndPrefix = (prefix: Buffer): Buffer | undefined => {
  const endPrefix = bytesIncrement(prefix);
  if (endPrefix.isErr()) {
    throw endPrefix.error;
  }

  if (endPrefix.value.length === prefix.length) {
    return Buffer.from(endPrefix.value);
  }

  return undefined;
};
