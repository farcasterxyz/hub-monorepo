import {
  Ed25519Signer as BaseEd25519Signer,
  Eip712Signer as BaseEip712Signer,
  HubAsyncResult,
  HubResult,
  TypedDataSigner,
  VerificationEthAddressClaim,
  bytesToHexString,
  ed25519,
  hexStringToBytes,
} from '@farcaster/utils';
import { err } from 'neverthrow';

export class Eip712Signer extends BaseEip712Signer {
  /**
   * Creates an instance of Eip712Signer from a TypedDataSigner and an Ethereum address.
   *
   * @param {TypedDataSigner} typedDataSigner - The TypedDataSigner instance to use for signing.
   * @param {string} address - The Ethereum address associated with the signer.
   *
   * @returns {HubResult<Eip712Signer>} A HubResult that resolves to an Eip712Signer instance on success, or
   * a failure with an error message on error.
   *
   * @example
   * ```typescript
   * import { Eip712Signer } from '@farcaster/js';
   * import { ethers } from 'ethers';
   *
   * const custodyWallet = ethers.Wallet.fromMnemonic('your mnemonic here apple orange banana');
   * const eip712Signer = Eip712Signer.fromSigner(custodyWallet, custodyWallet.address)._unsafeUnwrap();
   * ```
   */
  public static override fromSigner(typedDataSigner: TypedDataSigner, address: string): HubResult<Eip712Signer> {
    const signerKeyHex = address.toLowerCase();
    return hexStringToBytes(signerKeyHex).map((signerKey) => new this(typedDataSigner, address, signerKey));
  }

  /**
   * Generates a 256-bit hex signature from an Ethereum address.
   *
   * @param {string} hash - The 256-bit hash of the message to be signed.
   *
   * @returns {Promise<HubAsyncResult<string>>} A HubAsyncResult containing the 256-bit signature as a hex string.
   *
   * @example
   * ```typescript
   * import { Eip712Signer, types } from '@farcaster/js';
   * import { ethers, utils } from 'ethers';
   *
   * const custodyWallet = ethers.Wallet.fromMnemonic('your mnemonic here apple orange banana');
   * const eip712Signer = Eip712Signer.fromSigner(custodyWallet, custodyWallet.address)._unsafeUnwrap();
   *
   * const message = 'Hello World';
   * const messageHash = ethers.utils.keccak256(utils.toUtf8Bytes(message));
   * const messageHashResultHex = await eip712Signer.signMessageHashHex(messageHash);
   *
   * console.log(messageHashResultHex._unsafeUnwrap());
   *
   * // Output: "0xa620471a24cd101b99b7f69efcd9fe2437715924b..."
   * ```
   */
  async signMessageHashHex(hash: string): HubAsyncResult<string> {
    const hashBytes = hexStringToBytes(hash);
    if (hashBytes.isErr()) {
      return err(hashBytes.error);
    }

    const signatureBytes = await this.signMessageHash(hashBytes.value);

    return signatureBytes.andThen((bytes) => bytesToHexString(bytes));
  }

  /**
   * TODO description
   *
   * @param {Object} claim - The body of the claim to be signed as an object
   * @param {number} claim.fid - The fid of the claim.
   * @param {string} claim.address - The Ethereum address to be verified.
   * @param {types.FarcasterNetwork} claim.network - The network to be used for verification.
   * @param {string} claim.blockHash - The block hash to be used for verification.
   *
   * @returns {Promise<HubAsyncResult<Uint8Array>>} A HubAsyncResult containing the 256-bit signature as a Uint8Array.
   *
   * @example
   * ```typescript
   * import { Eip712Signer, types } from '@farcaster/js';
   * import { ethers, utils } from 'ethers';
   *
   * const custodyWallet = ethers.Wallet.fromMnemonic('your mnemonic here apple orange banana');
   * const eip712Signer = Eip712Signer.fromSigner(custodyWallet, custodyWallet.address)._unsafeUnwrap();
   *
   * const claimBody = {
   *   fid: -1,
   *   address: eip712Signer.signerKeyHex,
   *   network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
   *   blockHash: '2c87468704d6b0f4c46f480dc54251de50753af02e5d63702f85bde3da4f7a3d',
   * };
   *
   * const verificationResult = await eip712Signer.signVerificationEthAddressClaim(claimBody);
   * console.log(verificationResult._unsafeUnwrap());
   *
   * // Output: Uint8Array(65) [ 166, 32, 71, 26, 36, 205, ... ]
   * ```
   */
  async signVerificationEthAddressClaimHex(claim: VerificationEthAddressClaim): HubAsyncResult<string> {
    const signatureBytes = await this.signVerificationEthAddressClaim(claim);
    return signatureBytes.andThen((bytes) => bytesToHexString(bytes));
  }
}

export class Ed25519Signer extends BaseEd25519Signer {
  /**
   * Creates an Ed25519 signer from a private key.
   *
   * @param {Uint8Array} privateKey - The 32-byte private key to use for signing.
   *
   * @returns {HubResult<Ed25519Signer>} A HubResult containing an Ed25519Signer instance on success, or an error message on failure.
   *
   * @example
   * ```typescript
   * import { Ed25519Signer } from '@farcaster/js';
   * import * as ed from '@noble/ed25519';
   *
   * const privateKeyBytes = ed.utils.randomPrivateKey();
   * const signer = Ed25519Signer.fromPrivateKey(privateKeyBytes)._unsafeUnwrap();
   * ```
   */
  public static override fromPrivateKey(privateKey: Uint8Array): HubResult<Ed25519Signer> {
    const signerKey = ed25519.getPublicKeySync(privateKey);
    return bytesToHexString(signerKey).map((signerKeyHex) => {
      return new this(privateKey, signerKey, signerKeyHex);
    });
  }

  /**
   * Generates a 256-bit hex signature from an EdDSA key pair for a given message hash in hex format.
   *
   * @param {string} hash - The hash of the message to be signed in hex format.
   *
   * @returns {Promise<HubAsyncResult<string>>} A HubAsyncResult containing the signature in hex format.
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
   * const messageHash = messageBytes.toString('hex');
   *
   * const signature = await signer.signMessageHashHex(messageHash);
   *
   * console.log(signature._unsafeUnwrap()); // 0x9f1c7e13b9d0b8...
   * ```
   */
  async signMessageHashHex(hash: string): HubAsyncResult<string> {
    const hashBytes = hexStringToBytes(hash);
    if (hashBytes.isErr()) {
      return err(hashBytes.error);
    }

    const signatureBytes = await this.signMessageHash(hashBytes.value);

    return signatureBytes.andThen((bytes) => bytesToHexString(bytes));
  }
}
