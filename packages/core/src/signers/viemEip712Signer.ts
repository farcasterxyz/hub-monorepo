import { ResultAsync } from 'neverthrow';
import { Address, getAccount, WalletClient } from 'viem';
import { hexStringToBytes } from '../bytes';
import {
  EIP_712_FARCASTER_MESSAGE_DATA,
  EIP_712_FARCASTER_VERIFICATION_CLAIM,
  EIP_712_FARCASTER_DOMAIN,
} from '../crypto/eip712';
import { HubAsyncResult, HubError } from '../errors';
import { VerificationEthAddressClaim } from '../verifications';
import { Eip712Signer } from './eip712Signer';

export class ViemEip712Signer extends Eip712Signer {
  private readonly _viemWallet: WalletClient;

  constructor(viemWallet: WalletClient) {
    super();
    this._viemWallet = viemWallet;
  }

  private _toViemCompat712Domain() {
    const { salt, ...rest } = EIP_712_FARCASTER_DOMAIN;
    return {
      salt: salt as `0x${string}`,
      ...rest,
    };
  }

  private async _getSignerKey() {
    const [address] = await this._viemWallet.getAddresses();
    return address;
  }

  private async _getSignerAccount() {
    return getAccount((await this._getSignerKey()) as Address);
  }

  public async getSignerKey(): HubAsyncResult<Uint8Array> {
    return ResultAsync.fromPromise(this._getSignerKey(), (e) => new HubError('unknown', e as Error)).andThen(
      hexStringToBytes
    );
  }

  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._viemWallet.signTypedData({
        account: await this._getSignerAccount(),
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
      this._viemWallet.signTypedData({
        account: await this._getSignerAccount(),
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
