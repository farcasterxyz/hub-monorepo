# Documentation

@farcaster/js has four major components:

- [Messages](./Messages.md), which are the atomic units of change on the Farcaster network.
- [Clients](./Client.md), which can send and receive messages from a Farcaster Hub.
- [Builders](./Builders.md), which can be used to construct new messages.
- [Signers](./signers/), which are used by Builders to sign messages.

### Environments

@farcaster/js only works inside a NodeJS environment. Browser support is a [work in progress](https://github.com/farcasterxyz/hubble/issues/573).

### Error Handling

Error handling in @farcaster/js is monadic and functions do not throw exceptions. Each function call returns a Result object which contains a success value or error value. Read the [neverthrow](https://github.com/supermacro/neverthrow/blob/master/README.md) documentation to learn about handling Result types.

### Glossary

| Term     | Description                                                               |
| -------- | ------------------------------------------------------------------------- |
| Cast     | A public message posted by a user                                         |
| Fid      | A farcaster id, issued by the Id Registry on Ethereum                     |
| Fname    | A farcaster username, issued by the Name Registry on Ethereum.            |
| Hub      | A node in the Farcaster network which stores Farcaster Messages           |
| Reaction | A public action between a user and a piece of content (e.g. like, recast) |
