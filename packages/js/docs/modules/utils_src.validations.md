[hubble](../README.md) / [Modules](../modules.md) / [utils/src](utils_src.md) / validations

# Namespace: validations

[utils/src](utils_src.md).validations

## Table of contents

### Variables

- [ALLOWED\_CLOCK\_SKEW\_SECONDS](utils_src.validations.md#allowed_clock_skew_seconds)
- [EIP712\_MESSAGE\_TYPES](utils_src.validations.md#eip712_message_types)
- [FNAME\_REGEX](utils_src.validations.md#fname_regex)
- [HEX\_REGEX](utils_src.validations.md#hex_regex)

### Functions

- [validateAmpBody](utils_src.validations.md#validateampbody)
- [validateBlockHashHex](utils_src.validations.md#validateblockhashhex)
- [validateCastAddBody](utils_src.validations.md#validatecastaddbody)
- [validateCastId](utils_src.validations.md#validatecastid)
- [validateCastRemoveBody](utils_src.validations.md#validatecastremovebody)
- [validateEd25519PublicKey](utils_src.validations.md#validateed25519publickey)
- [validateEd25519PublicKeyHex](utils_src.validations.md#validateed25519publickeyhex)
- [validateEd25519ignatureHex](utils_src.validations.md#validateed25519ignaturehex)
- [validateEip712SignatureHex](utils_src.validations.md#validateeip712signaturehex)
- [validateEthAddress](utils_src.validations.md#validateethaddress)
- [validateEthAddressHex](utils_src.validations.md#validateethaddresshex)
- [validateEthBlockHash](utils_src.validations.md#validateethblockhash)
- [validateFid](utils_src.validations.md#validatefid)
- [validateFname](utils_src.validations.md#validatefname)
- [validateMessage](utils_src.validations.md#validatemessage)
- [validateMessageData](utils_src.validations.md#validatemessagedata)
- [validateMessageHash](utils_src.validations.md#validatemessagehash)
- [validateMessageHashHex](utils_src.validations.md#validatemessagehashhex)
- [validateMessageType](utils_src.validations.md#validatemessagetype)
- [validateNetwork](utils_src.validations.md#validatenetwork)
- [validateReactionBody](utils_src.validations.md#validatereactionbody)
- [validateReactionType](utils_src.validations.md#validatereactiontype)
- [validateSignerBody](utils_src.validations.md#validatesignerbody)
- [validateTransactionHashHex](utils_src.validations.md#validatetransactionhashhex)
- [validateTsHashHex](utils_src.validations.md#validatetshashhex)
- [validateUserDataAddBody](utils_src.validations.md#validateuserdataaddbody)
- [validateUserDataType](utils_src.validations.md#validateuserdatatype)
- [validateVerificationAddEthAddressBody](utils_src.validations.md#validateverificationaddethaddressbody)
- [validateVerificationAddEthAddressSignature](utils_src.validations.md#validateverificationaddethaddresssignature)
- [validateVerificationRemoveBody](utils_src.validations.md#validateverificationremovebody)

## Variables

### ALLOWED\_CLOCK\_SKEW\_SECONDS

• `Const` **ALLOWED\_CLOCK\_SKEW\_SECONDS**: `number`

Number of seconds (10 minutes) that is appropriate for clock skew

#### Defined in

[utils/src/validations.ts:11](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L11)

___

### EIP712\_MESSAGE\_TYPES

• `Const` **EIP712\_MESSAGE\_TYPES**: [`MessageType`](../enums/js_src.protobufs.MessageType.md)[]

Message types that must be signed by EIP712 signer

#### Defined in

[utils/src/validations.ts:14](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L14)

___

### FNAME\_REGEX

• `Const` **FNAME\_REGEX**: `RegExp`

#### Defined in

[utils/src/validations.ts:19](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L19)

___

### HEX\_REGEX

• `Const` **HEX\_REGEX**: `RegExp`

#### Defined in

[utils/src/validations.ts:20](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L20)

## Functions

### validateAmpBody

▸ **validateAmpBody**(`body`): [`HubResult`](utils_src.md#hubresult)<[`AmpBody`](js_src.protobufs.md#ampbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`AmpBody`](js_src.protobufs.md#ampbody) |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`AmpBody`](js_src.protobufs.md#ampbody)\>

#### Defined in

[utils/src/validations.ts:386](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L386)

___

### validateBlockHashHex

▸ **validateBlockHashHex**(`hex`): `Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hex` | `string` |

#### Returns

`Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Defined in

[utils/src/validations.ts:471](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L471)

___

### validateCastAddBody

▸ **validateCastAddBody**(`body`): [`HubResult`](utils_src.md#hubresult)<[`CastAddBody`](js_src.protobufs.md#castaddbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`CastAddBody`](js_src.protobufs.md#castaddbody) |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`CastAddBody`](js_src.protobufs.md#castaddbody)\>

#### Defined in

[utils/src/validations.ts:261](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L261)

___

### validateCastId

▸ **validateCastId**(`castId?`): [`HubResult`](utils_src.md#hubresult)<[`CastId`](js_src.protobufs.md#castid)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `castId?` | [`CastId`](js_src.protobufs.md#castid) |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`CastId`](js_src.protobufs.md#castid)\>

#### Defined in

[utils/src/validations.ts:34](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L34)

___

### validateCastRemoveBody

▸ **validateCastRemoveBody**(`body`): [`HubResult`](utils_src.md#hubresult)<[`CastRemoveBody`](js_src.protobufs.md#castremovebody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`CastRemoveBody`](js_src.protobufs.md#castremovebody) |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`CastRemoveBody`](js_src.protobufs.md#castremovebody)\>

#### Defined in

[utils/src/validations.ts:321](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L321)

___

### validateEd25519PublicKey

▸ **validateEd25519PublicKey**(`publicKey?`): [`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `publicKey?` | ``null`` \| `Uint8Array` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Defined in

[utils/src/validations.ts:85](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L85)

___

### validateEd25519PublicKeyHex

▸ **validateEd25519PublicKeyHex**(`hex`): `Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hex` | `string` |

#### Returns

`Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Defined in

[utils/src/validations.ts:471](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L471)

___

### validateEd25519ignatureHex

▸ **validateEd25519ignatureHex**(`hex`): `Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hex` | `string` |

#### Returns

`Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Defined in

[utils/src/validations.ts:471](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L471)

___

### validateEip712SignatureHex

▸ **validateEip712SignatureHex**(`hex`): `Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hex` | `string` |

#### Returns

`Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Defined in

[utils/src/validations.ts:471](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L471)

___

### validateEthAddress

▸ **validateEthAddress**(`address?`): [`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `address?` | ``null`` \| `Uint8Array` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Defined in

[utils/src/validations.ts:61](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L61)

___

### validateEthAddressHex

▸ **validateEthAddressHex**(`hex`): `Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hex` | `string` |

#### Returns

`Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Defined in

[utils/src/validations.ts:471](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L471)

___

### validateEthBlockHash

▸ **validateEthBlockHash**(`blockHash?`): [`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `blockHash?` | ``null`` \| `Uint8Array` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Defined in

[utils/src/validations.ts:73](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L73)

___

### validateFid

▸ **validateFid**(`fid?`): [`HubResult`](utils_src.md#hubresult)<`number`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid?` | ``null`` \| `number` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`number`\>

#### Defined in

[utils/src/validations.ts:45](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L45)

___

### validateFname

▸ **validateFname**<`T`\>(`fnameP?`): [`HubResult`](utils_src.md#hubresult)<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `string` \| `Uint8Array` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fnameP?` | ``null`` \| `T` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`T`\>

#### Defined in

[utils/src/validations.ts:439](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L439)

___

### validateMessage

▸ **validateMessage**(`message`): [`HubAsyncResult`](utils_src.md#hubasyncresult)<[`Message`](js_src.protobufs.md#message)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](js_src.protobufs.md#message) |

#### Returns

[`HubAsyncResult`](utils_src.md#hubasyncresult)<[`Message`](js_src.protobufs.md#message)\>

#### Defined in

[utils/src/validations.ts:97](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L97)

___

### validateMessageData

▸ **validateMessageData**(`data`): [`HubResult`](utils_src.md#hubresult)<[`MessageData`](js_src.protobufs.md#messagedata)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](js_src.protobufs.md#messagedata) |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`MessageData`](js_src.protobufs.md#messagedata)\>

#### Defined in

[utils/src/validations.ts:157](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L157)

___

### validateMessageHash

▸ **validateMessageHash**(`hash?`): [`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash?` | `Uint8Array` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Defined in

[utils/src/validations.ts:22](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L22)

___

### validateMessageHashHex

▸ **validateMessageHashHex**(`hex`): `Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hex` | `string` |

#### Returns

`Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Defined in

[utils/src/validations.ts:471](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L471)

___

### validateMessageType

▸ **validateMessageType**(`type`): [`HubResult`](utils_src.md#hubresult)<[`MessageType`](../enums/js_src.protobufs.MessageType.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `number` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`MessageType`](../enums/js_src.protobufs.MessageType.md)\>

#### Defined in

[utils/src/validations.ts:333](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L333)

___

### validateNetwork

▸ **validateNetwork**(`network`): [`HubResult`](utils_src.md#hubresult)<[`FarcasterNetwork`](../enums/js_src.protobufs.FarcasterNetwork.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `network` | `number` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`FarcasterNetwork`](../enums/js_src.protobufs.FarcasterNetwork.md)\>

#### Defined in

[utils/src/validations.ts:341](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L341)

___

### validateReactionBody

▸ **validateReactionBody**(`body`): [`HubResult`](utils_src.md#hubresult)<[`ReactionBody`](js_src.protobufs.md#reactionbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`ReactionBody`](js_src.protobufs.md#reactionbody) |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`ReactionBody`](js_src.protobufs.md#reactionbody)\>

#### Defined in

[utils/src/validations.ts:349](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L349)

___

### validateReactionType

▸ **validateReactionType**(`type`): [`HubResult`](utils_src.md#hubresult)<[`ReactionType`](../enums/js_src.protobufs.ReactionType.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `number` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`ReactionType`](../enums/js_src.protobufs.ReactionType.md)\>

#### Defined in

[utils/src/validations.ts:325](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L325)

___

### validateSignerBody

▸ **validateSignerBody**(`body`): [`HubResult`](utils_src.md#hubresult)<[`SignerBody`](js_src.protobufs.md#signerbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`SignerBody`](js_src.protobufs.md#signerbody) |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`SignerBody`](js_src.protobufs.md#signerbody)\>

#### Defined in

[utils/src/validations.ts:382](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L382)

___

### validateTransactionHashHex

▸ **validateTransactionHashHex**(`hex`): `Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hex` | `string` |

#### Returns

`Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Defined in

[utils/src/validations.ts:471](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L471)

___

### validateTsHashHex

▸ **validateTsHashHex**(`hex`): `Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hex` | `string` |

#### Returns

`Result`<`string`, [`HubError`](../classes/utils_src.HubError.md)\>

#### Defined in

[utils/src/validations.ts:471](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L471)

___

### validateUserDataAddBody

▸ **validateUserDataAddBody**(`body`): [`HubResult`](utils_src.md#hubresult)<[`UserDataBody`](js_src.protobufs.md#userdatabody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`UserDataBody`](js_src.protobufs.md#userdatabody) |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`UserDataBody`](js_src.protobufs.md#userdatabody)\>

#### Defined in

[utils/src/validations.ts:402](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L402)

___

### validateUserDataType

▸ **validateUserDataType**(`type`): [`HubResult`](utils_src.md#hubresult)<[`UserDataType`](../enums/js_src.protobufs.UserDataType.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `number` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`UserDataType`](../enums/js_src.protobufs.UserDataType.md)\>

#### Defined in

[utils/src/validations.ts:390](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L390)

___

### validateVerificationAddEthAddressBody

▸ **validateVerificationAddEthAddressBody**(`body`): [`HubResult`](utils_src.md#hubresult)<[`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody) |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody)\>

#### Defined in

[utils/src/validations.ts:358](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L358)

___

### validateVerificationAddEthAddressSignature

▸ **validateVerificationAddEthAddressSignature**(`body`, `fid`, `network`): [`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody) |
| `fid` | `number` |
| `network` | [`FarcasterNetwork`](../enums/js_src.protobufs.FarcasterNetwork.md) |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Defined in

[utils/src/validations.ts:236](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L236)

___

### validateVerificationRemoveBody

▸ **validateVerificationRemoveBody**(`body`): [`HubResult`](utils_src.md#hubresult)<[`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody) |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody)\>

#### Defined in

[utils/src/validations.ts:376](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/validations.ts#L376)
