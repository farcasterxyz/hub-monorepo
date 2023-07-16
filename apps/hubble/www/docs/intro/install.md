# Installation

We recommend running Hubble on an always on server that has [Docker](https://docs.docker.com/desktop/install/linux-install/) installed. 

## Requirements

Hubble can be installed in 30 minutes, but a full sync can take up to three hours to complete. You'll need a machine that has: 

- 8 GB of RAM
- 2 CPU cores or vCPUs
- 20 GB of free storage
- A public IP address with ports 2282 - 2285 exposed

See [tutorials](./tutorials.html) for instructions on how to set up cloud providers to run Hubble.

You will need RPC endpoints for Ethereum nodes on L1 Mainnet and L1 Goerli. We recommend using a service like [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/).



## Installing Hubble

1. Check out the [hub-monorepo](https://github.com/farcasterxyz/hub-monorepo) locally.
2. From the root of this folder navigate to `apps/hubble`
3. Generate your identity key pair with docker compose.

```bash
docker compose run hubble yarn identity create
```

4. Create a .env file in `apps/hubble` with your Ethereum RPC endpoints:

```bash
# Set to to your L1 Goerli ETH RPC URL
ETH_RPC_URL=your-ETH-RPC-URL

# Set this to you L1 Mainnet ETH RPC URL
ETH_MAINNET_RPC_URL=your-ETH-mainnet-RPC-URL
```

5. Follow the instructions to set [connect to a network](./networks.md).

6. Start Hubble with docker compose in detached mode:

```bash
docker compose up hubble -d
``` 

Docker compose will start a Hubble container that exposes ports for networking and writes data to `.hub` and `.rocks` directories. Hubble will now sync with the contracts and other hubble instances to download all messages on the network. 

## Upgrading Hubble

Navigate to `apps/hubble` in hub-monorepo and run: 

```bash
 git checkout main && git pull
docker compose stop && docker compose up -d --force-recreate --pull always
```

## Running commands

Check the sync status to see how your Hub is doing:

```bash
docker compose exec hubble yarn status --watch --insecure
```

Check the logs to ensure your hub is running successfully:

```bash
docker compose logs -f hubble
```

Open up a shell inside the hubble container by running:

```bash
docker compose exec hubble
```

## Troubleshooting

- If upgrading from a non-docker deployment, make sure `.hub` and `.rocks` directories are writable for all users.

- If upgrading from 1.3.3 or below, please set `ETH_MAINNET_RPC_URL=your-ETH-mainnet-RPC-URL` (if using docker) or provide the `--eth-mainnet-rpc-url` flag (if not using docker)

- If you're changing your Hub from one network to another, you'll need to reset your database with:  

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
