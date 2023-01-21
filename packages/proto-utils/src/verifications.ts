import { FarcasterNetwork } from '@farcaster/protobufs';
import { utils } from '@noble/ed25519';
import { BigNumber } from 'ethers';
import { err, ok } from 'neverthrow';
import { HubResult } from './errors';
import { validateBlockHashHex, validateEthAddressHex } from './validations';

export type VerificationEthAddressClaim = {
  fid: BigNumber;
  address: string; // Hex string
  network: FarcasterNetwork;
  blockHash: string; // Hex string
};

export const makeVerificationEthAddressClaim = (
  fid: number,
  ethAddress: Uint8Array,
  network: FarcasterNetwork,
  blockHash: Uint8Array
): HubResult<VerificationEthAddressClaim> => {
  // TODO: wrap in throwable
  const ethAddressHex = utils.bytesToHex(ethAddress);
  const isValidEthAddress = validateEthAddressHex(ethAddressHex);
  if (isValidEthAddress.isErr()) {
    return err(isValidEthAddress.error);
  }

  // TODO: wrap in throwable
  const blockHashHex = utils.bytesToHex(blockHash);
  const isValidBlockHash = validateBlockHashHex(blockHashHex);
  if (isValidBlockHash.isErr()) {
    return err(isValidBlockHash.error);
  }

  return ok({
    fid: BigNumber.from(fid),
    address: ethAddressHex,
    network: network,
    blockHash: blockHashHex,
  });
};
