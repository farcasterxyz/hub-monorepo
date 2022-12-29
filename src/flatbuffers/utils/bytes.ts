import { ByteBuffer } from 'flatbuffers';
import { err, ok } from 'neverthrow';
import { HubError, HubResult } from '~/utils/hubErrors';

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

export const toNumber = (bytesUint8Array: Uint8Array) => {
  return Buffer.from(bytesUint8Array).readUintLE(0, bytesUint8Array.length);
};

export const bigEndianBytesToNumber = (bytes: Uint8Array) => {
  return Buffer.from(bytes).readUIntBE(0, bytes.length);
};

/** Converts number to little endian byte array */
export const numberToLittleEndianBytes = (value: number, size?: number) => {
  if (value <= 0) {
    return err(new HubError('bad_request.invalid_param', 'value must be positive'));
  }

  if (typeof size === 'number' && size <= 0) {
    return err(new HubError('bad_request.invalid_param', 'size must be positive'));
  }

  const bytes = [];
  let bigIntValue = BigInt(value);

  while (bigIntValue !== 0n) {
    if (size && bytes.length >= size) {
      return err(new HubError('bad_request.invalid_param', 'value does not fit in size'));
    }
    bytes.push(Number(bigIntValue & 255n));
    bigIntValue >>= 8n;
  }

  while (size && bytes.length < size) {
    bytes.push(0);
  }

  return ok(new Uint8Array(bytes));
};

export const numberToBigEndianBytes = (value: number, size?: number): HubResult<Uint8Array> => {
  if (value <= 0) {
    return err(new HubError('bad_request.invalid_param', 'value must be positive'));
  }

  if (typeof size === 'number' && size <= 0) {
    return err(new HubError('bad_request.invalid_param', 'size must be positive'));
  }

  const bytes = [];
  let bigIntValue = BigInt(value);

  while (bigIntValue !== 0n) {
    if (size && bytes.length >= size) {
      return err(new HubError('bad_request.invalid_param', 'value does not fit in size'));
    }
    bytes.unshift(Number(bigIntValue & 255n));
    bigIntValue >>= 8n;
  }

  while (size && bytes.length < size) {
    bytes.unshift(0);
  }

  return ok(new Uint8Array(bytes));
};
