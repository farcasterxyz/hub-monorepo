import { Command } from 'commander';

import { benchMerkleTrie } from './merkleTrie';
import { outputWriter, waitForPromise } from './utils';

const app = new Command();
app
  .name('farcaster-bench')
  .description('Farcaster unit benchmark suites')
  .version(process.env['npm_package_version'] ?? '1.0.0');

app
  .usage('--benchmark <suite> [options]')
  .requiredOption('-b --benchmark <suite>', 'the benchmarking suite to run')
  .option('-n, --count <count>', 'size of input')
  .option('-c, --cycle <cycles>', 'run at least <cycle> times before taking measurements')
  .option('-o, --output <file>', 'path of the output file (default STDOUT)')
  .option('-s, --write-heap-snapshot', 'write V8 heap snapshot after each cycle', false)
  .showHelpAfterError();

app.parse(process.argv);
const opts = app.opts();

const writer = outputWriter(opts['output'] ?? process.stdout);

const args = {
  count: parseInt(opts['count']),
  cycle: parseInt(opts['cycle']),
  writer,
  writeHeapSnapshot: opts['writeHeapSnapshot'],
};

let promise;

switch (opts['benchmark'].toLowerCase()) {
  case 'merkletrie':
    promise = benchMerkleTrie(args);
    break;
  default:
    process.stderr.write('Error: unknown benchmark suite\n');
    app.help();
}

if (promise) {
  // Wait for the job to finish
  waitForPromise(promise);
}
