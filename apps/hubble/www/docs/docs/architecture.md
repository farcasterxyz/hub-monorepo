# Architecture

A Hub is a single-process daemon that receives data from clients, other hubs and farcaster contracts. It has three main components:

- P2P Engine - establishes a gossipsub network to exchange messages with hubs.
- Sync Engine - handles edge cases when gossip fails to deliver messages.
- Storage Engine - checks message validity, persists them to disk and emits events.

### Storage Engine

Messages received by Hubble are forwarded to the Storage engine which forwards them to the appropriate CRDT Set. Once validated by the CRDT Set, messages are persisted to [RocksDB](https://github.com/facebook/rocksdb) and events are emitted to listeners.


CRDT sets are implemented to meet the specification in the Farcaster protocol. The engine also tracks state of the Farcaster contracts, which are necessary for validating the Signer CRDT Set.

### P2P Engine

Hubble connects to other peers over a GossipSub network established using [LibP2P](https://github.com/libp2p/libp2p). Messages merged into the Storage Engine are immediately gossiped to all of is peers.

Hubble will only peer with trusted peers and employs a simple network topology during beta. It peers only with known instances which must be configured at startup. In later releases, the network topology will be modified to operate closer to a trustless mesh.

### Sync Engine

Hubble periodically performs a [diff sync](https://github.com/farcasterxyz/protocol#41-synchronization) with other peers to discover messages that may have been dropped during gossip. This is performed using gRPC APIs exposed by each Hub instance.

