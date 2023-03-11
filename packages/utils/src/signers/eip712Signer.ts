import {
  Signer as EthersAbstractSigner,
  TypedDataSigner as EthersTypedDataSigner,
} from '@ethersproject/abstract-signer';
import { SignatureScheme } from '@farcaster/protobufs';
import { hexStringToBytes } from '../bytes';
import { eip712 } from '../crypto';
import { HubAsyncResult, HubResult } from '../errors';
import { VerificationEthAddressClaim } from '../verifications';
import { Signer } from './signer';

export type TypedDataSigner = EthersAbstractSigner & EthersTypedDataSigner;

export class Eip712Signer implements Signer {
  /** Signature scheme as defined in protobufs */
  public readonly scheme = SignatureScheme.EIP712;

  /** 20-byte wallet address */
  public readonly signerKey: Uint8Array;

  private readonly _typedDataSigner: TypedDataSigner;

  public static fromSigner(typedDataSigner: TypedDataSigner, address: string): HubResult<Eip712Signer> {
    return hexStringToBytes(address).map((signerKey) => new this(typedDataSigner, address, signerKey));
  }

  constructor(typedDataSigner: TypedDataSigner, address: string, signerKey: Uint8Array) {
    this._typedDataSigner = typedDataSigner;
    this.signerKey = signerKey;
  }

  /**
   * Generates a 256-bit signature from an Ethereum address.
   *
   * #### Returns
   *
   * | Value | Description |
   * | :---- | :---------- |
   * | `HubAsyncResult<Uint8Array>` | A HubAsyncResult containing the 256-bit signature as a Uint8Array. |
   *
   * @param {Uint8Array} hash - The 256-bit hash of the message to be signed.
   *
   * @example
   * ```typescript
   * import { Eip712Signer } from '@farcaster/js';
   * import { ethers } from 'ethers';
   * import { randomBytes } from 'ethers/lib/utils';
   * import { blake3 } from '@noble/hashes/blake3';
   *
   * const custodyWallet = ethers.Wallet.fromMnemonic('your mnemonic here apple orange banana');
   * const eip712Signer = Eip712Signer.fromSigner(custodyWallet, custodyWallet.address)._unsafeUnwrap();
   *
   * const bytes = randomBytes(32);
   * const hash = blake3(bytes, { dkLen: 20 });
   * const signature = await signer.signMessageHash(hash);
   *
   * console.log(signature._unsafeUnwrap());
   *
   * // Output: Uint8Array(65) [ 166, 32, 71, 26, 36, 205, ... ]
   * ```
   */
  public signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return eip712.signMessageHash(hash, this._typedDataSigner);
  }

  /**
   * Signs a verification claim for an Ethereum address.
   *
   * #### Returns
   *
   * | Value | Description |
   * | :---- | :---------- |
   * | `HubAsyncResult<Uint8Array>` | A HubAsyncResult containing the 256-bit signature as a Uint8Array. |
   *
   *
   * @param {Object} claim - The body of the claim to be signed.
   * @param {number} claim.fid - The Farcaster ID.
   * @param {string} claim.address - The Ethereum address to verify.
   * @param {types.FarcasterNetwork} claim.network - The Farcaster network to use.
   * @param {string} claim.blockHash - The hash of the Ethereum block to use for verification.
   *
   *
   * @example
   * ```typescript
   * const claimBody = {
   *   fid: -1,
   *   address: eip712Signer.signerKeyHex,
   *   network: types.FarcasterNetwork.DEVNET,
   *   blockHash: '2c87468704d6b0f4c46f480dc54251de50753af02e5d63702f85bde3da4f7a3d',
   * };
   * const verificationResult = await eip712Signer.signVerificationEthAddressClaim(claimBody);
   * console.log(verificationResult._unsafeUnwrap());
   *
   * // Will output: Uint8Array(65) [ 166, 32, 71, 26, 36, 205, ... ]
   * ```
   */
  public signVerificationEthAddressClaim(claim: VerificationEthAddressClaim): HubAsyncResult<Uint8Array> {
    return eip712.signVerificationEthAddressClaim(claim, this._typedDataSigner);
  }
}
