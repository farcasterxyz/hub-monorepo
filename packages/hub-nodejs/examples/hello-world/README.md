## Setting Up An Account And Writing Data to Hubs

An example that signs up a new user on chain, purchases storage, creates a signer and updates the user's profile.

Given a custody address with ~10$ worth of funds on OP Mainnet, this example will:
 - Register an FID on the IdRegistry contract
 - Purchase 1 unit of storage on the StorageContract
 - Create a signer on the KeyRegistry contract
 - Register an fname on the fname registry server
 - Update the user's profile

### Run on StackBlitz

We do not recommend running this example in a cloud environment because it requires your custody address.

You can try out a web version of this at https://farcaster-signup-demo.vercel.app/ . Source: https://github.com/wojtekwtf/farcaster-signup-demo by [@woj.eth](https://warpcast.com/woj.eth).

### Run locally

1. Clone the repo locally
2. Navigate to this folder with `cd packages/hub-nodejs/examples/write-data`
3. Run `yarn install` to install dependencies
4. Run `yarn start`
