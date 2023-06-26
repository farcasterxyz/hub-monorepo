---
'@farcaster/hub-web': minor
---

Made RPC client factory functions more flexible

- removed @improbable-eng/grpc-web-node-http-transport as a dependency
  - this transport can be installed and configured using the `transport`
    property of the GrpcHubImpl options
- factory functions no longer take a boolean indicating if the env is a browser
  or not and instead an object to specify options of the GrpcWeb client
  - if you need to use this in a node environment, install
    @improbable-eng/grpc-web-node-http-transport and pass it as the transport,
    or use @farcaster/hub-node-js
