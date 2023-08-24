# Installation

We recommend running Hubble on an always-on server that has [Docker](https://docs.docker.com/desktop/install/linux-install/) installed. 

## Requirements

Hubble can be installed in 30 minutes, but a full sync can take up to three hours to complete. You'll need a machine that has: 

- 8 GB of RAM
- 2 CPU cores or vCPUs
- 20 GB of free storage
- A public IP address with ports 2282 - 2285 exposed

See [tutorials](./tutorials.html) for instructions on how to set up cloud providers to run Hubble.

You will need RPC endpoints for Ethereum nodes on L1 Mainnet and L1 Goerli. We recommend using a service like [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/).


## Installing Hubble

You can install and run Hubble various ways depending on how much flexibility you need.

### Install via installation script

This is the easiest way to install and run Hubble. On a Linux server, just run

```bash
curl -sSL https://download.thehubble.xyz/bootstrap.sh | bash
```

This will install and configure all dependencies automatically, and install the `hubble.sh` script into `~/hubble` for future use. Monitoring is set up automatically, and you can view the grafana dashboard by navigating to `http://localhost:3000` in your browser.

#### Upgrading Hubble
To upgrade your hubble via the script, run
```bash
cd ~/hubble && ./hubble.sh upgrade
```

### Install via docker container

This method allows you to manage your docker containers and config manually.

1. Check out the [hub-monorepo](https://github.com/farcasterxyz/hub-monorepo) locally.
2. From the root of this folder navigate to `apps/hubble`
3. Generate your identity key pair with docker compose.

```bash
docker compose run hubble yarn identity create
```

4. Create a .env file in `apps/hubble` with your Ethereum RPC endpoints:

```bash
# Set this to your L1 Goerli ETH RPC URL
ETH_RPC_URL=your-ETH-RPC-URL

# Set this to your L1 Mainnet ETH RPC URL
ETH_MAINNET_RPC_URL=your-ETH-mainnet-RPC-URL

# Set this to your L2 Optimism Mainnet RPC URL
L2_RPC_URL=your-L2-optimism-RPC-URL
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

#### Upgrading Hubble

Navigate to `apps/hubble` in hub-monorepo and run: 

```bash
git checkout main && git pull
docker compose stop && docker compose up -d --force-recreate --pull always
```


### Installing from source
You can also build and run Hubble from source.

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
3. `yarn start --eth-rpc-url <your ETH-RPC-URL> --eth-mainnet-rpc-url <your ETH-mainnet-RPC-URL`

#### Upgrading Hubble
To upgrade hubble, find the latest [release tag](https://github.com/farcasterxyz/hub-monorepo/releases) and checkout that version and build.

- `git fetch --tags` to fetch the latest tags
- `git checkout @farcaster/hubble@<version>` to checkout the specific version. Replace the tag with the version you want to check out. 
- `yarn install && yarn build` in the root folder to build Hubble.

## Monitoring Hubble
You can monitor your Hub in real-time by setting up Grafana.

1. Start grafana and statsd
```bash
docker compose up statsd grafana
```

2. Enable monitoring on your Hub by setting this in your `.env`
```bash
STATSD_METRICS_SERVER=statsd:8125
```

If you are running hubble from source, you can pass this in as a command line argument
```bash
yarn start --statsd-metrics-server 127.0.0.1:8125
```

3. Open Grafana in a browser at `127.0.0.1:3000`. The default username/password is `admin`/`admin`. You will need to change your password on first login

4. Go to `Settings -> Datasource -> Add new data source` and select `Graphite`. Set the URL to `http://statsd:80` and click `Save & Test` to make sure it is working

5. Go to `Settings -> Dashboard -> Add New -> Import`, and in the `Import from Panel JSON`, paste the contents of the [Default Grafana Dashboard](https://github.com/farcasterxyz/hub-monorepo/blob/main/apps/hubble/grafana/grafana-dashboard.json)


## Running commands

Check the logs to ensure your hub is running successfully:

```bash
docker compose logs -f hubble
```

Check the sync status to see how your Hub is doing:

```bash
docker compose exec hubble yarn status --insecure
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
