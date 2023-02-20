# @farcaster/js/Ed25519Signer

A Typescript class for signing messages with Ed25519.

## Classes

| Class         | Description                              | Docs                            |
| ------------- | ---------------------------------------- | ------------------------------- |
| Ed25519Signer | Class for signing messages with Ed25519. | [docs](./docs/Ed25519Signer.md) |

## Constructors

| Constructor   | Description                                        | Docs                                        |
| ------------- | -------------------------------------------------- | ------------------------------------------- |
| Ed25519Signer | Creates a new instance of the Ed25519Signer class. | [docs](./docs/Ed25519Signer.md#constructor) |

## Properties

| Property     | Description                                     | Docs                                         |
| ------------ | ----------------------------------------------- | -------------------------------------------- |
| scheme       | Gets the scheme used by the signer.             | [docs](./docs/Ed25519Signer.md#scheme)       |
| signerKey    | Gets the private key used by the signer.        | [docs](./docs/Ed25519Signer.md#signerkey)    |
| signerKeyHex | Gets the private key used by the signer in hex. | [docs](./docs/Ed25519Signer.md#signerkeyhex) |

## Methods

| Method             | Description                                                                                  | Docs                                               |
| ------------------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| signMessageHash    | Signs a message hash with the signer's private key.                                          | [docs](./docs/Ed25519Signer.md#signmessagehash)    |
| signMessageHashHex | Signs a message hash with the signer's private key, returning the signature as a hex string. | [docs](./docs/Ed25519Signer.md#signmessagehashhex) |
| fromPrivateKey     | Creates a new instance of the Ed25519Signer class from a given private key.                  | [docs](./docs/Ed25519Signer.md#fromprivatekey)     |

**`Example`**

```ts
// Example usage:
import import { Ed25519Signer } from "@farcaster/js";
import * as ed from "@noble/ed25519";

// TODO: safer way to generate keys?
const randomKey = ed.utils.randomPrivateKey();
const signer = Ed25519Signer.fromPrivateKey(randomKey)._unsafeUnwrap();

console.log(signer.scheme); // 1
console.log(signer.signerKey); // Uint8Array(32) [ 5, 199, 40, 255, 34, ...]
console.log(signer.signerKeyHex) // 05c728ff22bfd561e88e22...

const message = "Hello world";
const messageBytes = new TextEncoder().encode(message);

const unwrapHex = (data) =>
  console.log(ed.utils.bytesToHex(data._unsafeUnwrap()));

signer.signMessageHash(messageBytes).then(unwrapHex);
// will output 5c728ff22bfd561e88e22...

// TODO: value: HubError: hexToBytes: received invalid unpadded hex
signer.signMessageHashHex(message).then(unwrapHex);
```

## Properties

### Ed25519.scheme

Gets the scheme used by the signer.

#### Returns

// TODO: fact-check the description of this

| Name                                       | Value | Description                                  |
| :----------------------------------------- | :---- | :------------------------------------------- |
| `SignatureScheme.SIGNATURE_SCHEME_ED25519` | 1     | The signature scheme as defined in protobufs |

### Ed25519.signerKey

Gets the private key used by the signer.

#### Returns

| Name        | Type             | Description                                  |
| :---------- | :--------------- | :------------------------------------------- |
| `signerKey` | `Uint8Array(32)` | The signature scheme as defined in protobufs |

### Ed25519.signerKeyHex

Gets the private key used by the signer in hex.

#### Returns

| Name           | Type    | Description                   |
| :------------- | :------ | :---------------------------- |
| `signerKeyHex` | `string | The signer private key in hex |

## Methods

### signMessageHash

Signs a message hash with the signer's private key.

#### Parameters

| Name   | Type         | Description               |
| :----- | :----------- | :------------------------ |
| `hash` | `Uint8Array` | The hash to sign in bytes |

### signMessageHashHex

Signs a message hash with the signer's private key, returning the signature as a hex string.

#### Parameters

| Name   | Type     | Description      |
| :----- | :------- | :--------------- |
| `hash` | `string` | The hash to sign |

### fromPrivateKey

Creates a new instance of the Ed25519Signer class from a given private key.

#### Parameters

| Name         | Type         | Description                  |
| :----------- | :----------- | :--------------------------- |
| `privateKey` | `Uint8Array` | Ed25519 Private key in bytes |
