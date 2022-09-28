import { Command } from 'commander';
import { Hub, HubOpts } from '~/hub';

const app = new Command();

app.name('farcaster-hub').description('Farcaster Hub').version('0.1.0');

app
  .option('-n, --network-url <url>', 'ID Registry network URL')
  .option('-a, --id-registry-address <address>', 'ID Registry address')
  .option('-b, --bootstrap-addresses <addresses...>', 'A list of MultiAddrs to use for bootstrapping')
  .option('--rpc-port <port>', 'The RPC port to use. (default: selects one at random')
  .option('--simple-sync', 'Enable/Disable simple sync', true)
  .option('--db-reset', 'Clear the database before starting', false)
  .option('--db-name <name>', 'The name of the rocks db instance', 'rocks.hub._default');

app.parse(process.argv);
const cliOptions = app.opts();

const options: HubOpts = {
  networkUrl: cliOptions.networkUrl,
  IDRegistryAddress: cliOptions.idRegistryAddress,
  bootstrapAddrs: cliOptions.bootstrapAddresses,
  port: cliOptions.rpcPort,
  simpleSync: cliOptions.simpleSync,
  rocksDBName: cliOptions.dbName,
  resetDB: cliOptions.dbReset,
};

const hub = new Hub(options);
hub.start();
process.stdin.resume();
process.on('SIGINT', async () => {
  await hub.stop();
  process.exit();
});
