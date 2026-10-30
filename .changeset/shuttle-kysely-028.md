---
"@farcaster/shuttle": major
---

Upgrade kysely to ^0.28.17 to pick up fixes for CVE-2026-32763, CVE-2026-33468 and CVE-2026-44635.

Breaking: the exported `DB` and `DBTransaction` types are now built on kysely 0.28. Kysely instances from different versions are not type-compatible, so applications that pass their own `Kysely` instance or transaction into Shuttle (for example `MessageReconciliation` or `MessageProcessor.storeMessage`) need to be on kysely 0.28 as well.
