import {
  Signer as EthersAbstractSigner,
  TypedDataSigner as EthersTypedDataSigner,
} from '@ethersproject/abstract-signer';
import { hexStringToBytes } from '../bytes';
import { eip712 } from '../crypto';
import { VerificationEthAddressClaim } from '../verifications';
import { Eip712Signer } from './eip712Signer';

export type TypedDataSigner = EthersAbstractSigner & EthersTypedDataSigner;

export class EthersEip712Signer extends Eip712Signer {
  private readonly _typedDataSigner: TypedDataSigner;

  constructor(typedDataSigner: TypedDataSigner) {
    super();
    this._typedDataSigner = typedDataSigner;
  }

  public async getSignerKey(): Promise<Uint8Array> {
    const address = await this._typedDataSigner.getAddress();
    const addressHex = hexStringToBytes(address);
    if (addressHex.isErr()) throw addressHex.error;
    return addressHex.value;
  }

  public async signMessageHash(hash: Uint8Array): Promise<Uint8Array> {
    const result = await eip712.signMessageHash(hash, this._typedDataSigner);
    if (result.isErr()) throw result.error;
    return result.value;
  }

  public async signVerificationEthAddressClaim(claim: VerificationEthAddressClaim): Promise<Uint8Array> {
    const result = await eip712.signVerificationEthAddressClaim(claim, this._typedDataSigner);
    if (result.isErr()) throw result.error;
    return result.value;
  }
}
