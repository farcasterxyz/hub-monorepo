# farcaster.js

A lightweight, fast Typescript interface for Farcaster Hubs. Designed to work with [Hubble](https://github.com/farcasterxyz/hubble/) and any other Hub that implements the [Farcaster protocol](https://github.com/farcasterxyz/protocol).

## Features

- Call any Hub endpoint from a NodeJS environment.
- Serializes and deserializes Farcaster protobufs into Javascript objects.
- Has helpers to create and sign Farcaster messages.
- Written entirely in TypeScript, with strict types for safety.

Read the [documentation](./docs/README.md), see more [examples](./examples/) or get started with the guide below.

## Installation

Install @farcaster/js with the package manager of your choice

```bash
npm install @farcaster/js
yarn add @farcaster/js
pnpm install @farcaster/js
```

## Quickstart

### Fetching Data from Hubs

```typescript
import { Client } from '@farcaster/js';

(async () => {
  // Connect to a known hub using its address of the form <ip_address>:<rpc_port>
  const client = new Client('127.0.0.1:8080');

  // Set the user whose casts we will be fetching
  const fid = 2;

  const castsResult = await client.getCastsByFid(fid);

  if (castsResult.isErr()) {
    console.log('Failed: ', castsResult.error);
  }

  castsResult.map((casts) => casts.map((c) => console.log(`${c.data.body.text}\n`)));
})();
```

## Contributing

Please see our [contributing guidelines](../../../CONTRIBUTING.md) before making a pull request.

## License

MIT License
