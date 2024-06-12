# @farcaster/core

## 0.14.14

### Patch Changes

- de52fbce: feat: extend verifications signature max length

## 0.14.13

### Patch Changes

- 911f8b23: Adds missing builder for LinkCompactState

## 0.14.12

### Patch Changes

- c261fba6: added approxSize to getInfo()

## 0.14.11

### Patch Changes

- ab9258af: feat: extend verification signature max length
- 7b374890: feat: Add Link CompactStateMessage type for link compaction

## 0.14.10

### Patch Changes

- 4c9fb617: feat: allow sharding event stream by fid

## 0.14.9

### Patch Changes

- 5ca5a4a5: feat: Add gossip MessageBundles

## 0.14.8

### Patch Changes

- e30297b9: bug: Enforce protobuf oneof constraints

## 0.14.7

### Patch Changes

- 22615b3c: Add address to frame message

## 0.14.6

### Patch Changes

- f7d13376: Fix unicode error for replicator, add constraint where verification message claim signatures must be hex

## 0.14.5

### Patch Changes

- 5a1764d8: perf: Move DB and Reactions store to rust

## 0.14.4

### Patch Changes

- 579d29a4: feat: add transaction ID to frame message
- 419d8287: Add currentPeers RPC endpoint

## 0.14.3

### Patch Changes

- 1fd0f686: fix: add bs58 dependency

## 0.14.2

### Patch Changes

- 5703d339: feat: add state field to frame message
- 136ef6b4: fix: Remove old dependencies

## 0.14.1

### Patch Changes

- bf37ec76: feat: Run validateOrRevoke only if signer is updated
- 1a52b869: fix: Handle solana verification removes

## 0.14.0

### Minor Changes

- ae91b73a: Add Solana verification support

## 0.13.8

### Patch Changes

- 763d3154: feat: rename some verification message fields to support more protocols

## 0.13.7

### Patch Changes

- f8c5f280: fix: Revert verification renames which break http backwards compatibility

## 0.13.6

### Patch Changes

- fd9f9ff8: Rename verification message
- 362f580b: feat: add text input frame field

## 0.13.5

### Patch Changes

- 229ea166: feat: Add support for FrameAction and validateMessage

## 0.13.4

### Patch Changes

- 704e0777: feat: Add usage information to getCurrentStorageLimitsByFid rpc call

## 0.13.3

### Patch Changes

- b001fee9: Add ViemWalletEip712Signer

## 0.13.2

### Patch Changes

- ab245ce5: Add EIP-712 helpers

## 0.13.1

### Patch Changes

- 5199f66e: fix: disallow empty casts
- 6890969b: fix: remove references to old contracts
- 5199f66e: fix: Allow syncTrie to handle names that are substrings

## 0.13.0

### Minor Changes

- 3313c232: Adds support for contact info content signing + strictNoSign

### Patch Changes

- f3d32227: feat: Support v2 id and key registry contracts

## 0.12.15

### Patch Changes

- 153da45a: Remove PubSub PeerDiscovery in favor of ContactInfo based PeerDiscovery

## 0.12.14

### Patch Changes

- ba86d374: feat: Allow signing raw message data bytes to support rust, Golang etc...

## 0.12.13

### Patch Changes

- f4e50b95: fix: use interface for Viem PublicClient, add optional publicClients to builders

## 0.12.12

### Patch Changes

- 81e6d8ec: FIP-8 contract verifications
- aacff028: Remove eslint-config-custom dependencies
- c33f5270: fix: Run protoc as user instead of root
- 433bee81: feat: Enable events sync by default

## 0.12.11

### Patch Changes

- ef795c71: upgrade viem to 1.12.2
- 14f67cf2: feat: Add peer scoring

## 0.12.10

### Patch Changes

- 31641c17: fix: Bound generated timestamps for tests
- fb1f5c61: feat: Support onchain events and fnames in sync trie
- aeab5a4c: docs: Refactor HTTP API docs
- 4b99eddb: feat: Support fname and onchain event syncids

## 0.12.9

### Patch Changes

- 7e2a66e5: feat: Add a function to parse the timestamp from the eventId
- 20062ceb: chore: cleanup default links store size code
- d77970b1: chore: Delete deprecated rpc calls and events

## 0.12.8

### Patch Changes

- 4893e02d: fix: Update links store size to be 2500 in the future

## 0.12.7

### Patch Changes

- 08b652e: fix: Add txIndex to onchain events, fix wrong index being used in the primary key

## 0.12.6

### Patch Changes

- bc416dbe: feat: Allow Hub operators to set an FID
- 76a031e2: feat: Add storage limit constants to core

## 0.12.5

### Patch Changes

- e6180074: feat: enforce storage pruning 1 day after migration
- bf1c44d2: feat: Update signer onchain event to store new fields and add additional RPC calls

## 0.12.4

### Patch Changes

- e55e571f: feat: Add "getting blockchain events" to hub status
- 1fcfd495: fix: fetching l2 events was not respecting --l2-first-block
- c6d79cdb: feat: on chain event ordering updated to be more consistent

## 0.12.3

### Patch Changes

- 41334ab8: fix: Move rust code to apps/hubble, making core package PureJS

## 0.12.2

### Patch Changes

- afd2146f: fix: Remove neon shim to get compilation working

## 0.12.1

### Patch Changes

- cfec7767: fix: Disable the rust code path to make it pureJS for now

## 0.12.0

### Minor Changes

- 86149d32: Added storage limits RPC

### Patch Changes

- ec7734cf: feat: Move blake3 hash into rust
- 15fad467: feat: Add Rust to the toolchain and use rust for ed25519 signature verification
- dcd7a149: feat: support migrating to l2
- 67e9466e: feat: refactor storage rent events to on chain events

## 0.11.1

### Patch Changes

- e36fcae: Fix username proof timestamp validation + add builders for UsernameProofData and UsernameProofMessage
- 88f31f2: fix: Fix typing for merge username proof events

## 0.11.0

### Minor Changes

- 2391c3a5: Adds support for storage events

## 0.10.2

### Patch Changes

- cd0ddd6: feat: Add support for ens names
- 4fa7a56: rename UserDataType.FNAME to UserDataType.USERNAME

## 0.10.1

### Patch Changes

- 5a1baae: Switch fnames from contract events to fname server proofs

## 0.10.0

### Minor Changes

- 159c62d: added ViemLocalEip712Signer to exports
- bfdbfea: Used viem to verify Ethereum signatures

  - Added `signUserNameProofClaim` to `Eip712Signer`
  - Added `makeUserNameProofClaim`

  - Breaking API changes
    - make\*Data functions are now async
    - removed top-level getSignerKey, signVerificationEthAddressClaim, and signMessageHash, use an Eip712Signer class (i.e. EthersEip712Signer or ViemLocalEip712Signer)
    - rename `verifyUserNameProof` to `verifyUserNameProofClaim`

### Patch Changes

- 159c62d: bumped viem to 1.1.4

## 0.9.1

### Patch Changes

- f1c6b25: Fetch, validate and store username proofs from fname registry

## 0.9.0

### Minor Changes

- 2bc598a: Added support for Links

### Patch Changes

- 37f515f: Add app version to contactInfo message

## 0.8.1

### Patch Changes

- Re-publish

## 0.8.0

### Minor Changes

- 2ca66b17: replace @noble/ed25519 with faster and more secure @noble/curves

### Patch Changes

- 651df412: Remove unnecessary @faker-js/faker dependency from core

## 0.7.2

### Patch Changes

- 1236b4e: Add a GetSyncStatus rpc call that exposes the hubs sync status with different peers
- 2e633db: Reject prunable messages on merge
- d2cb5e4: fix: validate parentUrl and targetUrl comprehensively

## 0.7.1

### Patch Changes

- 6a84860: feat: add ViemLocalEip712Signer
- 421c385: Add sync stats to getInfo rpc call

## 0.7.0

### Minor Changes

- 87b2789: support CastId embeds, cast parent URLs, and reaction target URLs

## 0.6.1

### Patch Changes

- edea195: Ensure hub networks match when syncing with peers

## 0.6.0

### Minor Changes

- c4529a7: merge protobufs and utils packages into core

### Patch Changes

- 1e4e5ba: update tsup build command to check target environments and use tsup shims

## 0.5.0

### Minor Changes

- 1f47906: remove grpc-js dependency from protobufs, refactor hubble to use hub-nodejs
  hub-web to use @farcaster/protobufs and utils

### Patch Changes

- 9e39bb8: Update docs to close grpc connections after use
- Updated dependencies [142f3f5]
- Updated dependencies [1f47906]
- Updated dependencies [759e1cf]
  - @farcaster/protobufs@0.2.0

## 0.4.0

### Minor Changes

- e5cb327: Remove getHubRpcClient, use getSSLRpcClient() or getInsecureRpcClient()

### Patch Changes

- Updated dependencies [e5cb327]
  - @farcaster/protobufs@0.1.11

## 0.3.1

### Patch Changes

- 12c9c40: chore: use minimally specified ethers signer type
- dc69b66: feat: add EthersV5Eip712Signer
- 5c78405: upgrade ethers to 6.2.1
- Updated dependencies [6a0bf29]
- Updated dependencies [23de6e7]
  - @farcaster/protobufs@0.1.10

## 0.3.0

### Minor Changes

- 59920f9: upgrade ethers from v5 to v6
- 99518ef: refactor: generic and library specific signer classes

  - `Eip712Signer` has been renamed to `EthersEip712Signer` and should be built with `new EthersEip712Signer(wallet)` instead of `Eip712Signer.fromSigner`
  - `Ed25519Signer` has been renamed to `NobleEd25519Signer` and should be built with `new NobleEd25519Signer(privateKey)` instead of `Ed25519Signer.fromPrivateKey`

### Patch Changes

- 1b0e3a7: Add RPC Auth via Env variables and a new getAuthMetadata method to make it easier to use RPC auth
- 1e4482e: updated dependencies
- Updated dependencies [469825e]
- Updated dependencies [1e4482e]
  - @farcaster/protobufs@0.1.9

## 0.2.12

### Patch Changes

- 86c00f53: refactor: change `Eip712Signer.fromSigner` signature

  Simplify creation of Eip712Signer by removing the need to pass
  a signer key and instead deriving the it from the ethers signer.

  This requires the function to be async.

## 0.2.11

### Patch Changes

- 0a3b77c: make SignerAddBody.name and SubscribeRequest.fromId optional
- Updated dependencies [0a3b77c]
- Updated dependencies [e7602bd]
- Updated dependencies [68230b7]
  - @farcaster/protobufs@0.1.8

## 0.2.10

### Patch Changes

- 2d90f5bf: Validate embed URLs using utf8 byte length

## 0.2.9

### Patch Changes

- e75e46b3: Validate using UTF8 byte count instead of character length

## 0.2.8

### Patch Changes

- 6f1c5a9: chore: use removeEnumPrefix ts-proto flag and abbreviate protobuf enum names
- ea7b9c9: feat: add name to SignerAdd message
- Updated dependencies [6f1c5a9]
- Updated dependencies [ea7b9c9]
  - @farcaster/protobufs@0.1.7

## 0.2.7

### Patch Changes

- d04d5d4a: add fromId to SubscribeRequest protobuf and subscribe gRPC method
- 4056b5d4: add HubEvent protobuf and types
- 22a9d460: remove UserData location type
- Updated dependencies [d04d5d4a]
- Updated dependencies [4056b5d4]
- Updated dependencies [22a9d460]
  - @farcaster/protobufs@0.1.6

## 0.2.6

### Patch Changes

- 96468718: Allow duplicate mentions positions

## 0.2.5

### Patch Changes

- add prepublishOnly scripts to packages
- Updated dependencies
  - @farcaster/protobufs@0.1.5

## 0.2.4

### Patch Changes

- 3096e00: Allow empty cast text

## 0.2.3

### Patch Changes

- d21a8f2: chore: upgrade packages [feb 2023]
- 6a66bae: feat: add mentionsPositions to CastAddBody
- 1151fea: feat: update farcaster epoch to Jan 1, 2021
- Updated dependencies [d21a8f2]
- Updated dependencies [6a66bae]
- Updated dependencies [cf9c64c]
  - @farcaster/protobufs@0.1.4

## 0.2.2

### Patch Changes

- 6be9983: add subscribe grpc method and support event streaming
- Updated dependencies [9558382]
- Updated dependencies [6be9983]
  - @farcaster/protobufs@0.1.3

## 0.2.1

### Patch Changes

- 78d9050: only add require banner for esm files in protobufs and update bytesIncrement method to assume big endian
- Updated dependencies [78d9050]
  - @farcaster/protobufs@0.1.2

## 0.2.0

### Minor Changes

- 58738a4: migrate to protobufs

### Patch Changes

- b43fade: feat: add protobufs IdRegistryEvent and SignerStore
- ae7639c: add NameRegistryEvent schema and utils
- cd84f7c: feat: start @farcaster/protobufs for protobufs schema and static code and @farcaster/protoutils for protobufs version of utils package
- 2e32983: force addresses and hashes to be fixed size in validations
- Updated dependencies [526bd17]
- Updated dependencies [b43fade]
- Updated dependencies [ae7639c]
- Updated dependencies [cd84f7c]
  - @farcaster/protobufs@0.1.1
