import { rsBlake3Hash20 } from "../rustfunctions.js";
import { blake3 } from "@noble/hashes/blake3";

export const SLEEPWHILE_TIMEOUT = 10 * 1000;
export const BLAKE3TRUNCATE160_EMPTY_HASH = Buffer.from(blake3(new Uint8Array(), { dkLen: 20 }));

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const sleepWhile = (condition: () => boolean | Promise<boolean>, timeoutMs: number): Promise<boolean> => {
  const stack = new Error().stack;
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const c = await condition();

      if (!c) {
        clearInterval(interval);
        resolve(false);
      }
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      reject(new Error(`Timeout in sleepWhile: ${stack}`));
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
  return rsBlake3Hash20(msg);
};
