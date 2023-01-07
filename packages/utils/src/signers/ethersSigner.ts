import { SignatureScheme } from '@hub/flatbuffers';
import ethers from 'ethers';
import { hexStringToBytes } from '../bytes';
import { eip712 } from '../crypto';
import { HubAsyncResult } from '../errors';
import { VerificationEthAddressClaim } from '../types';
import { Signer } from './signer';

export class EthersSigner extends Signer {
  /** 32-byte wallet address */
  public declare readonly signerKey: Uint8Array;
  private readonly ethersSigner: ethers.Signer;

  static async fromEthers(ethersSigner: ethers.Signer) {
    const address = await ethersSigner.getAddress();
    return new EthersSigner(ethersSigner, address);
  }

  constructor(ethersSigner: ethers.Signer, address: string) {
    const signerKeyHex = address;
    const signerKey = hexStringToBytes(signerKeyHex);
    if (signerKey.isErr()) {
      throw signerKey.error;
    }
    super(SignatureScheme.Eip712, signerKey.value, signerKeyHex);
    this.ethersSigner = ethersSigner;
  }

  /** generates 256-bit signature from an Ethereum address */
  public signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return eip712.signMessageHash(hash, this.ethersSigner);
  }

  public signVerificationEthAddressClaim(claim: VerificationEthAddressClaim): HubAsyncResult<Uint8Array> {
    return eip712.signVerificationEthAddressClaim(claim, this.ethersSigner);
  }
}
