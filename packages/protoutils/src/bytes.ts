import { utils } from '@noble/ed25519';
import { BigNumber } from 'ethers';
import { err, ok, Result } from 'neverthrow';
import { HubError, HubResult } from './errors';

export const DEFAULT_ENDIANNESS: Endianness = 'little';

export type Endianness = 'little' | 'big';
export type BytesOptions = {
  endianness?: Endianness; // Endianness of byte array
};
export type SizableBytesOptions = BytesOptions & {
  size?: number; // Size of byte array
};

// TODO: support both big and little endian
export const bytesCompare = (a: Uint8Array, b: Uint8Array): number => {
  const aValue = a[0];
  const bValue = b[0];

  if (typeof aValue !== 'number' && typeof bValue !== 'number') {
    return 0;
  } else if (typeof aValue !== 'number') {
    return -1;
  } else if (typeof bValue !== 'number') {
    return 1;
  }

  if (aValue < bValue) {
    return -1;
  } else if (aValue > bValue) {
    return 1;
  } else {
    return bytesCompare(a.subarray(1), b.subarray(1));
  }
};

// TODO: should return HubResult
/* eslint-disable security/detect-object-injection */
export const bytesIncrement = (inputBytes: Uint8Array, options: BytesOptions = {}): Uint8Array => {
  const bytes = new Uint8Array(inputBytes); // avoid mutating input

  const endianness: Endianness = options.endianness ?? 'little';

  // Start from least significant byte
  let i = bytes.length - 1;
  while (i >= 0) {
    const pos = endianness === 'little' ? bytes.length - 1 - i : i;
    if ((bytes[pos] as number) < 255) {
      bytes[pos] = (bytes[pos] as number) + 1;
      return bytes;
    } else {
      bytes[pos] = 0;
    }
    i = i - 1;
  }

  if (endianness === 'little') {
    return new Uint8Array([...bytes, 1]);
  } else {
    return new Uint8Array([1, ...bytes]);
  }
};

export const bytesDecrement = (inputBytes: Uint8Array, options: BytesOptions = {}): HubResult<Uint8Array> => {
  const bytes = new Uint8Array(inputBytes); // avoid mutating input

  const endianness: Endianness = options.endianness ?? 'little';

  // start from least significant byte
  let i = bytes.length - 1;
  while (i >= 0) {
    const pos = endianness === 'little' ? bytes.length - 1 - i : i;
    if ((bytes[pos] as number) > 0) {
      bytes[pos] = (bytes[pos] as number) - 1;
      return ok(bytes);
    } else {
      if (i === 0) {
        return err(new HubError('bad_request.invalid_param', 'Cannot decrement zero'));
      }

      bytes[pos] = 255;
    }
    i = i - 1;
  }

  return ok(bytes);
};

export const bytesToHexString = (bytes: Uint8Array): HubResult<string> => {
  return Result.fromThrowable(
    (bytes: Uint8Array) => '0x' + utils.bytesToHex(bytes),
    (e) => new HubError('unknown', e as Error)
  )(bytes);
};

export const hexStringToBytes = (hex: string): HubResult<Uint8Array> => {
  return Result.fromThrowable(
    (hex: string) => utils.hexToBytes(hex.substring(0, 2) === '0x' ? hex.substring(2) : hex),
    (e) => new HubError('unknown', e as Error)
  )(hex);
};

export const bytesToUtf8String = (bytes: Uint8Array): HubResult<string> => {
  const decoder = new TextDecoder(undefined, { fatal: true });
  return ok(decoder.decode(bytes));
};

export const utf8StringToBytes = (utf8: string): HubResult<Uint8Array> => {
  const encoder = new TextEncoder();
  return ok(encoder.encode(utf8));
};

export const bigNumberToBytes = (value: BigNumber): HubResult<Uint8Array> => {
  return hexStringToBytes(value._hex);
};

export const bytesToBigNumber = (bytes: Uint8Array): HubResult<BigNumber> => {
  return bytesToHexString(bytes).map((hexString) => BigNumber.from(hexString));
};
