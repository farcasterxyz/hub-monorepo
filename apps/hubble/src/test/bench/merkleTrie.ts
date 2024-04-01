import { performance } from "node:perf_hooks";
import { Writable } from "node:stream";
import v8 from "v8";
import ProgressBar from "progress";
import { MerkleTrie } from "../../network/sync/merkleTrie.js";
import RocksDB from "../../storage/db/rocksdb.js";
import { generateSyncIds } from "./helpers.js";
import { yieldToEventLoop } from "./utils.js";

/**
 * Benchmark MerkleTrie. This is a CPU bound test (no disk operations). The test focuses on the
 * MerkleTrie implementation; Protobuf messages encoding/decoding are avoided as much as possible.
 *
 * Methodology
 *
 * 1. Pre-generates `count` SyncIds with sequential timestamps (delta between 1 to 300 seconds) and
 *    FIDs drew from 100,000 pre-generated set.
 * 2. Call insert `count` times, then measure time and memory
 * 3. Call getSnapshot `count` times, then measure time and memory
 * 4. Yield to NodeJS event loop
 * 5. Repeat 2-4 until all SyncIds are inserted
 *
 * @param args.count Target number of entries to be inserted.
 * @param args.cycle Take measurements after every this number of cycle.
 * @param args.writer Output writer
 * @param args.writeHeapSnapshot Write V8 heap snapshot after every cycle
 */
export const benchMerkleTrie = async ({
  count,
  cycle,
  writer,
  writeHeapSnapshot,
}: {
  count: number;
  cycle: number;
  writer: Writable;
  writeHeapSnapshot: boolean;
}) => {
  if (isNaN(count) || count < 1) {
    count = 100_000;
  }
  if (isNaN(cycle) || cycle < 1) {
    cycle = 10_000;
  }
  count = Math.ceil(count / cycle) * cycle;

  const progress = new ProgressBar("benchmarking MerkleTrie :bar :current/:total ", {
    total: count,
  });

  const syncIds = generateSyncIds(count, 100_000, 300);
  const db = new RocksDB("protobufs.bench.merkleTrie.test");
  await db.open();

  const trie = new MerkleTrie(db);
  await trie.initialize();

  let i = 0;
  progress.tick(0);
  const memoryUsage = process.memoryUsage();
  writer.write([
    0,
    "",
    "",
    memoryUsage.heapUsed / 1048576,
    memoryUsage.external / 1048576,
    memoryUsage.rss / 1048576,
    memoryUsage.arrayBuffers / 1048576,
  ]);

  // Yield before starting the test
  await yieldToEventLoop();

  while (i < syncIds.length) {
    let start = performance.now();
    for (let j = 0; j < cycle; j++) {
      // biome-ignore lint/style/noNonNullAssertion: legacy code, avoid using ignore for new code
      await trie.insert(syncIds[(i + j) % syncIds.length]!);
    }
    await trie.commitToDb();
    const insertDuration = performance.now() - start;

    i += cycle;

    start = performance.now();
    for (let j = 0; j < cycle; j++) {
      // biome-ignore lint/style/noNonNullAssertion: legacy code, avoid using ignore for new code
      await trie.getSnapshot(syncIds[(i - 1) % syncIds.length]!.syncId().slice(0, 10));
    }
    const snapshotDuration = performance.now() - start;

    const memoryUsage = process.memoryUsage();
    writer.write([
      i,
      insertDuration / cycle,
      snapshotDuration / cycle,
      memoryUsage.heapUsed / 1048576,
      memoryUsage.external / 1048576,
      memoryUsage.rss / 1048576,
      memoryUsage.arrayBuffers / 1048576,
    ]);

    if (writeHeapSnapshot) {
      v8.writeHeapSnapshot();
    }

    progress.tick(cycle);

    // Yield every cycle count
    await yieldToEventLoop();
  }

  db.clear();
  process.stderr.write("finished\n");
};
