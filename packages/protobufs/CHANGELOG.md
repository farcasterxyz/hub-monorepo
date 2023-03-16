# @farcaster/protobufs

## 0.1.8

### Patch Changes

- 0a3b77c: make SignerAddBody.name and SubscribeRequest.fromId optional
- e7602bd: add pagination to list rpc methods
- 68230b7: chore: move submitIdRegistryEvent and submitNameRegistryEvent to admin grpc service

## 0.1.7

### Patch Changes

- 6f1c5a9: chore: use removeEnumPrefix ts-proto flag and abbreviate protobuf enum names
- ea7b9c9: feat: add name to SignerAdd message

## 0.1.6

### Patch Changes

- d04d5d4a: add fromId to SubscribeRequest protobuf and subscribe gRPC method
- 4056b5d4: add HubEvent protobuf and types
- 22a9d460: remove UserData location type

## 0.1.5

### Patch Changes

- add prepublishOnly scripts to packages

## 0.1.4

### Patch Changes

- d21a8f2: chore: upgrade packages [feb 2023]
- 6a66bae: feat: add mentionsPositions to CastAddBody
- cf9c64c: add UpdateNameRegistryEventExpiryJobPayload message to job.proto

## 0.1.3

### Patch Changes

- 9558382: chore: delete unused dependencies in packages
- 6be9983: add subscribe grpc method and support event streaming

## 0.1.2

### Patch Changes

- 78d9050: only add require banner for esm files in protobufs and update bytesIncrement method to assume big endian

## 0.1.1

### Patch Changes

- 526bd17: feat: add job.proto schema
- b43fade: feat: add protobufs IdRegistryEvent and SignerStore
- ae7639c: add NameRegistryEvent schema and utils
- cd84f7c: feat: start @farcaster/protobufs for protobufs schema and static code and @farcaster/protoutils for protobufs version of utils package
