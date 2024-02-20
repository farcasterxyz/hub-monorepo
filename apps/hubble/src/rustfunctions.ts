// This is a bridge between the Rust code and the TS code.
// We import the Rust code as a NodeJS module, and then export it as a JS function.
// Note that we need to use the `createRequire` function to import the module, since it
// is binary code. If we used `import` instead, it would be interpreted as a JS module, and
// we would get an error becaues it would try to parse it as JS
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const lib = require("./addon/index.node");

import { validations } from "@farcaster/hub-nodejs";
import { PAGE_SIZE_MAX, PageOptions } from "./storage/stores/types.js";

// Use this function in TypeScript to call the rust code.
export function nativeBlake3Hash20(data: Uint8Array): Uint8Array {
  const dataBuf = Buffer.from(data);

  return new Uint8Array(lib.blake3_20(dataBuf));
}

export function nativeEd25519SignMessageHash(hash: Uint8Array, signerKey: Uint8Array): Uint8Array {
  const hashBuf = Buffer.from(hash);
  const signerKeyBuf = Buffer.from(signerKey);

  return lib.ed25519_signMessageHash(hashBuf, signerKeyBuf);
}

// Use this function in TypeScript to call the rust code.
export function nativeEd25519Verify(signature: Uint8Array, hash: Uint8Array, signer: Uint8Array): boolean {
  const sigBuf = Buffer.from(signature);
  const hashBuf = Buffer.from(hash);
  const signerBuf = Buffer.from(signer);

  return lib.ed25519_verify(sigBuf, hashBuf, signerBuf) === 1;
}

/** Fast, native implementation of validation methods to improve perf */
export const nativeValidationMethods: validations.ValidationMethods = {
  ed25519_verify: async (s: Uint8Array, m: Uint8Array, p: Uint8Array) => nativeEd25519Verify(s, m, p),
  ed25519_signMessageHash: async (m: Uint8Array, s: Uint8Array) => nativeEd25519SignMessageHash(m, s),
  blake3_20: (message: Uint8Array) => nativeBlake3Hash20(message),
};

/** Create a reaction Store */
export const createReactionStore = () => {
  const store = lib.createReactionStore();
  // console.log("store is ", store);
  // console.log("merge is ", lib.merge);

  return store;
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const db_clear = async (store: any) => {
  return await lib.db_clear.call(store);
};

/** This is dynamically dispatched to any Store that you pass in */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const merge = async (store: any, messageBytes: Uint8Array) => {
  return await lib.merge.call(store, messageBytes);
};

/** This is dynamically dispatched to any Store, and the messages will be returned from that store */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const getAllMessagesByFid = async (store: any, fid: number, pageOptions: PageOptions) => {
  return await lib.getAllMessagesByFid.call(
    store,
    fid,
    pageOptions.pageSize ?? PAGE_SIZE_MAX,
    pageOptions.pageToken ?? new Uint8Array(0),
    pageOptions.reverse ?? false,
  );
};
