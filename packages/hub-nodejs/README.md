# @farcaster/hub-nodejs

A lightweight, fast Typescript interface for Farcaster Hubs. Designed to work with [Hubble](https://github.com/farcasterxyz/hubble/) and any other Hub that implements the [Farcaster protocol](https://github.com/farcasterxyz/protocol).

## Features

- Call any Hub endpoint from a NodeJS environment.
- Serializes and deserializes Farcaster protobufs into Javascript objects.
- Has helpers to create and sign Farcaster messages.
- Written entirely in TypeScript, with strict types for safety.

Read the [documentation](./docs/README.md), see more [examples](./examples/) or get started with the guide below.

## Installation

Install @farcaster/hub-nodejs with the package manager of your choice

```bash
npm install @farcaster/hub-nodejs
yarn add @farcaster/hub-nodejs
pnpm install @farcaster/hub-nodejs
```

## Quickstart

### Fetching Data from Hubs

```typescript
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

  const castsResult = await client.getCastsByFid({ fid: 2 });

  castsResult.map((casts) => casts.messages.map((cast) => console.log(cast.data?.castAddBody?.text)));
})();
```

## Contributing

Please see our [contributing guidelines](../../CONTRIBUTING.md) before making a pull request.

## License

MIT License
