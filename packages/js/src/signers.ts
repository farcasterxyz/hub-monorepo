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
   * @static
   * @function
   * @name Eip712Signer.fromSigner
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
   * @function
   * @name eip712Signer.signMessageHashHex
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
   * TODO descriptionmessageHash
   *
   * @function
   * @name eip712Signer.signVerificationEthAddressClaim
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
  public static override fromPrivateKey(privateKey: Uint8Array): HubResult<Ed25519Signer> {
    const signerKey = ed25519.getPublicKeySync(privateKey);
    return bytesToHexString(signerKey).map((signerKeyHex) => {
      return new this(privateKey, signerKey, signerKeyHex);
    });
  }

  async signMessageHashHex(hash: string): HubAsyncResult<string> {
    const hashBytes = hexStringToBytes(hash);
    if (hashBytes.isErr()) {
      return err(hashBytes.error);
    }

    const signatureBytes = await this.signMessageHash(hashBytes.value);

    return signatureBytes.andThen((bytes) => bytesToHexString(bytes));
  }
}
