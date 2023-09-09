import { UserNameProof, HubError, bytesIncrement } from "@farcaster/hub-nodejs";

export const usernameProofCompare = (a: UserNameProof, b: UserNameProof): number => {
  // Compare timestamps
  if (a.timestamp < b.timestamp) {
    return -1;
  } else if (a.timestamp > b.timestamp) {
    return 1;
  }

  throw new HubError("bad_request.validation_failure", "proofs have the same timestamp");
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
