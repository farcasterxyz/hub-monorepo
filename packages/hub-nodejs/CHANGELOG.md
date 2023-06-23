# @farcaster/hub-nodejs

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
