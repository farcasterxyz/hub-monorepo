export type UserNameProofClaim = {
  /** Username being claimed **/
  name: string;

  /** Custody address claiming the username **/
  owner: `0x${string}`;

  /** Unix timestamp of proof in bigint representation **/
  timestamp: bigint;
};

export const makeUserNameProofClaim = ({
  name,
  owner,
  timestamp,
}: {
  /** Username being claimed **/
  name: string;
  /** Custody address claiming the username **/
  owner: `0x${string}`;
  /** Unix timestamp of proof **/
  timestamp: number;
}): UserNameProofClaim => {
  return {
    name,
    owner,
    timestamp: BigInt(timestamp),
  };
};
