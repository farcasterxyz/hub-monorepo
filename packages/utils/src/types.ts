import { FarcasterNetwork } from '@hub/flatbuffers';
import { BigNumber } from 'ethers';

export type VerificationEthAddressClaim = {
  fid: BigNumber;
  address: string; // Hex string
  network: FarcasterNetwork;
  blockHash: string; // Hex string
};
