import type {
  Signer as EthersAbstractSigner,
  TypedDataSigner as EthersTypedDataSigner,
} from '@ethersproject/abstract-signer';
import { ResultAsync } from 'neverthrow';
import { hexStringToBytes } from '../bytes';
import { eip712 } from '../crypto';
import { HubAsyncResult, HubError } from '../errors';
import { VerificationEthAddressClaim } from '../verifications';
import { Eip712Signer } from './eip712Signer';

export type TypedDataSigner = EthersAbstractSigner & EthersTypedDataSigner;

export class EthersV5Eip712Signer extends Eip712Signer {
  private readonly _typedDataSigner: TypedDataSigner;

  constructor(typedDataSigner: TypedDataSigner) {
    super();
    this._typedDataSigner = typedDataSigner;
  }

  public async getSignerKey(): HubAsyncResult<Uint8Array> {
    return ResultAsync.fromPromise(
      this._typedDataSigner.getAddress(),
      (e) => new HubError('unknown', e as Error)
    ).andThen(hexStringToBytes);
  }

  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        eip712.EIP_712_FARCASTER_DOMAIN,
        { MessageData: eip712.EIP_712_FARCASTER_MESSAGE_DATA },
        { hash }
      ),
      (e) => new HubError('bad_request.invalid_param', e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signVerificationEthAddressClaim(claim: VerificationEthAddressClaim): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        eip712.EIP_712_FARCASTER_DOMAIN,
        { VerificationClaim: eip712.EIP_712_FARCASTER_VERIFICATION_CLAIM },
        claim
      ),
      (e) => new HubError('bad_request.invalid_param', e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }
}
