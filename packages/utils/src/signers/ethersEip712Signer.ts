import { eip712 } from '../crypto';
import { HubAsyncResult } from '../errors';
import { VerificationEthAddressClaim } from '../verifications';
import { Eip712Signer } from './eip712Signer';

export class EthersEip712Signer extends Eip712Signer {
  private readonly _ethersSigner: eip712.MinimalEthersSigner;

  constructor(signer: eip712.MinimalEthersSigner) {
    super();
    this._ethersSigner = signer;
  }

  public async getSignerKey(): HubAsyncResult<Uint8Array> {
    return eip712.getSignerKey(this._ethersSigner);
  }

  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return eip712.signMessageHash(hash, this._ethersSigner);
  }

  public async signVerificationEthAddressClaim(claim: VerificationEthAddressClaim): HubAsyncResult<Uint8Array> {
    return eip712.signVerificationEthAddressClaim(claim, this._ethersSigner);
  }
}
