# @farcaster/hubble

## 1.13.3

### Patch Changes

- 2d26d305: CLI tool for measuring sync health
- b150e900: fix: Use stricter socket timeout for gossip
- eacf29c9: fix: http endoint return not found instead of internal database error
  - @farcaster/hub-nodejs@0.11.18

## 1.13.2

### Patch Changes

- e58e963d: fix: Always log when updating contact info
- 27a1cfc8: fix: updated the cli tool to flush logs before exiting
- f25f133f: chore: Segment bundle delay stats by message status
- dab95118: Add rpc to expose LinkCompactStateMessage + explicit handling of type
- 6ceb8f54: add libp2p/peer-store patch to resolve corrupt peer id loads
- Updated dependencies [dab95118]
  - @farcaster/hub-nodejs@0.11.17

## 1.13.1

### Patch Changes

- c424e111: feat: Add support for long casts
- Updated dependencies [c424e111]
  - @farcaster/hub-nodejs@0.11.16

## 1.13.0

### Minor Changes

- feat: Release 1.13

### Patch Changes

- 1c2dde78: feat: All HUB_OPTIONS env var to docker compose
- 35d395f3: [chore] Determine app version via manual JSON.parse instead of import
  - @farcaster/hub-nodejs@0.11.15

## 1.12.3

### Patch Changes

- a6367658: Retry fetching fname transfers on failed merge
- 33d43715: feat: Remove the BySigner index to reduce disk usage
- 053f3ac5: Remove unnecessary database reads when merging casts
- Updated dependencies [87c4f416]
  - @farcaster/hub-nodejs@0.11.13

## 1.12.2

### Patch Changes

- 8e7dec10: fix: Fix incorrect link message padding
- c261fba6: added approxSize to getInfo()
- 0e342af3: fix: Fetch previous snapshot if current db one is not present
- 8c759d66: fix: Throttle pruning so hub is not overloaded
- Updated dependencies [c261fba6]
  - @farcaster/hub-nodejs@0.11.12

## 1.12.1

### Patch Changes

- 26ced763: fix: Retry uploads of snapshot chunks to R2
- 4286432d: fix: Check if we need to prune before actually pruning
- 7b850fb9: fix: Fname index from Little endian -> big endian migration

## 1.12.0

### Minor Changes

- chore: Release 1.12

### Patch Changes

- 23b94856: fix: Use `PutObject` to upload snapshot chunks to R2
- e3afd5c8: fix: Use priority queue for sync work
- 063d4ed1: fix: sharding events should work when requesting historical events
- ec3b4e76: chore: Cleanup bundles code
- 1642e610: fix: Remove backup fetching for get_node
- 6bec999d: perf: Use multiple workers for validateOrRevokeMessages job
- 93de5d76: fix: Prevent unnecessary decode/encode in rpc APIs
- 089d1d1b: fix: Batch the de-dup check for merging messages
- 006473dd: perf: Improve getSyncMetadataByPrefix performance
- 63742239: chore: Cleanup trie batch inserts to use batches
- 1317f1ce: fix: Use R2 for snapshots
- f0bee818: fix: Batch insert merkle trie updates
- 45cf3f40: fix(hubble): Add startup check for hub to verify gRPC port is reachable from public internet. Reachable address is required for hub to perform diff sync via gRPC API and sync with the network. Hub operators may need to enable port-forwarding of traffic to hub's host and port if they are behind a NAT. Startup check emits warning for now, but may be enforced in the future.
- 5778e3a1: perf: Disable WAL when generating snapshots
- 7b374890: feat: Add Link CompactStateMessage type for link compaction
- Updated dependencies [7b374890]
  - @farcaster/hub-nodejs@0.11.11

## 1.11.8

### Patch Changes

- cd7db2dc: fix: Split the snapshot into 4GB chunks

## 1.11.7

### Patch Changes

- ee1e0543: fix: Restrict `yarn snapshot-url` to mainnet - snapshots are not supported on other networks
- 4c9fb617: feat: allow sharding event stream by fid
- dd10cdb1: fix: update diagnostics reports to prefix tags with fid and peer_id
- 7a1ccc38: fix: Handle axios errors while reporting to Datadog
- 51907b05: perf: DiffSync v2
- 3977c682: fix: Don't allow parallel storage cache scans
- a7b309ee: fix: Use threadpool for trie node ops
- ac229e2e: fix: Use pagesize=1 when scanning for first key
- Updated dependencies [4c9fb617]
  - @farcaster/hub-nodejs@0.11.10

## 1.11.6

### Patch Changes

- 6b4ea835: chore: Run validateOrRevokeMessagesJob once a month for each fid
- f1ffdd73: fix: Cleanup DB directory after destroy and reset TrieDB before catchupSyncwithSnapshot
- ce3f4241: perf: Use threadpool to getMany
- 86566b15: tests: Cleanup after tests properly
- 36191e5a: chore: update catchup sync with snapshot default to true
- 5ca5a4a5: feat: Add gossip MessageBundles
- Updated dependencies [5ca5a4a5]
  - @farcaster/hub-nodejs@0.11.9

## 1.11.5

### Patch Changes

- 2dcb3e80: fix: Change out-of-order warning to statsd
- 58b49138: perf: Count keys at prefix directly instead of forEachIterator
- 0728546f: fix: Create online snapshots using snapshot iterators
- d90b127d: perf: Support multiple validation workers
- 5e04c0a7: perf: Move merkle trie to rust
- b069d1e9: fix: Adjust nightly validateOrRevoke job time to run earlier
- 5e04c0a7: chore: Migrate trie node data to TrieDB
- 4fc41e1b: fix: Prune hub events in a threadpool
- bbc94487: fix: Log memory usage every 60s
- 05cb3397: perf: Cache trieDB writes
- 651ba7ac: fix: Throttle storageCache prepopulation
- c838795d: perf: Run long gRPC queries in a threadpool.
- ab71a53b: perf: Add LRU Cache for active signer and ID registry events
- 86e972ec: feat: Add --log-individual-messages to log each submitMessage status. If disabled (default) write one line per second
- c46790ac: fix: Calculate sleep time correctly for throttling validateOrRevoke job
- 436139f5: feat(hubble):

  - Add opt-out diagnostics reporting sent to the Farcaster foundation. Users may opt out with CLI flag `--opt-out-diagnostics true` or environment variable `HUB_OPT_OUT_DIAGNOSTICS=true`. Diagnostics are used to troubleshoot user issues and improve health of the network.
  - Add CLI flag `--diagnostic-report-url <url>`, and environment variables `HUB_DIAGNOSTICS_API_KEY`, `HUB_DIAGNOSTICS_APP_KEY` environment variables to pass in configurable DataDog-compatible URL and authorization tokens.

  fix(hubble): Add `L2_RPC_AUTHORIZATION_HEADER` environment variable for use with L2 RPC URLs that require authorization headers for access.

## 1.11.4

### Patch Changes

- ccd4d96a: fix(hubble): reduce hub bandwidth, can be toggled with GOSSIPSUB_FALLBACK_TO_FLOODSUB and GOSSIPSUB_FLOOD_PUBLISH
- 5ec735b4: chore: Migrate trie node data to TrieDB

## 1.11.3

### Patch Changes

- e3f49976: fix(hubble): handle edge cases of rocksdb instantiation for snapshot uploads

## 1.11.2

### Patch Changes

- fix: Set catch up sync to true for hubble install script and docker compose

## 1.11.1

### Patch Changes

- e30297b9: bug: Enforce protobuf oneof constraints
- c678742f: feat(hubble): update s3 snapshot metadata to include database statistics, and add snapshot-url command
- 751ed729: fix: Run full validateOrRevoke for all fids every 14 days
- 935246bd: feat(hubble): Add support for using S3 snapshot for "catch up" sync.
- @farcaster/hub-nodejs@0.11.8

## 1.11.0

### Minor Changes

- chore: Release 1.11

### Patch Changes

- dd1a3e46: chore: Migrate verifications store to rust
- f115bce1: feat: Generate grpc rust code from protobufs
- 63e2abe6: perf: Move username proof store to rust
- 70603192: perf: Throttle prune job
- ca42eaf0: perf: Migrate cast store to rust
- 0b523281: fix: Read data_bytes properly when pruning
- eb2b0e1d: Migrate link store to Rust
- cfa701c9: feat: stats for hub restarts
- d2b2f726: chore: Add rustfmt check before git commit

## 1.10.11

### Patch Changes

- 22615b3c: Add address to frame message
- Updated dependencies [22615b3c]
  - @farcaster/hub-nodejs@0.11.7

## 1.10.10

### Patch Changes

- 3e0f195c: fix: Run prune job in a thread to not block NodeJS main thread
- aad4396a: Set maximum & default page size for HTTP API requests to 1K
- aedde259: chore: Refactor store.rs to make migrating verifications store easier
- 18800701: Change Docker Compose restart policy to `always`
- 451ae847: Increase read timeout for Fname Registry server requests 2.5s → 5s
- 280946d0: fix: Tar file before gzip to make snapshotting faster.
- b51c15b2: fix: Use default page size for prune job
- a14b0dfb: Reduce default chunk size from 10000 to 9999
- f1eea12f: fix: Move snapshot tar creation into rocksdb.rs
- c4ca31ef: bug: Migrate FNameUserNameProofByFid prefix from 25 -> 27 to resolve conflict with VerificationsByAddress
- 6cb4c995: fix: Catch exception if inconsistency in DB
- 498ec9bb: tests: Setup testing framework for rust
- 9c5c7628: docs: Fix broken link on docs site
- 3e3edf2d: perf: Move UserData store to rust
- 4ec6c607: fix: Don't return '0x' for empty addresses

## 1.10.9

### Patch Changes

- 4a0fa6f4: fix: Handle latestBlock properly when sending to API
- 48d49b2e: fix: Simplify github actions test runs
- b302d3f4: fix: Add approximate_size for DB
- 6d765651: fix: hub crash on contract events

## 1.10.8

### Patch Changes

- ff1eefbe: fix: Fix bad version release because of package.json

## 1.10.7

### Patch Changes

- 5a1764d8: perf: Move DB and Reactions store to rust
- ac861b12: fix: Log directly from worker threads
- Updated dependencies [5a1764d8]
  - @farcaster/hub-nodejs@0.11.5

## 1.10.6

### Patch Changes

- 361996cf: fix: Update neynar bootstrap hub
- 419d8287: Add currentPeers RPC endpoint
- c4305b3e: fix: Use UTC for jobs scheduler
- Updated dependencies [579d29a4]
- Updated dependencies [419d8287]
  - @farcaster/hub-nodejs@0.11.4

## 1.10.5

### Patch Changes

- 72bbf29c: fix: Set dial timeout when connecting to peers for gossip node (default: 2 seconds) and expose LIBP2P_CONNECT_TIMEOUT_MS environment variable
- de5b0905: fix: Deprecate raw iterators and switch to forEach iterators

## 1.10.4

### Patch Changes

- addf097c: chore: update @farcaster/hub-nodejs

## 1.10.3

### Patch Changes

- 9bcaa9c1: Run via pm2 process supervisor
- a8b7dfcb: fix: Replace hot-shots with @figma/hot-shots
- Updated dependencies [5703d339]
  - @farcaster/hub-nodejs@0.11.2

## 1.10.2

### Patch Changes

- 915c6adb: fix: Fix hub crash from bad message data submit

## 1.10.1

### Patch Changes

- 8e928cea: fix: Small optimizations for merge code
- 83f66ab1: fix: Fix gossip seen ttl check (convert to seconds first)
- 83f66ab1: fix: Reduce fname poll timeout so we reject username messages less often
- e1c590a8: chore: log gossip message delay
- 8dc17613: fix: Add additional checks to prevent contact info duplicates
- bf37ec76: feat: Run validateOrRevoke only if signer is updated
- 1a52b869: fix: Handle solana verification removes
- 7f60a223: fix: Increase hub stream buffer size
- 8cfaa2cf: fix: Remove DB_RESET_TOKEN
  - @farcaster/hub-nodejs@0.11.1

## 1.10.0

### Minor Changes

- ae91b73a: Add Solana verification support

### Patch Changes

- 97a42165: fix: Don't broadcast old messages on gossip
- d90fb0b5: fix: Increase sync max duration
- be07bc86: fix: Properly init the merkle trie so we don't miss l2events
- a9105e20: fix: Add 8G heap to docker commands
- Updated dependencies [ae91b73a]
  - @farcaster/hub-nodejs@0.11.0

## 1.9.9

### Patch Changes

- 763d3154: feat: rename some verification message fields to support more protocols
- 97317971: fix: prefer peers with more messages to sync with
- c0551bfb: fix: Increase sync timeout
- 52102c21: fix: Early detect duplicate messages
- 81f453ab: fix: Process L2 blocks in batches
- 5a70330b: fix: Reduce Gossip TTL to 5 mins
- c0e17a49: feat: Add a new DB for trie data
- 41735d62: feat: Save connected peers in DB
- f49e9fe4: fix: Use the pendingDbUpdates to decide when to write updates to merkle trie
- Updated dependencies [763d3154]
  - @farcaster/hub-nodejs@0.10.24

## 1.9.8

### Patch Changes

- acf985c2: feat: Add neynar hubs to bootstrap list
- 0a6a7b70: fix: Multipart upload the snapshot to S3
- 6ec1b4dd: feat: Add a LRU cache to the active signers
- d29dfe51: fix: Check sync trie before fetching messages
- 06160b96: perf: Use execution timeout so we don't drop all messages in the lock queue
- 8bff4de6: fix: Bump gossip TTL to 10 mins

## 1.9.7

### Patch Changes

- 618e6fad: feat: Add quicksync
- 05ce5fe8: fix: Increase the sync trie cache to 64MB
- fb011fc5: fix: Minor performance tweaks and logging

## 1.9.6

### Patch Changes

- 577d698d: fix: Remove score penalty for duplicate gossip messages
- 57ce2c66: fix: reduce sync freqency to help reduce hub load

## 1.9.5

### Patch Changes

- f8c5f280: fix: Revert verification renames which break http backwards compatibility
- Updated dependencies [f8c5f280]
  - @farcaster/hub-nodejs@0.10.23

## 1.9.4

### Patch Changes

- fd9f9ff8: Rename verification message
- Updated dependencies [fd9f9ff8]
- Updated dependencies [362f580b]
  - @farcaster/hub-nodejs@0.10.22

## 1.9.3

### Patch Changes

- 229ea166: feat: Add support for FrameAction and validateMessage
- Updated dependencies [229ea166]
  - @farcaster/hub-nodejs@0.10.21

## 1.9.2

### Patch Changes

- 11a1e0d2: fix: Don't add deleted fnames to sync trie
- 7379a05f: feat: add a gossip message delay stat
- 00473c2a: fix: Do not add fnames to the sync trie when they have not been merged

## 1.9.1

### Patch Changes

- c78f01b3: fix: Admin reset key event may have reset the wrong key sometimes

## 1.9.0

### Minor Changes

- chore: Release 1.9

### Patch Changes

- 20b65759: chore: rename/remove v2 contract address cli params after migration
- 704e0777: feat: Add usage information to getCurrentStorageLimitsByFid rpc call
- Updated dependencies [704e0777]
  - @farcaster/hub-nodejs@0.10.20

## 1.8.0

### Minor Changes

- Expiry date changed to 1/10/24 0:00:00 UTC

### Patch Changes

- 6bfb694b: fix: Handle docker-compose versions in hubble.sh

## 1.7.2

### Patch Changes

- 912f680f: fix: catch and ignore provider errors during retry

## 1.7.1

### Patch Changes

- 5199f66e: fix: disallow empty casts
- 6890969b: fix: remove references to old contracts
- 5199f66e: fix: Allow syncTrie to handle names that are substrings
- 5199f66e: fix: Fix peer check job not actually starting
- Updated dependencies [6890969b]
  - @farcaster/hub-nodejs@0.10.17

## 1.7.0

### Minor Changes

- 3313c232: Adds support for contact info content signing + strictNoSign
- f3d32227: feat: Support v2 id and key registry contracts

### Patch Changes

- Updated dependencies [f3d32227]
  - @farcaster/hub-nodejs@0.10.16

## 1.6.6

### Patch Changes

- b47c65bb: Adds application-specific peer scoring to peer scoring for gossipsub with early immune list
- 559afd0e: fix: hubble autoupgrade should ensure dependencies and clean unused docker data
- 173c9d61: fix: Fix stale contactInfo caches on SyncEngine

## 1.6.5

### Patch Changes

- 153da45a: Remove PubSub PeerDiscovery in favor of ContactInfo based PeerDiscovery
- ec2711df: fix: Lower seenTTL to 5 mins to reduce memory consumption
- 6d54786e: fix: Prevent hub startup if protocol version is expired
- 2abaa115: add memory stats
- Updated dependencies [153da45a]
  - @farcaster/hub-nodejs@0.10.15

## 1.6.4

### Patch Changes

- a3e12f54: fix: Fix contactInfo messages not being forwarded and increase seen ttl to prevent future loops

## 1.6.3

### Patch Changes

- 89ce7d2d: fix: enable asyncValidation so we don't forward invalid messages on gossip
- a5708f85: chore: Remove grpc-web
- b518b97f: fix: Cache numFids and numFnames
- 86bed6f5: fix: Make message counts on-demand to speed startup
- ba86d374: feat: Allow signing raw message data bytes to support rust, Golang etc...
- Updated dependencies [ba86d374]
  - @farcaster/hub-nodejs@0.10.14

## 1.6.2

### Patch Changes

- 17ca659b: fix: Persist grafana container data
- e2ada603: fix: Exists check should not crash the hub

## 1.6.1

### Patch Changes

- 902447f8: fix: Fix buggy crontab entry that would try to upgrade every minute
- e10a8c93: fix: Improve logging on unhandled errors
- 81e6d8ec: FIP-8 contract verifications
- aacff028: Remove eslint-config-custom dependencies
- c7b28b06: fix: Run crontab as root for hubble.sh
- 9ca079e4: chore: Add peer scores to grafana dashboard
- 433bee81: feat: Enable events sync by default
- f5c70348: docs: Linter now checks the rpc.proto to make sure all methods and implemented in HTTP API
- c0741888: fix: Fix off by one error when inserting into trie
- 5b7d5686: fix: Handle errors from L2 getevents
- Updated dependencies [81e6d8ec]
- Updated dependencies [aacff028]
- Updated dependencies [c33f5270]
- Updated dependencies [433bee81]
  - @farcaster/hub-nodejs@0.10.12

## 1.6.0

### Minor Changes

- 09b7949c: feat: make verifications globally unique

### Patch Changes

- 8abf1864: feat: add migration to clear onchain events and force re-sync
- c64400dc: fix: Use DB_SCHEMA version in snapshot path
- 4dea7e28: chore: Upgrade ed25519-dalek in rust
- 472e8ae3: feat: Add a flag to clear l2 events
- ef795c71: upgrade viem to 1.12.2
- ef795c71: fall back to eth_getLogs in event sync
- b7c2b0a9: chore: Replace hub-web with HTTP api examples
- 14f67cf2: feat: Add peer scoring
- 03cd3333: feat: Audit peer's messages during sync
- Updated dependencies [14f67cf2]
  - @farcaster/hub-nodejs@0.10.11

## 1.5.6

### Patch Changes

- aa6553b1: feat: Enable HTTP API server
- fb1f5c61: feat: Support onchain events and fnames in sync trie
- f743a430: feat: Allow settings CORS for http api
- f0ad204e: feat: Repair sync trie when events and fnames are already present
- 833d9651: fix: hubble.sh - Don't delete before overwriting
- bc4a1366: fix: HTTP API add getInfo and other doc fixes
- aeab5a4c: docs: Refactor HTTP API docs
- 4809c9c8: fix: HTTP API port in docker-compose
- f163fa3d: chore: Remove "yarn status" command
- 4b99eddb: feat: Support fname and onchain event syncids
- Updated dependencies [aeab5a4c]
  - @farcaster/hub-nodejs@0.10.10

## 1.5.5

### Patch Changes

- a232963c: fix: Cleanup old snapshots from S3
- 7cbd77ee: test: Add e2e test for hubble startup
- 7b438e62: test: Add 2 hubble sync+gossip test
- e8b2dafa: fix: Fix flaky pruneMessagesJob test
- 0bc82ce4: test: Fix broken test due to Link storage limits change
- 82c996af: fix: Grafana: Sync times are blank for longer timeranges
- 7e2a66e5: feat: Add a function to parse the timestamp from the eventId
- 520843ba: feat: Move libp2p to worker thread
- d77970b1: chore: Delete deprecated rpc calls and events
- Updated dependencies [d77970b1]
  - @farcaster/hub-nodejs@0.10.9

## 1.5.4

### Patch Changes

- 0805122c: fix: Grafana issue where incoming sync count was not correct
- 4893e02d: fix: Update links store size to be 2500 in the future
- 5dc7d113: chore: Remove GossipMetricsRecorder (Use grafana dashboard instead)
- 8d21803e: feat: Add "up" and "down" commands to hubble.sh
  - @farcaster/hub-nodejs@0.10.8

## 1.5.3

### Patch Changes

- 08b652e: fix: Add txIndex to onchain events, fix wrong index being used in the primary key
- b36eef2: fix: Extract snapshot on the fly while downloading snapshot
- 93e43a8: fix: Use hashes to compare upgrade 'hubble.sh' versions
- 7daaae4: fix: Simplify IP addr fetching, prefering ipv4
- ac1f6ac: fix: Fetch envoy config during hubble.sh
- baf983f: fix: Consume the FID rate limit only after a successful merge
- Updated dependencies [08b652e]
  - @farcaster/hub-nodejs@0.10.7

## 1.5.2

### Patch Changes

- 2f2dd83d: feat: Snapshot sync
- 40e017fe: fix: Fix progress bar for docker (non-TTY)
- 6c12fee5: fix: Add custom linter for Grafana JSON
- cff71488: chore: Remove Goerli RPC url and signer message logic
- 52260bc8: chore: Deprecate "status" command
- 0f83be8f: fix: Reformat grafana dashboard with descriptions
- 316bcd3a: chore: Remove signer pre-sync for initial sync
- 3c32cf21: fix: Supress progress logs during tests
- 2ab99d95: feat: Add REST API
- 7fd1f945: fix: Add progress bar for storage cache
- aac4220f: chore: Add cli options documentation linter
- 5cb9db86: feat: Sync latest messages first
- bc416dbe: feat: Allow Hub operators to set an FID
- 5e5cfb15: fix: Ensure index keys are > UserMessagePostfixMax
- ef65fd40: fix: Count peer validation errors during sync
- bab7bba9: chore: Update the Grafana dashboard
- 76a031e2: feat: Add storage limit constants to core
- Updated dependencies [2ab99d95]
- Updated dependencies [bc416dbe]
- Updated dependencies [76a031e2]
  - @farcaster/hub-nodejs@0.10.6

## 1.5.1

### Patch Changes

- 9138ca9e: chore: Improve dashboard with sync %, versions
- 8ea938ab: fix: Handle both 'docker-compose' and 'docker compose' in hubble.sh
- 05e5ed1e: fix: Stream buffer size to 5K and correct store size limits

## 1.5.0

### Minor Changes

- be6ee3c8: feat: Make l2 rpc url required to start hubble ahead of mainnet migration

### Patch Changes

- ee3897f3: feat: Add startup checks and progress bars
- 01a3c08e: feat: fetch l2 contract addresses from network config
- b50024c8: fix: Improve startup checks to be clearer
- 315a0873: feat: add an events-reset command to clear l2 events from the db
- 74313c17: Switch startup checks to check against OP Mainnet
- a3d6b21e: fix: Cleanup startup checks and add cleaner exit failures
- e6180074: feat: enforce storage pruning 1 day after migration
- a508e56f: chore: Improve gen.submitMessages() for testing
- 930d8635: chore: Update the Grafana dashboard
- 7a969943: fix: Improve logging for DB migration failures
- 27287d2d: feat: hubble.sh script to install and upgrade hubble
- bf1c44d2: feat: Update signer onchain event to store new fields and add additional RPC calls
- acfb44d7: feat: SyncEngine syncs from L2 if required post migration
- Updated dependencies [bf1c44d2]
  - @farcaster/hub-nodejs@0.10.5

## 1.4.6

### Patch Changes

- e55e571f: feat: Add "getting blockchain events" to hub status
- 5e96e134: fix: Handle network failures when fetching config
- 951793b1: fix: getUserNameProofsByFid should return fname proofs as well
- 3e601f81: fix: Fetch L2 events in parallel before processing, show progress
- 6ec14935: feat: Remove permissioned allowlist for mainnet hubs
- c61728cb: fix: DB Migration for UserNameProof index messages
- 6bb1b439: fix: Handle sync status reporting properly
- 1fcfd495: fix: fetching l2 events was not respecting --l2-first-block
- f9631488: feat: Add statsd monitoring for Hubble
- c6d79cdb: feat: on chain event ordering updated to be more consistent
- f241dcf4: fix: Make sure valid messages are inserted into Sync Trie
- 36484022: fix: user name proofs weren't syncd correctly because they were not added to the sync trie
- 8d61f5f2: fix: Improve initial eth events fetching
- d8cb39ac: fix: Limit SyncStatus to upto 30 peers
- Updated dependencies [e55e571f]
- Updated dependencies [c6d79cdb]
  - @farcaster/hub-nodejs@0.10.4

## 1.4.5

### Patch Changes

- 437545cc: fix: Log when network config is updated
- 41334ab8: fix: Move rust code to apps/hubble, making core package PureJS
  - @farcaster/hub-nodejs@0.10.3

## 1.4.4

### Patch Changes

- 083762e5: feat: Improve profiler for gen messages and storage
- 63260785: fix: Bugfix where testnet would restrict peers
- 40c17c9b: feat: Add fallback bootstrap peers for mainnet
- d443fbe9: Adds support for logging would-be-pruned events, plus handles extra storage if purchased
- 571e5434: fix: Fetch network config only for mainnet
- c7ec4ca9: feat: revoke signers 1hr after custody event
- ec7734cf: feat: Move blake3 hash into rust
- 996be825: fix: handle revoking on chain signer and make l2 options customizable
- 1e0979b0: feat: Rate limit merges per FID to the total messages storage available for the FID
- 503b379d: feat: Check integrity of messages during sync
- b9efe14a: feat: validate name proofs against fids rather than custody address to enable smoother fid recovery process
- 65a4faff: feat: Create a deny list for PeerIDs
- a1b9aced: fix: Limit the number of simultaneous subscribe() streams by IP address
- 3f180073: chore: Update grpc-js and setup grpc server timeouts
- dcd7a149: feat: support migrating to l2
- 39e0141d: fix: Fix the TestData generation for testnet
- b598c4a2: feat: Add libp2p gossip server profiler
- 9ae366b7: fix: Fix onchain event subscription not sending events correctly
- 9f669b57: feat: Scale validation workers by number of CPUs and add a RPC profiler
- 2df38497: feat: Deprecate time based pruning in sets
- 67e9466e: feat: refactor storage rent events to on chain events
- 50a6b8ac: Adjusted rent prune log to debug instead of warn
- 86149d32: Added storage limits RPC
- Updated dependencies [3f180073]
- Updated dependencies [dcd7a149]
- Updated dependencies [67e9466e]
- Updated dependencies [86149d32]
  - @farcaster/hub-nodejs@0.10.0

## 1.4.3

### Patch Changes

- f00d7d2: fix: Move validatorOrRevokeMessage and storageCache iterators to be managed
- 115f1b5: feat: Do the validateOrRevokeMessages job fid-by-fid
- 998979d: feat: Warn if there are no incoming connections
- c1bb21c: fix: When retring messages due to failed signers, use a queue
- 376ae0f: feat: Use a web based network config for hubble
  - @farcaster/hub-nodejs@0.9.1

## 1.4.2

- 1d9c34af: Testnet should not require allow listed peers

## 1.4.1

### Minor Changes

- 2391c3a5: Adds support for storage events
- 15d43931: feat: support fallback RPC providers
- 3dfc29de: fix: throw error if unable to fetch fname server signature
- 71558f87: Reduce number of confirmations for ETH blocks from 6 to 3
- 8d0d87dc: Add support for direct peering
- f179dd6a: fix: Add managed iterator that will close the iterator under all conditions
- 6042e957: fix: only revoke the username if the nameproof matches
- 728a557a: Adjust chunk size to 1000 from 10000
- a0dbfbd8: perf: Improve incremental sync performance
- Updated dependencies [57235761]
- Updated dependencies [2391c3a5]
  - @farcaster/hub-nodejs@0.9.0

## 1.4.0

### Minor Changes

- a38720b: chore: Hard fail on missing RPC urls.

### Patch Changes

- 2817141: perf: Tune sync parameters and add mergeMessages profile
- b5becd9: fix: Improve logging for open iterators and add hub events timeout

## 1.3.4

### Patch Changes

- d5d65bd: Prevent connecting to peers not in allowed peer list
- 1d07446: Display correct app version when run in Docker container
- f9c978a: Include bad_request.prunable in list of INVALID_ARGUMENT errors
- f54185f: Updated EthEventProviders to hard fail unable to connect to eth RPC provider
- e513a3f: fix: Prevent unnecessary sync and log messages by filtering out SyncIDs our node already has
- 6e7ce94: perf: Fetch upto 4 leaf nodes at a time during sync
- dbe6074: Allow log level to be configured via environment variable
- cd0ddd6: feat: Add support for ens names
- a08bff3: Better error messages for config file
- 850f82f: perf: Add a sync profiler
- 229b806: Add a "yarn profile storage" command that prints the usage of the RocksDB database
- 4fa7a56: rename UserDataType.FNAME to UserDataType.USERNAME
- Updated dependencies [cd0ddd6]
- Updated dependencies [4fa7a56]
  - @farcaster/hub-nodejs@0.8.4

## 1.3.3

### Patch Changes

- abca3ed: Fixed bug with prune limits
- 5a1baae: Switch fnames from contract events to fname server proofs
- Updated dependencies [5a1baae]
  - @farcaster/hub-nodejs@0.8.3

## 1.3.2

### Patch Changes

- 159c62d: Upgraded viem to 1.1.4
  Used viem to interact with ethereum
  - @farcaster/hub-nodejs@0.8.2

## 1.3.1

### Patch Changes

- 7dabc0b: Refactored stores to use a generic implementation for easier addition of types
- 6667748: Handle peers with no messages in status command
- f1c6b25: Fetch, validate and store username proofs from fname registry
- c6fc422: Fix server hanging due to slow subscribers in certain conditions
- Updated dependencies [f1c6b25]
  - @farcaster/hub-nodejs@0.8.1

## 1.3.0

### Minor Changes

- 2bc598a: Added support for Links

### Patch Changes

- 37f515f: Add app version to contactInfo message
- 7f050d2: Correctly error when sequence ID exceeds max allowed value
- 27181c6: added fallback to dbreset
- 16ea9b4: Validate the eth network in ethEventsProvider
- Updated dependencies [2bc598a]
  - @farcaster/hub-nodejs@0.8.0

## 1.2.4

### Patch Changes

- Re-publish
- Updated dependencies
  - @farcaster/hub-nodejs@0.7.4

## 1.2.3

### Patch Changes

- c4891754: Add --watch to hub status command and more readable output
- 2ca66b17: replace @noble/ed25519 with faster and more secure @noble/curves
- 43444471: fix(eth): add stronger retry logic to eth events provider
- ea55abcb: Include semver as explicit dependency
- fe755fbd: Switch from `rocksdb` to `@farcaster/rocksdb` NPM package
- 651df412: Add @faker-js/faker as prod dependency
- Updated dependencies [2ca66b17]
  - @farcaster/hub-nodejs@0.7.3

## 1.2.2

### Patch Changes

- 5308788: improve handling of duplicate messages on gossip
- 1236b4e: Add a GetSyncStatus rpc call that exposes the hubs sync status with different peers
- 2e633db: Reject prunable messages on merge
- Updated dependencies [1236b4e]
  - @farcaster/hub-nodejs@0.7.2

## 1.2.1

### Patch Changes

- 4fc3198: Dedupe eth events when retrying to be more efficient with api calls
- 5cee2c5: Fix sync stalling because id registry events weren't retried correctly
- 427ced4: Remember bad peers during sync and ignore them for a while to reduced excessive sync attempts
- 421c385: Add sync stats to getInfo rpc call
- Updated dependencies [421c385]
  - @farcaster/hub-nodejs@0.7.1

## 1.2.0

### Minor Changes

- 87b2789: upgrade to protocol version 2023.4.19
- 87b2789: support CastId embeds, cast parent URLs, and reaction target URLs

### Patch Changes

- a027a3e: periodically compact the db while syncing to prevent bloat
- 0cb0a52: chore: re-organize SyncEngine to merge messages through Hub's submitMessage method rather than the storage engine directly
- Updated dependencies [87b2789]
  - @farcaster/hub-nodejs@0.7.0

## 1.1.0

### Minor Changes

- 34fe54f: Include network id in gossip topics to keep networks isolated

### Patch Changes

- 31d8917: Add cli option to configure commit lock size and timeout
- 0fbbbcc: Make dbreset its own command
- a3b0d09: Check in list of allowed peers on Mainnet
- 25c768d: Hangup on peer when removing from address book.
- 8758ef2: log sync status for better visibility

## 1.0.22

### Patch Changes

- edea195: Ensure hub networks match when syncing with peers
  - @farcaster/hub-nodejs@0.6.3

## 1.0.21

### Patch Changes

- c4529a7: merge protobufs and utils packages into core
- Updated dependencies [1e4e5ba]
- Updated dependencies [c4529a7]
  - @farcaster/hub-nodejs@0.6.2

## 1.0.20

### Patch Changes

- 71d6494: Helpful error when identity proto is not found
- 142f3f5: add getIdRegistryEventByAddress rpc and engine method
- 8e46cac: Start rpcServer before ethEventsProvider
- 1f47906: remove grpc-js dependency from protobufs, refactor hubble to use hub-nodejs
  hub-web to use @farcaster/protobufs and utils
- b9643b2: Fix issue where sync was off by 1
- 564f61e: Retry missing IdRegistry events from Eth node instead of peer
- 54dbf42: End iterator in while rebuilding trie
- 13415ea: Write events to subscribe() with a timeout to prevent slow clients from clogging up memory
- d0239f8: Retry bootstrap nodes if all fail to connect
- 759e1cf: Ignore outdated hubs for sync
- 9e39bb8: Update docs to close grpc connections after use
- Updated dependencies [1f47906]
- Updated dependencies [9e39bb8]
  - @farcaster/hub-nodejs@0.6.1

## 1.0.19

### Patch Changes

- fe74a1e: Close RPC connections to fix a memory leak
- 1025d3b: Support multiple RPC users via comma-separated-list
- de25020: Refuse to startup if DB network is mismatched
- 58cfbb9: Gossip server listens on 0.0.0.0 by default
- 9ee1076: Better grpc error messages when auth fails

## 1.0.18

### Patch Changes

- e5cb327: Remove getHubRpcClient, use getSSLRpcClient() or getInsecureRpcClient()
- misc: Numerous perf and bug fixes for testnet release
- Updated dependencies [e5cb327]
  - @farcaster/protobufs@0.1.11
  - @farcaster/utils@0.4.0

## 1.0.17

### Patch Changes

- c26fafa: Add test data to testnet hubs via TEST_USERS env variable
- 0f6737b: Add IP-based rate limiting for submitMessage()
- 5c78405: upgrade ethers to 6.2.1
- 6a0bf29: Gossip dnsName when sharing contact info
- a89a5b9: Reset DB if DB_RESET_TOKEN is set
- e29958e: Terminate webworkers when shutting down
- Updated dependencies [12c9c40]
- Updated dependencies [dc69b66]
- Updated dependencies [5c78405]
- Updated dependencies [6a0bf29]
- Updated dependencies [23de6e7]
  - @farcaster/utils@0.3.1
  - @farcaster/protobufs@0.1.10

## 1.0.16

### Patch Changes

- a91afdb: Allow specifying hub nickname via environment variable
- 1b0e3a7: Add RPC Auth via Env variables and a new getAuthMetadata method to make it easier to use RPC auth
- 59920f9: upgrade ethers from v5 to v6
- d63e05f: Switch to time-based check for process shutdown file
- 1e4482e: updated dependencies
- b596ec9: Yield to newer hubs started with the same RocksDB
- Updated dependencies [469825e]
- Updated dependencies [1b0e3a7]
- Updated dependencies [59920f9]
- Updated dependencies [99518ef]
- Updated dependencies [1e4482e]
  - @farcaster/protobufs@0.1.9
  - @farcaster/utils@0.3.0

## 1.0.15

### Patch Changes

- 8f2c6ef0: Increase sync trie Q limit
- 4e6b83e1: Retry DB open on failure upto 5 times
- Updated dependencies [86c00f53]
  - @farcaster/utils@0.2.12

## 1.0.14

### Patch Changes

- Updated dependencies [0a3b77c]
- Updated dependencies [e7602bd]
- Updated dependencies [68230b7]
  - @farcaster/protobufs@0.1.8
  - @farcaster/utils@0.2.11

## 1.0.13

### Patch Changes

- Updated dependencies [2d90f5bf]
  - @farcaster/utils@0.2.10

## 1.0.12

### Patch Changes

- Updated dependencies [e75e46b3]
  - @farcaster/utils@0.2.9

## 1.0.11

### Patch Changes

- Updated dependencies [6f1c5a9]
- Updated dependencies [ea7b9c9]
  - @farcaster/protobufs@0.1.7
  - @farcaster/utils@0.2.8

## 1.0.10

### Patch Changes

- Updated dependencies [d04d5d4a]
- Updated dependencies [4056b5d4]
- Updated dependencies [22a9d460]
  - @farcaster/protobufs@0.1.6
  - @farcaster/utils@0.2.7

## 1.0.9

### Patch Changes

- Updated dependencies [96468718]
  - @farcaster/utils@0.2.6

## 1.0.8

### Patch Changes

- Updated dependencies
  - @farcaster/protobufs@0.1.5
  - @farcaster/utils@0.2.5

## 1.0.7

### Patch Changes

- Updated dependencies [3096e00]
  - @farcaster/utils@0.2.4

## 1.0.6

### Patch Changes

- Updated dependencies [d21a8f2]
- Updated dependencies [6a66bae]
- Updated dependencies [1151fea]
- Updated dependencies [cf9c64c]
  - @farcaster/protobufs@0.1.4
  - @farcaster/utils@0.2.3

## 1.0.5

### Patch Changes

- Updated dependencies [9558382]
- Updated dependencies [6be9983]
  - @farcaster/protobufs@0.1.3
  - @farcaster/utils@0.2.2

## 1.0.4

### Patch Changes

- Updated dependencies [78d9050]
  - @farcaster/protobufs@0.1.2
  - @farcaster/utils@0.2.1

## 1.0.3

### Patch Changes

- b43fade: feat: add protobufs IdRegistryEvent and SignerStore
- Updated dependencies [58738a4]
- Updated dependencies [526bd17]
- Updated dependencies [b43fade]
- Updated dependencies [ae7639c]
- Updated dependencies [cd84f7c]
- Updated dependencies [2e32983]
  - @farcaster/utils@0.2.0
  - @farcaster/protobufs@0.1.1

## 1.0.3

### Patch Changes

- b43fade: feat: add protobufs IdRegistryEvent and SignerStore
- Updated dependencies [58738a4]
- Updated dependencies [526bd17]
- Updated dependencies [b43fade]
- Updated dependencies [ae7639c]
- Updated dependencies [cd84f7c]
- Updated dependencies [2e32983]
  - @farcaster/utils@0.2.0
  - @farcaster/protobufs@0.1.1

## 1.0.2

### Patch Changes

- 3b84ad2: chore: refactor functions in packages/\* to return HubResult
- Updated dependencies
- Updated dependencies [c20daed]
- Updated dependencies [3b84ad2]
  - @farcaster/utils@0.1.5
  - @farcaster/flatbuffers@0.1.5
  - @farcaster/grpc@0.1.5

## 1.0.1

### Patch Changes

- Updated dependencies
  - @farcaster/flatbuffers@0.1.4
  - @farcaster/grpc@0.1.4
  - @farcaster/utils@0.1.4
