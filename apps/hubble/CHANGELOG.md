# @farcaster/hubble

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
