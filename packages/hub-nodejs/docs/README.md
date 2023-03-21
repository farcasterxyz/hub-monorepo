# Documentation

@farcaster/hub-nodejs has five major components:

- A [Client](./Client.md), which can send and receive messages from a Farcaster Hub.
- [Messages](./Messages.md), which are the atomic units of change on the Farcaster network.
- [Builders](./Builders.md), which can be used to construct new messages.
- [Signers](./signers/), which are required by Builders to sign messages.
- [Utils](./Utils.md), which are helpers to deal with Farcaster idiosyncrasies.

## Idiosyncrasies

1. Timestamps are calculated from the [Farcaster epoch](./Utils.md#time), not the Unix epoch.
2. Errors are handled with [a monadic pattern](./Utils.md#errors), instead of try-catch.
3. [Ethers](https://www.npmjs.com/package/ethers) and [noble](https://www.npmjs.com/package/@noble/ed25519) are required to create new messages.
4. Only Nodejs is supported, and browser support is a [work in progress](https://github.com/farcasterxyz/hubble/issues/573).
5. Fixed length data is encoded in [byte formats](./Utils.md#bytes), instead of strings.

There are also a few Farcaster-specific terms that are very commonly used in this package:

| Term     | Description                                                               |
| -------- | ------------------------------------------------------------------------- |
| Cast     | A public message posted by a user                                         |
| Fid      | A Farcaster id, issued by the Id Registry on Ethereum                     |
| Fname    | A Farcaster username, issued by the Name Registry on Ethereum.            |
| Hub      | A node in the Farcaster network which stores Farcaster Messages           |
| Reaction | A public action between a user and a piece of content (e.g. like, recast) |

## Troubleshooting

### Ethers v5

If you must use Ethers v5 in your application, implement an `Ethersv5Eip712Signer` and use it instead of the included [`EthersEip712Signer`](./signers/EthersEip712Signer.md).

```typescript
import { ResultAsync } from 'neverthrow';
import {
  hexStringToBytes,
  HubAsyncResult,
  HubError,
  VerificationEthAddressClaim,
  Eip712Signer,
  eip712,
} from '@farcaster/hub-nodejs';
import {
  Signer as EthersAbstractSigner,
  TypedDataSigner as EthersTypedDataSigner,
} from '@ethersproject/abstract-signer';

export type TypedDataSigner = EthersAbstractSigner & EthersTypedDataSigner;

export class Ethersv5Eip712Signer extends Eip712Signer {
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
```

This can be called with

```
const signer = new EthersEip712Signer(ethersWalletInstance);
```
