# Documentation

@farcaster/js has four major components:

- A [Client](./Client.md), which can send and receive messages from a Farcaster Hub.
- [Messages](./Messages.md), which are the atomic units of change on the Farcaster network.
- [Builders](./Builders.md), which can be used to construct new messages.
- [Signers](./signers/), which are required by Builders to sign messages.

## Idiosyncrasies

There are a few unique things about the package that are described here:

| Term     | Description                                                               |
| -------- | ------------------------------------------------------------------------- |
| Cast     | A public message posted by a user                                         |
| Fid      | A farcaster id, issued by the Id Registry on Ethereum                     |
| Fname    | A farcaster username, issued by the Name Registry on Ethereum.            |
| Hub      | A node in the Farcaster network which stores Farcaster Messages           |
| Reaction | A public action between a user and a piece of content (e.g. like, recast) |

### Binary and Hex Formats

API responses return addresses, keys and signatures as binary data held in Uint8Arrays. To convert them to a hex strings:

```typescript
const messageHash = message.hash; // message is an object returned by the hubs
console.log(Buffer.from(messageHash).toString('hex'));
```

Builders and API methods often require the values to be supplied in binary form. To convert a hex string to a binary Uint8Array:

```typescript
const hexString = '006f082f70dfb2de81e7852f3b79f1cdf2aa6b86';
const bytesString = new Uint8Array(Buffer.from(hexString, 'hex'));
```

### Error Handling

Error handling in @farcaster/js is monadic and functions do not throw exceptions. Each function call returns a Result object which contains a success value or error value. Read the [neverthrow](https://github.com/supermacro/neverthrow/blob/master/README.md) documentation to learn about handling Result types.

### Environments

@farcaster/js only works inside a NodeJS environment. Browser support is a [work in progress](https://github.com/farcasterxyz/hubble/issues/573).
