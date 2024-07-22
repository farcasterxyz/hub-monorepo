# @farcaster/hub-shuttle

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
