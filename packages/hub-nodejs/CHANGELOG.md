# @farcaster/hub-nodejs

## 0.12.1

### Patch Changes

- cc0d0a3e: feat: added start/stop time filters for bulk queries
- Updated dependencies [fbd3ba5f]
- Updated dependencies [cc0d0a3e]
  - @farcaster/core@0.15.1

## 0.12.0

### Minor Changes

- dd634c79: feat: Implement Storage Extension FIP

### Patch Changes

- Updated dependencies [dd634c79]
  - @farcaster/core@0.15.0

## 0.11.24

### Patch Changes

- 47fbd34e: fix: adjust grpc keepalive time to 5s to encourage faster failover from uncooperative peers

## 0.11.23

### Patch Changes

- 939dde84: chore: upgrade viem to v2
- Updated dependencies [61959467]
- Updated dependencies [939dde84]
  - @farcaster/core@0.14.20

## 0.11.22

### Patch Changes

- 2fa29ad4: fix: Upgrade grpc-js to 1.11

## 0.11.21

### Patch Changes

- Updated dependencies [76ad1ac2]
  - @farcaster/core@0.14.19

## 0.11.20

### Patch Changes

- Updated dependencies [fb0a083a]
  - @farcaster/core@0.14.18

## 0.11.19

### Patch Changes

- c723f655: feat: Add endpoints to control sync

## 0.11.18

### Patch Changes

- Updated dependencies [eacf29c9]
  - @farcaster/core@0.14.17

## 0.11.17

### Patch Changes

- dab95118: Add rpc to expose LinkCompactStateMessage + explicit handling of type
- Updated dependencies [dab95118]
  - @farcaster/core@0.14.16

## 0.11.16

### Patch Changes

- c424e111: feat: Add support for long casts
- Updated dependencies [c424e111]
  - @farcaster/core@0.14.15

## 0.11.15

### Patch Changes

- Updated dependencies [de52fbce]
  - @farcaster/core@0.14.14

## 0.11.14

### Patch Changes

- Updated dependencies [911f8b23]
  - @farcaster/core@0.14.13

## 0.11.13

### Patch Changes

- 87c4f416: Include better error message when providing bad host address

## 0.11.12

### Patch Changes

- c261fba6: added approxSize to getInfo()
- Updated dependencies [c261fba6]
  - @farcaster/core@0.14.12

## 0.11.11

### Patch Changes

- 7b374890: feat: Add Link CompactStateMessage type for link compaction
- Updated dependencies [ab9258af]
- Updated dependencies [7b374890]
  - @farcaster/core@0.14.11

## 0.11.10

### Patch Changes

- 4c9fb617: feat: allow sharding event stream by fid
- Updated dependencies [4c9fb617]
  - @farcaster/core@0.14.10

## 0.11.9

### Patch Changes

- 5ca5a4a5: feat: Add gossip MessageBundles
- Updated dependencies [5ca5a4a5]
  - @farcaster/core@0.14.9

## 0.11.8

### Patch Changes

- Updated dependencies [e30297b9]
  - @farcaster/core@0.14.8

## 0.11.7

### Patch Changes

- 22615b3c: Add address to frame message
- Updated dependencies [22615b3c]
  - @farcaster/core@0.14.7

## 0.11.6

### Patch Changes

- Updated dependencies [f7d13376]
  - @farcaster/core@0.14.6

## 0.11.5

### Patch Changes

- 5a1764d8: perf: Move DB and Reactions store to rust
- Updated dependencies [5a1764d8]
  - @farcaster/core@0.14.5

## 0.11.4

### Patch Changes

- 579d29a4: feat: add transaction ID to frame message
- 419d8287: Add currentPeers RPC endpoint
- Updated dependencies [579d29a4]
- Updated dependencies [419d8287]
  - @farcaster/core@0.14.4

## 0.11.3

### Patch Changes

- Updated dependencies [1fd0f686]
  - @farcaster/core@0.14.3

## 0.11.2

### Patch Changes

- 5703d339: feat: add state field to frame message
- Updated dependencies [5703d339]
- Updated dependencies [136ef6b4]
  - @farcaster/core@0.14.2

## 0.11.1

### Patch Changes

- Updated dependencies [bf37ec76]
- Updated dependencies [1a52b869]
  - @farcaster/core@0.14.1

## 0.11.0

### Minor Changes

- ae91b73a: Add Solana verification support

### Patch Changes

- Updated dependencies [ae91b73a]
  - @farcaster/core@0.14.0

## 0.10.24

### Patch Changes

- 763d3154: feat: rename some verification message fields to support more protocols
- Updated dependencies [763d3154]
  - @farcaster/core@0.13.8

## 0.10.23

### Patch Changes

- f8c5f280: fix: Revert verification renames which break http backwards compatibility
- Updated dependencies [f8c5f280]
  - @farcaster/core@0.13.7

## 0.10.22

### Patch Changes

- fd9f9ff8: Rename verification message
- 362f580b: feat: add text input frame field
- Updated dependencies [fd9f9ff8]
- Updated dependencies [362f580b]
  - @farcaster/core@0.13.6

## 0.10.21

### Patch Changes

- 229ea166: feat: Add support for FrameAction and validateMessage
- Updated dependencies [229ea166]
  - @farcaster/core@0.13.5

## 0.10.20

### Patch Changes

- 704e0777: feat: Add usage information to getCurrentStorageLimitsByFid rpc call
- Updated dependencies [704e0777]
  - @farcaster/core@0.13.4

## 0.10.19

### Patch Changes

- Updated dependencies [b001fee9]
  - @farcaster/core@0.13.3

## 0.10.18

### Patch Changes

- ab245ce5: Add EIP-712 helpers
- Updated dependencies [ab245ce5]
  - @farcaster/core@0.13.2

## 0.10.17

### Patch Changes

- 6890969b: fix: remove references to old contracts
- Updated dependencies [5199f66e]
- Updated dependencies [6890969b]
- Updated dependencies [5199f66e]
  - @farcaster/core@0.13.1

## 0.10.16

### Patch Changes

- f3d32227: feat: Support v2 id and key registry contracts
- Updated dependencies [3313c232]
- Updated dependencies [f3d32227]
  - @farcaster/core@0.13.0

## 0.10.15

### Patch Changes

- 153da45a: Remove PubSub PeerDiscovery in favor of ContactInfo based PeerDiscovery
- Updated dependencies [153da45a]
  - @farcaster/core@0.12.15

## 0.10.14

### Patch Changes

- ba86d374: feat: Allow signing raw message data bytes to support rust, Golang etc...
- Updated dependencies [ba86d374]
  - @farcaster/core@0.12.14

## 0.10.13

### Patch Changes

- f4e50b95: fix: use interface for Viem PublicClient, add optional publicClients to builders
- Updated dependencies [f4e50b95]
  - @farcaster/core@0.12.13

## 0.10.12

### Patch Changes

- 81e6d8ec: FIP-8 contract verifications
- aacff028: Remove eslint-config-custom dependencies
- c33f5270: fix: Run protoc as user instead of root
- 433bee81: feat: Enable events sync by default
- Updated dependencies [81e6d8ec]
- Updated dependencies [aacff028]
- Updated dependencies [c33f5270]
- Updated dependencies [433bee81]
  - @farcaster/core@0.12.12

## 0.10.11

### Patch Changes

- 14f67cf2: feat: Add peer scoring
- Updated dependencies [ef795c71]
- Updated dependencies [14f67cf2]
  - @farcaster/core@0.12.11

## 0.10.10

### Patch Changes

- aeab5a4c: docs: Refactor HTTP API docs
- Updated dependencies [31641c17]
- Updated dependencies [fb1f5c61]
- Updated dependencies [aeab5a4c]
- Updated dependencies [4b99eddb]
  - @farcaster/core@0.12.10

## 0.10.9

### Patch Changes

- d77970b1: chore: Delete deprecated rpc calls and events
- Updated dependencies [7e2a66e5]
- Updated dependencies [20062ceb]
- Updated dependencies [d77970b1]
  - @farcaster/core@0.12.9

## 0.10.8

### Patch Changes

- Updated dependencies [4893e02d]
  - @farcaster/core@0.12.8

## 0.10.7

### Patch Changes

- 08b652e: fix: Add txIndex to onchain events, fix wrong index being used in the primary key
- Updated dependencies [08b652e]
  - @farcaster/core@0.12.7

## 0.10.6

### Patch Changes

- 2ab99d95: feat: Add REST API
- bc416dbe: feat: Allow Hub operators to set an FID
- 76a031e2: feat: Add storage limit constants to core
- Updated dependencies [bc416dbe]
- Updated dependencies [76a031e2]
  - @farcaster/core@0.12.6

## 0.10.5

### Patch Changes

- bf1c44d2: feat: Update signer onchain event to store new fields and add additional RPC calls
- Updated dependencies [e6180074]
- Updated dependencies [bf1c44d2]
  - @farcaster/core@0.12.5

## 0.10.4

### Patch Changes

- e55e571f: feat: Add "getting blockchain events" to hub status
- c6d79cdb: feat: on chain event ordering updated to be more consistent
- Updated dependencies [e55e571f]
- Updated dependencies [1fcfd495]
- Updated dependencies [c6d79cdb]
  - @farcaster/core@0.12.4

## 0.10.3

### Patch Changes

- Updated dependencies [41334ab8]
  - @farcaster/core@0.12.3

## 0.10.2

### Patch Changes

- Updated dependencies [afd2146f]
  - @farcaster/core@0.12.2

## 0.10.1

### Patch Changes

- Updated dependencies [cfec7767]
  - @farcaster/core@0.12.1

## 0.10.0

### Minor Changes

- 86149d32: Added storage limits RPC

### Patch Changes

- 3f180073: chore: Update grpc-js and setup grpc server timeouts
- dcd7a149: feat: support migrating to l2
- 67e9466e: feat: refactor storage rent events to on chain events
- Updated dependencies [ec7734cf]
- Updated dependencies [15fad467]
- Updated dependencies [dcd7a149]
- Updated dependencies [67e9466e]
- Updated dependencies [86149d32]
  - @farcaster/core@0.12.0

## 0.9.1

### Patch Changes

- Updated dependencies [e36fcae]
- Updated dependencies [88f31f2]
  - @farcaster/core@0.11.1

## 0.9.0

### Minor Changes

- 2391c3a5: Adds support for storage events

### Patch Changes

- 57235761: Remove ethers dependency
- Updated dependencies [2391c3a5]
  - @farcaster/core@0.11.0

## 0.8.4

### Patch Changes

- cd0ddd6: feat: Add support for ens names
- 4fa7a56: rename UserDataType.FNAME to UserDataType.USERNAME
- Updated dependencies [cd0ddd6]
- Updated dependencies [4fa7a56]
  - @farcaster/core@0.10.2

## 0.8.3

### Patch Changes

- 5a1baae: Switch fnames from contract events to fname server proofs
- Updated dependencies [5a1baae]
  - @farcaster/core@0.10.1

## 0.8.2

### Patch Changes

- Updated dependencies [159c62d]
- Updated dependencies [159c62d]
- Updated dependencies [bfdbfea]
  - @farcaster/core@0.10.0

## 0.8.1

### Patch Changes

- f1c6b25: Fetch, validate and store username proofs from fname registry
- Updated dependencies [f1c6b25]
  - @farcaster/core@0.9.1

## 0.8.0

### Minor Changes

- 2bc598a: Added support for Links

### Patch Changes

- Updated dependencies [37f515f]
- Updated dependencies [2bc598a]
  - @farcaster/core@0.9.0

## 0.7.4

### Patch Changes

- Re-publish
- Updated dependencies
  - @farcaster/core@0.8.1

## 0.7.3

### Patch Changes

- 2ca66b17: replace @noble/ed25519 with faster and more secure @noble/curves
- Updated dependencies [651df412]
- Updated dependencies [2ca66b17]
  - @farcaster/core@0.8.0

## 0.7.2

### Patch Changes

- 1236b4e: Add a GetSyncStatus rpc call that exposes the hubs sync status with different peers
- Updated dependencies [1236b4e]
- Updated dependencies [2e633db]
- Updated dependencies [d2cb5e4]
  - @farcaster/core@0.7.2

## 0.7.1

### Patch Changes

- 421c385: Add sync stats to getInfo rpc call
- Updated dependencies [6a84860]
- Updated dependencies [421c385]
  - @farcaster/core@0.7.1

## 0.7.0

### Minor Changes

- 87b2789: support CastId embeds, cast parent URLs, and reaction target URLs

### Patch Changes

- Updated dependencies [87b2789]
  - @farcaster/core@0.7.0

## 0.6.3

### Patch Changes

- Updated dependencies [edea195]
  - @farcaster/core@0.6.1

## 0.6.2

### Patch Changes

- 1e4e5ba: update tsup build command to check target environments and use tsup shims
- c4529a7: merge protobufs and utils packages into core
- Updated dependencies [1e4e5ba]
- Updated dependencies [c4529a7]
  - @farcaster/core@0.6.0

## 0.6.1

### Patch Changes

- 1f47906: remove grpc-js dependency from protobufs, refactor hubble to use hub-nodejs
  hub-web to use @farcaster/protobufs and utils
- 9e39bb8: Update docs to close grpc connections after use
- Updated dependencies [142f3f5]
- Updated dependencies [1f47906]
- Updated dependencies [759e1cf]
- Updated dependencies [9e39bb8]
  - @farcaster/protobufs@0.2.0
  - @farcaster/utils@0.5.0

## 0.6.0

### Minor Changes

- e5cb327: Remove getHubRpcClient, use getSSLRpcClient() or getInsecureRpcClient()

### Patch Changes

- Updated dependencies [e5cb327]
  - @farcaster/protobufs@0.1.11
  - @farcaster/utils@0.4.0

## 0.5.1

### Patch Changes

- c26fafa: Add test data to testnet hubs via TEST_USERS env variable
- dc69b66: feat: add EthersV5Eip712Signer
- 5c78405: upgrade ethers to 6.2.1
- 1b5f6b2: fixed documentation links on npm
- Updated dependencies [12c9c40]
- Updated dependencies [dc69b66]
- Updated dependencies [5c78405]
- Updated dependencies [6a0bf29]
- Updated dependencies [23de6e7]
  - @farcaster/utils@0.3.1
  - @farcaster/protobufs@0.1.10

## 0.5.0

### Minor Changes

- 59920f9: upgrade ethers from v5 to v6
- 99518ef: refactor: generic and library specific signer classes

  - `Eip712Signer` has been renamed to `EthersEip712Signer` and should be built with `new EthersEip712Signer(wallet)` instead of `Eip712Signer.fromSigner`
  - `Ed25519Signer` has been renamed to `NobleEd25519Signer` and should be built with `new NobleEd25519Signer(privateKey)` instead of `Ed25519Signer.fromPrivateKey`

### Patch Changes

- c459855: docs: update signer links in docs
- 1e4482e: updated dependencies
- Updated dependencies [469825e]
- Updated dependencies [1b0e3a7]
- Updated dependencies [59920f9]
- Updated dependencies [99518ef]
- Updated dependencies [1e4482e]
  - @farcaster/protobufs@0.1.9
  - @farcaster/utils@0.3.0

## 0.4.1

### Patch Changes

- 86c00f53: refactor: change `Eip712Signer.fromSigner` signature

  Simplify creation of Eip712Signer by removing the need to pass
  a signer key and instead deriving the it from the ethers signer.

  This requires the function to be async.

- Updated dependencies [86c00f53]
  - @farcaster/utils@0.2.12

## 0.4.0

### Minor Changes

- a74ecb2: rename package from farcaster/js to farcaster/hub-nodejs

### Patch Changes

- Updated dependencies [0a3b77c]
- Updated dependencies [e7602bd]
- Updated dependencies [68230b7]
  - @farcaster/protobufs@0.1.8
  - @farcaster/utils@0.2.11

## 0.3.0

### Minor Changes

- f55fa8a2: move builders to utils and use bytes rather than hex

### Patch Changes

- Updated dependencies [2d90f5bf]
  - @farcaster/utils@0.2.10

## 0.2.9

### Patch Changes

- Updated dependencies [e75e46b3]
  - @farcaster/utils@0.2.9

## 0.2.8

### Patch Changes

- 6f1c5a9: chore: use removeEnumPrefix ts-proto flag and abbreviate protobuf enum names
- ea7b9c9: feat: add name to SignerAdd message
- Updated dependencies [6f1c5a9]
- Updated dependencies [ea7b9c9]
  - @farcaster/protobufs@0.1.7
  - @farcaster/utils@0.2.8

## 0.2.7

### Patch Changes

- d04d5d4a: add fromId to SubscribeRequest protobuf and subscribe gRPC method
- 4056b5d4: add HubEvent protobuf and types
- Updated dependencies [d04d5d4a]
- Updated dependencies [4056b5d4]
- Updated dependencies [22a9d460]
  - @farcaster/protobufs@0.1.6
  - @farcaster/utils@0.2.7

## 0.2.6

### Patch Changes

- Updated dependencies [96468718]
  - @farcaster/utils@0.2.6

## 0.2.5

### Patch Changes

- add prepublishOnly scripts to packages
- Updated dependencies
  - @farcaster/protobufs@0.1.5
  - @farcaster/utils@0.2.5

## 0.2.4

### Patch Changes

- Updated dependencies [3096e00]
  - @farcaster/utils@0.2.4

## 0.2.3

### Patch Changes

- d21a8f2: chore: upgrade packages [feb 2023]
- 1151fea: feat: update farcaster epoch to Jan 1, 2021
- Updated dependencies [d21a8f2]
- Updated dependencies [6a66bae]
- Updated dependencies [1151fea]
- Updated dependencies [cf9c64c]
  - @farcaster/protobufs@0.1.4
  - @farcaster/utils@0.2.3

## 0.2.2

### Patch Changes

- 9558382: chore: delete unused dependencies in packages
- 6be9983: add subscribe grpc method and support event streaming
- Updated dependencies [9558382]
- Updated dependencies [6be9983]
  - @farcaster/protobufs@0.1.3
  - @farcaster/utils@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies [78d9050]
  - @farcaster/protobufs@0.1.2
  - @farcaster/utils@0.2.1

## 0.2.0

### Minor Changes

- 58738a4: migrate to protobufs

### Patch Changes

- a26d8ff: replace flatbuffers with protobufs
- Updated dependencies [58738a4]
- Updated dependencies [526bd17]
- Updated dependencies [b43fade]
- Updated dependencies [ae7639c]
- Updated dependencies [cd84f7c]
- Updated dependencies [2e32983]
  - @farcaster/utils@0.2.0
  - @farcaster/protobufs@0.1.1

## 0.1.6

### Patch Changes

- fix: switch to 160-bit hash
- c20daed: feat: add support for /subscribe gRPC method in @farcaster/hub-nodejs
- 3b84ad2: chore: refactor functions in packages/\* to return HubResult
- Updated dependencies
- Updated dependencies [c20daed]
- Updated dependencies [3b84ad2]
  - @farcaster/utils@0.1.5
  - @farcaster/flatbuffers@0.1.5
  - @farcaster/grpc@0.1.5

## 0.1.5

### Patch Changes

- adding packages to changesets
- Updated dependencies
  - @farcaster/flatbuffers@0.1.4
  - @farcaster/grpc@0.1.4
  - @farcaster/utils@0.1.4
