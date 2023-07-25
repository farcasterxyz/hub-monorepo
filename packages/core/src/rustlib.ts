import ffi from "ffi-napi";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// When running in prod, this is the index.js file in the dist folder and when running jest tests
// this is the rustlib.ts file. So we'll need to figure out the correct path to the native lib
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let libPath = path.join(__dirname, "./release/libnativelib");
if (!fs.existsSync(libPath)) {
  libPath = path.join(__dirname, "../dist/release/libnativelib");
}

// rome-ignore lint/suspicious/noExplicitAny: <explanation>
let lib: any;

/** Verify ed25519 signature. */
export function ed25519Verify(signature: Uint8Array, hash: Uint8Array, signer: Uint8Array): boolean {
  if (lib === undefined) {
    // Specify the functions we want to use from the native lib
    // NOTE: The function names must match the ones in the native lib
    // [return type, [param1 type, param2 type, ...]]

    const stackTrace = new Error().stack;
    // console.debug("Loading native lib", stackTrace);
    lib = ffi.Library(libPath, {
      verify: ["int", ["string", "string", "string"]],
    });
    // console.debug("Native lib loaded");
  }

  // NOTE: We should be able to pass the buffers directly, but it doesn't work with Node 20
  // for some reason. We'll work around to use base64 strings. Still much faster
  const sig_base64 = Buffer.from(signature).toString("base64");
  const msg_base64 = Buffer.from(hash).toString("base64");
  const pubKey_base64 = Buffer.from(signer).toString("base64");

  //   console.debug("Calling native lib. mem =", process.memoryUsage().heapUsed / 1024 / 1024, "MB");
  const ans = lib.verify(sig_base64, msg_base64, pubKey_base64) === 1;
  //   console.debug("Native lib returned", ans);
  return ans;
}
