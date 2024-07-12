/**
 * Takes a hash as a number and a number of shards (must be >= 1) and assigns
 * the hash to a shard (a.k.a. bucket) such that when the number of shards
 * changes the number of hashes whose shard assignment changes is minimized.
 *
 * Note that this implementation doesn't do any hashing of the key itself--you
 * must provide the key as a number obtained by a uniformly distributed hashing
 * function.
 *
 * Aside: We're only intending to use this for FID shard allocation since we
 * care more about the consistent assignment property when number of shards
 * change. Anecdotally, passing just the FID as the key distributes FIDs to
 * shards uniformly enough.
 *
 * @see "A Fast, Minimal Memory, Consistent Hash Algorithm" https://arxiv.org/pdf/1406.2294
 */
export function jumpConsistentHash(key: number, shards: number): number {
  let hash = BigInt(key);
  let b: bigint;
  let j = 0n;
  do {
    b = j;
    hash = ((hash * 2862933555777941757n) % 2n ** 64n) + 1n;
    j = BigInt(Math.floor(((Number(b) + 1) * Number(1n << 31n)) / Number((hash >> 33n) + 1n)));
  } while (j < shards);
  return Number(b);
}
