import { HubError, HubResult } from '@hub/errors';
import { ByteBuffer } from 'flatbuffers';
import { err, ok, Result } from 'neverthrow';

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

// TOOD: support both big and little endian
/* eslint-disable security/detect-object-injection */
export const bytesIncrement = (bytes: Uint8Array): Uint8Array => {
  let i = bytes.length - 1;
  while (i >= 0) {
    if ((bytes[i] as number) < 255) {
      bytes[i] = (bytes[i] as number) + 1;
      return bytes;
    } else {
      bytes[i] = 0;
    }
    i = i - 1;
  }
  return new Uint8Array([1, ...bytes]);
};

// TODO: support both big and little endian
export const bytesDecrement = (bytes: Uint8Array): Uint8Array => {
  let i = bytes.length - 1;
  while (i >= 0) {
    if ((bytes[i] as number) > 0) {
      bytes[i] = (bytes[i] as number) - 1;
      return bytes;
    } else {
      if (i === 0) {
        throw new HubError('bad_request.invalid_param', 'Cannot decrement zero');
      }

      bytes[i] = 255;
    }
    i = i - 1;
  }

  return new Uint8Array([...bytes]);
};

export const toByteBuffer = (buffer: Buffer): ByteBuffer => {
  return new ByteBuffer(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length / Uint8Array.BYTES_PER_ELEMENT));
};

export const bytesToUtf8String = (bytes: Uint8Array, options: BytesOptions = {}): HubResult<string> => {
  const endianness: Endianness = options.endianness ?? 'little';
  const decoder = new TextDecoder();
  if (endianness === 'little') {
    while (bytes[bytes.length - 1] === 0) {
      bytes = bytes.subarray(0, bytes.length - 1);
    }

    bytes = bytes.reverse(); // reverse because TextDecoder takes big endian
  } else {
    while (bytes[0] === 0) {
      bytes = bytes.subarray(1);
    }
  }

  return ok(decoder.decode(bytes));
};

// TODO: support numbers up to Number.MAX_SAFE_INTEGER
export const bytesToNumber = (bytes: Uint8Array, options: BytesOptions = {}): HubResult<number> => {
  const endianness: Endianness = options.endianness ?? 'little';
  const safeReadUInt = Result.fromThrowable(
    (bytes: Uint8Array) => {
      if (endianness === 'little') {
        return Buffer.from(bytes).readUIntLE(0, bytes.length);
      } else {
        return Buffer.from(bytes).readUIntBE(0, bytes.length);
      }
    },
    (e) => new HubError('bad_request.invalid_param', e as Error)
  );
  return safeReadUInt(bytes);
};

export const bytesToHexString = (bytes: Uint8Array, options: SizableBytesOptions = {}): HubResult<string> => {
  const endianness = options.endianness ?? 'little';

  if (typeof options.size === 'number') {
    if (options.size <= 0) {
      return err(new HubError('bad_request.invalid_param', 'size must be positive'));
    }

    if (options.size % 2) {
      return err(new HubError('bad_request.invalid_param', 'size must be even'));
    }
  }

  let hex = '0x';

  if (endianness === 'little') {
    // Start at end
    let i = bytes.length - 1;

    // Skip padding
    while (bytes[i] === 0) {
      i--;
    }

    for (i; i >= 0; i--) {
      let hexChars = bytes[i]?.toString(16);
      if (hexChars?.length === 1) {
        hexChars = '0' + hexChars;
      }

      hex = hex + hexChars;

      // Check size minus 0x prefix
      if (typeof options.size === 'number' && hex.length - 2 > options.size) {
        return err(new HubError('bad_request.invalid_param', 'value does not fit in size'));
      }
    }
  } else {
    // Start at beginning
    let i = 0;

    // Skip padding
    while (bytes[i] === 0) {
      i++;
    }

    for (i; i < bytes.length; i++) {
      let hexChars = bytes[i]?.toString(16);
      if (hexChars?.length === 1) {
        hexChars = '0' + hexChars;
      }
      hex = hex + hexChars;

      // Check size minus 0x prefix
      if (typeof options.size === 'number' && hex.length - 2 > options.size) {
        return err(new HubError('bad_request.invalid_param', 'value does not fit in size'));
      }
    }
  }

  return ok(hex);
};

export const hexStringToBytes = (hex: string, options: SizableBytesOptions = {}): HubResult<Uint8Array> => {
  const endianness: Endianness = options.endianness ?? 'little';

  if (hex.substring(0, 2) === '0x') {
    hex = hex.substring(2);
  }

  // Pad hex string if length is odd
  if (hex.length % 2) {
    hex = '0' + hex;
  }

  const bytes = [];

  let i = 0;

  // Skip padding
  while (hex.substring(i, i + 2) === '00') {
    i += 2;
  }

  for (i; i < hex.length; i += 2) {
    const byte = parseInt(hex.substring(i, i + 2), 16);
    if (endianness === 'little') {
      bytes.unshift(byte);
    } else {
      bytes.push(byte);
    }
  }

  return ok(new Uint8Array(bytes));
};

export const utf8StringToBytes = (utf8: string, options: SizableBytesOptions = {}): HubResult<Uint8Array> => {
  const endianness: Endianness = options.endianness ?? 'little';

  const encoder = new TextEncoder();

  if (endianness === 'little') {
    return ok(encoder.encode(utf8).reverse());
  } else {
    return ok(encoder.encode(utf8));
  }
};

export const numberToBytes = (value: number, options: SizableBytesOptions = {}): HubResult<Uint8Array> => {
  return bigIntToBytes(BigInt(value), options);
};

export const bigIntToBytes = (value: bigint, options: SizableBytesOptions = {}): HubResult<Uint8Array> => {
  if (value <= 0n) {
    return err(new HubError('bad_request.invalid_param', 'value must be positive'));
  }

  if (typeof options.size === 'number' && options.size <= 0) {
    return err(new HubError('bad_request.invalid_param', 'size must be positive'));
  }

  const endianness: Endianness = options.endianness ?? 'little';

  const bytes = [];

  while (value !== 0n) {
    if (options.size && bytes.length >= options.size) {
      return err(new HubError('bad_request.invalid_param', 'value does not fit in size'));
    }
    const byte = Number(value & 255n);
    if (endianness === 'little') {
      bytes.push(byte);
    } else {
      bytes.unshift(byte);
    }

    value >>= 8n;
  }

  while (options.size && bytes.length < options.size) {
    if (endianness === 'little') {
      bytes.push(0);
    } else {
      bytes.unshift(0);
    }
  }

  return ok(new Uint8Array(bytes));
};
