# Documentation

@farcaster/hub-nodejs has five major components:

- A grpc [Client](./Client.md), which can send and receive messages from a Farcaster Hub.  
- [Messages](./Messages.md), which are the atomic units of change on the Farcaster network.
- [Builders](./Builders.md), which can be used to construct new messages.
- [Signers](./signers/), which are required by Builders to sign messages.
- [Utils](./Utils.md), which are helpers to deal with Farcaster idiosyncrasies.

Note: The HTTP API is an alternate way to read/write to the Hub. Please see the [HTTP API docs](https://www.thehubble.xyz/docs/httpapi/httpapi.html)

## Idiosyncrasies

1. Timestamps are calculated from the [Farcaster epoch](./Utils.md#time), not the Unix epoch.
2. Errors are handled with [a monadic pattern](./Utils.md#errors), instead of try-catch.
3. [Ethers](https://www.npmjs.com/package/ethers) and [noble](https://www.npmjs.com/package/@noble/ed25519) are required to create new messages.
4. Both Node.js and [browser environments are supported](https://github.com/farcasterxyz/hubble/issues/573).
5. Fixed length data is encoded in [byte formats](./Utils.md#bytes), instead of strings.

There are also a few Farcaster-specific terms that are very commonly used in this package:

| Term     | Description                                                               |
| -------- | ------------------------------------------------------------------------- |
| Cast     | A public message posted by a user                                         |
| Fid      | A Farcaster id, issued by the Id Registry on Ethereum                     |
| Fname    | A Farcaster username, issued by the Name Registry on Ethereum.            |
| Hub      | A node in the Farcaster network which stores Farcaster Messages           |
| Reaction | A public action between a user and a piece of content (e.g. like, recast) |
