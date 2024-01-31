import { FarcasterNetwork } from "./protobufs";
import { err, ok } from "neverthrow";
import { bytesToHexString } from "./bytes";
import { HubResult } from "./errors";
import { validateEthAddress, validateEthBlockHash } from "./validations";

export type VerificationAddressClaim = {
  fid: bigint;
  address: `0x${string}`;
  network: FarcasterNetwork;
  blockHash: `0x${string}`;
};

export type VerificationSolAddressClaim = {
  fid: bigint;
  // Solana addresses use base58 encoding and do not have a 0x prefix
  address: string;
  network: FarcasterNetwork;
  // Solana block hash is base58 encoded and does not have a 0x prefix
  blockHash: string;
};

export const makeVerificationEthAddressClaim = (
  fid: number,
  ethAddress: Uint8Array,
  network: FarcasterNetwork,
  blockHash: Uint8Array,
): HubResult<VerificationAddressClaim> => {
  const ethAddressHex = validateEthAddress(ethAddress).andThen((validatedEthAddress) =>
    bytesToHexString(validatedEthAddress),
  );
  if (ethAddressHex.isErr()) {
    return err(ethAddressHex.error);
  }

  const blockHashHex = validateEthBlockHash(blockHash).andThen((validatedBlockHash) =>
    bytesToHexString(validatedBlockHash),
  );
  if (blockHashHex.isErr()) {
    return err(blockHashHex.error);
  }

  return ok({
    fid: BigInt(fid),
    address: ethAddressHex.value,
    network: network,
    blockHash: blockHashHex.value,
  });
};

export const makeVerificationSolAddressClaim = (
  fid: number,
  solAddress: Uint8Array,
  network: FarcasterNetwork,
  blockHash: Uint8Array,
): HubResult<VerificationSolAddressClaim> => {
  const solAddressHex = validateEthAddress(solAddress).andThen((validatedEthAddress) =>
    bytesToHexString(validatedEthAddress),
  );
  if (solAddressHex.isErr()) {
    return err(solAddressHex.error);
  }

  const blockHashHex = validateEthBlockHash(blockHash).andThen((validatedBlockHash) =>
    bytesToHexString(validatedBlockHash),
  );
  if (blockHashHex.isErr()) {
    return err(blockHashHex.error);
  }

  return ok({
    fid: BigInt(fid),
    address: solAddressHex.value,
    network: network,
    blockHash: blockHashHex.value,
  });
};
