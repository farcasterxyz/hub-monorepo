import { SignatureScheme } from '@hub/flatbuffers';
import { ethers } from 'ethers';
import { HubAsyncResult } from '~/utils/hubErrors';
import { hexStringToBytes } from '../utils/bytes';
import { signMessageHash } from '../utils/eip712';
import { IMessageSigner } from './types';

class EthersMessageSigner implements IMessageSigner {
  /** 20-byte wallet address */
  public signerKey: Uint8Array;
  public scheme = SignatureScheme.Eip712;

  private wallet: ethers.Wallet;

  constructor(wallet: ethers.Wallet) {
    this.wallet = wallet;
    this.signerKey = hexStringToBytes(wallet.address)._unsafeUnwrap();
  }

  /** generates 256-bit signature from an Ethereum address */
  public sign(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return signMessageHash(hash, this.wallet);
  }
}

export default EthersMessageSigner;
