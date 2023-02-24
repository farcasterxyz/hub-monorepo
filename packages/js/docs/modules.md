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
| `eventTypes?` | [`HubEventType`](enums/protobufs.HubEventType.md)[] |
| `fromId?` | `number` |

## Functions

### makeCastAdd

▸ **makeCastAdd**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`CastAddBody`](modules/types.md#castaddbody), [`MESSAGE_TYPE_CAST_ADD`](enums/protobufs.MessageType.md#message_type_cast_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

Make a message to add a cast

**`Example`**

```typescript
import {
  Client,
  Ed25519Signer,
  makeCastAdd,
  makeCastRemove,
  types,
} from '@farcaster/js';
import * as ed from '@noble/ed25519';

const rpcUrl = '<rpc-url>';
const client = new Client(rpcUrl);

const privateKeyHex = '86be7f6f8dcf18...'; // EdDSA hex private key
const privateKey = ed.utils.hexToBytes(privateKeyHex);

// _unsafeUnwrap() is used here for simplicity, but should be avoided in production
const ed25519Signer = Ed25519Signer.fromPrivateKey(privateKey)._unsafeUnwrap();

const dataOptions = {
  fid: -9999, // must be changed to fid of the custody address, or else it will fail
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
};

const cast = await makeCastAdd({ text: 'hello world' }, dataOptions, ed25519Signer);
await client.submitMessage(cast._unsafeUnwrap());
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`CastAddBody`](modules/types.md#castaddbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`CastAddBody`](modules/types.md#castaddbody), [`MESSAGE_TYPE_CAST_ADD`](enums/protobufs.MessageType.md#message_type_cast_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### makeCastAddData

▸ **makeCastAddData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`CastAddBody`](modules/types.md#castaddbody), [`MESSAGE_TYPE_CAST_ADD`](enums/protobufs.MessageType.md#message_type_cast_add)\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`CastAddBody`](modules/types.md#castaddbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`CastAddBody`](modules/types.md#castaddbody), [`MESSAGE_TYPE_CAST_ADD`](enums/protobufs.MessageType.md#message_type_cast_add)\>\>

...

___

### makeCastRemove

▸ **makeCastRemove**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`CastRemoveBody`](modules/types.md#castremovebody), [`MESSAGE_TYPE_CAST_REMOVE`](enums/protobufs.MessageType.md#message_type_cast_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`CastRemoveBody`](modules/types.md#castremovebody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`CastRemoveBody`](modules/types.md#castremovebody), [`MESSAGE_TYPE_CAST_REMOVE`](enums/protobufs.MessageType.md#message_type_cast_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### makeCastRemoveData

▸ **makeCastRemoveData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`CastRemoveBody`](modules/types.md#castremovebody), [`MESSAGE_TYPE_CAST_REMOVE`](enums/protobufs.MessageType.md#message_type_cast_remove)\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`CastRemoveBody`](modules/types.md#castremovebody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`CastRemoveBody`](modules/types.md#castremovebody), [`MESSAGE_TYPE_CAST_REMOVE`](enums/protobufs.MessageType.md#message_type_cast_remove)\>\>

...

___

### makeMessageHash

▸ **makeMessageHash**(`messageData`): `HubAsyncResult`<`string`\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageData` | [`MessageData`](modules/types.md#messagedata)<[`MessageBody`](modules/types.md#messagebody), [`MessageType`](enums/protobufs.MessageType.md)\> |

#### Returns

`HubAsyncResult`<`string`\>

...

___

### makeMessageWithSignature

▸ **makeMessageWithSignature**(`messageData`, `signerOptions`, `signature`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`MessageBody`](modules/types.md#messagebody), [`MessageType`](enums/protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageData` | [`MessageData`](modules/types.md#messagedata)<[`MessageBody`](modules/types.md#messagebody), [`MessageType`](enums/protobufs.MessageType.md)\> |
| `signerOptions` | `MessageSignerOptions` |
| `signature` | `string` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`MessageBody`](modules/types.md#messagebody), [`MessageType`](enums/protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### makeReactionAdd

▸ **makeReactionAdd**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_ADD`](enums/protobufs.MessageType.md#message_type_reaction_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`ReactionBody`](modules/types.md#reactionbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_ADD`](enums/protobufs.MessageType.md#message_type_reaction_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### makeReactionAddData

▸ **makeReactionAddData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_ADD`](enums/protobufs.MessageType.md#message_type_reaction_add)\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`ReactionBody`](modules/types.md#reactionbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_ADD`](enums/protobufs.MessageType.md#message_type_reaction_add)\>\>

...

___

### makeReactionRemove

▸ **makeReactionRemove**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_REMOVE`](enums/protobufs.MessageType.md#message_type_reaction_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`ReactionBody`](modules/types.md#reactionbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_REMOVE`](enums/protobufs.MessageType.md#message_type_reaction_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### makeReactionRemoveData

▸ **makeReactionRemoveData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_REMOVE`](enums/protobufs.MessageType.md#message_type_reaction_remove)\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`ReactionBody`](modules/types.md#reactionbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`ReactionBody`](modules/types.md#reactionbody), [`MESSAGE_TYPE_REACTION_REMOVE`](enums/protobufs.MessageType.md#message_type_reaction_remove)\>\>

...

___

### makeSignerAdd

▸ **makeSignerAdd**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_ADD`](enums/protobufs.MessageType.md#message_type_signer_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`SignerBody`](modules/types.md#signerbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Eip712Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_ADD`](enums/protobufs.MessageType.md#message_type_signer_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### makeSignerAddData

▸ **makeSignerAddData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_ADD`](enums/protobufs.MessageType.md#message_type_signer_add)\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`SignerBody`](modules/types.md#signerbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_ADD`](enums/protobufs.MessageType.md#message_type_signer_add)\>\>

...

___

### makeSignerRemove

▸ **makeSignerRemove**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_REMOVE`](enums/protobufs.MessageType.md#message_type_signer_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`SignerBody`](modules/types.md#signerbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Eip712Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_REMOVE`](enums/protobufs.MessageType.md#message_type_signer_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### makeSignerRemoveData

▸ **makeSignerRemoveData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_REMOVE`](enums/protobufs.MessageType.md#message_type_signer_remove)\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`SignerBody`](modules/types.md#signerbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`SignerBody`](modules/types.md#signerbody), [`MESSAGE_TYPE_SIGNER_REMOVE`](enums/protobufs.MessageType.md#message_type_signer_remove)\>\>

...

___

### makeUserDataAdd

▸ **makeUserDataAdd**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`UserDataBody`](modules/types.md#userdatabody), [`MESSAGE_TYPE_USER_DATA_ADD`](enums/protobufs.MessageType.md#message_type_user_data_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`UserDataBody`](modules/types.md#userdatabody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`UserDataBody`](modules/types.md#userdatabody), [`MESSAGE_TYPE_USER_DATA_ADD`](enums/protobufs.MessageType.md#message_type_user_data_add)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### makeUserDataAddData

▸ **makeUserDataAddData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`UserDataBody`](modules/types.md#userdatabody), [`MESSAGE_TYPE_USER_DATA_ADD`](enums/protobufs.MessageType.md#message_type_user_data_add)\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`UserDataBody`](modules/types.md#userdatabody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`UserDataBody`](modules/types.md#userdatabody), [`MESSAGE_TYPE_USER_DATA_ADD`](enums/protobufs.MessageType.md#message_type_user_data_add)\>\>

...

___

### makeVerificationAddEthAddress

▸ **makeVerificationAddEthAddress**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`VerificationAddEthAddressBody`](modules/types.md#verificationaddethaddressbody), [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](enums/protobufs.MessageType.md#message_type_verification_add_eth_address)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`VerificationAddEthAddressBody`](modules/types.md#verificationaddethaddressbody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`VerificationAddEthAddressBody`](modules/types.md#verificationaddethaddressbody), [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](enums/protobufs.MessageType.md#message_type_verification_add_eth_address)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### makeVerificationAddEthAddressData

▸ **makeVerificationAddEthAddressData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`VerificationAddEthAddressBody`](modules/types.md#verificationaddethaddressbody), [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](enums/protobufs.MessageType.md#message_type_verification_add_eth_address)\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`VerificationAddEthAddressBody`](modules/types.md#verificationaddethaddressbody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`VerificationAddEthAddressBody`](modules/types.md#verificationaddethaddressbody), [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](enums/protobufs.MessageType.md#message_type_verification_add_eth_address)\>\>

...

___

### makeVerificationRemove

▸ **makeVerificationRemove**(`bodyJson`, `dataOptions`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`VerificationRemoveBody`](modules/types.md#verificationremovebody), [`MESSAGE_TYPE_VERIFICATION_REMOVE`](enums/protobufs.MessageType.md#message_type_verification_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`VerificationRemoveBody`](modules/types.md#verificationremovebody) |
| `dataOptions` | `MessageDataOptions` |
| `signer` | `Ed25519Signer` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](modules/protobufs.md#message) ; `data`: [`MessageData`](modules/types.md#messagedata)<[`VerificationRemoveBody`](modules/types.md#verificationremovebody), [`MESSAGE_TYPE_VERIFICATION_REMOVE`](enums/protobufs.MessageType.md#message_type_verification_remove)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### makeVerificationRemoveData

▸ **makeVerificationRemoveData**(`bodyJson`, `dataOptions`): `HubResult`<[`MessageData`](modules/types.md#messagedata)<[`VerificationRemoveBody`](modules/types.md#verificationremovebody), [`MESSAGE_TYPE_VERIFICATION_REMOVE`](enums/protobufs.MessageType.md#message_type_verification_remove)\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `bodyJson` | [`VerificationRemoveBody`](modules/types.md#verificationremovebody) |
| `dataOptions` | `MessageDataOptions` |

#### Returns

`HubResult`<[`MessageData`](modules/types.md#messagedata)<[`VerificationRemoveBody`](modules/types.md#verificationremovebody), [`MESSAGE_TYPE_VERIFICATION_REMOVE`](enums/protobufs.MessageType.md#message_type_verification_remove)\>\>

...
