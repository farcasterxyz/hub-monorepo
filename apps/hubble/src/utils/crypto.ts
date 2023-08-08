import { nativeBlake3Hash20 } from "../rustfunctions.js";
import { blake3 } from "@noble/hashes/blake3";

export const BLAKE3TRUNCATE160_EMPTY_HASH = Buffer.from(blake3(new Uint8Array(), { dkLen: 20 }));

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const sleepWhile = (condition: () => boolean | Promise<boolean>, timeoutMs: number): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      if (!(await condition())) {
        clearInterval(interval);
        resolve(false);
      }
    }, 10);
    setTimeout(() => {
      clearInterval(interval);
      reject(true);
    }, timeoutMs);
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
  return nativeBlake3Hash20(msg);
};
