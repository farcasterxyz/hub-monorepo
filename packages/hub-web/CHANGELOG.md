# @farcaster/hub-web

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
