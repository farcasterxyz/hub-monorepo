---
"@farcaster/shuttle": major
---

feat(shuttle): add `UsernameProofReconciliation` and a typed `usernames` table

Adds first-class support for reconciling username proofs (`fname`,
`ENS L1`, basenames) between the hub and the local database, mirroring
the structure of `MessageReconciliation`:

- New `UsernameProofReconciliation` class (in
  `src/shuttle/usernameProofReconciliation.ts`) with
  `reconcileUsernameProofsForFid` /
  `reconcileUsernameProofsOfTypeForFid`. The hub-side pass is always
  run, and the DB-side pass is opt-in via an `onDbProof` callback.

- Promotes `usernames` to a typed table on `HubTables`, with new
  exports `UsernamesTable`, `UsernameRow`, `InsertableUsernameRow`.
  Adds an `004_usernames` migration to the example app.

Marked as a major release because the new `usernames` field on the
exported `HubTables` interface is a breaking change for consumers that
already extend `HubTables` with their own `usernames` table shape.
