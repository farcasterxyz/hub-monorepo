import { hexStringToBytes } from '@hub/bytes';
import { HubAsyncResult } from '@hub/errors';
import { SignatureScheme } from '@hub/flatbuffers';
import { Wallet } from 'ethers';
import { VerificationEthAddressClaim } from '~/flatbuffers/models/types';
import { signMessageHash, signVerificationEthAddressClaim } from '~/flatbuffers/utils/eip712';
import Signer from './signer';

class Eip712Signer extends Signer {
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
    return signMessageHash(hash, this.wallet);
  }

  public signVerificationEthAddressClaim(claim: VerificationEthAddressClaim): HubAsyncResult<Uint8Array> {
    return signVerificationEthAddressClaim(claim, this.wallet);
  }
}

export default Eip712Signer;
