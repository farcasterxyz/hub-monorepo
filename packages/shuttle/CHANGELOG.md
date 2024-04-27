# @farcaster/hub-shuttle

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
