import RocksDB from "../rocksdb.js";
import { performDbMigrations } from "./migrations.js";
import { Factories, UserNameProof } from "@farcaster/hub-nodejs";
import { getFNameProofByFid, makeFNameUserNameProofKey } from "../nameRegistryEvent.js";

const dbName = "fnameproof.migration.test.db";

describe("fnameproof migration", () => {
  let db: RocksDB;

  beforeAll(async () => {
    db = new RocksDB(dbName);
    await db.open();
  });

  afterAll(async () => {
    await db.close();
    await db.destroy();
  });

  test("should migrate fnameproof index", async () => {
    // Write an fname proof without the index
    const proof = Factories.UserNameProof.build();
    const proofBuffer = Buffer.from(UserNameProof.encode(proof).finish());
    await db.put(makeFNameUserNameProofKey(proof.name), proofBuffer);

    await expect(getFNameProofByFid(db, proof.fid)).rejects.toThrow("NotFound");

    const success = await performDbMigrations(db, 1, 2);
    expect(success).toBe(true);

    await expect(getFNameProofByFid(db, proof.fid)).resolves.toEqual(proof);
  });

  test("should not fail when proof is not decodable", async () => {
    const badProof = Buffer.from([1, 2, 3]);
    await db.put(makeFNameUserNameProofKey(Buffer.from([])), badProof);
    await expect(db.get(makeFNameUserNameProofKey(Buffer.from([])))).resolves.toBeDefined();
    const success = await performDbMigrations(db, 1, 2);
    expect(success).toBe(true);
    await expect(db.get(makeFNameUserNameProofKey(Buffer.from([])))).rejects.toThrow("NotFound");
  });
});
