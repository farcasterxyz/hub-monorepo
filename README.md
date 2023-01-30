# Hubble

Hubble is a typescript implementation of a Farcaster Hub defined in the [protocol specification](https://github.com/farcasterxyz/protocol). The repository is a monorepo with an executable hub application and shared packages.

| Package Name                                 | Description                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| [@farcaster/hub](/apps/hub)                  | An executable Farcaster Hub                                                  |
| [@farcaster/protobufs](/packages/protobufs/) | Protobufs schemas and generated files for types                              |
| [@farcaster/utils](/packages/utils/)         | Shared methods and classes                                                   |
| [@farcaster/js](/packages/js)                | Methods and types to easily build messages and interact with hubble via gRPC |

## Getting Started

To run an instance of the hub, follow the steps to [set up your environment](CONTRIBUTING.md#2-setting-up-your-development-environment) and then follow the instructions in [@farcaster/hubble's README](/apps/hub/README.md).

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md)
