[@farcaster/js](../README.md) / [Exports](../modules.md) / [protobufs](../modules/protobufs.md) / Message

# Interface: Message

[protobufs](../modules/protobufs.md).Message

A Message is a delta operation on the Farcaster network. The message protobuf is an envelope
that wraps a MessageData object and contains a hash and signature which can verify its authenticity.

## Table of contents

### Properties

- [data](protobufs.Message.md#data)
- [hash](protobufs.Message.md#hash)
- [hashScheme](protobufs.Message.md#hashscheme)
- [signature](protobufs.Message.md#signature)
- [signatureScheme](protobufs.Message.md#signaturescheme)
- [signer](protobufs.Message.md#signer)

## Properties

### data

• **data**: `undefined` \| [`MessageData`](../modules/protobufs.md#messagedata)

Contents of the message

___

### hash

• **hash**: `Uint8Array`

Hash digest of data

___

### hashScheme

• **hashScheme**: [`HashScheme`](../enums/protobufs.HashScheme.md)

Hash scheme that produced the hash digest

___

### signature

• **signature**: `Uint8Array`

Signature of the hash digest

___

### signatureScheme

• **signatureScheme**: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md)

Signature scheme that produced the signature

___

### signer

• **signer**: `Uint8Array`

Public key or address of the key pair that produced the signature
