// This is a bridge between the Rust code and the TS code.
// Note that this file is in JS, not TS, because it needs to load the
// Rust library, which is compiled into a cdylib, and we don't want the
// TS compiler to try to reinterpret the "import lib from './index.node';"
// line as a TS import or as a ESM import.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const lib = require("./index.node");

// JS function, so no types
export function bridgeEd25519Verify(signature: Uint8Array, hash: Uint8Array, signer: Uint8Array) {
  const sigBuf = Buffer.from(signature);
  const hashBuf = Buffer.from(hash);
  const signerBuf = Buffer.from(signer);

  return lib.ed25519_verify(sigBuf, hashBuf, signerBuf) === 1;
}

// JS function, so no types
export function bridgeBlake3Hash20(data: Uint8Array) {
  const dataBuf = Buffer.from(data);

  return new Uint8Array(lib.blake3_20(dataBuf));
}
