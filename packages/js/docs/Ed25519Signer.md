# @farcaster/js/Ed25519Signer

A Typescript class for signing messages with Ed25519.

## Constructors

| Constructor   | Description                                        | Docs                                   |
| ------------- | -------------------------------------------------- | -------------------------------------- |
| Ed25519Signer | Creates a new instance of the Ed25519Signer class. | [docs](./Ed25519Signer.md#constructor) |

## Properties

| Property     | Description                         | Docs                                                 |
| ------------ | ----------------------------------- | ---------------------------------------------------- |
| scheme       | Gets the scheme used by the signer. | [docs](./Ed25519Signer.md#ed25519signerscheme)       |
| signerKey    | TODO                                | [docs](./Ed25519Signer.md#ed25519signersignerkey)    |
| signerKeyHex | TODO                                | [docs](./Ed25519Signer.md#ed25519signersignerkeyhex) |

## Methods

| Method             | Description                                                                                  | Docs                                          |
| ------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------- |
| signMessageHash    | Signs a message hash with the signer's private key.                                          | [docs](./Ed25519Signer.md#signmessagehash)    |
| signMessageHashHex | Signs a message hash with the signer's private key, returning the signature as a hex string. | [docs](./Ed25519Signer.md#signmessagehashhex) |
| fromPrivateKey     | Creates a new instance of the Ed25519Signer class from a given private key.                  | [docs](./Ed25519Signer.md#fromprivatekey)     |

**`Example`**

```ts
// Example usage:
import import { Ed25519Signer } from "@farcaster/js";
import * as ed from "@noble/ed25519";

// TODO: safer way to generate keys?
// TODO: maybe use `new Ed25519Signer()` instead?
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

### `Ed25519Signer()`

Creates a new instance of the `Ed25519Signer` class.

**Parameters**

| Name           | Type         | Description                        |
| :------------- | :----------- | :--------------------------------- |
| `privateKey`   | `Uint8Array` | The EdDSA private key              |
| `signerKey`    | `Uint8Array` | The EdDSA public key               |
| `signerKeyHex` | `string`     | The EdDSA public key in hex format |

## Properties

### `Ed25519Signer.scheme`

Gets the scheme used by the signer.

**Returns**

| Name                                       | Value | Description                                  |
| :----------------------------------------- | :---- | :------------------------------------------- |
| `SignatureScheme.SIGNATURE_SCHEME_ED25519` | 1     | The signature scheme as defined in protobufs |

### `Ed25519Signer.signerKey`

Gets EdDSA public key in bytes.

**Returns**

| Name        | Type             | Description |
| :---------- | :--------------- | :---------- |
| `signerKey` | `Uint8Array(32)` | TODO        |

### `Ed25519Signer.signerKeyHex`

Gets EdDSA public key in hexadecimal format.

**Returns**

| Name           | Type     | Description |
| :------------- | :------- | :---------- |
| `signerKeyHex` | `string` | TODO        |

## Methods

### `Ed25519Signer.signMessageHash()`

TODO

**Parameters**

| Name   | Type         | Description               |
| :----- | :----------- | :------------------------ |
| `hash` | `Uint8Array` | The hash to sign in bytes |

### `Ed25519Signer.signMessageHashHex()`

TODO

**Parameters**

| Name   | Type     | Description      |
| :----- | :------- | :--------------- |
| `hash` | `string` | The hash to sign |

### `Ed25519Signer.fromPrivateKey()`

Creates a new instance of the `Ed25519Signer` class from a EdDSA private key.

**Parameters**

| Name         | Type         | Description                  |
| :----------- | :----------- | :--------------------------- |
| `privateKey` | `Uint8Array` | Ed25519 Private key in bytes |
