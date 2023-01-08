import { FarcasterNetwork } from '@hub/flatbuffers';
import { BigNumber } from 'ethers';
import { err, ok } from 'neverthrow';
import { bytesToBigNumber, bytesToHexString } from './bytes';
import { HubResult } from './errors';

export type VerificationEthAddressClaim = {
  fid: BigNumber;
  address: string; // Hex string
  network: FarcasterNetwork;
  blockHash: string; // Hex string
};

export const makeVerificationEthAddressClaim = (
  fid: Uint8Array,
  ethAddress: Uint8Array,
  network: FarcasterNetwork,
  blockHash: Uint8Array
): HubResult<VerificationEthAddressClaim> => {
  const fidBigNumber = bytesToBigNumber(fid);
  if (fidBigNumber.isErr()) {
    return err(fidBigNumber.error);
  }

  const addressHex = bytesToHexString(ethAddress, { size: 40 });
  if (addressHex.isErr()) {
    return err(addressHex.error);
  }

  const blockHashHex = bytesToHexString(blockHash, { size: 64 });
  if (blockHashHex.isErr()) {
    return err(blockHashHex.error);
  }

  return ok({
    fid: fidBigNumber.value,
    address: addressHex.value,
    network: network,
    blockHash: blockHashHex.value,
  });
};
