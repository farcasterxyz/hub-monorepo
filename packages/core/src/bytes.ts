import { err, ok, Result } from "neverthrow";
import { bytesToHex, hexToBytes } from "viem";
import { HubError, HubResult } from "./errors";

export const bytesCompare = (a: Uint8Array, b: Uint8Array): number => {
  const aValue = a[0];
  const bValue = b[0];

  if (typeof aValue !== "number" && typeof bValue !== "number") {
    return 0;
  } else if (typeof aValue !== "number") {
    return -1;
  } else if (typeof bValue !== "number") {
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

export const bytesIncrement = (inputBytes: Uint8Array): HubResult<Uint8Array> => {
  const bytes = new Uint8Array(inputBytes); // avoid mutating input

  // Start from least significant byte
  let i = bytes.length - 1;
  while (i >= 0) {
    if ((bytes[i] as number) < 255) {
      bytes[i] = (bytes[i] as number) + 1;
      return ok(bytes);
    } else {
      bytes[i] = 0;
    }
    i = i - 1;
  }

  return ok(new Uint8Array([1, ...bytes]));
};

export const bytesDecrement = (inputBytes: Uint8Array): HubResult<Uint8Array> => {
  const bytes = new Uint8Array(inputBytes); // avoid mutating input

  // start from least significant byte
  let i = bytes.length - 1;
  while (i >= 0) {
    if ((bytes[i] as number) > 0) {
      bytes[i] = (bytes[i] as number) - 1;
      return ok(bytes);
    } else {
      if (i === 0) {
        return err(new HubError("bad_request.invalid_param", "Cannot decrement zero"));
      }

      bytes[i] = 255;
    }
    i = i - 1;
  }

  return ok(bytes);
};

export const bytesToHexString = (bytes: Uint8Array): HubResult<`0x${string}`> => {
  return Result.fromThrowable(
    (bytes: Uint8Array) => bytesToHex(bytes),
    (e) => new HubError("unknown", e as Error),
  )(bytes);
};

export const hexStringToBytes = (hex: string): HubResult<Uint8Array> => {
  return Result.fromThrowable(
    (hex: string) => hexToBytes(hex.startsWith("0x") ? (hex as `0x${string}`) : `0x${hex}`),
    (e) => new HubError("unknown", e as Error),
  )(hex);
};

export const bytesToUtf8String = (bytes: Uint8Array): HubResult<string> => {
  const decoder = new TextDecoder(undefined, { fatal: true });
  return ok(decoder.decode(bytes));
};

const encoder = new TextEncoder();
export const utf8StringToBytes = (utf8: string): HubResult<Uint8Array> => {
  return ok(encoder.encode(utf8));
};

export const bigIntToBytes = (value: bigint): HubResult<Uint8Array> => {
  let hexValue = value.toString(16);

  // Prefix odd-length hex values with a 0 since hexStringToBytes requires even-length hex values
  hexValue = hexValue.length % 2 === 0 ? hexValue : `0${hexValue}`;

  return hexStringToBytes(hexValue);
};

export const bytesToBigInt = (bytes: Uint8Array): HubResult<bigint> => {
  return bytesToHexString(bytes).map((hexString) => BigInt(hexString));
};

export const bytesStartsWith = (haystack: Uint8Array, needle: Uint8Array): boolean => {
  if (needle.length > haystack.length) {
    return false;
  }

  for (let i = 0; i < needle.length; i++) {
    if (haystack[i] !== needle[i]) {
      return false;
    }
  }

  return true;
};
