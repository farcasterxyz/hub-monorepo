# Documentation

@farcaster/hub-nodejs has four major components:

- A [Client](./Client.md), which can send and receive messages from a Farcaster Hub.
- [Messages](./Messages.md), which are the atomic units of change on the Farcaster network.
- [Builders](./Builders.md), which can be used to construct new messages.
- [Signers](./signers/), which are required by Builders to sign messages.
- [Utils](./Utils.md), which are helpers to deal with Farcaster idiosyncrasies.

## Idiosyncrasies

There are four important things to know about the package:

- Fixed length data is encoded in [byte formats](./Utils.md#bytes), instead of strings.
- Errors are handled with [a monadic pattern](./Utils.md#errors), instead of try-catch.
- Timestamps are calculated from the [Farcaster epoch](./Utils.md#time), not the Unix epoch.
- Only Nodejs is supported, and browser support is a [work in progress](https://github.com/farcasterxyz/hubble/issues/573).

There are also a few Farcaster-specific terms that are very commonly used in this package:

| Term     | Description                                                               |
| -------- | ------------------------------------------------------------------------- |
| Cast     | A public message posted by a user                                         |
| Fid      | A farcaster id, issued by the Id Registry on Ethereum                     |
| Fname    | A farcaster username, issued by the Name Registry on Ethereum.            |
| Hub      | A node in the Farcaster network which stores Farcaster Messages           |
| Reaction | A public action between a user and a piece of content (e.g. like, recast) |
