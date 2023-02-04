import { SignatureScheme } from '@farcaster/protobufs';
import { Signer as EthersSigner } from 'ethers';
import { hexStringToBytes } from '../bytes';
import { eip712 } from '../crypto';
import { HubAsyncResult, HubResult } from '../errors';
import { VerificationEthAddressClaim } from '../verifications';
import { Signer } from './signer';

// export type TypedDataSigner = EthersAbstractSigner & EthersTypedDataSigner;

export class Eip712Signer implements Signer {
  public readonly scheme = SignatureScheme.SIGNATURE_SCHEME_EIP712;

  /** 20-byte wallet address */
  public readonly signerKey: Uint8Array;
  public readonly signerKeyHex: string;

  // TODO: rename if this works
  private readonly _typedDataSigner: EthersSigner;

  public static fromSigner(typedDataSigner: EthersSigner, address: string): HubResult<Eip712Signer> {
    const signerKeyHex = address.toLowerCase();
    return hexStringToBytes(signerKeyHex).map((signerKey) => new this(typedDataSigner, address, signerKey));
  }

  constructor(typedDataSigner: EthersSigner, address: string, signerKey: Uint8Array) {
    this._typedDataSigner = typedDataSigner;
    this.signerKeyHex = address.toLowerCase();
    this.signerKey = signerKey;
  }

  /** generates 256-bit signature from an Ethereum address */
  public signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return eip712.signMessageHash(hash, this._typedDataSigner);
  }

  public signVerificationEthAddressClaim(claim: VerificationEthAddressClaim): HubAsyncResult<Uint8Array> {
    return eip712.signVerificationEthAddressClaim(claim, this._typedDataSigner);
  }
}
