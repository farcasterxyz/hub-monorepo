# @farcaster/protobufs

Specifications for API's and data formats used in Hubble, including both Farcaster protocol types and Hubble specific types.

| Schema                                      | Type Description                         | Docs                    |
|---------------------------------------------|------------------------------------------| ----------------------- |
| [Message](schemas/message.proto)            | Types for Farcaster deltas               | [docs](docs/message.md) |
| [OnChainEvent](schemas/onchain_event.proto) | Types for Farcaster onchain events       | [docs](docs/message.md) |
| [HubEvent](schemas/hub_event.proto)         | Types for hub events                     | [docs](docs/message.md) |
| [RPC](schemas/rpc.proto)                    | Types for gRPC APIs exposed by Hubs      | [docs](docs/rpc.md)     |
| [Gossip](schemas/gossip.proto)              | Types for gossiping data between Hubs    |                         |
| [HubState](schemas/hub_state.proto)         | Types for maintaining internal state     |                         |

## Getting Started

### Compiling Protobufs
If you make changes to the protobufs, you will need to run `yarn protoc` in the following directories to compile and generate the JS files
- `packages/core`
- `packages/hub-nodejs`
- `packages/hub-web`

### Generate Bindings

Coming soon

### Docs

Docs for the protobufs are under `../apps/hubble/www/docs/docs`
