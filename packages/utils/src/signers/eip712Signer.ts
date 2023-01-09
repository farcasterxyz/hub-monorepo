import {
  Signer as EthersAbstractSigner,
  TypedDataSigner as EthersTypedDataSigner,
} from '@ethersproject/abstract-signer';
import { SignatureScheme } from '@farcaster/flatbuffers';
import { hexStringToBytes } from '../bytes';
import { eip712 } from '../crypto';
import { HubAsyncResult } from '../errors';
import { VerificationEthAddressClaim } from '../verifications';
import { Signer } from './signer';

export type TypedDataSigner = EthersAbstractSigner & EthersTypedDataSigner;

export class Eip712Signer implements Signer {
  public readonly scheme = SignatureScheme.Eip712;

  /** 20-byte wallet address */
  public readonly signerKey: Uint8Array;
  public readonly signerKeyHex: string;

  private readonly _typedDataSigner: TypedDataSigner;

  constructor(typedDataSigner: TypedDataSigner, address: string) {
    this._typedDataSigner = typedDataSigner;
    this.signerKeyHex = address.toLowerCase();

    const signerKey = hexStringToBytes(this.signerKeyHex);
    if (signerKey.isErr()) {
      throw signerKey.error;
    }
    this.signerKey = signerKey.value;
  }

  /** generates 256-bit signature from an Ethereum address */
  public signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return eip712.signMessageHash(hash, this._typedDataSigner);
  }

  public signVerificationEthAddressClaim(claim: VerificationEthAddressClaim): HubAsyncResult<Uint8Array> {
    return eip712.signVerificationEthAddressClaim(claim, this._typedDataSigner);
  }
}
