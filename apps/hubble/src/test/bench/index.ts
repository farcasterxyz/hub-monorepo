import { Command } from "commander";

import { benchMerkleTrie } from "./merkleTrie.js";
import { outputWriter, waitForPromise } from "./utils.js";

const app = new Command();
app
  .name("farcaster-bench")
  .description("Farcaster unit benchmark suites")
  .version(process.env["npm_package_version"] ?? "1.0.0");

app
  .usage("--benchmark <suite> [options]")
  .requiredOption("-b --benchmark <suite>", "the benchmarking suite to run")
  .option("-n, --count <count>", "size of input")
  .option("-c, --cycle <cycles>", "run at least <cycle> times before taking measurements")
  .option("-p, --peers-count <peers-count>", "number of simultaneous peers to run")
  .option("-d, --drop-rate <drop-rate>", "drop rate from 0 to 1")
  .option("-o, --output <file>", "path of the output file (default STDOUT)")
  .option("-s, --write-heap-snapshot", "write V8 heap snapshot after each cycle", false)
  .showHelpAfterError();

app.parse(process.argv);
const opts = app.opts();

const writer = outputWriter(opts["output"] ?? process.stdout);

const args = {
  count: parseInt(opts["count"]),
  cycle: parseInt(opts["cycle"]),
  dropRate: parseFloat(opts["dropRate"]),
  writer,
  writeHeapSnapshot: opts["writeHeapSnapshot"],
  peersCount: opts["peersCount"],
};

let promise;

switch (opts["benchmark"].toLowerCase()) {
  case "merkletrie":
    promise = benchMerkleTrie(args);
    break;
  default:
    process.stderr.write("Error: unknown benchmark suite\n");
    app.help();
}

if (promise) {
  // Wait for the job to finish
  waitForPromise(promise);
}
