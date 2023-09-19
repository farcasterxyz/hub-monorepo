# CLI

Documentation for the Hubble CLI. 

1. `start` - start hubble and configure how it should run
2. `identity` - generate or validate hub identities
3. `status` - status reports on sync, storage and other systems.
4. `dbreset` - clear the database. 
4. `events-reset` - clear l2 events data from the db. 
4. `profile` - profile the storage usage of the db. 
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
  --hub-operator-fid <fid>              The FID of the hub operator. Optional.
  -c, --config <filepath>               Path to the config file.
  --db-name <name>                      The name of the RocksDB instance. (default: rocks.hub._default)
  --admin-server-enabled                Enable the admin server. (default: disabled)
  --admin-server-host <host>            The host the admin server should listen on. (default: '127.0.0.1')
  --process-file-prefix <prefix>        Prefix for file to which hub process number is written. (default: "")

Ethereum Options:
  -m, --eth-mainnet-rpc-url <url>       RPC URL of a Mainnet ETH Node (or comma separated list of URLs)
  -l, --l2-rpc-url <url>                RPC URL of a Goerli Optimism Node (or comma separated list of URLs)
  --rank-rpcs                           Rank the RPCs by latency/stability and use the fastest one (default: disabled)
  --fname-server-url <url>              The URL for the FName registry server (default: https://fnames.farcaster.xyz)

L2 Options:
  --l2-id-registry-address              The address of the L2 Farcaster ID Registry contract
  --l2-key-registry-address <address>   The address of the L2 Farcaster Key Registry contract
  --l2-storage-registry-address <address>  The address of the L2 Farcaster Storage Registry contract
  --l2-resync-events                    Resync events from the L2 Farcaster contracts before starting (default: disabled)
  --l2-first-block <number>             The block number to begin syncing events from L2 Farcaster contracts
  --l2-chunk-size <number>              The number of events to fetch from L2 Farcaster contracts at a time
  --l2-chain-id <number>                The chain ID of the L2 Farcaster contracts are deployed to
  --l2-rent-expiry-override <number>    The storage rent expiry in seconds to use instead of the default 1 year (ONLY FOR TESTS)

Snapshots Options:
  --enable-snapshot-to-s3               Enable daily snapshots to be uploaded to S3. (default: disabled)
  --s3-snapshot-bucket <bucket>         The S3 bucket to upload snapshots to
  --disable-snapshot-sync               Disable syncing from snapshots. (default: enabled)

Metrics:
  --statsd-metrics-server <host>        The host to send statsd metrics to, eg "127.0.0.1:8125". (default: disabled)

Networking Options:
  -a, --allowed-peers <peerIds...>      Only peer with specific peer ids. (default: all peers allowed)
  -b, --bootstrap <peer-multiaddrs...>  Peers to bootstrap gossip and sync from. (default: none)
  -g, --gossip-port <port>              Port to use for gossip (default: 2282)
  -r, --rpc-port <port>                 Port to use for gRPC  (default: 2283)
  --httpApiPort <port>                  Port to use for HTTP API (default: 2281)
  --ip <ip-address>                     IP address to listen on (default: "127.0.0.1")
  --announce-ip <ip-address>            Public IP address announced to peers (default: fetched with external service)
  --announce-server-name <name>         Server name announced to peers, useful if SSL/TLS enabled. (default: "none")
  --direct-peers <peer-multiaddrs...>   A list of peers for libp2p to directly peer with (default: [])
  --denied-peers <peerIds...>           Do not peer with specific peer ids. (default: no peers denied)
  --rpc-rate-limit <number>             RPC rate limit for peers specified in rpm. Set to -1 for none. (default: 20k/min)
  --rpc-subscribe-per-ip-limit <number> Maximum RPC subscriptions per IP address (default: 4)

Snapshots Options:
  --enable-snapshot-to-s3               Enable daily snapshots to be uploaded to S3. (default: disabled)
  --s3-snapshot-bucket <bucket>         The S3 bucket to upload snapshots to
  --disable-snapshot-sync               Disable syncing from snapshots. (default: enabled)

Metrics:
  --statsd-metrics-server <host>        The host to send statsd metrics to, eg "127.0.0.1:8125". (default: disabled)

Debugging Options:  
  --profile-sync                        Profile a full hub sync and exit. (default: disabled)
  --rebuild-sync-trie                   Rebuild the sync trie before starting (default: disabled)  
  --resync-name-events                  Resync events from the Fname server before starting (default: disabled)
  --chunk-size <number>                 The number of blocks to batch when syncing historical events from Farcaster contracts. (default: 10000)
  --commit-lock-timeout <number>        Rocks DB commit lock timeout in milliseconds (default: 500)
  --commit-lock-max-pending <number>    Rocks DB commit lock max pending jobs (default: 1000)
  --rpc-auth <username:password,...>    Require username-password auth for RPC submit. (default: disabled)
  --disable-console-status              Immediately log to STDOUT, and disable console status and progressbars. (default: disabled)
  
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

### events-reset

```
Usage: yarn events-reset [options]

Clears all data about L2 events from the database.

Options:
  --db-name <name>         The name of the RocksDB instance
  -c, --config <filepath>  Path to a config file with options
  -h, --help               display help for command
```

### profile

```
Usage: yarn profile [options]

Profile the db storage for the hubs. Breaks down space used by key.

Options:
  --db-name <name>         The name of the RocksDB instance
  -o <name>                The path to write the output file to
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