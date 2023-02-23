[hubble](../README.md) / [Modules](../modules.md) / [utils/src](../modules/utils_src.md) / HubError

# Class: HubError

[utils/src](../modules/utils_src.md).HubError

HubError should be used to construct all types exceptions in the Hub.

A HubError is instantiated with a HubErrorCode that classifies the error, a context object that
provides additional information about the error. The context object can be a string, an Error,
or both and also accepts additional parameters to classify the HubError. HubErrors should never
be thrown directly and always be returned using neverthrow's Result type.

## Hierarchy

- `Error`

  ↳ **`HubError`**

## Table of contents

### Constructors

- [constructor](utils_src.HubError.md#constructor)

### Properties

- [errCode](utils_src.HubError.md#errcode)
- [presentable](utils_src.HubError.md#presentable)

## Constructors

### constructor

• **new HubError**(`errCode`, `context`)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `errCode` | [`HubErrorCode`](../modules/utils_src.md#huberrorcode) | the HubError code for this message |
| `context` | `string` \| `Error` \| `Partial`<`HubErrorOpts`\> | a message, another Error, or a HubErrorOpts |

#### Overrides

Error.constructor

#### Defined in

[utils/src/errors.ts:32](https://github.com/vinliao/hubble/blob/4e20c6c/packages/utils/src/errors.ts#L32)

## Properties

### errCode

• `Readonly` **errCode**: [`HubErrorCode`](../modules/utils_src.md#huberrorcode)

#### Defined in

[utils/src/errors.ts:23](https://github.com/vinliao/hubble/blob/4e20c6c/packages/utils/src/errors.ts#L23)

___

### presentable

• `Readonly` **presentable**: `boolean` = `false`

#### Defined in

[utils/src/errors.ts:26](https://github.com/vinliao/hubble/blob/4e20c6c/packages/utils/src/errors.ts#L26)
