import { UserNameProof, bytesIncrement } from "@farcaster/hub-nodejs";
import { bytesCompare } from "@farcaster/core";

export const usernameProofCompare = (a: UserNameProof, b: UserNameProof): number => {
  // Compare timestamps (assumes name and proof type have already been checked by the caller)
  if (a.timestamp < b.timestamp) {
    return -1;
  } else if (a.timestamp > b.timestamp) {
    return 1;
  }

  // If timestamps match, order by signature bytes so we can deterministically choose the same proof everywhere
  return bytesCompare(a.signature, b.signature);
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
