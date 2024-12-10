# @farcaster/hub-web

A fast and easy REST-like interface to work with Farcaster Hubs. Designed to work with [Hubble](https://github.com/farcasterxyz/hubble/) and any other Hub that implements the [Farcaster protocol](https://github.com/farcasterxyz/protocol).

## Features

- Call any endpoint using a simple HTTP API, including from a browser environment
- Responses are plain JSON
- Written entirely in Typescript, with strict types for safety.

## Installation

The examples in this package use `axios` to make HTTP requests, but you can use any library. It is also useful to install the `@farcaster/core` library which has several helper methods that are useful while working with Farcaster messages.

```bash
yarn add axios @farcaster/core
yarn add -D @types/axios 
```

## Documentation

The HTTP API endpoints are [documented here](https://www.thehubble.xyz/docs/httpapi/httpapi.html).

### Getting started: fetching casts

```typescript
import axios from "axios";

const fid = 2;
const server = "http://nemes.farcaster.xyz:2281";

try {
    const response = await axios.get(`${server}/v1/castsByFid?fid=${fid}`);

    console.log(`API Returned HTTP status ${response.status}`);    
    console.log(`The first cast's text is ${response.messages[0].data.castAddBody.text}`);
} catch (e) {
    // Handle errors
    console.log(response);
}
```

### Running the examples

There are several examples in the `examples/` folder. To run the examples, please look at the individual README files in the examples directory. Most examples can be run by

```bash
yarn install
yarn start
```

## grpc-Web

grpc-web was an older way of proxying to the grpc API from web environments. This has been deprecated and is no longer supported. You can read the original [grpc-web documentation and examples here](./README.grpcweb.md).

## Contributing

Please see our [contributing guidelines](https://github.com/farcasterxyz/hubble/blob/main/CONTRIBUTING.md) before making a pull request.

## License

MIT License
