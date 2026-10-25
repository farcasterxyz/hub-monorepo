---
"@farcaster/core": minor
"@farcaster/hub-nodejs": minor
"@farcaster/hub-web": minor
---

Regenerate protobufs for `CastAddBody.formatVersion` and the optional `CastAddBody.chain` field (`ChainCast`) from FIP: Cast Format and Chained Casts. Like `type`, `formatVersion` is a required property of `CastAddBody`. An object literal passed to `makeCastAdd` needs `formatVersion: 0` (plain text). `CastAddBody.create()` sets it to 0. Before protocol version V22, nodes accept any bytes in field 10. `MessageData.decode` throws on a cast whose field 10 does not decode as a `ChainCast`.
