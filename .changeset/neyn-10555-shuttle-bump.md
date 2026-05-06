---
"@farcaster/shuttle": patch
---

chore: rebuild against `@farcaster/hub-nodejs@0.15.11` so the rolled-up
`.d.ts` re-exports the new V16 types (`KeyAddMessage` / `KeyRemoveMessage` /
`SignerInfo` / `SignersByFidRequest` / etc.) for consumers importing them
through `@farcaster/shuttle`. No source change.
