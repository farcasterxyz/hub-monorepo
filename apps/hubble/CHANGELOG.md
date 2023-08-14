# @farcaster/hubble

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
