# @farcaster/utils

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
