# @farcaster/hub-web

## 0.7.1

### Patch Changes

- ab245ce5: Add EIP-712 helpers
- Updated dependencies [ab245ce5]
  - @farcaster/core@0.13.2

## 0.7.0

### Minor Changes

- 3313c232: Adds support for contact info content signing + strictNoSign

### Patch Changes

- f3d32227: feat: Support v2 id and key registry contracts
- Updated dependencies [3313c232]
- Updated dependencies [f3d32227]
  - @farcaster/core@0.13.0

## 0.6.10

### Patch Changes

- 153da45a: Remove PubSub PeerDiscovery in favor of ContactInfo based PeerDiscovery
- Updated dependencies [153da45a]
  - @farcaster/core@0.12.15

## 0.6.9

### Patch Changes

- 06bb2f43: chore: Go lang example for submitMessage()
- a5708f85: chore: Remove grpc-web
- ba86d374: feat: Allow signing raw message data bytes to support rust, Golang etc...
- Updated dependencies [ba86d374]
  - @farcaster/core@0.12.14

## 0.6.8

### Patch Changes

- f4e50b95: fix: use interface for Viem PublicClient, add optional publicClients to builders
- Updated dependencies [f4e50b95]
  - @farcaster/core@0.12.13

## 0.6.7

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

## 0.6.6

### Patch Changes

- b7c2b0a9: chore: Replace hub-web with HTTP api examples
- 14f67cf2: feat: Add peer scoring
- Updated dependencies [ef795c71]
- Updated dependencies [14f67cf2]
  - @farcaster/core@0.12.11

## 0.6.5

### Patch Changes

- d77970b1: chore: Delete deprecated rpc calls and events
- Updated dependencies [7e2a66e5]
- Updated dependencies [20062ceb]
- Updated dependencies [d77970b1]
  - @farcaster/core@0.12.9

## 0.6.4

### Patch Changes

- 08b652e: fix: Add txIndex to onchain events, fix wrong index being used in the primary key
- Updated dependencies [08b652e]
  - @farcaster/core@0.12.7

## 0.6.3

### Patch Changes

- 76a031e2: feat: Add storage limit constants to core
- Updated dependencies [bc416dbe]
- Updated dependencies [76a031e2]
  - @farcaster/core@0.12.6

## 0.6.2

### Patch Changes

- bf1c44d2: feat: Update signer onchain event to store new fields and add additional RPC calls
- Updated dependencies [e6180074]
- Updated dependencies [bf1c44d2]
  - @farcaster/core@0.12.5

## 0.6.1

### Patch Changes

- 1fcfd495: fix: fetching l2 events was not respecting --l2-first-block
- c6d79cdb: feat: on chain event ordering updated to be more consistent
- Updated dependencies [e55e571f]
- Updated dependencies [1fcfd495]
- Updated dependencies [c6d79cdb]
  - @farcaster/core@0.12.4

## 0.6.0

### Minor Changes

- 86149d32: Added storage limits RPC

### Patch Changes

- dcd7a149: feat: support migrating to l2
- 67e9466e: feat: refactor storage rent events to on chain events
- Updated dependencies [ec7734cf]
- Updated dependencies [15fad467]
- Updated dependencies [dcd7a149]
- Updated dependencies [67e9466e]
- Updated dependencies [86149d32]
  - @farcaster/core@0.12.0

## 0.5.0

### Minor Changes

- 2391c3a5: Adds support for storage events

### Patch Changes

- Updated dependencies [2391c3a5]
  - @farcaster/core@0.11.0

## 0.4.2

### Patch Changes

- cd0ddd6: feat: Add support for ens names
- 4fa7a56: rename UserDataType.FNAME to UserDataType.USERNAME
- Updated dependencies [cd0ddd6]
- Updated dependencies [4fa7a56]
  - @farcaster/core@0.10.2

## 0.4.1

### Patch Changes

- 5a1baae: Switch fnames from contract events to fname server proofs
- Updated dependencies [5a1baae]
  - @farcaster/core@0.10.1

## 0.4.0

### Minor Changes

- d8729a7: Made RPC client factory functions more flexible

  - removed @improbable-eng/grpc-web-node-http-transport as a dependency
    - this transport can be installed and configured using the `transport`
      property of the GrpcHubImpl options
  - factory functions no longer take a boolean indicating if the env is a browser
    or not and instead an object to specify options of the GrpcWeb client
    - if you need to use this in a node environment, install
      @improbable-eng/grpc-web-node-http-transport and pass it as the transport,
      or use @farcaster/hub-node-js

### Patch Changes

- Updated dependencies [159c62d]
- Updated dependencies [159c62d]
- Updated dependencies [bfdbfea]
  - @farcaster/core@0.10.0

## 0.3.6

### Patch Changes

- f1c6b25: Fetch, validate and store username proofs from fname registry
- Updated dependencies [f1c6b25]
  - @farcaster/core@0.9.1

## 0.3.5

### Patch Changes

- 37f515f: Add app version to contactInfo message
- Updated dependencies [37f515f]
- Updated dependencies [2bc598a]
  - @farcaster/core@0.9.0

## 0.3.4

### Patch Changes

- Re-publish
- Updated dependencies
  - @farcaster/core@0.8.1

## 0.3.3

### Patch Changes

- 2ca66b17: replace @noble/ed25519 with faster and more secure @noble/curves
- Updated dependencies [651df412]
- Updated dependencies [2ca66b17]
  - @farcaster/core@0.8.0

## 0.3.2

### Patch Changes

- 1236b4e: Add a GetSyncStatus rpc call that exposes the hubs sync status with different peers
- Updated dependencies [1236b4e]
- Updated dependencies [2e633db]
- Updated dependencies [d2cb5e4]
  - @farcaster/core@0.7.2

## 0.3.1

### Patch Changes

- 421c385: Add sync stats to getInfo rpc call
- Updated dependencies [6a84860]
- Updated dependencies [421c385]
  - @farcaster/core@0.7.1

## 0.3.0

### Minor Changes

- 87b2789: support CastId embeds, cast parent URLs, and reaction target URLs

### Patch Changes

- Updated dependencies [87b2789]
  - @farcaster/core@0.7.0

## 0.2.5

### Patch Changes

- ee953ec: fix: use @improbable-eng/grpc-web default export to improve compatibility

## 0.2.4

### Patch Changes

- 6e5449a: use raw Observable for subscribe method

## 0.2.3

### Patch Changes

- 833c4cc: map grpc codes to hub error codes in client
- 7d58347: fix error code for no connection
- 74ec252: add grpc error code as fallback
- Updated dependencies [edea195]
  - @farcaster/core@0.6.1

## 0.2.2

### Patch Changes

- 9f0dc6a: enable getSSLHubRpcClient
- 7194054: export getAuthMetadata for hub-web
  export getHubRpcClient

## 0.2.1

### Patch Changes

- 1e4e5ba: update tsup build command to check target environments and use tsup shims
- c4529a7: merge protobufs and utils packages into core
- Updated dependencies [1e4e5ba]
- Updated dependencies [c4529a7]
  - @farcaster/core@0.6.0

## 0.2.0

### Minor Changes

- 3ac5315: - add support for envoy
  - expose RpcWebClient
  - add new hub-web package and generate code from grpc-web
- 1f47906: remove grpc-js dependency from protobufs, refactor hubble to use hub-nodejs
  hub-web to use @farcaster/protobufs and utils
- ce7929e: wrap client of hub-web response Promise<T> -> Promise<HubResult<T>>
  fix the camelCase issue for generated ts

### Patch Changes

- Updated dependencies [142f3f5]
- Updated dependencies [1f47906]
- Updated dependencies [759e1cf]
- Updated dependencies [9e39bb8]
  - @farcaster/protobufs@0.2.0
  - @farcaster/utils@0.5.0
