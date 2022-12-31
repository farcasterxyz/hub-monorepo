import { SignatureScheme } from '@hub/flatbuffers';
import { ethers } from 'ethers';
import { arrayify } from 'ethers/lib/utils';
import { signMessageHash } from '../utils/eip712';
import { IMessageSigner } from './types';

class EthersMessageSigner implements IMessageSigner {
  /** 20-byte wallet address */
  public signerKey: Uint8Array;
  public scheme = SignatureScheme.Eip712;

  private wallet: ethers.Wallet;

  constructor(wallet: ethers.Wallet) {
    this.wallet = wallet;
    this.signerKey = arrayify(wallet.address);
  }

  /** generates 256-bit signature from an Ethereum address */
  public async sign(hash: Uint8Array): Promise<Uint8Array> {
    return signMessageHash(hash, this.wallet);
  }
}

export default EthersMessageSigner;
