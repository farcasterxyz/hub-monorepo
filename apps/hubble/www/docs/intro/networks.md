# Networks

When  [installing your hub](./install.md), you'll need to choose a network to connect to. We recommend starting with testnet if this is your first time, and migrating to mainnet when you've got it working.

## Testnet

A Testnet Hub connects to a sandbox, where dummy messages are broadcast every 10 seconds. You'll need 4GB RAM and 5 GB of free space to operate a testnet hub.

Set the following variables in your .env file:

```sh

FC_NETWORK_ID=2
BOOTSTRAP_NODE=/dns/testnet1.farcaster.xyz/tcp/2282
```
## Mainnet

A Mainnet Hub connects to the production environment used by all apps on the network. You will need 8GB RAM and 20 GB of disk space to operate a mainnet hub. 

Update the `.env` file in your `apps/hubble` directory with the network ID and bootstrap nodes.
```sh
FC_NETWORK_ID=1
BOOTSTRAP_NODE=/dns/nemes.farcaster.xyz/tcp/2282
```
