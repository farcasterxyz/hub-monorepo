import { FarcasterNetwork } from './protobufs';
import { err, ok } from 'neverthrow';
import { bytesToHexString } from './bytes';
import { HubResult } from './errors';
import { validateEthAddress, validateEthBlockHash } from './validations';

export type VerificationEthAddressClaim = {
  fid: bigint;
  address: `0x${string}`;
  network: FarcasterNetwork;
  blockHash: `0x${string}`;
};

export const makeVerificationEthAddressClaim = (
  fid: number,
  ethAddress: Uint8Array,
  network: FarcasterNetwork,
  blockHash: Uint8Array
): HubResult<VerificationEthAddressClaim> => {
  const ethAddressHex = validateEthAddress(ethAddress).andThen((validatedEthAddress) =>
    bytesToHexString(validatedEthAddress)
  );
  if (ethAddressHex.isErr()) {
    return err(ethAddressHex.error);
  }

  const blockHashHex = validateEthBlockHash(blockHash).andThen((validatedBlockHash) =>
    bytesToHexString(validatedBlockHash)
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
