import { SignatureScheme } from "../protobufs";
import { HubAsyncResult } from "../errors";

export interface Signer {
  readonly scheme: SignatureScheme;

  /**
   * Get the key in bytes used to idenitfy this signer.
   */
  getSignerKey(): HubAsyncResult<Uint8Array>;

  /**
   * Generates a 256-bit signature for a message hash and returns the bytes.
   */
  signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array>;
}
