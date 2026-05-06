---
"@farcaster/core": patch
"@farcaster/hub-nodejs": patch
"@farcaster/hub-web": patch
---

feat: pull in snapchain V16 protos (signers and scopes / gasless signers)

Regenerates protobuf bindings against snapchain `e8e89a3`, the client
surface for engine version V16 (`LATEST_PROTOCOL_VERSION` 10 → 11;
`ProtocolFeature::GaslessSigners` gate). V16 activates testnet
2026-04-28 20:00 UTC and mainnet 2026-05-07 17:00 UTC.

- `MESSAGE_TYPE_KEY_ADD` (16) and `MESSAGE_TYPE_KEY_REMOVE` (17) on
  `MessageType`, plus `KeyAddBody` / `KeyRemoveBody` and corresponding
  `KeyAddData` / `KeyAddMessage` / `KeyRemoveData` / `KeyRemoveMessage`
  type narrowings and `isKeyAdd*` / `isKeyRemove*` typeguards in `core`.
- Backfills the previously-missing `isLendStorageData` /
  `isLendStorageMessage` typeguards.
- New unified signer surface in RPC: `GetSigner` and `GetSignersByFid`
  return both on-chain and off-chain (gasless) keys via `SignerResponse`
  and `SignersByFidResponse`. The pre-existing `GetOnChainSigner` and
  `GetOnChainSignersByFid` are now marked deprecated; existing callers
  are unaffected. The `Signer` proto message is re-exported from `core`
  as `SignerInfo` to disambiguate from the existing cryptographic
  `Signer` interface.
- `GetSignersByFid` accepts a `SignersByFidRequest` so callers can
  request current per-FID nonce counters (`current_user_nonce`,
  `requester_fid_nonces`).
- `BlocksRequest.shard_id` is removed (server already ignored it; field
  number `1` is `reserved` on the wire).

Adds `LendStorage*`, `KeyAdd*`, and `KeyRemove*` factories plus runtime
tests for the new typeguards.
