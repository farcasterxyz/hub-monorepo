---
"@farcaster/shuttle": major
---

feat(shuttle): add `OnChainEventReconciliation` and a typed `onchain_events` table

Adds first-class support for reconciling on-chain events between the hub
and the local database, mirroring the structure of
`MessageReconciliation`.

Highlights:

- New `OnChainEventReconciliation` class (in
  `src/shuttle/onChainEventReconciliation.ts`) with
  `reconcileOnChainEventsForFid` / `reconcileOnChainEventsOfTypeForFid`.
  Both methods take an **options object** (rather than positional
  arguments) so the optional `onDbOnChainEvent` callback isn't a
  landmine sitting between the hub callback and the time-window
  arguments. The DB-side pass is opt-in via that callback. By default
  it covers `ID_REGISTER`, `SIGNER`, `SIGNER_MIGRATED`, `STORAGE_RENT`
  and `TIER_PURCHASE` events. The new `RECONCILABLE_ONCHAIN_EVENT_TYPES`
  const + `ReconcilableOnChainEventType` type pin the public `types`
  parameter to only the event kinds the reconciler actually has hub-
  side fetch logic for.

- `startTimestamp` / `stopTimestamp` are Farcaster timestamp numbers
  (matching `MessageReconciliation`), validated once up front in the
  outer call, so input handling is consistent whether or not
  `onDbOnChainEvent` is provided.

- Promotes `onchain_events` to a typed table on `HubTables`, with new
  exports `OnChainEventsTable`, `OnChainEventRow`,
  `InsertableOnChainEventRow`, and `OnChainEventBodyJson`. Body shapes
  are now JSON-safe (every protobuf `Uint8Array` field — e.g.
  `IdRegisterEventBody.to`, `TierPurchaseBody.payer` — is exposed as a
  `0x`-prefixed string), so values round-trip through a Postgres `json`
  column without being persisted as numeric-index objects. `chainId` /
  `blockNumber` are typed as `number` to match the package's global
  `int8` → JS `number` pg parser; declaring them as `bigint` (the
  literal Postgres type) would silently mislead consumers and break
  the IN-list comparisons used by reconciliation.

- Updates the example-app accordingly: migration `003_onchain_events`
  now includes `chainId` and uses `blockTimestamp` (matching the hub
  event payload), and the example handler records signer-migrated and
  tier-purchase events alongside the existing ID-register / signer /
  storage-rent ones.

- Adds integration test coverage for `OnChainEventReconciliation`:
  a regression test for the `chainId` / `blockNumber` IN-list
  comparison (now that those columns deserialize as JS `number`),
  hub-only and DB-only flagging, and the `types` filter.

Marked as a major release because the new `onchain_events` field on the
exported `HubTables` interface is a breaking change for consumers that
already extend `HubTables` with their own `onchain_events` shape, and
the example-app migration renames/adds columns relative to the prior
example schema.
