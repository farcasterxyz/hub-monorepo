# @farcaster/hub-web

A lightweight, fast Typescript interface for Farcaster Hubs. Designed to work with [Hubble](https://github.com/farcasterxyz/hubble/) and any other Hub that implements the [Farcaster protocol](https://github.com/farcasterxyz/protocol).

## Features

- Call any Hub endpoint from a browser environment using gRPC-Web.
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

## Documentation

The @farcaster/hub-web APIs are largely the same as @farcaster/hub-nodejs. Read the [@farcaster/hub-nodejs documentation](https://github.com/farcasterxyz/hubble/tree/main/packages/hub-nodejs/docs) and browse code [examples](https://github.com/farcasterxyz/hubble/tree/main/packages/hub-nodejs/examples). We're also including sample @farcaster/hub-web code below as well as a list of differences with the other package.

### Getting start: fetching casts

```typescript
import { getHubRpcClient } from '@farcaster/hub-web';

(async () => {
  const client = getHubRpcClient('https://testnet1.farcaster.xyz:2285');

  const castsResult = await client.getCastsByFid({ fid: 15 });

  castsResult.map((casts) =>
    casts.messages.map((cast) => console.log(cast.data?.castAddBody?.text))
  );
})();
```

### Get the username by FID

```typescript
const getFnameFromFid = async (
  fid: number,
  client: HubRpcClient
): HubAsyncResult<string> => {
  const result = await client.getUserData({
    fid: fid,
    userDataType: UserDataType.FNAME,
  });
  return result.map((message) => {
    if (isUserDataAddMessage(message)) {
      return message.data.userDataBody.value;
    } else {
      return '';
    }
  });
};
```

### Instantiating a client

The method to construct a Hub gRPC client differs from @farcaster/hub-nodejs. Use `getHubRpcClient`, which returns a Hub gRPC-Web client. Make sure that the gRPC server you're connecting to implements a gRPC-Web proxy. The standard is to expose the gRPC-Web proxy at port 2285.

#### Usage

```typescript
import { getHubRpcClient } from '@farcaster/hub-web';

(async () => {
  const client = getHubRpcClient('https://testnet1.farcaster.xyz:2285');

  // If you're using gRPC-Web from a Nodejs environment, add a second false parameter
  // const nodeClient = getHubRpcClient('https://testnet1.farcaster.xyz:2285', false);
})();
```

#### Returns

| Type           | Description                     |
| :------------- | :------------------------------ |
| `HubRpcClient` | A new gRPC-Web Client instance. |

#### Parameters

| Name        | Type      | Description                                                                |
| :---------- | :-------- | :------------------------------------------------------------------------- |
| `url`       | `string`  | Address and RPC port string (e.g. `https://testnet1.farcaster.xyz:2285`)   |
| `isBrowser` | `boolean` | Optional parameter indicating whether to use the gRPC-Web Nodejs transport |

### Streaming hub events

gRPC-Web hub event streams are instances of the [Observable class](https://rxjs.dev/guide/observable) in @farcaster/hub-web.

#### Usage

```typescript
import { getHubRpcClient } from '@farcaster/hub-web';

async () => {
  const client = getHubRpcClient('https://testnet1.farcaster.xyz:2285');

  const result = client.subscribe({
    eventTypes: [HubEventType.PRUNE_MESSAGE],
    fromId: 0,
  });

  result.map((observable) => {
    observable.subscribe({
      next(event: HubEvent) {
        console.log('received event', event);
      },
      error(err) {
        console.error(err);
      },
    });
  });
};
```

#### Returns

| Type                              | Description                                                                   |
| :-------------------------------- | :---------------------------------------------------------------------------- |
| `HubResult<Observable<HubEvent>>` | An [Observable](https://rxjs.dev/guide/observable) stream wrapped in a Result |

#### Parameters

| Name         | Type             | Description                                                                                                                                                                           |
| :----------- | :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fromId`     | `number`         | (Optional) ID of the hub event to start streaming from. A `fromId` of `0` will stream all events from the hub, and passing no `fromId` will start the stream from the present moment. |
| `eventTypes` | `HubEventType[]` | Array of hub event types to return. If `eventTypes` is `[]`, all event types will be returned.                                                                                        |

## Contributing

Please see our [contributing guidelines](https://github.com/farcasterxyz/hubble/blob/main/CONTRIBUTING.md) before making a pull request.

## License

MIT License
