# Node Playground

The playground is a simulated environment to test the [Farcaster v2 design](https://farcasterxyz.notion.site/Farcaster-v2-850f8aa56d6144f890b09570fba6bb67). There are four main parts to the playground:

- [Simulator](src/simulation.ts) - an observervable environment where nodes and clients can be made to interact in different ways.
- [Client](src/client.ts) - a class that can generate new signed messages, approximating a desktop or mobile application.
- [Node](src/node.ts) - a class that receives messages from clients and sync messages with other peers.
- [Engine](src/engine/index.ts) - a class that determines how a new message recieved by a node gets merged into the existing state.

## :package: Installing Dependencies

First, ensure that the following are installed globally on your machine:

- [Node.js 16+](https://github.com/nvm-sh/nvm)
- [Yarn](https://classic.yarnpkg.com/lang/en/docs/install)

Then, from the project root, run `yarn install` to install NPM dependencies.

## :racehorse: Running the App Locally

Run `yarn dev` to begin the simulation in your terminal. You should see output like this and be able to watch the nodes converge to an identical state.

```bash
┌────────┬──────────────────────────────────────┐
│ Cook   │                                      │
├────────┼────────┬─────────┬─────────┬─────────┤
│ Friar  │ 🪴  11e │ 📢  d20 │ 📢  dc9 │ 📢  e50 │
├────────┼────────┼─────────┼─────────┼─────────┤
│ Knight │ 🪴  11e │ 📢  d20 │ 📢  dc9 │ 📢  e50 │
├────────┼────────┴─────────┴─────────┴─────────┤
│ Miller │                                      │
├────────┼────────┬─────────┬─────────┬─────────┤
│ Squire │ 🪴  11e │ 📢  d20 │ 📢  dc9 │ 📢  e50 │
└────────┴────────┴─────────┴─────────┴─────────┘
```

## Roadmap

### Phase I - Consensus Verification

The first step is to verify that our [consensus algorithm](https://farcasterxyz.notion.site/Spec-Farcaster-Message-c71fa4c4334542e9a3dc678be4df6fe2) results in an eventually consistent network under all circumstances. This is the most difficult part of what we are building and where most of the risk lies.

Our focus is on identifying problem in this area quickly by taking shortcuts in other areas for now. We'll avoid the problems of infrastructure (by simulating a network inside Node.js), data storage (by keeping everything in memory), peer discovery (by hardcoding peers), network transport (by allowing direct communication between classes) and smart contract development (by simulating blockchain events),

- [x] **Basics** - a simple implementation of interfaces for a simulator, node, client and engine.
- [x] **Visualizer** - bird's eye view of all the nodes and the messages
- [x] **Roots** - implement consensus rules and unit tests for Roots
- [x] **Registry Simulation** - logic and tests to handle new registrations and signer change events
- [x] **Casts** - implement consensus rules and unit tests for Casts
- [ ] **Reactions** - implement consensus rules and unit tests for reactions
- [ ] **Network Simulations** - run complex edge cases on the network

### Phase II - Smart Contract Integration

Implement the remaining data structures, which at this point should just be extensions of the existing data structures that we have in place.

- [ ] **Profile** - implement consensus rules and unit tests for profile data
- [ ] **Verified Addresses** - implement consensus rules and unit tests for verified addresses
- [ ] **Follows** - implement consensus rules and unit tests for follows

### Phase III - Smart Contract Integration

Connect to a working version of our smart contract and respond to events in real time.

### Phase III - P2P & Transport Implementation

Implement a mechanism to discover peers efficiently and to standardize a format for sending data over the wire.

### Phase IV - Persistent Local Storage

Implement persistent, local storage so that nodes can retain data if they need to restart.

### Phase V - Testnet

Deploy the nodes into a real test environment where they can talk to each other over a public network.
