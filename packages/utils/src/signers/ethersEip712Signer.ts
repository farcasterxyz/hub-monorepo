import { Signer as EthersSigner } from 'ethers';
import { hexStringToBytes } from '../bytes';
import { eip712 } from '../crypto';
import { VerificationEthAddressClaim } from '../verifications';
import { Eip712Signer } from './eip712Signer';

export class EthersEip712Signer extends Eip712Signer {
  private readonly _ethersSigner: EthersSigner;

  constructor(typedDataSigner: EthersSigner) {
    super();
    this._ethersSigner = typedDataSigner;
  }

  public async getSignerKey(): Promise<Uint8Array> {
    const address = await this._ethersSigner.getAddress();
    const addressHex = hexStringToBytes(address);
    if (addressHex.isErr()) throw addressHex.error;
    return addressHex.value;
  }

  public async signMessageHash(hash: Uint8Array): Promise<Uint8Array> {
    return eip712.signMessageHash(hash, this._ethersSigner);
  }

  public async signVerificationEthAddressClaim(claim: VerificationEthAddressClaim): Promise<Uint8Array> {
    return eip712.signVerificationEthAddressClaim(claim, this._ethersSigner);
  }
}
