## Writing Casts to Hubs

An example that creates seven different types of casts given a custody address' recovery phrase. 

The custody address is used to create a SignerAdd message, and the Signer is used to create Casts. The example runs on testnet by default so that you can make changes safely without affecting your mainnet data.

### Run on StackBlitz

We do not recommend running this example in a cloud environment because it requires your custody address.

### Run locally

1. Clone the repo locally
2. Navigate to this folder with `cd packages/hub-nodejs/examples/make-cast`
3. Run `yarn install` to install dependencies
4. Run `yarn start`