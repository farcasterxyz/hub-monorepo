[hubble](../README.md) / [Modules](../modules.md) / [js/src](../modules/js_src.md) / Client

# Class: Client

[js/src](../modules/js_src.md).Client

## Table of contents

### Constructors

- [constructor](js_src.Client.md#constructor)

### Properties

- [\_grpcClient](js_src.Client.md#_grpcclient)

### Methods

- [getAllAmpMessagesByFid](js_src.Client.md#getallampmessagesbyfid)
- [getAllCastMessagesByFid](js_src.Client.md#getallcastmessagesbyfid)
- [getAllReactionMessagesByFid](js_src.Client.md#getallreactionmessagesbyfid)
- [getAllSignerMessagesByFid](js_src.Client.md#getallsignermessagesbyfid)
- [getAllUserDataMessagesByFid](js_src.Client.md#getalluserdatamessagesbyfid)
- [getAllVerificationMessagesByFid](js_src.Client.md#getallverificationmessagesbyfid)
- [getAmp](js_src.Client.md#getamp)
- [getAmpsByFid](js_src.Client.md#getampsbyfid)
- [getAmpsByUser](js_src.Client.md#getampsbyuser)
- [getCast](js_src.Client.md#getcast)
- [getCastsByFid](js_src.Client.md#getcastsbyfid)
- [getCastsByMention](js_src.Client.md#getcastsbymention)
- [getCastsByParent](js_src.Client.md#getcastsbyparent)
- [getIdRegistryEvent](js_src.Client.md#getidregistryevent)
- [getNameRegistryEvent](js_src.Client.md#getnameregistryevent)
- [getReaction](js_src.Client.md#getreaction)
- [getReactionsByCast](js_src.Client.md#getreactionsbycast)
- [getReactionsByFid](js_src.Client.md#getreactionsbyfid)
- [getSigner](js_src.Client.md#getsigner)
- [getSignersByFid](js_src.Client.md#getsignersbyfid)
- [getUserData](js_src.Client.md#getuserdata)
- [getUserDataByFid](js_src.Client.md#getuserdatabyfid)
- [getVerification](js_src.Client.md#getverification)
- [getVerificationsByFid](js_src.Client.md#getverificationsbyfid)
- [submitMessage](js_src.Client.md#submitmessage)
- [subscribe](js_src.Client.md#subscribe)

## Constructors

### constructor

• **new Client**(`address`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Defined in

[js/src/client.ts:42](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L42)

## Properties

### \_grpcClient

• **\_grpcClient**: `HubRpcClient`

#### Defined in

[js/src/client.ts:40](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L40)

## Methods

### getAllAmpMessagesByFid

▸ **getAllAmpMessagesByFid**(`fid`): `HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`AmpAddData`](../modules/js_src.types.md#ampadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`AmpRemoveData`](../modules/js_src.types.md#ampremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`AmpAddData`](../modules/js_src.types.md#ampadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`AmpRemoveData`](../modules/js_src.types.md#ampremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

#### Defined in

[js/src/client.ts:110](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L110)

___

### getAllCastMessagesByFid

▸ **getAllCastMessagesByFid**(`fid`): `HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`CastAddData`](../modules/js_src.types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`CastRemoveData`](../modules/js_src.types.md#castremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`CastAddData`](../modules/js_src.types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`CastRemoveData`](../modules/js_src.types.md#castremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

#### Defined in

[js/src/client.ts:86](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L86)

___

### getAllReactionMessagesByFid

▸ **getAllReactionMessagesByFid**(`fid`): `HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/js_src.types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`ReactionRemoveData`](../modules/js_src.types.md#reactionremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/js_src.types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`ReactionRemoveData`](../modules/js_src.types.md#reactionremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

#### Defined in

[js/src/client.ts:157](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L157)

___

### getAllSignerMessagesByFid

▸ **getAllSignerMessagesByFid**(`fid`): `HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`SignerAddData`](../modules/js_src.types.md#signeradddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`SignerRemoveData`](../modules/js_src.types.md#signerremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`SignerAddData`](../modules/js_src.types.md#signeradddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`SignerRemoveData`](../modules/js_src.types.md#signerremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

#### Defined in

[js/src/client.ts:207](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L207)

___

### getAllUserDataMessagesByFid

▸ **getAllUserDataMessagesByFid**(`fid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`UserDataAddData`](../modules/js_src.types.md#userdataadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`UserDataAddData`](../modules/js_src.types.md#userdataadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Defined in

[js/src/client.ts:226](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L226)

___

### getAllVerificationMessagesByFid

▸ **getAllVerificationMessagesByFid**(`fid`): `HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`VerificationAddEthAddressData`](../modules/js_src.types.md#verificationaddethaddressdata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`VerificationRemoveData`](../modules/js_src.types.md#verificationremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`VerificationAddEthAddressData`](../modules/js_src.types.md#verificationaddethaddressdata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`VerificationRemoveData`](../modules/js_src.types.md#verificationremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

#### Defined in

[js/src/client.ts:182](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L182)

___

### getAmp

▸ **getAmp**(`fid`, `targetFid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`AmpAddData`](../modules/js_src.types.md#ampadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `targetFid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`AmpAddData`](../modules/js_src.types.md#ampadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/client.ts:95](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L95)

___

### getAmpsByFid

▸ **getAmpsByFid**(`fid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`AmpAddData`](../modules/js_src.types.md#ampadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`AmpAddData`](../modules/js_src.types.md#ampadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Defined in

[js/src/client.ts:100](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L100)

___

### getAmpsByUser

▸ **getAmpsByUser**(`targetFid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`AmpAddData`](../modules/js_src.types.md#ampadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetFid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`AmpAddData`](../modules/js_src.types.md#ampadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Defined in

[js/src/client.ts:105](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L105)

___

### getCast

▸ **getCast**(`fid`, `hash`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`CastAddData`](../modules/js_src.types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `hash` | `string` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`CastAddData`](../modules/js_src.types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/client.ts:58](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L58)

___

### getCastsByFid

▸ **getCastsByFid**(`fid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`CastAddData`](../modules/js_src.types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`CastAddData`](../modules/js_src.types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Defined in

[js/src/client.ts:67](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L67)

___

### getCastsByMention

▸ **getCastsByMention**(`mentionFid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`CastAddData`](../modules/js_src.types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `mentionFid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`CastAddData`](../modules/js_src.types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Defined in

[js/src/client.ts:81](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L81)

___

### getCastsByParent

▸ **getCastsByParent**(`parent`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`CastAddData`](../modules/js_src.types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `parent` | [`CastId`](../modules/js_src.types.md#castid) |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`CastAddData`](../modules/js_src.types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Defined in

[js/src/client.ts:72](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L72)

___

### getIdRegistryEvent

▸ **getIdRegistryEvent**(`fid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`IdRegistryEvent`](../modules/js_src.protobufs.md#idregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `fid`: `number` ; `from`: `undefined` \| `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`IdRegistryEventType`](../enums/js_src.protobufs.IdRegistryEventType.md)  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`IdRegistryEvent`](../modules/js_src.protobufs.md#idregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `fid`: `number` ; `from`: `undefined` \| `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`IdRegistryEventType`](../enums/js_src.protobufs.IdRegistryEventType.md)  }\>\>

#### Defined in

[js/src/client.ts:235](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L235)

___

### getNameRegistryEvent

▸ **getNameRegistryEvent**(`fname`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`NameRegistryEvent`](../modules/js_src.protobufs.md#nameregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `expiry`: `undefined` \| `number` ; `fname`: `string` ; `from`: `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`NameRegistryEventType`](../enums/js_src.protobufs.NameRegistryEventType.md)  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fname` | `string` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`NameRegistryEvent`](../modules/js_src.protobufs.md#nameregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `expiry`: `undefined` \| `number` ; `fname`: `string` ; `from`: `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`NameRegistryEventType`](../enums/js_src.protobufs.NameRegistryEventType.md)  }\>\>

#### Defined in

[js/src/client.ts:240](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L240)

___

### getReaction

▸ **getReaction**(`fid`, `type`, `cast`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/js_src.types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `type` | [`ReactionType`](../enums/js_src.protobufs.ReactionType.md) |
| `cast` | [`CastId`](../modules/js_src.types.md#castid) |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/js_src.types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/client.ts:119](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L119)

___

### getReactionsByCast

▸ **getReactionsByCast**(`cast`, `type?`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/js_src.types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `cast` | [`CastId`](../modules/js_src.types.md#castid) |
| `type?` | [`ReactionType`](../enums/js_src.protobufs.ReactionType.md) |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/js_src.types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Defined in

[js/src/client.ts:145](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L145)

___

### getReactionsByFid

▸ **getReactionsByFid**(`fid`, `type?`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/js_src.types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `type?` | [`ReactionType`](../enums/js_src.protobufs.ReactionType.md) |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/js_src.types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Defined in

[js/src/client.ts:137](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L137)

___

### getSigner

▸ **getSigner**(`fid`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`SignerAddData`](../modules/js_src.types.md#signeradddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `signer` | `string` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`SignerAddData`](../modules/js_src.types.md#signeradddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/client.ts:193](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L193)

___

### getSignersByFid

▸ **getSignersByFid**(`fid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`SignerAddData`](../modules/js_src.types.md#signeradddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`SignerAddData`](../modules/js_src.types.md#signeradddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Defined in

[js/src/client.ts:202](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L202)

___

### getUserData

▸ **getUserData**(`fid`, `type`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`UserDataAddData`](../modules/js_src.types.md#userdataadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `type` | [`UserDataType`](../enums/js_src.protobufs.UserDataType.md) |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`UserDataAddData`](../modules/js_src.types.md#userdataadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/client.ts:216](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L216)

___

### getUserDataByFid

▸ **getUserDataByFid**(`fid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`UserDataAddData`](../modules/js_src.types.md#userdataadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`UserDataAddData`](../modules/js_src.types.md#userdataadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Defined in

[js/src/client.ts:221](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L221)

___

### getVerification

▸ **getVerification**(`fid`, `address`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`VerificationAddEthAddressData`](../modules/js_src.types.md#verificationaddethaddressdata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `address` | `string` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`VerificationAddEthAddressData`](../modules/js_src.types.md#verificationaddethaddressdata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/client.ts:168](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L168)

___

### getVerificationsByFid

▸ **getVerificationsByFid**(`fid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`VerificationAddEthAddressData`](../modules/js_src.types.md#verificationaddethaddressdata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`VerificationAddEthAddressData`](../modules/js_src.types.md#verificationaddethaddressdata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

#### Defined in

[js/src/client.ts:177](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L177)

___

### submitMessage

▸ **submitMessage**(`message`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`MessageData`](../modules/js_src.types.md#messagedata)<[`MessageBody`](../modules/js_src.types.md#messagebody), [`MessageType`](../enums/js_src.protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`MessageData`](../modules/js_src.types.md#messagedata)<[`MessageBody`](../modules/js_src.types.md#messagebody), [`MessageType`](../enums/js_src.protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\> |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/js_src.protobufs.md#message) ; `data`: [`MessageData`](../modules/js_src.types.md#messagedata)<[`MessageBody`](../modules/js_src.types.md#messagebody), [`MessageType`](../enums/js_src.protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/client.ts:50](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L50)

___

### subscribe

▸ **subscribe**(`filters?`): `Promise`<`HubResult`<`ClientReadableStream`<[`EventResponse`](../modules/js_src.protobufs.md#eventresponse)\>\>\>

Data from this stream can be parsed using `deserializeEventResponse`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `filters` | [`EventFilters`](../modules/js_src.md#eventfilters) |

#### Returns

`Promise`<`HubResult`<`ClientReadableStream`<[`EventResponse`](../modules/js_src.protobufs.md#eventresponse)\>\>\>

#### Defined in

[js/src/client.ts:257](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/client.ts#L257)
