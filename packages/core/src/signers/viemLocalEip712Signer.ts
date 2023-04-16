import { ResultAsync } from 'neverthrow';
import { LocalAccount } from 'viem/accounts';
import { hexStringToBytes } from '../bytes';
import {
  EIP_712_FARCASTER_MESSAGE_DATA,
  EIP_712_FARCASTER_VERIFICATION_CLAIM,
  EIP_712_FARCASTER_DOMAIN,
} from '../crypto/eip712';
import { HubAsyncResult, HubError } from '../errors';
import { VerificationEthAddressClaim } from '../verifications';
import { Eip712Signer } from './eip712Signer';

export class ViemLocalEip712Signer extends Eip712Signer {
  private readonly _viemLocalAccount: LocalAccount<string>;

  constructor(viemLocalAccount: LocalAccount<string>) {
    super();
    this._viemLocalAccount = viemLocalAccount;
  }

  private _toViemCompat712Domain() {
    const { salt, ...rest } = EIP_712_FARCASTER_DOMAIN;
    return {
      salt: salt as `0x${string}`,
      ...rest,
    };
  }

  private async _getSignerKey() {
    return this._viemLocalAccount.address;
  }

  public async getSignerKey(): HubAsyncResult<Uint8Array> {
    return ResultAsync.fromPromise(this._getSignerKey(), (e) => new HubError('unknown', e as Error)).andThen(
      hexStringToBytes
    );
  }

  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._viemLocalAccount.signTypedData({
        domain: this._toViemCompat712Domain(),
        types: { MessageData: EIP_712_FARCASTER_MESSAGE_DATA },
        primaryType: 'MessageData',
        message: {
          hash,
        },
      }),
      (e) => new HubError('bad_request.invalid_param', e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signVerificationEthAddressClaim(claim: VerificationEthAddressClaim): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._viemLocalAccount.signTypedData({
        domain: this._toViemCompat712Domain(),
        types: { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM },
        primaryType: 'VerificationClaim',
        message: {
          ...claim,
        },
      }),
      (e) => new HubError('bad_request.invalid_param', e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }
}
