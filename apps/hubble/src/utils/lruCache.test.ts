import { LRUCache } from "./lruCache.js";

describe("lruCache", () => {
  test("cur/prev cache should work", async () => {
    const cache = new LRUCache<string, string>(2);

    const a = await cache.get("a", async () => "a");
    expect(a).toEqual("a");

    // Getting a again should not call the get method
    const a2 = await cache.get("a", async () => "not_called");
    expect(a2).toEqual("a");

    const b = await cache.get("b", async () => "b");
    expect(b).toEqual("b");

    // Since cache size is 2, both keys should be in the cache
    const a3 = await cache.get("a", async () => "not_called");
    expect(a3).toEqual("a");
    const b3 = await cache.get("b", async () => "not_called");
    expect(b3).toEqual("b");

    // Now adding a new key should evict the oldest key
    const c = await cache.get("c", async () => "c");
    expect(c).toEqual("c");

    // a and b are now in the "prev" cache
    const a4 = await cache.get("a", async () => "not_called");
    expect(a4).toEqual("a");

    // a and c are now in the current cache and "b" is in the "prev" cache. Calling this will
    // actually call the get method
    const b4 = await cache.get("b", async () => "b4");
    expect(b4).toEqual("b4");

    // Clear the cache
    cache.clear();

    // Cache should be empty
    const a5 = await cache.get("a", async () => "a5");
    expect(a5).toEqual("a5");

    const b5 = await cache.get("b", async () => "b5");
    expect(b5).toEqual("b5");
  });

  test("invalidate should work", async () => {
    const cache = new LRUCache<string, string>(2);

    const a = await cache.get("a", async () => "a");
    expect(a).toEqual("a");

    const b = await cache.get("b", async () => "b");
    expect(b).toEqual("b");

    cache.invalidate("a");

    const a2 = await cache.get("a", async () => "a2");
    expect(a2).toEqual("a2");

    const b2 = await cache.get("b", async () => "b2");
    expect(b2).toEqual("b");
  });

  test("old keys should be evicted", async () => {
    const cache = new LRUCache<string, string>(2);

    const a = await cache.get("a", async () => "a");
    expect(a).toEqual("a");

    const b = await cache.get("b", async () => "b");
    expect(b).toEqual("b");

    const c = await cache.get("c", async () => "c");
    expect(c).toEqual("c");

    const d = await cache.get("d", async () => "d");
    expect(d).toEqual("d");

    const e = await cache.get("e", async () => "e");
    expect(e).toEqual("e");

    // Now a and b should be evicted
    const a3 = await cache.get("a", async () => "a3");
    expect(a3).toEqual("a3");

    const b3 = await cache.get("b", async () => "b3");
    expect(b3).toEqual("b3");

    // Now current is "b3" and prev is "e" and "a3"
    const e2 = await cache.get("e", async () => "not_called");
    expect(e2).toEqual("e");
  });
});
