import { TTLMap } from "./ttl_map.js";
import { jest } from "@jest/globals";

describe("TTLMap", () => {
  jest.useFakeTimers();

  test("size should accurately reflect non-expired entries", () => {
    const map = new TTLMap<string, number>(1000);

    expect(map.size()).toBe(0);

    map.set("a", 1);
    expect(map.size()).toBe(1);

    map.set("b", 2);
    expect(map.size()).toBe(2);

    jest.advanceTimersByTime(500);
    map.set("c", 3);
    expect(map.size()).toBe(3);

    jest.advanceTimersByTime(501);
    expect(map.size()).toBe(1);

    map.get("a"); // This should trigger cleanup of expired entry
    expect(map.size()).toBe(1);
  });

  test("set should not double count when updating existing entries", () => {
    const map = new TTLMap<string, number>(1000);

    map.set("a", 1);
    expect(map.size()).toBe(1);

    map.set("a", 2); // Updating existing non-expired entry
    expect(map.size()).toBe(1);

    jest.advanceTimersByTime(1001);
    map.set("a", 3); // Updating expired entry
    expect(map.size()).toBe(1);
  });

  test("delete should correctly update size for expired and non-expired entries", () => {
    const map = new TTLMap<string, number>(1000);

    map.set("a", 1);
    map.set("b", 2);
    expect(map.size()).toBe(2);

    map.delete("a");
    expect(map.size()).toBe(1);

    jest.advanceTimersByTime(1001);
    expect(map.delete("b")).toBe(true); // Deleting expired entry
    expect(map.size()).toBe(0);
  });

  test("get should update size when retrieving expired entries", () => {
    const map = new TTLMap<string, number>(1000);

    map.set("a", 1);
    expect(map.size()).toBe(1);

    jest.advanceTimersByTime(1001);
    expect(map.get("a")).toBeUndefined();
    expect(map.size()).toBe(0);
  });

  test("resetTTL should correctly handle expired and non-expired entries", () => {
    const map = new TTLMap<string, number>(1000);

    map.set("a", 1);
    expect(map.size()).toBe(1);

    jest.advanceTimersByTime(500);
    map.resetTTL("a");
    expect(map.size()).toBe(1);

    jest.advanceTimersByTime(750);
    expect(map.get("a")).toBe(1);
    expect(map.size()).toBe(1);

    jest.advanceTimersByTime(251);
    map.resetTTL("a");
    expect(map.size()).toBe(1);
    expect(map.get("a")).toBe(1);
  });

  test("getAll should return only non-expired entries", () => {
    const map = new TTLMap<string, number>(1000);

    map.set("a", 1);
    map.set("b", 2);
    map.set("c", 3);

    jest.advanceTimersByTime(500);
    map.set("d", 4);

    jest.advanceTimersByTime(501);

    const allEntries = map.getAll();
    expect(allEntries).toHaveLength(1);
    expect(allEntries[0]).toEqual(["d", 4]);
    expect(map.size()).toBe(1);
  });

  test("clear should reset size to zero", () => {
    const map = new TTLMap<string, number>(1000);

    map.set("a", 1);
    map.set("b", 2);
    expect(map.size()).toBe(2);

    map.clear();
    expect(map.size()).toBe(0);

    map.set("c", 3);
    expect(map.size()).toBe(1);
  });

  test("size should be accurate after multiple operations", () => {
    const map = new TTLMap<string, number>(1000);

    map.set("a", 1);
    map.set("b", 2);
    map.set("c", 3);
    expect(map.size()).toBe(3);

    jest.advanceTimersByTime(500);
    map.delete("b");
    map.set("d", 4);
    expect(map.size()).toBe(3);

    jest.advanceTimersByTime(501);
    map.get("a"); // This should trigger cleanup
    expect(map.size()).toBe(1);

    map.set("e", 5);
    map.resetTTL("d");
    expect(map.size()).toBe(2);
  });
});
