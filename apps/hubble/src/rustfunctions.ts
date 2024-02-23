// This is a bridge between the Rust code and the TS code.
// We import the Rust code as a NodeJS module, and then export it as a JS function.
// Note that we need to use the `createRequire` function to import the module, since it
// is binary code. If we used `import` instead, it would be interpreted as a JS module, and
// we would get an error becaues it would try to parse it as JS
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const lib = require("./addon/index.node");

import { HubError, HubErrorCode, validations } from "@farcaster/hub-nodejs";
import { PageOptions } from "./storage/stores/types.js";
import { UserMessagePostfix } from "storage/db/types.js";

export class RustDynStore {}
export class RustDb {}

// Type returned from Rust which is equivalent to the TypeScript type `MessagesPage`
export class RustMessagesPage {
  messageBytes?: Buffer[];
  nextPageToken?: Buffer;
}

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

export const rustErrorToHubError = (e: unknown) => {
  // Split the error string by "/", the first part is the error code, the second part is the error message
  const [errCode, errMsg] = (e as Error).message.split("/");
  return new HubError(errCode as HubErrorCode, errMsg ?? "");
};

/** Create or Open a DB at a give path */
export const createDb = (path: string): RustDb => {
  const db = lib.createDb(path);

  return db as RustDb;
};

export const dbClear = async (db: RustDb) => {
  return await lib.dbClear.call(db);
};

export const dbDestroy = async (db: RustDb) => {
  return await lib.dbDestroy.call(db);
};

/** Create a reaction Store */
export const createReactionStore = (db: RustDb): RustDynStore => {
  const store = lib.createReactionStore(db);
  // console.log("store is ", store);
  // console.log("merge is ", lib.merge);

  return store as RustDynStore;
};

export const getMessage = async (
  store: RustDynStore,
  fid: number,
  set: UserMessagePostfix,
  tsHash: Uint8Array,
): Promise<Buffer> => {
  return await lib.getMessage.call(store, fid, set, tsHash);
};

/** This is dynamically dispatched to any Store that you pass in */
export const merge = async (store: RustDynStore, messageBytes: Uint8Array): Promise<Buffer> => {
  return await lib.merge.call(store, messageBytes);
};

/** Revoke a message from the store */
export const revoke = async (store: RustDynStore, messageBytes: Uint8Array): Promise<Buffer> => {
  return await lib.revoke.call(store, messageBytes);
};

/** This is dynamically dispatched to any Store, and the messages will be returned from that store */

export const getAllMessagesByFid = async (
  store: RustDynStore,
  fid: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getAllMessagesByFid.call(store, fid, pageOptions);
};

export const getReactionAdd = async (
  store: RustDynStore,
  fid: number,
  type: number,
  targetCastIdBytes: Buffer,
  targetUrl: string,
): Promise<Buffer> => {
  return await lib.getReactionAdd.call(store, fid, type, targetCastIdBytes, targetUrl);
};

export const getReactionRemove = async (
  store: RustDynStore,
  fid: number,
  type: number,
  targetCastIdBytes: Buffer,
  targetUrl: string,
): Promise<Buffer> => {
  return await lib.getReactionRemove.call(store, fid, type, targetCastIdBytes, targetUrl);
};

export const getReactionAddsByFid = async (
  store: RustDynStore,
  fid: number,
  type: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getReactionAddsByFid.call(store, fid, type, pageOptions);
};

export const getReactionRemovesByFid = async (
  store: RustDynStore,
  fid: number,
  type: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getReactionRemovesByFid.call(store, fid, type, pageOptions);
};

export const getReactionsByTarget = async (
  store: RustDynStore,
  targetCastIdBytes: Buffer,
  targetUrl: string,
  type: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getReactionsByTarget.call(store, targetCastIdBytes, targetUrl, type, pageOptions);
};
