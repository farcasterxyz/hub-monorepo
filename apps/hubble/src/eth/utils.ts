import { bytesToBigInt, hexStringToBytes, HubResult } from '@farcaster/hub-nodejs';

export const bytes32ToBytes = (value: bigint): HubResult<Uint8Array> => {
  // Remove right padding
  let hex = value.toString(16);
  while (hex.substring(hex.length - 2) === '00') {
    hex = hex.substring(0, hex.length - 2);
  }

  return hexStringToBytes(hex);
};

export const bytesToBytes32 = (value: Uint8Array): HubResult<bigint> => {
  const bytes = new Uint8Array(32);
  bytes.set(value, 0);
  return bytesToBigInt(bytes);
};
