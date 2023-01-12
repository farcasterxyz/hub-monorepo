import {
  bytesToHexString,
  Ed25519Signer as FlatbufferEd25519Signer,
  Eip712Signer as FlatbufferEip712Signer,
  hexStringToBytes,
  HubAsyncResult,
} from '@farcaster/utils';
import { err } from 'neverthrow';

export class Eip712Signer extends FlatbufferEip712Signer {
  async signMessageHashHex(hash: string): HubAsyncResult<string> {
    const hashBytes = hexStringToBytes(hash);
    if (hashBytes.isErr()) {
      return err(hashBytes.error);
    }

    const signatureBytes = await this.signMessageHash(hashBytes.value);

    return signatureBytes.andThen((bytes) => bytesToHexString(bytes));
  }
}

export class Ed25519Signer extends FlatbufferEd25519Signer {
  async signMessageHashHex(hash: string): HubAsyncResult<string> {
    const hashBytes = hexStringToBytes(hash);
    if (hashBytes.isErr()) {
      return err(hashBytes.error);
    }

    const signatureBytes = await this.signMessageHash(hashBytes.value);

    return signatureBytes.andThen((bytes) => bytesToHexString(bytes));
  }
}
