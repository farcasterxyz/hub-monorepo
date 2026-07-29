---
"@farcaster/core": minor
"@farcaster/hub-nodejs": minor
"@farcaster/hub-web": minor
---

feat: builders and EIP-712 helpers for gasless signers (FIP-272)

The V16 protos for `KEY_ADD` / `KEY_REMOVE` shipped in 0.18.11, but nothing above the wire
format did — callers had to hand-roll the EIP-712 signatures and ABI encoding. This adds the
missing layer.

**BREAKING for custom `Eip712Signer` subclasses.** Four abstract methods are added to
`Eip712Signer`; any class extending it outside this repo must implement them to compile. All
four bundled signers (`ViemLocalEip712Signer`, `ViemWalletEip712Signer`, `EthersEip712Signer`,
`EthersV5Eip712Signer`) are updated. Callers that only *use* signers are unaffected.

- New `gaslessKeys` module: the `Farcaster KeyAdd` EIP-712 domain and its `KeyAdd`,
  `KeyRemove` and `SignedKeyRequest` types, `verifyKeyAdd` / `verifyKeyRemove` /
  `verifyGaslessKeyRequest`, metadata encode/decode, and the protocol constants
  (`MAX_KEY_TTL_SECONDS`, `MAX_KEY_ADD_SCOPES`, `MAX_GASLESS_KEYS_PER_FID`,
  `ADMISSIBLE_KEY_ADD_SCOPES`, key and signature type discriminants).
- New `Eip712Signer` methods: `signKeyAdd`, `signKeyRemove`, `signGaslessKeyRequest` and
  `getGaslessSignedKeyRequestMetadata`.
- New builders: `makeKeyAddBody`, `makeKeyRemoveBody`, `makeKeyRemoveBodySelfRevoke`,
  `makeKeyAdd`, `makeKeyAddData`, `makeKeyRemove`, `makeKeyRemoveData`.
- `validations.validateKeyAddBody` and `validateKeyRemoveBody`, wired into
  `validateMessageData` so `KEY_ADD` / `KEY_REMOVE` are no longer rejected as
  `bodyType is invalid`. `validateKeyAddBody` also decodes the `SignedKeyRequest`
  metadata blob and, given the enclosing `MessageData.timestamp`, rejects an expired
  one — matching `verify_signed_key_request_metadata` so an authorization that the
  node would reject fails before submit rather than at merge time. It compares
  against the message's own timestamp, not wall-clock, so replaying a valid old
  message stays deterministic.

Note that snapchain's `SignedKeyRequest` shares a struct name with the onchain
`SignedKeyRequestValidator` flow but uses a different EIP-712 domain — `Farcaster KeyAdd`,
chainId 1, no `verifyingContract`. The existing `signKeyRequest` and
`getSignedKeyRequestMetadata` remain the onchain versions and produce signatures snapchain
rejects; the `Gasless`-prefixed methods are their off-chain counterparts. The two are not
interchangeable.
