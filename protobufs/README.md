# @farcaster/protobufs

Specifications for API's and data formats used in Hubble, including both Farcaster protocol types and Hubble specific types.

| Schema                                                 | Type Description                         | Docs                    |
| ------------------------------------------------------ | ---------------------------------------- | ----------------------- |
| [Message](schemas/message.proto)                       | Types for Farcaster deltas               | [docs](docs/message.md) |
| [RPC](schemas/rpc.proto)                               | Types for gRPC APIs exposed by Hubs      | [docs](docs/rpc.md)     |
| [Gossip](schemas/gossip.proto)                         | Types for gossiping data between Hubs    |                         |
| [IdRegistryEvent](schemas/id_registry_event.proto)     | Types for representing on-chain activity |                         |
| [NameRegistryEvent](schemas/name_registry_event.proto) | Types for representing on-chain activity |                         |
| [HubState](schemas/hub_state.proto)                    | Types for for maintaining internal state |                         |

## Getting Started

### Generate Bindings

Coming soon

### Generate Docs

Documentation of gRPC endpoints is done manually, but `protoc` can be used to generate Message docs:

1. Install [protoc](https://grpc.io/docs/protoc-installation/)
2. Download latest `protoc-gen-doc` binary from the [repo](https://github.com/pseudomuto/protoc-gen-doc) and place in this folder
3. On OS X, you may need to remove the binary from quaratine with `xattr -d com.apple.quarantine protoc-gen-doc`
4. Run `protoc --plugin=protoc-gen-doc=./protoc-gen-doc --doc_out=. --doc_opt=markdown,message.md schemas/message.proto`

The output should be merged with the existing documentation by hand because it makes some errors like not correctly documenting [oneOf](https://github.com/pseudomuto/protoc-gen-doc/issues/333). It also organizes items alphabetically which makes it harder to parse.
