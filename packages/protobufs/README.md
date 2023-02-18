# @farcaster/protobufs

Contains protobuf types used in Hubble.

| Schema                                                     | Type Description                         | Docs                    |
| ---------------------------------------------------------- | ---------------------------------------- | ----------------------- |
| [Message](src/schemas/message.proto)                       | Types for Farcaster deltas               | [docs](docs/message.md) |
| [Gossip](src/schemas/gossip.proto)                         | Types for gossiping data between Hubs    |                         |
| [RPC](src/schemas/rpc.proto)                               | Types for gRPC APIs exposed by Hubs      | [docs](docs/rpc.md)     |
| [IdRegistryEvent](src/schemas/id_registry_event.proto)     | Types for representing on-chain activity |                         |
| [NameRegistryEvent](src/schemas/name_registry_event.proto) | Types for representing on-chain activity |                         |
| [HubState](src/schemas/hub_state.proto)                    | Types for for maintaining internal state |                         |

### Generate Docs

Documentation of gRPC endpoints is done manually, but `protoc` can be used to generate protofbuf docs. To do this:

1. Install [protoc](https://grpc.io/docs/protoc-installation/)
2. Download latest `protoc-gen-doc` binary from the [repo](https://github.com/pseudomuto/protoc-gen-doc) and place in this folder
3. On OS X, you may need to remove the binary from quaratine with `xattr -d com.apple.quarantine protoc-gen-doc`
4. Run `protoc --plugin=protoc-gen-doc=./protoc-gen-doc --doc_out=. --doc_opt=markdown,message.md src/schemas/message.proto`

The output should be merged with the existing documentation by hand because it makes some errors like not correctly documenting [oneOf](https://github.com/pseudomuto/protoc-gen-doc/issues/333). It also organizes items alphabetically which makes it harder to parse.
