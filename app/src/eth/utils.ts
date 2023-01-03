import { BigNumber } from 'ethers';
import { BytesOptions, bytesToHexString, hexStringToBytes, ToBytesOptions } from '~/flatbuffers/utils/bytes';
import { HubResult } from '~/utils/hubErrors';

export const bytes32ToBytes = (value: BigNumber, options: ToBytesOptions = {}): HubResult<Uint8Array> => {
  // Remove right padding
  let hex = value.toHexString();
  while (hex.substring(hex.length - 2) === '00') {
    hex = hex.substring(0, hex.length - 2);
  }

  return hexStringToBytes(hex, options);
};

export const bigNumberToBytes = (value: BigNumber, options: ToBytesOptions = {}): HubResult<Uint8Array> => {
  return hexStringToBytes(value._hex, options);
};

export const bytesToBigNumber = (bytes: Uint8Array, options: BytesOptions = {}): HubResult<BigNumber> => {
  return bytesToHexString(bytes, options).map((hexString) => BigNumber.from(hexString));
};
