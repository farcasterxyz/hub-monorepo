[@farcaster/js](README.md) / Exports

# @farcaster/js

## Table of contents

### Namespaces

- [protobufs](modules/protobufs.md)
- [types](modules/types.md)
- [utils](modules/utils.md)

### Classes

- [Client](classes/Client.md)
- [Ed25519Signer](classes/Ed25519Signer.md)
- [Eip712Signer](classes/Eip712Signer.md)

### Type Aliases

- [EventFilters](modules.md#eventfilters)

### Functions

- [makeAmpAdd](modules.md#makeampadd)
- [makeAmpAddData](modules.md#makeampadddata)
- [makeAmpRemove](modules.md#makeampremove)
- [makeAmpRemoveData](modules.md#makeampremovedata)
- [makeCastAdd](modules.md#makecastadd)
- [makeCastAddData](modules.md#makecastadddata)
- [makeCastRemove](modules.md#makecastremove)
- [makeCastRemoveData](modules.md#makecastremovedata)
- [makeMessageHash](modules.md#makemessagehash)
- [makeMessageWithSignature](modules.md#makemessagewithsignature)
- [makeReactionAdd](modules.md#makereactionadd)
- [makeReactionAddData](modules.md#makereactionadddata)
- [makeReactionRemove](modules.md#makereactionremove)
- [makeReactionRemoveData](modules.md#makereactionremovedata)
- [makeSignerAdd](modules.md#makesigneradd)
- [makeSignerAddData](modules.md#makesigneradddata)
- [makeSignerRemove](modules.md#makesignerremove)
- [makeSignerRemoveData](modules.md#makesignerremovedata)
- [makeUserDataAdd](modules.md#makeuserdataadd)
- [makeUserDataAddData](modules.md#makeuserdataadddata)
- [makeVerificationAddEthAddress](modules.md#makeverificationaddethaddress)
- [makeVerificationAddEthAddressData](modules.md#makeverificationaddethaddressdata)
- [makeVerificationRemove](modules.md#makeverificationremove)
- [makeVerificationRemoveData](modules.md#makeverificationremovedata)

## Type Aliases

### EventFilters

Ƭ **EventFilters**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `eventTypes?` | [`EventType`](enums/protobufs.EventType.md)[] |

#### Defined in

[js/src/client.ts:7](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/client.ts#L7)

## Functions

### makeAmpAdd

▸ **makeAmpAdd**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`AmpBody`](modules/types.md#ampbody), [`MESSAGE_TYPE_AMP_ADD`](enums/protobufs.MessageType.md#message_type_amp_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

Amp Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`AmpBody`](modules/types.md#ampbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`AmpBody`](modules/types.md#ampbody), [`MESSAGE_TYPE_AMP_ADD`](enums/protobufs.MessageType.md#message_type_amp_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L62)

___

### makeAmpAddData

▸ **makeAmpAddData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`AmpBody`](modules/types.md#ampbody), [`MESSAGE_TYPE_AMP_ADD`](enums/protobufs.MessageType.md#message_type_amp_add)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`AmpBody`](modules/types.md#ampbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`AmpBody`](modules/types.md#ampbody), [`MESSAGE_TYPE_AMP_ADD`](enums/protobufs.MessageType.md#message_type_amp_add)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L91)

___

### makeAmpRemove

▸ **makeAmpRemove**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`AmpBody`](modules/types.md#ampbody), [`MESSAGE_TYPE_AMP_REMOVE`](enums/protobufs.MessageType.md#message_type_amp_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`AmpBody`](modules/types.md#ampbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`AmpBody`](modules/types.md#ampbody), [`MESSAGE_TYPE_AMP_REMOVE`](enums/protobufs.MessageType.md#message_type_amp_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L62)

___

### makeAmpRemoveData

▸ **makeAmpRemoveData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`AmpBody`](modules/types.md#ampbody), [`MESSAGE_TYPE_AMP_REMOVE`](enums/protobufs.MessageType.md#message_type_amp_remove)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`AmpBody`](modules/types.md#ampbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`AmpBody`](modules/types.md#ampbody), [`MESSAGE_TYPE_AMP_REMOVE`](enums/protobufs.MessageType.md#message_type_amp_remove)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L91)

___

### makeCastAdd

▸ **makeCastAdd**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`CastAddBody`](modules/types.md#castaddbody), [`MESSAGE_TYPE_CAST_ADD`](enums/protobufs.MessageType.md#message_type_cast_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

Cast Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`CastAddBody`](modules/types.md#castaddbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`CastAddBody`](modules/types.md#castaddbody), [`MESSAGE_TYPE_CAST_ADD`](enums/protobufs.MessageType.md#message_type_cast_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L62)

___

### makeCastAddData

▸ **makeCastAddData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`CastAddBody`](modules/types.md#castaddbody), [`MESSAGE_TYPE_CAST_ADD`](enums/protobufs.MessageType.md#message_type_cast_add)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`CastAddBody`](modules/types.md#castaddbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`CastAddBody`](modules/types.md#castaddbody), [`MESSAGE_TYPE_CAST_ADD`](enums/protobufs.MessageType.md#message_type_cast_add)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L91)

___

### makeCastRemove

▸ **makeCastRemove**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`CastRemoveBody`](modules/types.md#castremovebody), [`MESSAGE_TYPE_CAST_REMOVE`](enums/protobufs.MessageType.md#message_type_cast_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`CastRemoveBody`](modules/types.md#castremovebody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`CastRemoveBody`](modules/types.md#castremovebody), [`MESSAGE_TYPE_CAST_REMOVE`](enums/protobufs.MessageType.md#message_type_cast_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L62)

___

### makeCastRemoveData

▸ **makeCastRemoveData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`CastRemoveBody`](modules/types.md#castremovebody), [`MESSAGE_TYPE_CAST_REMOVE`](enums/protobufs.MessageType.md#message_type_cast_remove)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`CastRemoveBody`](modules/types.md#castremovebody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`CastRemoveBody`](modules/types.md#castremovebody), [`MESSAGE_TYPE_CAST_REMOVE`](enums/protobufs.MessageType.md#message_type_cast_remove)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L91)

___

### makeMessageHash

▸ **makeMessageHash**(`messageData`): `HubAsyncResult`<`string`\>

Generic Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageData` | [`MessageData`](modules/types.md#messagedata)<[`MessageBody`](modules/types.md#messagebody), [`MessageType`](enums/protobufs.MessageType.md)\> |

#### Returns

`HubAsyncResult`<`string`\>

#### Defined in

[js/src/builders.ts:156](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L156)

___

### makeMessageWithSignature

▸ **makeMessageWithSignature**(`messageData`, `signerOptions`, `signature`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`MessageBody`](modules/types.md#messagebody), [`MessageType`](enums/protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageData` | [`MessageData`](modules/types.md#messagedata)<[`MessageBody`](modules/types.md#messagebody), [`MessageType`](enums/protobufs.MessageType.md)\> |
| `signerOptions` | `MessageSignerOptions` |
| `signature` | `string` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`MessageBody`](modules/types.md#messagebody), [`MessageType`](enums/protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:162](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L162)

___

### makeReactionAdd

▸ **makeReactionAdd**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_ADD`](enums/protobufs.MessageType.md#message_type_reaction_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

Amp Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`ReactionBody`](modules/types.md#reactionbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_ADD`](enums/protobufs.MessageType.md#message_type_reaction_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L62)

___

### makeReactionAddData

▸ **makeReactionAddData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_ADD`](enums/protobufs.MessageType.md#message_type_reaction_add)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`ReactionBody`](modules/types.md#reactionbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_ADD`](enums/protobufs.MessageType.md#message_type_reaction_add)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L91)

___

### makeReactionRemove

▸ **makeReactionRemove**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_REMOVE`](enums/protobufs.MessageType.md#message_type_reaction_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`ReactionBody`](modules/types.md#reactionbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_REMOVE`](enums/protobufs.MessageType.md#message_type_reaction_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L62)

___

### makeReactionRemoveData

▸ **makeReactionRemoveData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_REMOVE`](enums/protobufs.MessageType.md#message_type_reaction_remove)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`ReactionBody`](modules/types.md#reactionbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_REMOVE`](enums/protobufs.MessageType.md#message_type_reaction_remove)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L91)

___

### makeSignerAdd

▸ **makeSignerAdd**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_ADD`](enums/protobufs.MessageType.md#message_type_signer_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

Signer Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`SignerBody`](modules/types.md#signerbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Eip712Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_ADD`](enums/protobufs.MessageType.md#message_type_signer_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L62)

___

### makeSignerAddData

▸ **makeSignerAddData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_ADD`](enums/protobufs.MessageType.md#message_type_signer_add)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`SignerBody`](modules/types.md#signerbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_ADD`](enums/protobufs.MessageType.md#message_type_signer_add)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L91)

___

### makeSignerRemove

▸ **makeSignerRemove**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_REMOVE`](enums/protobufs.MessageType.md#message_type_signer_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`SignerBody`](modules/types.md#signerbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Eip712Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_REMOVE`](enums/protobufs.MessageType.md#message_type_signer_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L62)

___

### makeSignerRemoveData

▸ **makeSignerRemoveData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_REMOVE`](enums/protobufs.MessageType.md#message_type_signer_remove)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`SignerBody`](modules/types.md#signerbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_REMOVE`](enums/protobufs.MessageType.md#message_type_signer_remove)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L91)

___

### makeUserDataAdd

▸ **makeUserDataAdd**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`UserDataBody`](modules/types.md#userdatabody), [`MESSAGE_TYPE_USER_DATA_ADD`](enums/protobufs.MessageType.md#message_type_user_data_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

User Data Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`UserDataBody`](modules/types.md#userdatabody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`UserDataBody`](modules/types.md#userdatabody), [`MESSAGE_TYPE_USER_DATA_ADD`](enums/protobufs.MessageType.md#message_type_user_data_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L62)

___

### makeUserDataAddData

▸ **makeUserDataAddData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`UserDataBody`](modules/types.md#userdatabody), [`MESSAGE_TYPE_USER_DATA_ADD`](enums/protobufs.MessageType.md#message_type_user_data_add)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`UserDataBody`](modules/types.md#userdatabody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`UserDataBody`](modules/types.md#userdatabody), [`MESSAGE_TYPE_USER_DATA_ADD`](enums/protobufs.MessageType.md#message_type_user_data_add)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L91)

___

### makeVerificationAddEthAddress

▸ **makeVerificationAddEthAddress**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`VerificationAddEthAddressBody`](modules/types.md#verificationaddethaddressbody), [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](enums/protobufs.MessageType.md#message_type_verification_add_eth_address)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

Verification Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`VerificationAddEthAddressBody`](modules/types.md#verificationaddethaddressbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`VerificationAddEthAddressBody`](modules/types.md#verificationaddethaddressbody), [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](enums/protobufs.MessageType.md#message_type_verification_add_eth_address)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L62)

___

### makeVerificationAddEthAddressData

▸ **makeVerificationAddEthAddressData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`VerificationAddEthAddressBody`](modules/types.md#verificationaddethaddressbody), [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](enums/protobufs.MessageType.md#message_type_verification_add_eth_address)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`VerificationAddEthAddressBody`](modules/types.md#verificationaddethaddressbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`VerificationAddEthAddressBody`](modules/types.md#verificationaddethaddressbody), [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](enums/protobufs.MessageType.md#message_type_verification_add_eth_address)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L91)

___

### makeVerificationRemove

▸ **makeVerificationRemove**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`VerificationRemoveBody`](modules/types.md#verificationremovebody), [`MESSAGE_TYPE_VERIFICATION_REMOVE`](enums/protobufs.MessageType.md#message_type_verification_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`VerificationRemoveBody`](modules/types.md#verificationremovebody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`VerificationRemoveBody`](modules/types.md#verificationremovebody), [`MESSAGE_TYPE_VERIFICATION_REMOVE`](enums/protobufs.MessageType.md#message_type_verification_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L62)

___

### makeVerificationRemoveData

▸ **makeVerificationRemoveData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`VerificationRemoveBody`](modules/types.md#verificationremovebody), [`MESSAGE_TYPE_VERIFICATION_REMOVE`](enums/protobufs.MessageType.md#message_type_verification_remove)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`VerificationRemoveBody`](modules/types.md#verificationremovebody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`VerificationRemoveBody`](modules/types.md#verificationremovebody), [`MESSAGE_TYPE_VERIFICATION_REMOVE`](enums/protobufs.MessageType.md#message_type_verification_remove)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/14483bd/packages/js/src/builders.ts#L91)
