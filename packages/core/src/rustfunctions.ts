import { ed25519 } from "./crypto";
import { blake3 } from "@noble/hashes/blake3";

// Use this function in TypeScript to call the rust code.
export function nativeBlake3Hash20(data: Uint8Array): Uint8Array {
  return blake3.create({ dkLen: 20 }).update(data).digest();
}

// Use this function in TypeScript to call the rust code.
export async function nativeEd25519Verify(
  signature: Uint8Array,
  hash: Uint8Array,
  signer: Uint8Array,
): Promise<boolean> {
  return (await ed25519.verifyMessageHashSignature(signature, hash, signer)).unwrapOr(false);
}
