import { faker } from "@faker-js/faker";
import { HubError } from "@farcaster/hub-nodejs";
import { existsSync, mkdirSync, rmdirSync } from "fs";
import { jestRocksDB } from "./jestUtils.js";
import RocksDB from "./rocksdb.js";
import { ResultAsync } from "neverthrow";

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
        rmdirSync(db.location, { recursive: true });
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
    expect(db.status).toEqual("open");
    await db.open();
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

  describe("iteratorByPrefix", () => {
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

  describe("forEachIterator", () => {
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
