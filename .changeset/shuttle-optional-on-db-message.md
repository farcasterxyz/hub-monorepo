---
"@farcaster/shuttle": minor
---

feat(shuttle): allow disabling DB-side reconciliation and filtering message types

`MessageReconciliation` now lets callers opt out of the
"DB messages missing from the hub" pass, which is useful during initial
backfills where every DB row is missing from the hub by definition and
streaming each one through the callback is just wasted work.

- `onDbMessage` is now optional on both `reconcileMessagesForFid` and
  `reconcileMessagesOfTypeForFid`. When omitted, the DB-side scan is
  skipped entirely (no `allActiveDbMessagesOfTypeForFid` call) and the
  per-message hub-hash map that the DB pass needed is no longer
  populated, removing a per-FID memory cost on large backfills.
- `reconcileMessagesForFid` accepts a new optional
  `types: ReconcilableMessageType[]` parameter to restrict
  reconciliation to a subset of message types (e.g. only `LEND_STORAGE`
  after a hub backfill of just that type). The new
  `RECONCILABLE_MESSAGE_TYPES` const + `ReconcilableMessageType` type
  pin this to the message types `MessageReconciliation` actually has
  hub-side RPCs for, so passing e.g. `CAST_REMOVE` is a compile-time
  error instead of a runtime "Unknown message type" throw.
- `DBMessage` is now exported so consumers can type their `onDbMessage`
  callback without re-declaring the row shape.
- Time-window resolution (`fromFarcasterTime` of `startTimestamp` /
  `stopTimestamp`) now happens once up front in
  `reconcileMessagesForFid` / `reconcileMessagesOfTypeForFid` instead
  of per-type inside the DB pass, so input handling is consistent
  whether or not `onDbMessage` is provided.
- Bonus: fixes a stale `@farcaster/hub-shuttle` import in the example
  app that would otherwise fail `tsc --noEmit`.

No behavior change for existing callers that pass an `onDbMessage`
callback.
