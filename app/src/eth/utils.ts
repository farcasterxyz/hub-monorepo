import { hexStringToBytes, HubResult, SizableBytesOptions } from '@hub/utils';
import { BigNumber } from 'ethers';

export const bytes32ToBytes = (value: BigNumber, options: SizableBytesOptions = {}): HubResult<Uint8Array> => {
  // Remove right padding
  let hex = value.toHexString();
  while (hex.substring(hex.length - 2) === '00') {
    hex = hex.substring(0, hex.length - 2);
  }

  return hexStringToBytes(hex, options);
};
