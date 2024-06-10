import { faker } from "@faker-js/faker";
import { HubError, bytesCompare, bytesIncrement } from "@farcaster/hub-nodejs";
import { existsSync, mkdirSync, rmSync } from "fs";
import { jestRocksDB } from "./jestUtils.js";
import RocksDB from "./rocksdb.js";
import { ResultAsync } from "neverthrow";
import { rsDbForEachIteratorByOpts, rsDbForEachIteratorByPrefix } from "../../rustfunctions.js";

//Safety: fs is safe to use in tests

const randomDbName = () => `rocksdb.test.${faker.name.lastName().toLowerCase()}.${faker.random.alphaNumeric(8)}`;

describe("open", () => {
  describe("opens db and changes status", () => {
    let db: RocksDB;

    beforeEach(() => {
      db = new RocksDB(randomDbName());
      expect(db.location).toBeTruthy();
    });

    afterEach(async () => {
      await expect(db.open()).resolves.toEqual(undefined);
      expect(db.status).toEqual("open");
      await db.destroy();
    });

    test("when directory does not exist", async () => {
      if (existsSync(db.location)) {
        rmSync(db.location, { recursive: true });
      }
    });

    test("when directory exists", async () => {
      mkdirSync(db.location, { recursive: true });
    });

    test("when opening twice", async () => {
      await expect(db.open()).resolves.toEqual(undefined);
    });
  });
});

describe("close", () => {
  test("succeeds", async () => {
    const db = new RocksDB(randomDbName());
    expect(db.status).toEqual("new");
    await db.open();
    expect(db.status).toEqual("open");
    db.close();
    expect(db.status).toEqual("closed");
    await db.destroy();
  });
});

describe("destroy", () => {
  test("succeeds when db is open", async () => {
    const db = new RocksDB(randomDbName());
    await db.open();
    await expect(db.destroy()).resolves.toEqual(true);
  });

  test("destroys db", async () => {
    const db = new RocksDB(randomDbName());
    await db.open();
    db.close();
    await expect(db.destroy()).resolves.toEqual(true);
  });
});

describe("clear", () => {
  test("succeeds", async () => {
    const db = new RocksDB(randomDbName());
    await db.open();
    await db.put(Buffer.from("key"), Buffer.from("value"));
    const value = await db.get(Buffer.from("key"));
    expect(value).toEqual(Buffer.from("value"));

    db.clear();
    await expect(db.get(Buffer.from("key"))).rejects.toThrow(HubError);
    await db.destroy();
  });
});

describe("with db", () => {
  const db = jestRocksDB("binaryrocksdb.test");

  describe("location", () => {
    test("returns db location", () => {
      expect(db.location).toContain(".rocks/");
    });
  });

  describe("status", () => {
    test("returns db status", () => {
      expect(db.status).toEqual("open");
    });
  });

  describe("get", () => {
    test("gets a value by key", async () => {
      await db.put(Buffer.from("foo"), Buffer.from("bar"));
      await expect(db.get(Buffer.from("foo"))).resolves.toEqual(Buffer.from("bar"));
    });

    test("fails if not found", async () => {
      await expect(db.get(Buffer.from("foo"))).rejects.toThrow(HubError);
    });
  });

  describe("getMany", () => {
    test("gets multiple values", async () => {
      await db.put(Buffer.from("foo"), Buffer.from("bar"));
      await db.put(Buffer.from("alice"), Buffer.from("bob"));
      await db.put(Buffer.from("exclude"), Buffer.from("this"));
      const res = await db.getMany([Buffer.from("foo"), Buffer.from("alice")]);
      expect(res).toEqual([Buffer.from("bar"), Buffer.from("bob")]);
    });

    test("succeeds when some keys not found", async () => {
      await db.put(Buffer.from("foo"), Buffer.from("bar"));
      await expect(db.getMany([Buffer.from("foo"), Buffer.from("alice")])).resolves.toEqual([
        Buffer.from("bar"),
        undefined,
      ]);
    });

    test("succeeds when no keys found", async () => {
      await expect(db.getMany([Buffer.from("foo"), Buffer.from("alice")])).resolves.toEqual([undefined, undefined]);
    });
  });

  describe("keysExist", () => {
    test("exists for single key", async () => {
      await db.put(Buffer.from("foo"), Buffer.from("bar"));
      const exists = await db.keysExist([Buffer.from("foo")]);
      expect(exists._unsafeUnwrap()).toEqual([true]);
    });

    test("exists works for keys that exist mixed with don't exist", async () => {
      await db.put(Buffer.from("foo"), Buffer.from("bar"));
      const exists = await db.keysExist([Buffer.from("foo"), Buffer.from("alice")]);
      expect(exists._unsafeUnwrap()).toEqual([true, false]);
    });

    test("exists works when no keys exist", async () => {
      const exists = await db.keysExist([Buffer.from("foo"), Buffer.from("alice")]);
      expect(exists._unsafeUnwrap()).toEqual([false, false]);
    });

    test("exists works for no keys", async () => {
      const exists = await db.keysExist([]);
      expect(exists._unsafeUnwrap()).toEqual([]);
    });
  });

  describe("put", () => {
    test("puts a value by key", async () => {
      await expect(db.put(Buffer.from("foo"), Buffer.from("bar"))).resolves.toEqual(undefined);
      await expect(db.get(Buffer.from("foo"))).resolves.toEqual(Buffer.from("bar"));
    });
  });

  describe("del", () => {
    test("deletes key", async () => {
      await db.put(Buffer.from("foo"), Buffer.from("bar"));
      await expect(db.get(Buffer.from("foo"))).resolves.toEqual(Buffer.from("bar"));
      await expect(db.del(Buffer.from("foo"))).resolves.toEqual(undefined);
      await expect(db.get(Buffer.from("foo"))).rejects.toThrow(HubError);
    });
  });

  describe("iterator", () => {
    test("succeeds", async () => {
      await db.put(Buffer.from("foo"), Buffer.from("bar"));
      await db.put(Buffer.from([1, 2]), Buffer.from([255]));

      const keys: Buffer[] = [];
      const values: Buffer[] = [];

      await db.forEachIteratorByPrefix(Buffer.from([]), async (key, value) => {
        keys.push(key as Buffer);
        values.push(value as Buffer);
      });

      expect(keys).toEqual([Buffer.from([1, 2]), Buffer.from("foo")]);
      expect(values).toEqual([Buffer.from([255]), Buffer.from("bar")]);
    });
  });

  describe("forEachIteratorByPrefix", () => {
    test("succeeds", async () => {
      await db.put(Buffer.from("aliceprefix!b"), Buffer.from("foo"));
      await db.put(Buffer.from("allison"), Buffer.from("oops"));
      await db.put(Buffer.from("aliceprefix!a"), Buffer.from("bar"));
      await db.put(Buffer.from("bobprefix!a"), Buffer.from("bar"));
      await db.put(Buffer.from("prefix!a"), Buffer.from("bar"));

      const output: [Buffer, Buffer][] = [];
      await db.forEachIteratorByPrefix(Buffer.from("aliceprefix!"), (key, value) => {
        output.push([key as Buffer, value as Buffer]);
      });

      expect(output).toEqual([
        [Buffer.from("aliceprefix!a"), Buffer.from("bar")],
        [Buffer.from("aliceprefix!b"), Buffer.from("foo")],
      ]);
    });

    test("succeeds with bytes prefix", async () => {
      const tsx = db
        .transaction()
        .put(Buffer.from([1, 255, 1]), Buffer.from("a"))
        .put(Buffer.from([1, 255, 2]), Buffer.from("b"))
        .put(Buffer.from([2, 0, 0]), Buffer.from("c"))
        .put(Buffer.from([1, 0, 0]), Buffer.from("d"))
        .put(Buffer.from([1, 254, 255]), Buffer.from("e"));

      await db.commit(tsx);

      const values: Buffer[] = [];
      await db.forEachIteratorByPrefix(Buffer.from([1, 255]), (key, value) => {
        values.push(value as Buffer);
      });

      expect(values).toEqual([Buffer.from("a"), Buffer.from("b")]);
    });

    test("succeeds with single byte prefix", async () => {
      const tsx = db
        .transaction()
        .put(Buffer.from([225, 1]), Buffer.from("a"))
        .put(Buffer.from([225, 2]), Buffer.from("b"))
        .put(Buffer.from([2, 0]), Buffer.from("c"))
        .put(Buffer.from([1, 0]), Buffer.from("d"))
        .put(Buffer.from([254, 255]), Buffer.from("e"));

      await db.commit(tsx);

      const values: Buffer[] = [];
      await db.forEachIteratorByPrefix(Buffer.from([225]), (_key, value) => {
        values.push(value as Buffer);
      });
      expect(values).toEqual([Buffer.from("a"), Buffer.from("b")]);
    });
  });

  describe("large iterators", () => {
    test("pages 10k messages", async () => {
      const testSize = 10_000 + 5;

      // Create an array with 10k + 5 messages
      let count = new Uint8Array(Buffer.from([100, 0, 0, 0]));
      const keys = Array.from({ length: testSize }, (_, i) => {
        count = bytesIncrement(count)._unsafeUnwrap();
        return new Uint8Array(count);
      });

      // Add all the messages to the db
      const tsx = db.transaction();
      keys.forEach((key) => {
        tsx.put(Buffer.from(key), Buffer.from(key));
      });
      await db.commit(tsx);

      // 1. Iterate through all the messages with just the prefix
      let values: Buffer[] = [];
      let allFinished = await db.forEachIteratorByPrefix(Buffer.from([100]), (_key, value) => {
        values.push(value as Buffer);
      });
      expect(bytesCompare(values[0] as Buffer, keys[0] as Buffer)).toEqual(0);
      expect(allFinished).toEqual(true);
      expect(values.length).toEqual(testSize);

      // 2. Iterate through all the messages with a blank prefix
      values = [];
      allFinished = await db.forEachIteratorByPrefix(Buffer.from([]), (_key, value) => {
        values.push(value as Buffer);
      });
      expect(bytesCompare(values[0] as Buffer, keys[0] as Buffer)).toEqual(0);
      expect(allFinished).toEqual(true);
      expect(values.length).toEqual(testSize);

      // 3. Iterate through all messages with prefix + reverse
      values = [];
      allFinished = await db.forEachIteratorByPrefix(
        Buffer.from([100]),
        (_key, value) => {
          values.push(value as Buffer);
        },
        { reverse: true },
      );
      expect(bytesCompare(values[0] as Buffer, keys[testSize - 1] as Buffer)).toEqual(0);
      expect(allFinished).toEqual(true);
      expect(values.length).toEqual(testSize);

      // 4. Iterate through all messages with no prefix + reverse
      values = [];
      allFinished = await db.forEachIteratorByPrefix(
        Buffer.from([]),
        (_key, value) => {
          values.push(value as Buffer);
        },
        { reverse: true },
      );
      expect(bytesCompare(values[0] as Buffer, keys[testSize - 1] as Buffer)).toEqual(0);
      expect(allFinished).toEqual(true);
      expect(values.length).toEqual(testSize);

      // 5. Iterate through all messages with prefix + page size
      values = [];
      allFinished = await db.forEachIteratorByPrefix(
        Buffer.from([100]),
        (_key, value) => {
          values.push(value as Buffer);
        },
        { pageSize: 100 },
      );
      expect(bytesCompare(values[0] as Buffer, keys[0] as Buffer)).toEqual(0);
      expect(bytesCompare(values[99] as Buffer, keys[99] as Buffer)).toEqual(0);
      expect(values.length).toEqual(100);
      expect(allFinished).toEqual(true);

      // 6. Iterate through all messages with no prefix + page size
      values = [];
      allFinished = await db.forEachIteratorByPrefix(
        Buffer.from([]),
        (_key, value) => {
          values.push(value as Buffer);
        },
        { pageSize: 100 },
      );
      expect(bytesCompare(values[0] as Buffer, keys[0] as Buffer)).toEqual(0);
      expect(bytesCompare(values[99] as Buffer, keys[99] as Buffer)).toEqual(0);
      expect(allFinished).toEqual(true);
      expect(values.length).toEqual(100);

      // 6.1 Iterate through all messages with no prefix + page size + page token
      values = [];
      allFinished = await db.forEachIteratorByPrefix(
        Buffer.from([]),
        (_key, value) => {
          values.push(value as Buffer);
        },
        { pageSize: 100, pageToken: keys[100] as Buffer },
      );
      expect(bytesCompare(values[0] as Buffer, keys[101] as Buffer)).toEqual(0);
      expect(allFinished).toEqual(true);
      expect(values.length).toEqual(100);

      // 6.2 Iterate through all messages with no prefix + page size + page token + reverse
      values = [];
      allFinished = await db.forEachIteratorByPrefix(
        Buffer.from([]),
        (_key, value) => {
          values.push(value as Buffer);
        },
        { pageSize: 100, pageToken: keys[100] as Buffer, reverse: true },
      );
      expect(bytesCompare(values[0] as Buffer, keys[99] as Buffer)).toEqual(0);
      expect(allFinished).toEqual(true);
      expect(values.length).toEqual(100);

      // 6.3 Iterate through all messages with no prefix + page token
      values = [];
      allFinished = await db.forEachIteratorByPrefix(
        Buffer.from([]),
        (_key, value) => {
          values.push(value as Buffer);
        },
        { pageToken: keys[99] as Buffer },
      );
      expect(bytesCompare(values[0] as Buffer, keys[100] as Buffer)).toEqual(0);
      expect(allFinished).toEqual(true);
      expect(values.length).toEqual(testSize - 100);

      // 7. Iterate using opts
      values = [];
      allFinished = await db.forEachIteratorByOpts(
        { gte: Buffer.from([100]), lt: Buffer.from([101]) },
        (_key, value) => {
          values.push(value as Buffer);
        },
      );
      expect(bytesCompare(values[0] as Buffer, keys[0] as Buffer)).toEqual(0);
      expect(allFinished).toEqual(true);
      expect(values.length).toEqual(testSize);

      // 8. Iterate using opts + reverse
      values = [];
      allFinished = await db.forEachIteratorByOpts(
        { gte: Buffer.from([100]), lt: Buffer.from([101]), reverse: true },
        (_key, value) => {
          values.push(value as Buffer);
        },
      );
      expect(bytesCompare(values[0] as Buffer, keys[testSize - 1] as Buffer)).toEqual(0);
      expect(allFinished).toEqual(true);
      expect(values.length).toEqual(testSize);

      // 9. Iterate using opts + prefix starting in the middle
      values = [];
      allFinished = await db.forEachIteratorByOpts(
        { gte: keys[5] as Buffer, lt: Buffer.from([101]) },
        (_key, value) => {
          values.push(value as Buffer);
        },
      );
      expect(bytesCompare(values[0] as Buffer, keys[5] as Buffer)).toEqual(0);
      expect(bytesCompare(values[values.length - 1] as Buffer, keys[testSize - 1] as Buffer)).toEqual(0);
      expect(allFinished).toEqual(true);
      expect(values.length).toEqual(testSize - 5);

      // 10. Iterate using opts + prefix starting in the middle + reverse
      values = [];
      allFinished = await db.forEachIteratorByOpts(
        { gte: keys[5] as Buffer, lt: Buffer.from([101]), reverse: true },
        (_key, value) => {
          values.push(value as Buffer);
        },
      );
      expect(bytesCompare(values[0] as Buffer, keys[testSize - 1] as Buffer)).toEqual(0);
      expect(bytesCompare(values[values.length - 1] as Buffer, keys[5] as Buffer)).toEqual(0);
      expect(allFinished).toEqual(true);
      expect(values.length).toEqual(testSize - 5);

      // 11. Iterate using opts + prefix but interrupt after 1 message
      values = [];
      allFinished = await db.forEachIteratorByOpts(
        { gte: Buffer.from([100]), lt: Buffer.from([101]) },
        (_key, value) => {
          values.push(value as Buffer);
          return true;
        },
      );
      expect(bytesCompare(values[0] as Buffer, keys[0] as Buffer)).toEqual(0);
      expect(allFinished).toEqual(false);
      expect(values.length).toEqual(1);
    });
  });

  describe("db forEachIteratorByOpts paging", () => {
    test("forEachIteratorByOpts succeeds with paging", async () => {
      const allValues = [
        Buffer.from("a"),
        Buffer.from("b"),
        Buffer.from("c"),
        Buffer.from("d"),
        Buffer.from("e"),
        Buffer.from("f"),
        Buffer.from("g"),
      ];

      const tsx = db
        .transaction()
        .put(Buffer.from([100, 1]), allValues[0] as Buffer)
        .put(Buffer.from([100, 2]), allValues[1] as Buffer)
        .put(Buffer.from([100, 3]), allValues[2] as Buffer)
        .put(Buffer.from([100, 4]), allValues[3] as Buffer)
        .put(Buffer.from([100, 5]), allValues[4] as Buffer)
        .put(Buffer.from([100, 6]), allValues[5] as Buffer)
        .put(Buffer.from([100, 7]), allValues[6] as Buffer);

      await db.commit(tsx);

      // Returns the first 3 values with the correct ranges
      let values: Buffer[] = [];
      let allFinished = await rsDbForEachIteratorByOpts(
        db.rustDb,
        { gte: Buffer.from([100]), lt: Buffer.from([100, 4]) },
        (_key, value) => {
          values.push(value as Buffer);
        },
      );
      expect(allFinished).toEqual(true);
      expect(values).toEqual(allValues.slice(0, 3));

      // Correctly pages through all the values even with a small overridePageSize
      values = [];
      allFinished = await rsDbForEachIteratorByOpts(
        db.rustDb,
        { gte: Buffer.from([100]), lt: Buffer.from([100, 6]) },
        (_key, value) => {
          values.push(value as Buffer);
        },
        3,
      );
      expect(allFinished).toEqual(true);
      expect(values).toEqual(allValues.slice(0, 5));

      // Stops iteration if the callback returns true
      values = [];
      allFinished = await rsDbForEachIteratorByOpts(
        db.rustDb,
        { gte: Buffer.from([100]), lt: Buffer.from([100, 6]) },
        (_key, value) => {
          values.push(value as Buffer);
          return true; // stop iteration
        },
      );
      expect(allFinished).toEqual(false);
      expect(values).toEqual(allValues.slice(0, 1));

      // Respects "gt" instead of "gte"
      values = [];
      allFinished = await rsDbForEachIteratorByOpts(
        db.rustDb,
        { gt: Buffer.from([100, 1]), lt: Buffer.from([100, 6]) },
        (_key, value) => {
          values.push(value as Buffer);
        },
      );
      expect(allFinished).toEqual(true);
      expect(values).toEqual(allValues.slice(1, 5));

      // Respects reverse even with a small overridePageSize
      values = [];
      allFinished = await rsDbForEachIteratorByOpts(
        db.rustDb,
        { gte: Buffer.from([100]), lt: Buffer.from([100, 6]), reverse: true },
        (_key, value) => {
          values.push(value as Buffer);
        },
        3,
      );
      expect(allFinished).toEqual(true);
      expect(values).toEqual(allValues.slice(0, 5).reverse());
    });
  });

  describe("db forEachIteratorByPrefix paging", () => {
    test("forEachIteratorByPrefix succeeds with paging", async () => {
      const allValues = [
        Buffer.from("a"),
        Buffer.from("b"),
        Buffer.from("c"),
        Buffer.from("d"),
        Buffer.from("e"),
        Buffer.from("f"),
        Buffer.from("g"),
      ];

      const tsx = db
        .transaction()
        .put(Buffer.from([100, 1]), allValues[0] as Buffer)
        .put(Buffer.from([100, 2]), allValues[1] as Buffer)
        .put(Buffer.from([100, 3]), allValues[2] as Buffer)
        .put(Buffer.from([100, 4]), allValues[3] as Buffer)
        .put(Buffer.from([100, 5]), allValues[4] as Buffer)
        .put(Buffer.from([100, 6]), allValues[5] as Buffer)
        .put(Buffer.from([100, 7]), allValues[6] as Buffer);

      await db.commit(tsx);

      // With a max page size, all values are returned
      let values: Buffer[] = [];
      let allFinished = await rsDbForEachIteratorByPrefix(db.rustDb, Buffer.from([100]), {}, (_key, value) => {
        values.push(value as Buffer);
      });
      expect(allFinished).toEqual(true);
      expect(values).toEqual(allValues);

      // With a page size of 3, the first 3 values are returned
      values = [];
      allFinished = await rsDbForEachIteratorByPrefix(db.rustDb, Buffer.from([100]), { pageSize: 3 }, (_key, value) => {
        values.push(value as Buffer);
      });
      expect(allFinished).toEqual(true);
      expect(values).toEqual(allValues.slice(0, 3));

      // With a continuation token and page size, the next 3 values are returned
      values = [];
      allFinished = await rsDbForEachIteratorByPrefix(
        db.rustDb,
        Buffer.from([100]),
        { pageSize: 3, pageToken: Buffer.from([3]) },
        (_key, value) => {
          values.push(value as Buffer);
        },
      );
      expect(allFinished).toEqual(true);
      expect(values).toEqual(allValues.slice(3, 6));

      // With a continuation token and no page size, all remaining values are returned
      values = [];
      allFinished = await rsDbForEachIteratorByPrefix(
        db.rustDb,
        Buffer.from([100]),
        { pageToken: Buffer.from([3]) },
        (_key, value) => {
          values.push(value as Buffer);
        },
      );
      expect(allFinished).toEqual(true);
      expect(values).toEqual(allValues.slice(3, 7));

      // With the last continuation token and page size, all remaining values are returned
      values = [];
      allFinished = await rsDbForEachIteratorByPrefix(
        db.rustDb,
        Buffer.from([100]),
        { pageSize: 3, pageToken: Buffer.from([6]) },
        (_key, value) => {
          values.push(value as Buffer);
        },
      );
      expect(allFinished).toEqual(true);
      expect(values).toEqual(allValues.slice(6, 7));

      // If the prefix doesn't exist, the iterator returns finished
      values = [];
      allFinished = await rsDbForEachIteratorByPrefix(db.rustDb, Buffer.from([101]), {}, (_key, value) => {
        values.push(value as Buffer);
      });
      expect(allFinished).toEqual(true);
      expect(values).toEqual([]);

      // allFinished returns false if the callback returns true
      values = [];
      allFinished = await rsDbForEachIteratorByPrefix(db.rustDb, Buffer.from([100]), {}, (_key, value) => {
        values.push(value as Buffer);
        return true;
      });
      expect(allFinished).toEqual(false);
      expect(values).toEqual(allValues.slice(0, 1));

      // allFinished returns false if the callback returns true with pageSize
      values = [];
      allFinished = await rsDbForEachIteratorByPrefix(db.rustDb, Buffer.from([100]), { pageSize: 5 }, (_key, value) => {
        values.push(value as Buffer);
        return true;
      });
      expect(allFinished).toEqual(false);
      expect(values).toEqual(allValues.slice(0, 1));
    });
  });

  describe("forEachIterator errors", () => {
    test("succeeds", async () => {
      await db.put(Buffer.from("aliceprefix!b"), Buffer.from("foo"));
      await db.put(Buffer.from("allison"), Buffer.from("oops"));
      await db.put(Buffer.from("aliceprefix!a"), Buffer.from("bar"));
      await db.put(Buffer.from("bobprefix!a"), Buffer.from("bar"));
      await db.put(Buffer.from("prefix!a"), Buffer.from("bar"));
      const output = [];
      await db.forEachIteratorByPrefix(Buffer.from([]), (key, value) => {
        output.push([key, value]);
      });

      expect(output.length).toEqual(5);
    });

    test("fails when iterator throws", async () => {
      await db.put(Buffer.from("aliceprefix!b"), Buffer.from("foo"));
      await db.put(Buffer.from("allison"), Buffer.from("oops"));
      await db.put(Buffer.from("aliceprefix!a"), Buffer.from("bar"));
      await db.put(Buffer.from("bobprefix!a"), Buffer.from("bar"));
      await db.put(Buffer.from("prefix!a"), Buffer.from("bar"));

      const output: Array<[Buffer | undefined, Buffer | undefined]> = [];
      const result = await ResultAsync.fromPromise(
        db.forEachIteratorByPrefix(Buffer.from([]), (key, value) => {
          output.push([key, value]);
          if (key?.toString() === "allison") {
            throw new Error("oops");
          }
        }),
        (err) => err as Error,
      );

      expect(result.isErr()).toEqual(true);
      expect(result._unsafeUnwrapErr().message).toEqual("oops");
      expect(output.length).toEqual(3);
    });

    test("fails when iterator throws async", async () => {
      await db.put(Buffer.from("aliceprefix!b"), Buffer.from("foo"));
      await db.put(Buffer.from("allison"), Buffer.from("oops"));
      await db.put(Buffer.from("aliceprefix!a"), Buffer.from("bar"));
      await db.put(Buffer.from("bobprefix!a"), Buffer.from("bar"));
      await db.put(Buffer.from("prefix!a"), Buffer.from("bar"));

      const output: Array<[Buffer | undefined, Buffer | undefined]> = [];
      const result = await ResultAsync.fromPromise(
        db.forEachIteratorByPrefix(Buffer.from([]), async (key, value) => {
          output.push([key, value]);
          if (key?.toString() === "allison") {
            throw new Error("oops");
          }
        }),
        (err) => err as Error,
      );

      expect(result.isErr()).toEqual(true);
      expect(result._unsafeUnwrapErr().message).toEqual("oops");
      expect(output.length).toEqual(3);
    });

    test("fails when returning to break", async () => {
      await db.put(Buffer.from("aliceprefix!b"), Buffer.from("foo"));
      await db.put(Buffer.from("allison"), Buffer.from("oops"));
      await db.put(Buffer.from("aliceprefix!a"), Buffer.from("bar"));
      await db.put(Buffer.from("bobprefix!a"), Buffer.from("bar"));
      await db.put(Buffer.from("prefix!a"), Buffer.from("bar"));

      const output: Array<[Buffer | undefined, Buffer | undefined]> = [];
      let result;
      await db.forEachIteratorByPrefix(Buffer.from([]), (key, value) => {
        output.push([key, value]);
        if (key?.toString() === "allison") {
          result = "break";
          return true;
        } else {
          return false;
        }
      });

      expect(result).toEqual("break");
      expect(output.length).toEqual(3);
    });

    test("fails when returning to break async", async () => {
      await db.put(Buffer.from("aliceprefix!b"), Buffer.from("foo"));
      await db.put(Buffer.from("allison"), Buffer.from("oops"));
      await db.put(Buffer.from("aliceprefix!a"), Buffer.from("bar"));
      await db.put(Buffer.from("bobprefix!a"), Buffer.from("bar"));
      await db.put(Buffer.from("prefix!a"), Buffer.from("bar"));

      const output: Array<[Buffer | undefined, Buffer | undefined]> = [];
      let result;
      await db.forEachIteratorByPrefix(Buffer.from([]), async (key, value) => {
        output.push([key, value]);
        if (key?.toString() === "allison") {
          result = "break";
          return Promise.resolve(true);
        } else {
          return false;
        }
      });

      expect(result).toEqual("break");
      expect(output.length).toEqual(3);
    });
  });
});
