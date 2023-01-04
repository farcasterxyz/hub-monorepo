import { SignatureScheme } from '@hub/flatbuffers';
import { ethers } from 'ethers';
import { signMessageHash } from '~/flatbuffers/utils/eip712';
import { HubAsyncResult } from '~/utils/hubErrors';
import { Signer } from './types';

class EthereumSigner implements Signer {
  /** 20-byte wallet address */
  public signerKey: string;
  public scheme = SignatureScheme.Eip712;
  public wallet: ethers.Wallet;

  constructor(wallet: ethers.Wallet) {
    this.wallet = wallet;
    this.signerKey = wallet.address.toLowerCase();
  }

  /** generates 256-bit signature from an Ethereum address */
  public sign(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return signMessageHash(hash, this.wallet);
  }
}

export default EthereumSigner;
