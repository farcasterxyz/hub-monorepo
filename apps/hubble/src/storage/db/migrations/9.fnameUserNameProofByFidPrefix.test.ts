import { performDbMigrations } from "./migrations.js";
import { jestRocksDB } from "../jestUtils.js";
import { Eip712Signer, Factories, HubError, VerificationAddAddressMessage } from "@farcaster/hub-nodejs";
import StoreEventHandler from "../../stores/storeEventHandler.js";
import { putOnChainEventTransaction } from "../onChainEvent.js";
import VerificationStore from "../../stores/verificationStore.js";
import { RootPrefix } from "../types.js";
import { makeFidKey, makeTsHash } from "../message.js";
import { ResultAsync } from "neverthrow";

const db = jestRocksDB("fnameUserNameProofByFid.migration.test");

const eventHandler = new StoreEventHandler(db);
const set = new VerificationStore(db, eventHandler);

const fid = Factories.Fid.build();

let ethSigner: Eip712Signer;
let ethSignerKey: Uint8Array;
let verificationAdd: VerificationAddAddressMessage;

describe("fnameUserNameProofByFid migration", () => {
  beforeAll(async () => {
    ethSigner = Factories.Eip712Signer.build();
    ethSignerKey = (await ethSigner.getSignerKey())._unsafeUnwrap();

    const rent = Factories.StorageRentOnChainEvent.build({ fid }, { transient: { units: 1 } });
    await db.commit(putOnChainEventTransaction(db.transaction(), rent));

    verificationAdd = await Factories.VerificationAddEthAddressMessage.create(
      {
        data: { fid, verificationAddAddressBody: { address: ethSignerKey } },
      },
      { transient: { ethSigner } },
    );
    await set.merge(verificationAdd);
  });

  test("should migrate the fnameUserNameProofByFidPrefix", async () => {
    const tsHash = makeTsHash(verificationAdd.data.timestamp, verificationAdd.hash)._unsafeUnwrap();

    // Add the FnameUserNameProofByFidPrefix key with the old (25) prefix
    const key = Buffer.concat([Buffer.from([25]), makeFidKey(fid)]);
    await db.put(key, Buffer.from(tsHash));

    const success = await performDbMigrations(db, 8, 9);
    expect(success).toBe(true);

    // Expect that the key was migrated to the new (27) prefix
    const newKey = Buffer.concat([Buffer.from([RootPrefix.FNameUserNameProofByFid]), makeFidKey(fid)]);
    const value = await db.get(newKey);
    expect(value).toEqual(Buffer.from(tsHash));

    // Expect that the old key was deleted
    const oldKey = key;
    const oldValue = await ResultAsync.fromPromise(db.get(oldKey), (e) => e as HubError);
    expect(oldValue.isErr()).toBe(true);
    expect(oldValue._unsafeUnwrapErr().errCode).toBe("not_found");

    // Expect that the verificationAddAddressMessage is still in the store
    const verifications = await set.getVerificationAddsByFid(fid);
    expect(verifications.messages).toHaveLength(1);
    expect(verifications.messages[0]?.hash).toEqual(verificationAdd.hash);

    const verification = await set.getVerificationAdd(fid, ethSignerKey);
    expect(verification.hash).toEqual(verificationAdd.hash);
  });
});
