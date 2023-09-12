# Installation

We recommend running Hubble on an always-on server that has [Docker](https://docs.docker.com/desktop/install/linux-install/) installed. 

## Requirements

Hubble can be installed in 30 minutes, and a full sync can take 1-2 hours to complete. You'll need a machine that has: 

- 8 GB of RAM
- 2 CPU cores or vCPUs
- 20 GB of free storage
- A public IP address with ports 2282 - 2285 exposed

See [tutorials](./tutorials.html) for instructions on how to set up cloud providers to run Hubble.

You will need RPC endpoints for Ethereum nodes on L2 OP Mainnet, L1 Mainnet and L1 Goerli. We recommend using a service like [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/).


## Install via Script

The install script is the simplest way to set up Hubble. 

```bash
curl -sSL https://download.thehubble.xyz/bootstrap.sh | bash
```

*If you're using macOS, you'll need to have docker installed and running.*

Hubble will be installed into `~/hubble` and will be run via Docker in the background, along with Grafana and Prometheus for [monitoring](monitoring.md). If you have trouble with the script, try [installing via docker](#install-via-docker).

### Upgrading Hubble

Upgrade Hubble to the latest version by running

```bash
cd ~/hubble && ./hubble.sh upgrade
```

## Install via Docker

Hubble can also be set up by running the docker image directly. To do this: 

1. Check out the [hub-monorepo](https://github.com/farcasterxyz/hub-monorepo) locally.
2. From the root of this folder navigate to `apps/hubble`
3. Generate your identity key pair with docker compose.

```bash
docker compose run hubble yarn identity create
```

4. Create a .env file in `apps/hubble` with your Ethereum RPC endpoints:

```bash
# Set this to your L1 Mainnet ETH RPC URL
ETH_MAINNET_RPC_URL=your-ETH-mainnet-RPC-URL

# Set this to your L2 Optimism Mainnet RPC URL
OPTIMISM_L2_RPC_URL=your-L2-optimism-RPC-URL

# Set this to your Farcaster FID
HUB_OPERATOR_FID=your-fid
```

5. Follow the instructions to set [connect to a network](./networks.md).

6. Start Hubble with docker compose in detached mode:

```bash
docker compose up hubble -d
``` 

Docker compose will start a Hubble container that exposes ports for networking and writes data to `.hub` and `.rocks` directories. Hubble will now sync with the contracts and other hubble instances to download all messages on the network. 

7. To view the status of the sync and hubble, follow the logs

```bash
docker compose logs -f hubble
```

8. Follow the instructions in the [monitoring](monitoring.md) instructions to set up Grafana and view your Hub's status in real-time.

### Upgrading Hubble

Navigate to `apps/hubble` in hub-monorepo and run: 

```bash
git checkout main && git pull
docker compose stop && docker compose up -d --force-recreate --pull always
```

## Installing from source

Hubble can also be built and run directly from source without Docker. 

#### Installing Dependencies

First, ensure that the following are installed globally on your machine:

- [Node.js 18.7+](https://nodejs.org/en/download/releases)
- [Yarn](https://classic.yarnpkg.com/lang/en/docs/install)
- [Foundry](https://book.getfoundry.sh/getting-started/installation#using-foundryup)
- [Rust](https://www.rust-lang.org/tools/install)

#### Build

- `git clone https://github.com/farcasterxyz/hub-monorepo.git` to clone the repo
- `cd hub-monorepo` to enter the directory
- `yarn install` to install dependencies
- `yarn build` to build Hubble and its dependencies
- `yarn test` to ensure that the test suite runs correctly

#### Running Hubble
To run the Hubble commands, go to the Hubble app (`cd apps/hubble`) and run the `yarn` commands.

1. `yarn identity create` to create a ID
2. Follow the instructions to set [connect to a network](./networks.md)
3. `yarn start --eth-mainnet-rpc-url <your ETH-mainnet-RPC-URL> --l2-rpc-url <your Optimism-L2-RPC-URL> --hub-operator-fid <your FID>`

### Upgrading Hubble

To upgrade hubble, find the latest [release tag](https://github.com/farcasterxyz/hub-monorepo/releases) and checkout that version and build.

```bash
git fetch --tags # to fetch the latest tags
git checkout @farcaster/hubble@latest # Or use a specific version. 
yarn install && yarn build # in the root folder
```

## Running commands

Check the logs to ensure your hub is running successfully:

```bash
docker compose logs -f hubble
```

Open up a shell inside the hubble container by running:

```bash
docker compose exec hubble /bin/sh
```

## Troubleshooting

- If upgrading from a non-docker deployment, make sure `.hub` and `.rocks` directories are writable for all users.

- If upgrading from 1.3.3 or below, please set `ETH_MAINNET_RPC_URL=your-ETH-mainnet-RPC-URL` (if using docker) or provide the `--eth-mainnet-rpc-url` flag (if not using docker)

- If you're changing your Hub from one network to another, you'll need to delete your database contents: 

```bash
docker compose stop && docker compose run --rm hubble yarn dbreset
```


- To pull the image yourself, you can run:

```bash
# Get the latest image
docker pull farcasterxyz/hubble:latest

# Get a specific release (v1.4.0)
docker pull farcasterxyz/hubble@v1.4.0
```

- To set the Hub operator FID
  * If you are running via docker or the script, please set this in your `.env` file: `HUB_OPERATOR_FID=your-fid`
  * If you are running via source `yarn start --hub-operator-fid <your-fid>`
