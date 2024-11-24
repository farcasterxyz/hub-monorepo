## Working with EIP-712 signatures

This example app demonstrates how to create and use EIP-712 signatures to sponsor onchain transactions on behalf of users.

Every onchain action in the Farcaster protocol can be performed by a third party on behalf of the end user by collecting a typed signature and providing it to the Farcaster smart contracts. This makes it possible to pay gas and sponsor onchain transactions for your users without asking them to pay a fee or send a transaction from their wallet.

The structured format of EIP-712 signatures makes them more secure for the end user and easier for wallets to parse, but they can be difficult to construct and work with as an application developer. This demo app shows how to call every signature based function in the Farcaster contracts, including registering an account, transferring a fid, and adding/removing signer keys.

This example uses [Hardhat](https://hardhat.org/) to run a local node that simulates OP Mainnet, where the Farcaster contracts are deployed.

### Run locally

1. Clone the repo locally
2. Navigate to this folder with `cd packages/hub-nodejs/examples/make-cast`
3. Run `yarn install` to install dependencies
4. Run `yarn chain:start` to start Hardhat
5. Run `yarn start`
