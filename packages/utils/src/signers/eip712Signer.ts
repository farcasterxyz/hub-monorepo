import { SignatureScheme } from '@hub/flatbuffers';
import { Wallet } from 'ethers';
import { hexStringToBytes } from '../bytes';
import { eip712 } from '../crypto';
import { HubAsyncResult } from '../errors';
import { VerificationEthAddressClaim } from '../types';
import { Signer } from './signer';

export class Eip712Signer extends Signer {
  /** 32-byte wallet address */
  public declare readonly signerKey: Uint8Array;
  private readonly wallet: Wallet;

  constructor(privateKey: Uint8Array) {
    const wallet = new Wallet(privateKey);
    const signerKey = hexStringToBytes(wallet.address.toLowerCase());
    if (signerKey.isErr()) {
      throw signerKey.error;
    }
    super(SignatureScheme.Eip712, privateKey, signerKey.value);
    this.wallet = wallet;
  }

  /** generates 256-bit signature from an Ethereum address */
  public signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return eip712.signMessageHash(hash, this.wallet);
  }

  public signVerificationEthAddressClaim(claim: VerificationEthAddressClaim): HubAsyncResult<Uint8Array> {
    return eip712.signVerificationEthAddressClaim(claim, this.wallet);
  }
}
