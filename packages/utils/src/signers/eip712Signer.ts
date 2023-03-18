import { SignatureScheme } from '@farcaster/protobufs';
import { Signer as EthersSigner } from 'ethers';
import { hexStringToBytes } from '../bytes';
import { eip712 } from '../crypto';
import { HubAsyncResult, HubResult } from '../errors';
import { VerificationEthAddressClaim } from '../verifications';
import { Signer } from './signer';

export class Eip712Signer implements Signer {
  /** Signature scheme as defined in protobufs */
  public readonly scheme = SignatureScheme.EIP712;

  /** 20-byte wallet address */
  public readonly signerKey: Uint8Array;

  private readonly _ethersSigner: EthersSigner;

  public static fromSigner(signer: EthersSigner, address: string): HubResult<Eip712Signer> {
    return hexStringToBytes(address).map((signerKey) => new this(signer, address, signerKey));
  }

  constructor(signer: EthersSigner, address: string, signerKey: Uint8Array) {
    this._ethersSigner = signer;
    this.signerKey = signerKey;
  }

  public signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return eip712.signMessageHash(hash, this._ethersSigner);
  }

  public signVerificationEthAddressClaim(claim: VerificationEthAddressClaim): HubAsyncResult<Uint8Array> {
    return eip712.signVerificationEthAddressClaim(claim, this._ethersSigner);
  }
}
