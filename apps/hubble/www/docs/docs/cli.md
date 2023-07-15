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

Options:
  -e, --eth-rpc-url <url>               RPC URL of a Goerli Ethereum Node
  -c, --config <filepath>               Path to a config file with options
  --fir-address <address>               The address of the Farcaster ID Registry contract
  --fnr-address <address>               The address of the Farcaster Name Registry contract
  --first-block <number>                The block number to begin syncing events from Farcaster contracts
  --fname-server-url <url>              The URL for the FName registry server
  --chunk-size <number>                 The number of blocks to batch when syncing historical events from Farcaster contracts. (default: 10000)
  -b, --bootstrap <peer-multiaddrs...>  A list of peer multiaddrs to bootstrap libp2p
  -a, --allowed-peers <peerIds...>      An allow-list of peer ids permitted to connect to the hub
  --ip <ip-address>                     The IP address libp2p should listen on. (default: "127.0.0.1")
  --announce-ip <ip-address>            The IP address libp2p should announce to other peers. If not provided, the IP address will be fetched from an external service
  --announce-server-name <name>         The name of the server to announce to peers. This is useful if you have SSL/TLS enabled. (default: "none")
  -g, --gossip-port <port>              The tcp port libp2p should gossip over. (default: 2282)
  -r, --rpc-port <port>                 The tcp port that the rpc server should listen on.  (default: 2283)
  --rpc-auth <username:password,...>    Enable Auth for RPC submit methods with the username and password. (default: disabled)
  --rpc-rate-limit <number>             Impose a Per IP rate limit per minute. Set to -1 for no rate limits (default: 20k/min)
  --admin-server-enabled                Enable the admin server. (default: disabled)
  --admin-server-host <host>            The host the admin server should listen on. (default: '127.0.0.1')
  --db-name <name>                      The name of the RocksDB instance
  --rebuild-sync-trie                   Rebuilds the sync trie before starting
  --resync-eth-events                   Resyncs events from the Farcaster contracts before starting
  --resync-name-events                  Resyncs events from the FName registry server before starting
  --commit-lock-timeout <number>        Commit lock timeout in milliseconds (default: 500)
  --commit-lock-max-pending <number>    Commit lock max pending jobs (default: 1000)
  -i, --id <filepath>                   Path to the PeerId file
  -n --network <network>                Farcaster network ID
  --process-file-prefix <prefix>        Prefix for file to which hub process number is written. (default: "")
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