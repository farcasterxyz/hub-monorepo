# @farcaster/hub-shuttle

## 0.8.2

### Patch Changes

- 8877a5f7: chore: add logging for event stream monitor

## 0.8.1

### Patch Changes

- 54dd939c: fix: revert changes to the event stream to process events in order

## 0.8.0

### Minor Changes

- 4a2d8e29: feat: process events from stream in order

## 0.7.4

### Patch Changes

- 373d3fe8: fix: use shard id from event in stream monitoring

## 0.7.3

### Patch Changes

- 41b1f354: fix: only maintain counts for expected events in event stream monitoring

## 0.7.2

### Patch Changes

- 3cd6a779: fix: add custom redis key prefix for monitoring

## 0.7.1

### Patch Changes

- 77d520af: fix: track event stream stats by host
- 722acc86: feat: set up monitoring for event stream based on snapchain block numbers
- Updated dependencies [722acc86]
  - @farcaster/hub-nodejs@0.15.1

## 0.7.0

### Minor Changes

- 56cf1302: chore: switch to generating client libraries off snapchain protos

### Patch Changes

- 56cf1302: chore: add typeguards for BlockConfirmed event
- Updated dependencies [56cf1302]
- Updated dependencies [56cf1302]
  - @farcaster/hub-nodejs@0.15.0

## 0.6.18

### Patch Changes

- 1af3e7de: fix: Shuttle should respect validate messages flag everywhere

## 0.6.17

### Patch Changes

- 1290c93c: fix: Fix event timestamp calculation for snapchain
  - @farcaster/hub-nodejs@0.14.1

## 0.6.16

### Patch Changes

- Updated dependencies [6307171a]
  - @farcaster/hub-nodejs@0.14.0

## 0.6.15

### Patch Changes

- e26f69bf: feat: Add snapchain fields to hub event
- e26f69bf: fix: Populate data and dataBytes for better compatibility
- Updated dependencies [e26f69bf]
- Updated dependencies [e26f69bf]
  - @farcaster/hub-nodejs@0.13.4

## 0.6.14

### Patch Changes

- Updated dependencies [846336ea]
  - @farcaster/hub-nodejs@0.13.0

## 0.6.13

### Patch Changes

- 63eb1407: feat: add envvars to shuttle for consuming from snapchain

## 0.6.12

### Patch Changes

- a302bcd1: feat(shuttle): Revert unsafe "Support deleting messages on DB that are missing on hub" #2341

## 0.6.11

### Patch Changes

- d34a86df: fix: Use statsd host from env

## 0.6.10

### Patch Changes

- 07aaf852: fix: Make fallback to rpc in more cases when reconcile stream errors

## 0.6.9

### Patch Changes

- a9c45a3d: feat(shuttle): Pipe connectionTimeout arg through EventStreamHubSubscriber
- 99982106: chore: add event timestamp metric for event subscription monitoring

## 0.6.8

### Patch Changes

- 727041cb: feat(shuttle): Parametrize hub connection timeouts for HubSubscriber and MessageReconciliation
- Updated dependencies [91b77204]
  - @farcaster/hub-nodejs@0.12.6

## 0.6.7

### Patch Changes

- d06fbda8: fix: handle timed out connections from hub event subscriber

## 0.6.6

### Patch Changes

- 386059ac: fix: gracefully handle streaming hangups when the server dies unexpectedly

## 0.6.5

### Patch Changes

- 64084968: feat(shuttle): Support deleting messages on DB that are missing on hub
- 8dfe9843: fix: restore start/stop times for reconcileMessagesForFid
  - @farcaster/hub-nodejs@0.12.4

## 0.6.4

### Patch Changes

- 2de0697e: chore: upgrade hub-nodejs dependency so interfaces align

## 0.6.3

### Patch Changes

- f6ba2b09: chore: add metric for events processed with event type tag

## 0.6.2

### Patch Changes

- 4e897e9a: chore: add more metrics to HubSubscriber
- b7a0f402: chore: add event kind and stale/not stale tags to event processing metrics

## 0.6.1

### Patch Changes

- 78342c3d: feat: switch shuttle to use stream fetch

## 0.6.0

### Minor Changes

- 7eba6ee0: feat: Support event level callbacks in shuttle

### Patch Changes

- 49ecf50e: fix: reconciliation wasn't actually using time bounds for hub rpcs
- 2bf64461: fix: Update onHubEvent to accept a txn for consistency

## 0.5.13

### Patch Changes

- 70d1f830: feat: add time range option for reconciliation
- Updated dependencies [cc0d0a3e]
  - @farcaster/hub-nodejs@0.12.1

## 0.5.12

### Patch Changes

- Updated dependencies [dd634c79]
  - @farcaster/hub-nodejs@0.12.0

## 0.5.11

### Patch Changes

- 768dc875: fix: Reduce reconciliation default pagination size
- Updated dependencies [47fbd34e]
  - @farcaster/hub-nodejs@0.11.24

## 0.5.10

### Patch Changes

- 165a0aac: fix(shuttle): Add missing `await` to per-iteration `sleep()` call
- Updated dependencies [939dde84]
  - @farcaster/hub-nodejs@0.11.23

## 0.5.9

### Patch Changes

- 5d5b3273: Fix CPU throttling regression introduced in 0.5.6 by trim optimization
- Updated dependencies [939dde84]
  - @farcaster/hub-nodejs@0.11.23

## 0.5.8

### Patch Changes

- 4f40c19b: fix: Do not validate messages in shuttle by default
- Updated dependencies [2fa29ad4]
  - @farcaster/hub-nodejs@0.11.22

## 0.5.7

### Patch Changes

- ee0947ec: fix: on conflict criteria is ambiguous and cannot be used for upsert
  - @farcaster/hub-nodejs@0.11.21

## 0.5.6

### Patch Changes

- e5760da0: Trim stream at regular interval instead of every loop
- fc67ccf0: Stop recording stream size
  - @farcaster/hub-nodejs@0.11.20

## 0.5.5

### Patch Changes

- a5262796: Switch before/after hooks to work with batches for efficiency
  - @farcaster/hub-nodejs@0.11.20

## 0.5.4

### Patch Changes

- 41f32cd0: Add support for running before/after hooks when processing events

## 0.5.3

### Patch Changes

- 57b9c6ab: Re-build package

## 0.5.2

### Patch Changes

- a8b69a07: feat: make message processor handle removals for compact state explicitly, warn on mismatching deletes
- cc357b4b: feat(shuttle): Enables shuttle and its example-app to optionally use a postgres schema other than "public"

## 0.5.1

### Patch Changes

- Fix reset of limit for total batch bytes

## 0.5.0

### Minor Changes

- Support customization of event batch size and time between flushes

## 0.4.4

### Patch Changes

- 864261b7: feat(shuttle) Allow Redis client to be a cluster instance

## 0.4.3

### Patch Changes

- 45180584: Gracefully handle "no such key" when querying group on first start

## 0.4.2

### Patch Changes

- fad0f179: Switch where clause to use more efficient form

## 0.4.1

### Patch Changes

- fix: Bump max receive size to fix resource exhaustion error

## 0.4.0

### Minor Changes

- ad281729: Link reconciliation now calls the compact state rpc as well

### Patch Changes

- 76c0504f: Lower level of shuttle logs to debug
- dab95118: Add rpc to expose LinkCompactStateMessage + explicit handling of type
- Updated dependencies [dab95118]
  - @farcaster/hub-nodejs@0.11.17

## 0.3.3

### Patch Changes

- fix: Fix shuttle hub-nodejs version dep to support long casts

## 0.3.2

### Patch Changes

- feat(shuttle): store cast type in message body

## 0.3.1

### Patch Changes

- 87796697: Export multiple signatures for farcasterTimeToDate
  - @farcaster/hub-nodejs@0.11.15

## 0.3.0

### Minor Changes

- bb707b1e: feat: Add support for reverse reconciliation

### Patch Changes

- Updated dependencies [87c4f416]
  - @farcaster/hub-nodejs@0.11.13

## 0.2.8

### Patch Changes

- f784afd2: feat: support link compact state message in shuttle
- Updated dependencies [7b374890]
  - @farcaster/hub-nodejs@0.11.11

## 0.2.7

### Patch Changes

- 1b502fc2: Allow skipping validation when storing message

## 0.2.6

### Patch Changes

- 7490ff5d: Switch from @figma/hot-shots to @farcaster/hot-shots
- afa31270: Stop DNS lookups for loopback address in statsd calls

## 0.2.5

### Patch Changes

- 20c4ef64: Validate merge messages only when storing messages

## 0.2.4

### Patch Changes

- 30b8d64f: fix: increase hub timeout limit
- 80aadc6a: Buffer statsd calls before sending on socket
- 589e5770: fix: Preserve redis stream backwards compatibility
- 0c1ab37f: feat: add fid sharding

## 0.2.3

### Patch Changes

- feat(shuttle): add message state to handler

## 0.2.2

### Patch Changes

- fix: ack the correct group name to fix stale bug

## 0.2.1

### Patch Changes

- feat(shuttle): Make event stream more customizable

## 0.2.0

### Minor Changes

- chore: Rename to shuttle and release beta

## 0.1.6

### Patch Changes

- feat(shuttle): support prune, revokes and deletes
- 1051b3dd: feat: Support redis streams for scalability and add reconciliation workers

## 0.1.5

### Patch Changes

- fix: Fix module import issue

## 0.1.4

### Patch Changes

- fix: Fix interfaces import

## 0.1.3

### Patch Changes

- feat: Refactor message reconciliation to accept function

## 0.1.2

### Patch Changes

- 86cfa4f5: fix: add missing db and redis exports to hub-shuttle
- 5282c730: fix: add support for windows file paths in example hub-shuttle app

## 0.1.1

### Patch Changes

- fix: update exports

## 0.1.0

### Minor Changes

- 31d54545: feat: initial release of hub-shuttle
