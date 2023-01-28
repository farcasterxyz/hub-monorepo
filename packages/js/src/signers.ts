import {
  bytesToHexString,
  ed25519,
  Ed25519Signer as BaseEd25519Signer,
  Eip712Signer as BaseEip712Signer,
  hexStringToBytes,
  HubAsyncResult,
  HubResult,
  TypedDataSigner,
  VerificationEthAddressClaim,
} from '@farcaster/protoutils';
import { err } from 'neverthrow';

export class Eip712Signer extends BaseEip712Signer {
  public static override fromSigner(typedDataSigner: TypedDataSigner, address: string): HubResult<Eip712Signer> {
    const signerKeyHex = address.toLowerCase();
    return hexStringToBytes(signerKeyHex).map((signerKey) => new this(typedDataSigner, address, signerKey));
  }

  async signMessageHashHex(hash: string): HubAsyncResult<string> {
    const hashBytes = hexStringToBytes(hash);
    if (hashBytes.isErr()) {
      return err(hashBytes.error);
    }

    const signatureBytes = await this.signMessageHash(hashBytes.value);

    return signatureBytes.andThen((bytes) => bytesToHexString(bytes));
  }

  async signVerificationEthAddressClaimHex(claim: VerificationEthAddressClaim): HubAsyncResult<string> {
    const signatureBytes = await this.signVerificationEthAddressClaim(claim);
    return signatureBytes.andThen((bytes) => bytesToHexString(bytes));
  }
}

export class Ed25519Signer extends BaseEd25519Signer {
  public static override fromPrivateKey(privateKey: Uint8Array): HubResult<Ed25519Signer> {
    const signerKey = ed25519.getPublicKeySync(privateKey);
    return bytesToHexString(signerKey).map((signerKeyHex) => {
      return new this(privateKey, signerKey, signerKeyHex);
    });
  }

  async signMessageHashHex(hash: string): HubAsyncResult<string> {
    const hashBytes = hexStringToBytes(hash);
    if (hashBytes.isErr()) {
      return err(hashBytes.error);
    }

    const signatureBytes = await this.signMessageHash(hashBytes.value);

    return signatureBytes.andThen((bytes) => bytesToHexString(bytes));
  }
}
