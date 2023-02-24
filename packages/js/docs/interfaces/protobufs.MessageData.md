[@farcaster/js](../README.md) / [Exports](../modules.md) / [protobufs](../modules/protobufs.md) / MessageData

# Interface: MessageData

[protobufs](../modules/protobufs.md).MessageData

A MessageData object contains properties common to all messages and wraps a body object which
contains properties specific to the MessageType.

## Table of contents

### Properties

- [castAddBody](protobufs.MessageData.md#castaddbody)
- [castRemoveBody](protobufs.MessageData.md#castremovebody)
- [fid](protobufs.MessageData.md#fid)
- [network](protobufs.MessageData.md#network)
- [reactionBody](protobufs.MessageData.md#reactionbody)
- [signerBody](protobufs.MessageData.md#signerbody)
- [timestamp](protobufs.MessageData.md#timestamp)
- [type](protobufs.MessageData.md#type)
- [userDataBody](protobufs.MessageData.md#userdatabody)
- [verificationAddEthAddressBody](protobufs.MessageData.md#verificationaddethaddressbody)
- [verificationRemoveBody](protobufs.MessageData.md#verificationremovebody)

## Properties

### castAddBody

• `Optional` **castAddBody**: [`CastAddBody`](../modules/protobufs.md#castaddbody)

___

### castRemoveBody

• `Optional` **castRemoveBody**: [`CastRemoveBody`](../modules/protobufs.md#castremovebody)

___

### fid

• **fid**: `number`

Farcaster ID of the user producing the message

___

### network

• **network**: [`FarcasterNetwork`](../enums/protobufs.FarcasterNetwork.md)

Farcaster network the message is intended for

___

### reactionBody

• `Optional` **reactionBody**: [`ReactionBody`](../modules/protobufs.md#reactionbody)

___

### signerBody

• `Optional` **signerBody**: [`SignerBody`](../modules/protobufs.md#signerbody)

___

### timestamp

• **timestamp**: `number`

Farcaster epoch timestamp in seconds

___

### type

• **type**: [`MessageType`](../enums/protobufs.MessageType.md)

Type of message contained in the body

___

### userDataBody

• `Optional` **userDataBody**: [`UserDataBody`](../modules/protobufs.md#userdatabody)

___

### verificationAddEthAddressBody

• `Optional` **verificationAddEthAddressBody**: [`VerificationAddEthAddressBody`](../modules/protobufs.md#verificationaddethaddressbody)

___

### verificationRemoveBody

• `Optional` **verificationRemoveBody**: [`VerificationRemoveBody`](../modules/protobufs.md#verificationremovebody)
