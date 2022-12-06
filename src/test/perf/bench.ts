import { Command } from 'commander';
import { RPCClient } from '~/network/rpc';
import { SetupMode, setupNetwork } from '~/test/perf/setup';
import { addressInfoFromNodeAddress } from '~/utils/p2p';
import { multiaddr } from '@multiformats/multiaddr';
import { playback, PlaybackOrder } from '~/test/perf/playback';
import { makeBasicScenario } from '~/test/perf/scenario';
import { waitForSync } from '~/test/perf/verify';

/**
 * Farcaster Benchmark Client
 *
 * This file provides a mechanism to benchmark and test a network of Farcaster Hubs
 *
 * When executed, it submits a series of events to the Hub network and measures the
 * time taken for each set of requests to be processed.
 */

const parseNumber = (string: string) => {
  const number = Number(string);
  if (isNaN(number)) throw new Error('Not a number.');
  return number;
};

const app = new Command();
app
  .name('farcaster-benchmark-client')
  .description('Farcaster Benchmark')
  .version(process.env['npm_package_version'] ?? '1.0.0');

app
  .requiredOption(
    '-l, --hubs <rpc-multiaddrs...>',
    'A list of RPC multiaddrs of Hubs on the network (example:"/ip4/192.168.1.255/tcp/9090")'
  )
  .option('-u, --users <count>', 'The number of users to simulate', parseNumber, 10);

app.parse(process.argv);
const cliOptions = app.opts();

// makes a list of RPCClients for each Hub
const rpcMultiAddrs: string[] = cliOptions['hubs'];
const rpcClients = rpcMultiAddrs.map((addr) => {
  const address = multiaddr(addr);
  const addressInfoResult = addressInfoFromNodeAddress(address.nodeAddress());
  if (addressInfoResult.isErr()) {
    throw addressInfoResult.error;
  }

  return new RPCClient(addressInfoResult.value);
});

// sets up hubs
const userInfos = await setupNetwork(rpcClients, { users: cliOptions['users'], mode: SetupMode.RANDOM_SINGLE });
// creates scenario data
const scenario = await makeBasicScenario(rpcClients[0], userInfos);
// submits the scenario for playback
await playback(scenario, { order: PlaybackOrder.SEQ });
// verifies network sync
await waitForSync(rpcClients);
