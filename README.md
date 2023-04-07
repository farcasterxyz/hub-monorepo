# Hub Monorepo

A monorepo codebase that implements the [Farcaster Hub specification](https://github.com/farcasterxyz/protocol#4-hubs) in Typescript and Protocol Buffers.

| Package Name                                  | Description                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| [@farcaster/hubble](/apps/hubble)             | A Hub, which can be run as a stand-alone application.                          |
| [@farcaster/core](/packages/core)             | Protobuf definitions and shared utility functions.                             |
| [@farcaster/hub-nodejs](/packages/hub-nodejs) | Node.js package exporting `@farcaster/core` and gRPC client implementation     |
| [@farcaster/hub-web](/packages//hub-web)      | Browser package exporting `@farcaster/core` and gRPC-Web client implementation |

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md)
