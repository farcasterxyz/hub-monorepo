// This is a bridge between the Rust code and the TS code.
// Note that this file is in JS, not TS, because it needs to load the 
// Rust library, which is compiled into a cdylib, and we don't want the 
// TS compiler to try to reinterpret the "import lib from './index.node';" 
// line as a TS import or as a ESM import.

import lib from "./index.node";

// JS function, so no types
function bridgeEd25519Verify(signature, hash, signer) {
  const sigBuf = Buffer.from(signature);
  const hashBuf = Buffer.from(hash);
  const signerBuf = Buffer.from(signer);

  return lib.ed25519_verify(sigBuf, hashBuf, signerBuf) === 1;
}

// JS function, so no types
function bridgeBlake3Hash20(data) {
  const dataBuf = Buffer.from(data);

  return new Uint8Array(lib.blake3_20(dataBuf));
}

// Use the module.exports syntax
module.exports = {
  bridgeEd25519Verify,
  bridgeBlake3Hash20,
};
