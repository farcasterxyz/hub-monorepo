import lib from "./index.node";

function nativeEd25519Verify(signature, hash, signer) {
  // NOTE: We should be able to pass the buffers directly, but it doesn't work with Node 20
  // for some reason. We'll work around to use base64 strings. Still much faster
  const sig_base64 = Buffer.from(signature).toString("base64");
  const hash_base64 = Buffer.from(hash).toString("base64");
  const signer_base64 = Buffer.from(signer).toString("base64");

  return lib.ed25519_verify(sig_base64, hash_base64, signer_base64) === 1;
}

module.exports = {
  nativeEd25519Verify,
};
