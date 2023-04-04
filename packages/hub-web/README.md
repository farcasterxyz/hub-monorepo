# @farcaster/hub-web

A lightweight, fast Typescript interface for Farcaster Hubs. Designed to work with [Hubble](https://github.com/farcasterxyz/hubble/) and any other Hub that implements the [Farcaster protocol](https://github.com/farcasterxyz/protocol).

## Features

- Call any Hub endpoint from browser environment (or node environemnt using grpc-web).
- Serializes and deserializes Farcaster protobufs into Javascript objects.
- Has helpers to create and sign Farcaster messages.
- Written entirely in TypeScript, with strict types for safety.

## Installation

Install @farcaster/hub-web with the package manager of your choice

```bash
npm install @farcaster/hub-web
yarn add @farcaster/hub-web
pnpm install @farcaster/hub-web
```

### Fetching Data from Hubs

```typescript
import { getRpcWebClient } from '@farcaster/hub-web';

(async () => {
  // if you are testing from a node environment
  // const client = getRpcWebClient('http://testnet1.farcaster.xyz:2284', false);

  // if you are testing from a braowser environment
  const client = getRpcWebClient('http://testnet1.farcaster.xyz:2284');

  const castsResult = await client.GetCastsByFid({ fid: 7884 });

  castsResult.messages.map((cast) => console.log(cast.data?.castAddBody?.text));
})();
```

## Contributing

Please see our [contributing guidelines](https://github.com/farcasterxyz/hubble/blob/main/CONTRIBUTING.md) before making a pull request.

## License

MIT License
