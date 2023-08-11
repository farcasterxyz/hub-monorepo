/**
 * The UserNameProofStore had accidentally overloaded the `UserNameProofMessage` postfix. It was being
 * used for storing both the `UserNameProofMessage` protobuf and the `UserNameProofMessageAdd` index messages.
 *
 * This migration moves the index postfix to `UserNameProofMessageAdd` and replaces the postfix for
 * the index messages
 */

import { logger } from "../../../utils/logger.js";
import RocksDB from "../rocksdb.js";
import { FID_BYTES, RootPrefix, UserPostfix } from "../types.js";

const log = logger.child({ component: "UsernameProofIndexMigration" });

export async function usernameProofIndexMigration(db: RocksDB): Promise<boolean> {
  // To do this migration, we'll go over all RootPrefix.User messages,
  // looking for a postfix of UserNameProofMessage. If we find one, we'll
  // check if the value is a 24-byte index (a TS Hash). If it is, we'll add new DB entry with
  // postfix `UserNameProofMessageAdd` and delete the original entry

  log.info({}, "Starting username proof index migration");
  let count = 0;
  const start = Date.now();

  await db.forEachIteratorByPrefix(
    Buffer.from([RootPrefix.User]),
    async (key, value) => {
      if (!key || !value) {
        return;
      }

      const postfix = key.readUint8(1 + FID_BYTES);
      if (postfix === UserPostfix.UsernameProofMessage) {
        // Check if the value is an index
        if (value.length === 24) {
          // Replace the (1 + FID_BYTES) postfix with `UserPostfix.UserNameProofAdds`
          const newKey = Buffer.concat([
            key.subarray(0, 1 + FID_BYTES),
            Buffer.from([UserPostfix.UserNameProofAdds]),
            key.subarray(1 + FID_BYTES + 1),
          ]);

          // Write the new key and delete the old one
          const txn = db.transaction();
          txn.put(newKey, value);
          txn.del(key);
          await db.commit(txn);

          count += 1;
        }
      }
    },
    {},
    1 * 60 * 60 * 1000,
  );

  log.info({ count, duration: Date.now() - start }, "Finished username proof index migration");
  return true;
}
