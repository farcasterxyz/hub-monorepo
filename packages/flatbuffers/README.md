# Flatbuffers

A collection of [Flatbuffer](https://github.com/google/flatbuffers) schemas and generated Typescript classes used in the Farcaster Hub.

| Schema                                                        | Description                             |
| ------------------------------------------------------------- | --------------------------------------- |
| [Message](./src/schemas/message.fbs)                          | Farcaster Deltas created by users       |
| [Id Registry Events](./src/schemas/id_registry_event.fbs)     | Events from the Farcaster Id Registry   |
| [Name Registry Events](./src/schemas/name_registry_event.fbs) | Events from the Farcaster Name Registry |
| [RPC](./src/schemas/rpc.fbs)                                  | Requests to the RPC Server              |
| [Gossip](./src/schemas/gossip.fbs)                            | Messages sent over the gossip network   |
| [Hub State](./src/schemas/hub_state.fbs)                      | State persisted by the Hub              |

If you update any `*.fbs` files you must regenerate the TS classes by running `yarn flatc`.
