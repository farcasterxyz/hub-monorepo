import { blake3 } from '@noble/hashes/blake3';

export const BLAKE3TRUNCATE160_EMPTY_HASH = Buffer.from(blake3(new Uint8Array(), { dkLen: 20 }));

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

/**
 * Compute Blake3-Truncate-160 digest.
 *
 * @param msg Message to digest. undefined is treated as empty message.
 * @return Blake3-Truncate-160 digest
 */
export const blake3Truncate160 = (msg: Uint8Array | undefined): Uint8Array => {
  if (msg === undefined || msg.length === 0) {
    return BLAKE3TRUNCATE160_EMPTY_HASH;
  }
  return blake3(msg, { dkLen: 20 });
};
