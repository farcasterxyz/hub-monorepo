import { performDbMigrations } from "./migrations.js";
import { jestRocksDB } from "../jestUtils.js";
import { Factories, UserNameProof, UserNameType } from "@farcaster/hub-nodejs";
import { FID_BYTES, RootPrefix } from "../types.js";
import { makeFidKey } from "../message.js";
import { ResultAsync } from "neverthrow";

const db = jestRocksDB("fnameFidIndex.migration.test");

const fid1 = Factories.Fid.build();
const fid2 = fid1 + 1;

describe("fnameFidIndex migration", () => {
  beforeAll(async () => {});

  test("should migrate the fname index properly", async () => {
    // To trigger the migration, we need the FnameUserNameProofs to exist
    const fname1 = Buffer.from("fname1");
    const fnameProofFid1 = Buffer.concat([Buffer.from([RootPrefix.FNameUserNameProof]), fname1]);
    const fid1UsernameProof = Factories.UserNameProof.build({
      name: fname1,
      fid: fid1,
      timestamp: 0,
      type: UserNameType.USERNAME_TYPE_FNAME,
    });
    await db.put(fnameProofFid1, Buffer.from(UserNameProof.encode(fid1UsernameProof).finish()));

    const fname2 = Buffer.from("fname2");
    const fnameProofFid2 = Buffer.concat([Buffer.from([RootPrefix.FNameUserNameProof]), fname2]);
    const fid2UsernameProof = Factories.UserNameProof.build({
      name: fname2,
      fid: fid2,
      timestamp: 0,
      type: UserNameType.USERNAME_TYPE_FNAME,
    });
    await db.put(fnameProofFid2, Buffer.from(UserNameProof.encode(fid2UsernameProof).finish()));

    // First, write an incorrect index
    const littleEndianFid = Buffer.alloc(FID_BYTES);
    littleEndianFid.writeUint32LE(fid1);

    const incorrectIndexKey = Buffer.concat([Buffer.from([RootPrefix.FNameUserNameProofByFid]), littleEndianFid]);
    const correctIndexKey = Buffer.concat([Buffer.from([RootPrefix.FNameUserNameProofByFid]), makeFidKey(fid1)]);
    const fixedIndexValue = fnameProofFid1;
    await db.put(incorrectIndexKey, fixedIndexValue);

    // Then also create a correct index
    const unchangedIndexKey = Buffer.concat([Buffer.from([RootPrefix.FNameUserNameProofByFid]), makeFidKey(fid2)]);
    const unchangedIndexValue = fnameProofFid2;
    await db.put(unchangedIndexKey, unchangedIndexValue);

    // Now run the migration
    await performDbMigrations(db, 10, 11);

    // Check that the incorrect index was deleted
    const incorrectIndexValueResult = await ResultAsync.fromPromise(db.get(incorrectIndexKey), (e) => e as Error);
    expect(incorrectIndexValueResult.isErr()).toBe(true);

    // Check that the correct index was written correctly
    const correctIndexValue = await db.get(correctIndexKey);
    expect(correctIndexValue).toEqual(fixedIndexValue);

    // Check that the correct index was unchanged
    const correctIndexValueResult = await db.get(unchangedIndexKey);
    expect(correctIndexValueResult).toEqual(unchangedIndexValue);
  });
});
