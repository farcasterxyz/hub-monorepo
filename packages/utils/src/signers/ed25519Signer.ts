import { SignatureScheme } from '@farcaster/protobufs';
import { bytesToHexString } from '../bytes';
import { ed25519 } from '../crypto';
import { HubAsyncResult, HubResult } from '../errors';
import { Signer } from './signer';

export class Ed25519Signer implements Signer {
  /** Signature scheme as defined in protobufs */
  public readonly scheme = SignatureScheme.SIGNATURE_SCHEME_ED25519;

  /** 32-byte EdDSA public key */
  public readonly signerKey: Uint8Array;

  /** 32-byte EdDSA public key in hex format */
  public readonly signerKeyHex: string;

  private readonly _privateKey: Uint8Array;

  public static fromPrivateKey(privateKey: Uint8Array): HubResult<Ed25519Signer> {
    const signerKey = ed25519.getPublicKeySync(privateKey);
    return bytesToHexString(signerKey).map((signerKeyHex) => {
      return new this(privateKey, signerKey, signerKeyHex);
    });
  }

  constructor(privateKey: Uint8Array, signerKey: Uint8Array, signerKeyHex: string) {
    this._privateKey = privateKey;
    this.signerKey = signerKey;
    this.signerKeyHex = signerKeyHex;
  }

  /**
   * Generates a 256-bit signature using from EdDSA key pair.
   *
   * @example
   * ```typescript
   * import { Ed25519Signer } from '@farcaster/js';
   * import { randomBytes } from 'crypto';
   * import * as ed from '@noble/ed25519';
   *
   * const privateKeyBytes = ed.utils.randomPrivateKey();
   * const signer = new Ed25519Signer(privateKeyBytes);
   *
   * const messageBytes = randomBytes(32);
   * const messageHash = crypto.createHash('sha256').update(messageBytes).digest();
   *
   * const signature = await signer.signMessageHash(messageHash);
   *
   * console.log(signature._unsafeUnwrap());
   * ```
   *
   * @param {Uint8Array} hash - The 256-bit hash of the message to be signed.
   *
   * @returns {Promise<HubAsyncResult<Uint8Array>>} A HubAsyncResult containing the signature as a Uint8Array.
   *
   */
  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return ed25519.signMessageHash(hash, this._privateKey);
  }
}
