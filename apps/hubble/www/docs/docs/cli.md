# CLI

Documentation for the Hubble CLI. 

1. `start` - start hubble and configure how it should run
2. `identity` - generate or validate hub identities
3. `status` - status reports on sync, storage and other systems.
4. `dbreset` - clear the database. 
5. `console` - start an interactive repl console for debugging.

Commands must invoked with yarn by running: 

```
# if using docker
docker compose exec hubble yarn <command> 

# if not using docker
yarn <command> 
```

### start

```
Usage: yarn start [options]

Start a Hub

Hubble Options:
  -n --network <network>                ID of the Farcaster Network (default: 3 (devnet))
  -i, --id <filepath>                   Path to the PeerId file.
  -c, --config <filepath>               Path to the config file.
  --db-name <name>                      The name of the RocksDB instance. (default: rocks.hub._default)
  --admin-server-enabled                Enable the admin server. (default: disabled)
  --admin-server-host <host>            The host the admin server should listen on. (default: '127.0.0.1')
  --process-file-prefix <prefix>        Prefix for file to which hub process number is written. (default: "")

Ethereum Options:
  -m, --eth-mainnet-rpc-url <url>       RPC URL of a Mainnet ETH Node (or comma separated list of URLs)
  -l, --l2-rpc-url <url>                RPC URL of a Goerli Optimism Node (or comma separated list of URLs)
  --rank-rpcs                           Rank the RPCs by latency/stability and use the fastest one (default: disabled)
  --fname-server-url <url>              The URL for the FName registry server (default: https://fnames.farcaster.xyz
  --fir-address <address>               The address of the Farcaster ID Registry contract
  --first-block <number>                The block number to begin syncing events from Farcaster contracts

Networking Options:
  -a, --allowed-peers <peerIds...>      Only peer with specific peer ids. (default: all peers allowed)
  -b, --bootstrap <peer-multiaddrs...>  Peers to bootstrap gossip and sync from. (default: none)
  -g, --gossip-port <port>              Port to use for gossip (default: 2282)
  -r, --rpc-port <port>                 Port to use for gRPC  (default: 2283)
  --ip <ip-address>                     IP address to listen on (default: "127.0.0.1")
  --announce-ip <ip-address>            Public IP address announced to peers (default: fetched with external service)
  --announce-server-name <name>         Server name announced to peers, useful if SSL/TLS enabled. (default: "none")
  --direct-peers <peer-multiaddrs...>   A list of peers for libp2p to directly peer with (default: [])
  --rpc-rate-limit <number>             RPC rate limit for peers specified in rpm. Set to -1 for none. (default: 20k/min)

Debugging Options:
  --gossip-metrics-enabled              Generate tracing and metrics for the gossip network. (default: disabled)
  --profile-sync                        Profile a full hub sync and exit. (default: disabled)
  --rebuild-sync-trie                   Rebuild the sync trie before starting (default: disabled)
  --resync-eth-events                   Resync events from the Farcaster contracts before starting (default: disabled)
  --resync-name-events                  Resync events from the Fname server before starting (default: disabled)
  --chunk-size <number>                 The number of blocks to batch when syncing historical events from Farcaster contracts. (default: 10000)
  --commit-lock-timeout <number>        Rocks DB commit lock timeout in milliseconds (default: 500)
  --commit-lock-max-pending <number>    Rocks DB commit lock max pending jobs (default: 1000)
  --rpc-auth <username:password,...>    Require username-password auth for RPC submit. (default: disabled)

  --fnr-address <address>               The address of the Farcaster Name Registry contract
  -h, --help                            display help for command
  ```

### identity

```
Usage: yarn identity [options] [command]

Create or verify a peerID

Options:
  -h, --help        display help for command

Commands:
  create [options]  Create a new peerId and write it to a file.

                    Note: This command will always overwrite the default PeerId file.
  verify [options]  Verify a peerId file
  help [command]    display help for command
```

### status

```
Usage: yarn status [options]

Reports the db and sync status of the hub
WARNING: This command has been deprecated, and will be removed in a future release. Please use Grafana monitoring. See https://www.thehubble.xyz/intro/monitoring.html

Options:
  -s, --server <url>     Farcaster RPC server address:port to connect to (eg. 127.0.0.1:2283) (default: "127.0.0.1:2283")
  --insecure             Allow insecure connections to the RPC server (default: false)
  --watch                Keep running and periodically report status (default: false)
  -p, --peerId <peerId>  Peer id of the hub to compare with (defaults to bootstrap peers)
  -h, --help             display help for command
```

### dbreset

```
Usage: yarn dbreset [options]

Completely remove the database

Options:
  --db-name <name>         The name of the RocksDB instance
  -c, --config <filepath>  Path to a config file with options
  -h, --help               display help for command
```

### console

```
Usage: hub console [options]

Start a REPL console

Options:
  -s, --server <url>  Farcaster RPC server address:port to connect to (eg. 127.0.0.1:2283) (default: "127.0.0.1:2283")
  --insecure          Allow insecure connections to the RPC server (default: false)
  -h, --help          display help for command
```