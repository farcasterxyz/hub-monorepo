[hubble](../README.md) / [Modules](../modules.md) / js/src

# Module: js/src

## Table of contents

### Namespaces

- [protobufs](js_src.protobufs.md)
- [types](js_src.types.md)
- [utils](js_src.utils.md)

### Classes

- [Client](../classes/js_src.Client.md)
- [Ed25519Signer](../classes/js_src.Ed25519Signer.md)
- [Eip712Signer](../classes/js_src.Eip712Signer.md)

### Type Aliases

- [EventFilters](js_src.md#eventfilters)

### Functions

- [makeAmpAdd](js_src.md#makeampadd)
- [makeAmpAddData](js_src.md#makeampadddata)
- [makeAmpRemove](js_src.md#makeampremove)
- [makeAmpRemoveData](js_src.md#makeampremovedata)
- [makeCastAdd](js_src.md#makecastadd)
- [makeCastAddData](js_src.md#makecastadddata)
- [makeCastRemove](js_src.md#makecastremove)
- [makeCastRemoveData](js_src.md#makecastremovedata)
- [makeMessageHash](js_src.md#makemessagehash)
- [makeMessageWithSignature](js_src.md#makemessagewithsignature)
- [makeReactionAdd](js_src.md#makereactionadd)
- [makeReactionAddData](js_src.md#makereactionadddata)
- [makeReactionRemove](js_src.md#makereactionremove)
- [makeReactionRemoveData](js_src.md#makereactionremovedata)
- [makeSignerAdd](js_src.md#makesigneradd)
- [makeSignerAddData](js_src.md#makesigneradddata)
- [makeSignerRemove](js_src.md#makesignerremove)
- [makeSignerRemoveData](js_src.md#makesignerremovedata)
- [makeUserDataAdd](js_src.md#makeuserdataadd)
- [makeUserDataAddData](js_src.md#makeuserdataadddata)
- [makeVerificationAddEthAddress](js_src.md#makeverificationaddethaddress)
- [makeVerificationAddEthAddressData](js_src.md#makeverificationaddethaddressdata)
- [makeVerificationRemove](js_src.md#makeverificationremove)
- [makeVerificationRemoveData](js_src.md#makeverificationremovedata)

## Type Aliases

### EventFilters

Ƭ **EventFilters**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `eventTypes?` | [`EventType`](../enums/js_src.protobufs.EventType.md)[] |

#### Defined in

[js/src/client.ts:7](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/client.ts#L7)

## Functions

### makeAmpAdd

▸ **makeAmpAdd**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`AmpBody`](js_src.types.md#ampbody), [`MESSAGE_TYPE_AMP_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_amp_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

Amp Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`AmpBody`](js_src.types.md#ampbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`AmpBody`](js_src.types.md#ampbody), [`MESSAGE_TYPE_AMP_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_amp_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L62)

___

### makeAmpAddData

▸ **makeAmpAddData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`AmpBody`](js_src.types.md#ampbody), [`MESSAGE_TYPE_AMP_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_amp_add)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`AmpBody`](js_src.types.md#ampbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`AmpBody`](js_src.types.md#ampbody), [`MESSAGE_TYPE_AMP_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_amp_add)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L91)

___

### makeAmpRemove

▸ **makeAmpRemove**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`AmpBody`](js_src.types.md#ampbody), [`MESSAGE_TYPE_AMP_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_amp_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`AmpBody`](js_src.types.md#ampbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`AmpBody`](js_src.types.md#ampbody), [`MESSAGE_TYPE_AMP_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_amp_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L62)

___

### makeAmpRemoveData

▸ **makeAmpRemoveData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`AmpBody`](js_src.types.md#ampbody), [`MESSAGE_TYPE_AMP_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_amp_remove)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`AmpBody`](js_src.types.md#ampbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`AmpBody`](js_src.types.md#ampbody), [`MESSAGE_TYPE_AMP_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_amp_remove)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L91)

___

### makeCastAdd

▸ **makeCastAdd**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`CastAddBody`](js_src.types.md#castaddbody), [`MESSAGE_TYPE_CAST_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_cast_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

Cast Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`CastAddBody`](js_src.types.md#castaddbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`CastAddBody`](js_src.types.md#castaddbody), [`MESSAGE_TYPE_CAST_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_cast_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L62)

___

### makeCastAddData

▸ **makeCastAddData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`CastAddBody`](js_src.types.md#castaddbody), [`MESSAGE_TYPE_CAST_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_cast_add)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`CastAddBody`](js_src.types.md#castaddbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`CastAddBody`](js_src.types.md#castaddbody), [`MESSAGE_TYPE_CAST_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_cast_add)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L91)

___

### makeCastRemove

▸ **makeCastRemove**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`CastRemoveBody`](js_src.types.md#castremovebody), [`MESSAGE_TYPE_CAST_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_cast_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`CastRemoveBody`](js_src.types.md#castremovebody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`CastRemoveBody`](js_src.types.md#castremovebody), [`MESSAGE_TYPE_CAST_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_cast_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L62)

___

### makeCastRemoveData

▸ **makeCastRemoveData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`CastRemoveBody`](js_src.types.md#castremovebody), [`MESSAGE_TYPE_CAST_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_cast_remove)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`CastRemoveBody`](js_src.types.md#castremovebody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`CastRemoveBody`](js_src.types.md#castremovebody), [`MESSAGE_TYPE_CAST_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_cast_remove)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L91)

___

### makeMessageHash

▸ **makeMessageHash**(`messageData`): `HubAsyncResult`<`string`\>

Generic Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageData` | [`MessageData`](js_src.types.md#messagedata)<[`MessageBody`](js_src.types.md#messagebody), [`MessageType`](../enums/js_src.protobufs.MessageType.md)\> |

#### Returns

`HubAsyncResult`<`string`\>

#### Defined in

[js/src/builders.ts:156](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L156)

___

### makeMessageWithSignature

▸ **makeMessageWithSignature**(`messageData`, `signerOptions`, `signature`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`MessageBody`](js_src.types.md#messagebody), [`MessageType`](../enums/js_src.protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageData` | [`MessageData`](js_src.types.md#messagedata)<[`MessageBody`](js_src.types.md#messagebody), [`MessageType`](../enums/js_src.protobufs.MessageType.md)\> |
| `signerOptions` | `MessageSignerOptions` |
| `signature` | `string` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`MessageBody`](js_src.types.md#messagebody), [`MessageType`](../enums/js_src.protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:162](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L162)

___

### makeReactionAdd

▸ **makeReactionAdd**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`ReactionBody`](js_src.types.md#reactionbody), [`MESSAGE_TYPE_REACTION_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_reaction_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

Amp Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`ReactionBody`](js_src.types.md#reactionbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`ReactionBody`](js_src.types.md#reactionbody), [`MESSAGE_TYPE_REACTION_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_reaction_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L62)

___

### makeReactionAddData

▸ **makeReactionAddData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`ReactionBody`](js_src.types.md#reactionbody), [`MESSAGE_TYPE_REACTION_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_reaction_add)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`ReactionBody`](js_src.types.md#reactionbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`ReactionBody`](js_src.types.md#reactionbody), [`MESSAGE_TYPE_REACTION_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_reaction_add)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L91)

___

### makeReactionRemove

▸ **makeReactionRemove**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`ReactionBody`](js_src.types.md#reactionbody), [`MESSAGE_TYPE_REACTION_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_reaction_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`ReactionBody`](js_src.types.md#reactionbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`ReactionBody`](js_src.types.md#reactionbody), [`MESSAGE_TYPE_REACTION_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_reaction_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L62)

___

### makeReactionRemoveData

▸ **makeReactionRemoveData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`ReactionBody`](js_src.types.md#reactionbody), [`MESSAGE_TYPE_REACTION_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_reaction_remove)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`ReactionBody`](js_src.types.md#reactionbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`ReactionBody`](js_src.types.md#reactionbody), [`MESSAGE_TYPE_REACTION_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_reaction_remove)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L91)

___

### makeSignerAdd

▸ **makeSignerAdd**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`SignerBody`](js_src.types.md#signerbody), [`MESSAGE_TYPE_SIGNER_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_signer_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

Signer Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`SignerBody`](js_src.types.md#signerbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Eip712Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`SignerBody`](js_src.types.md#signerbody), [`MESSAGE_TYPE_SIGNER_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_signer_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L62)

___

### makeSignerAddData

▸ **makeSignerAddData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`SignerBody`](js_src.types.md#signerbody), [`MESSAGE_TYPE_SIGNER_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_signer_add)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`SignerBody`](js_src.types.md#signerbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`SignerBody`](js_src.types.md#signerbody), [`MESSAGE_TYPE_SIGNER_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_signer_add)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L91)

___

### makeSignerRemove

▸ **makeSignerRemove**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`SignerBody`](js_src.types.md#signerbody), [`MESSAGE_TYPE_SIGNER_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_signer_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`SignerBody`](js_src.types.md#signerbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Eip712Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`SignerBody`](js_src.types.md#signerbody), [`MESSAGE_TYPE_SIGNER_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_signer_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L62)

___

### makeSignerRemoveData

▸ **makeSignerRemoveData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`SignerBody`](js_src.types.md#signerbody), [`MESSAGE_TYPE_SIGNER_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_signer_remove)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`SignerBody`](js_src.types.md#signerbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`SignerBody`](js_src.types.md#signerbody), [`MESSAGE_TYPE_SIGNER_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_signer_remove)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L91)

___

### makeUserDataAdd

▸ **makeUserDataAdd**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`UserDataBody`](js_src.types.md#userdatabody), [`MESSAGE_TYPE_USER_DATA_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_user_data_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

User Data Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`UserDataBody`](js_src.types.md#userdatabody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`UserDataBody`](js_src.types.md#userdatabody), [`MESSAGE_TYPE_USER_DATA_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_user_data_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L62)

___

### makeUserDataAddData

▸ **makeUserDataAddData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`UserDataBody`](js_src.types.md#userdatabody), [`MESSAGE_TYPE_USER_DATA_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_user_data_add)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`UserDataBody`](js_src.types.md#userdatabody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`UserDataBody`](js_src.types.md#userdatabody), [`MESSAGE_TYPE_USER_DATA_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_user_data_add)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L91)

___

### makeVerificationAddEthAddress

▸ **makeVerificationAddEthAddress**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`VerificationAddEthAddressBody`](js_src.types.md#verificationaddethaddressbody), [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](../enums/js_src.protobufs.MessageType.md#message_type_verification_add_eth_address)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

Verification Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`VerificationAddEthAddressBody`](js_src.types.md#verificationaddethaddressbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`VerificationAddEthAddressBody`](js_src.types.md#verificationaddethaddressbody), [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](../enums/js_src.protobufs.MessageType.md#message_type_verification_add_eth_address)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L62)

___

### makeVerificationAddEthAddressData

▸ **makeVerificationAddEthAddressData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`VerificationAddEthAddressBody`](js_src.types.md#verificationaddethaddressbody), [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](../enums/js_src.protobufs.MessageType.md#message_type_verification_add_eth_address)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`VerificationAddEthAddressBody`](js_src.types.md#verificationaddethaddressbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`VerificationAddEthAddressBody`](js_src.types.md#verificationaddethaddressbody), [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](../enums/js_src.protobufs.MessageType.md#message_type_verification_add_eth_address)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L91)

___

### makeVerificationRemove

▸ **makeVerificationRemove**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`VerificationRemoveBody`](js_src.types.md#verificationremovebody), [`MESSAGE_TYPE_VERIFICATION_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_verification_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`VerificationRemoveBody`](js_src.types.md#verificationremovebody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`VerificationRemoveBody`](js_src.types.md#verificationremovebody), [`MESSAGE_TYPE_VERIFICATION_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_verification_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/builders.ts:62](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L62)

___

### makeVerificationRemoveData

▸ **makeVerificationRemoveData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`VerificationRemoveBody`](js_src.types.md#verificationremovebody), [`MESSAGE_TYPE_VERIFICATION_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_verification_remove)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`VerificationRemoveBody`](js_src.types.md#verificationremovebody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`VerificationRemoveBody`](js_src.types.md#verificationremovebody), [`MESSAGE_TYPE_VERIFICATION_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_verification_remove)\>\>

#### Defined in

[js/src/builders.ts:91](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/builders.ts#L91)
