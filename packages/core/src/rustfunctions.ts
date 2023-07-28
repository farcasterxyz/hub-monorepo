import { bridgeBlake3Hash20, bridgeEd25519Verify } from "./addon/addon.js";

// Use this function in TypeScript to call the rust code.
export function nativeBlake3Hash20(data: Uint8Array): Uint8Array {
  return bridgeBlake3Hash20(data);
}

// Use this function in TypeScript to call the rust code.
export function nativeEd25519Verify(signature: Uint8Array, hash: Uint8Array, signer: Uint8Array): boolean {
  return bridgeEd25519Verify(signature, hash, signer);
}
