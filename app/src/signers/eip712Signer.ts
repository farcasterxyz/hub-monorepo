import { hexStringToBytes } from '@hub/bytes';
import { HubAsyncResult } from '@hub/errors';
import { SignatureScheme } from '@hub/flatbuffers';
import { Wallet } from 'ethers';
import { signMessageHash } from '~/flatbuffers/utils/eip712';
import { Signer } from './signer';

class Eip712Signer extends Signer {
  /** 32-byte wallet address */
  public declare readonly signerKey: Uint8Array;
  public readonly wallet: Wallet;

  constructor(privateKey: Uint8Array) {
    const wallet = new Wallet(privateKey);
    const signerKey = hexStringToBytes(wallet.address.toLowerCase())._unsafeUnwrap();
    super(SignatureScheme.Eip712, privateKey, signerKey);
    this.wallet = wallet;
  }

  /** generates 256-bit signature from an Ethereum address */
  public signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return signMessageHash(hash, this.wallet);
  }
}

export default Eip712Signer;
