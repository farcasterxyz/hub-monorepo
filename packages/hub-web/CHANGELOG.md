# @farcaster/hub-web

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
