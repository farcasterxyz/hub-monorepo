# Hubble

## Benchmarking Branch

Note: Requires linux, modern bash, and the overlay kernel module. Most modern distributions should have everything needed out of the box.

To record a gossip messages for benchmarking you'll first need to have an up to date hub. You can get this by setting the environment to "normal".

```bash
bash scripts/bench_setup_normal.sh
```

After this completes, run your hub as you would normally. Once your hub is caught up, close the program and move your environment to "record".

```bash
bash scripts/benchmark_setup_record.sh
```

This will toggle a variable in `src/run_mode.ts` and rebuild the application. Now when you run the hub, gossip messages
will be recorded to `gossip_log.json`. If you do not delete the existing `gossip_log.json` file, new messages will
be appended. Behind the scenes this script will also setup OverlayFS on the .rocks directory making all changes revertable.
This allows the replay step to apply gossip messages on the same state they were recorded for. Once you get enough gossip
messages you can close the hub and move to replaying the messages.

Some useful commands:

```bash
# how much data you've recorded (base64 & JSON encoded)
du -sh gossip_log.json

# how many gossip messages you've recorded
cat gossip_log.json | wc -l
```

### Replaying messages

This script will reset & setup OverlayFS, run yarn build, and start the program in replay mode. You can simply make your experimental change
and run this script to benchmark its performance.

```bash
export ETH_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/...
export L2_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/...

bash scripts/benchmark_start_replay.sh
```

Every second the application will print a line like

```
Perf| count: 3054, ms: 3931
```

When the lines are no longer changing, you can assume the test has been completed. The performance metrics recorded are very simple.
The recorder simply shows the millisecond epoch delta between the first gossip message completion and the latest. This code can be
found in `src/hubble.ts registerEventHandlers`.

I recommend recording the log output from `scripts/benchmark_start_replay.sh` and monitoring the log output in a separate termainl.

```bash
# running program
bash scripts/benchmark_start_replay.sh > logs

# watching logs
tail -f logs
```

This allows you process the logs to see if there's something different happening between runs. Here are a few useful commands

```bash
# see how many merges succeeded
cat logs | grep 'submitMessageBundle merged' | jq .success |grep -v null | python -c "import sys; print(sum(int(l) for l in sys.stdin))"

# see how many merges were attempted
cat logs | grep 'submitMessageBundle merged' | jq .total |grep -v null | python -c "import sys; print(sum(int(l) for l in sys.stdin))"
```


[Install](https://www.thehubble.xyz/intro/install.html) | [Documentation](https://www.thehubble.xyz/)

## What is Hubble?

Hubble is a Typescript implementation of a [Farcaster Hub](https://github.com/farcasterxyz/protocol).


A Hub will download an entire copy of the network to your machine and keep it in sync. Messages can be created and uploaded to a Hub and they will propagate to all other Hubs. Running a Hub gives you a private instance that you can query as much as you like and helps decentralize the network.



## Support 

If you have any questions or need help, please reach out to us on [Telegram](https://t.me/farcasterdevchat).

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on making contributions.