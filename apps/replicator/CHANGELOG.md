# @farcaster/replicator

## 0.3.8

### Patch Changes

- 1c9f2527: respect fnames_username_unique constraint
- 1bed6d18: Fix replicator heap out of memory
- Updated dependencies [87c4f416]
  - @farcaster/hub-nodejs@0.11.13

## 0.3.7

### Patch Changes

- 02bca881: fix(replicator): handle Hub errors in backfill

## 0.3.6

### Patch Changes

- 0b1a6862: updateTableMetrics is using too much postgresql CPU

## 0.3.5

### Patch Changes

- ff5b8cbc: Base 58 encode solana data

## 0.3.4

### Patch Changes

- f7d13376: Fix unicode error for replicator, add constraint where verification message claim signatures must be hex
  - @farcaster/hub-nodejs@0.11.6

## 0.3.3

### Patch Changes

- 5a1764d8: perf: Move DB and Reactions store to rust
- Updated dependencies [5a1764d8]
  - @farcaster/hub-nodejs@0.11.5

## 0.3.2

### Patch Changes

- addf097c: chore: update @farcaster/hub-nodejs

## 0.3.1

### Patch Changes

- a8b7dfcb: fix: Replace hot-shots with @figma/hot-shots
- Updated dependencies [5703d339]
  - @farcaster/hub-nodejs@0.11.2

## 0.3.0

### Minor Changes

- ae91b73a: Add Solana verification support

### Patch Changes

- Updated dependencies [ae91b73a]
  - @farcaster/hub-nodejs@0.11.0

## 0.2.10

### Patch Changes

- 763d3154: feat: rename some verification message fields to support more protocols
- Updated dependencies [763d3154]
  - @farcaster/hub-nodejs@0.10.24

## 0.2.9

### Patch Changes

- f8c5f280: fix: Revert verification renames which break http backwards compatibility
- Updated dependencies [f8c5f280]
  - @farcaster/hub-nodejs@0.10.23

## 0.2.8

### Patch Changes

- fd9f9ff8: Rename verification message
- Updated dependencies [fd9f9ff8]
- Updated dependencies [362f580b]
  - @farcaster/hub-nodejs@0.10.22

## 0.2.7

### Patch Changes

- 229ea166: feat: Add support for FrameAction and validateMessage
- Updated dependencies [229ea166]
  - @farcaster/hub-nodejs@0.10.21

## 0.2.6

### Patch Changes

- d8a5caaf: Include storage allocations and reactions

## 0.2.5

### Patch Changes

- 3621a9fe: Update minimum hub-nodejs version
- 406de333: Consolidate to single subscription connection

## 0.2.4

### Patch Changes

- 24357fd5: Increment minimum hub-nodejs version

## 0.2.3

### Patch Changes

- 87f518a6: Don't backfill chain events that were already backfilled

## 0.2.2

### Patch Changes

- 28b2e654: Bind job dashboard to all interfaces
- 51842b03: Don't show very large time estimates

## 0.2.1

### Patch Changes

- 1e9770f2: Return correct version from package.json

## 0.2.0

### Minor Changes

- 998f61b0: Fix Replicator Docker image build

### Patch Changes

- Updated dependencies [81e6d8ec]
- Updated dependencies [aacff028]
