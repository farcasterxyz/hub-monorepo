# Farcaster Hub

The Farcaster Hub is a server that validates, stores, and replicates signed messages on the Farcaster v2 network. Read more about the Farcaster v2 design in the [Farcaster protocol repo](https://github.com/farcasterxyz/protocol).

The hub has three components

- [Client](src/client.ts) - a class that embeds the Farcaster types and can generate new signed messages, approximating a desktop or mobile application
- [Node](src/node.ts) - a class that receives messages from clients and syncs messages with other peers
- [Engine](src/engine/index.ts) - a class that determines how a new message received by a node gets merged into the existing state. State is represented by a collection of CRDTs, each with its own conflict-resolution logic.

## :package: Installing Dependencies

First, ensure that the following are installed globally on your machine:

- [Node.js 16+](https://github.com/nvm-sh/nvm)
- [Yarn](https://classic.yarnpkg.com/lang/en/docs/install)

Then, from the project root, run `yarn install` to install NPM dependencies.

## Roadmap

Roadmap is coming soon.
