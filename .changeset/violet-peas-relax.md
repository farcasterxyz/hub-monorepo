---
"@farcaster/hubble": patch
---

feat(hubble): Add support for using S3 snapshot for "catch up" sync. Snapshot metadata is used to determine whether snapshot should be used. If metadata JSON is missing attribute for message count, conservative heuristics are used to prefer using snapshot.
