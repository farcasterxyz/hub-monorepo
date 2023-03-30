import { ResultAsync } from 'neverthrow';
import { getAccount, Hex, WalletClient } from 'viem';
import { hexStringToBytes } from '../bytes';
import {
  EIP_712_FARCASTER_MESSAGE_DATA,
  EIP_712_FARCASTER_VERIFICATION_CLAIM,
  EIP_712_FARCASTER_DOMAIN,
} from '../crypto/eip712';
import { HubAsyncResult, HubError } from '../errors';
import { VerificationEthAddressClaim } from '../verifications';
import { Eip712Signer } from './eip712Signer';

const typeDefs = {
  MessageData: EIP_712_FARCASTER_MESSAGE_DATA,
  VerificationClaims: EIP_712_FARCASTER_VERIFICATION_CLAIM,
};

export class ViemEip712Signer extends Eip712Signer {
  private readonly _viemWallet: WalletClient;

  constructor(viemWallet: WalletClient) {
    super();
    this._viemWallet = viemWallet;
  }

  private _hexStringToHex(hexString: string): Hex {
    return hexString as Hex;
  }

  private _toViemCompat712Domain() {
    const { salt, ...rest } = EIP_712_FARCASTER_DOMAIN;
    return {
      salt: this._hexStringToHex(salt),
      ...rest,
    };
  }

  private async _getSignerKey(): Promise<string> {
    const [address] = await this._viemWallet.getAddresses();
    return address;
  }

  private async _getSignerAccount() {
    return getAccount(this._hexStringToHex(await this._getSignerKey()));
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
        types: typeDefs,
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
        types: typeDefs,
        primaryType: 'VerificationClaims',
        message: {
          ...claim,
        },
      }),
      (e) => new HubError('bad_request.invalid_param', e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }
}
