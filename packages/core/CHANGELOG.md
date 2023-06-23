# @farcaster/core

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
