---
"@farcaster/shuttle": patch
---

fix(shuttle): swallow `xtrim` errors when the Redis connection is no longer ready

During process shutdown the periodic `HubEventStreamConsumer.clearOldEvents`
timer can still fire while the underlying ioredis client is closing. The
follow-up `xtrim` call against the closed connection produces unhandled
promise rejections.

`EventStreamConnection.trim` now wraps the `xtrim` call in a try/catch:
if it fails *and* the client is no longer in a `"ready"` state, the
error is swallowed (xtrim is best-effort periodic maintenance, the next
invocation against a fresh client will catch up). Any other failure is
rethrown so real errors stay visible.
