/**
 Remove admin resets so they can be re-added correctly (old logic picked first signer and did not check for the exact key)
 */

import { logger } from "../../../utils/logger.js";
import RocksDB from "../rocksdb.js";
import { OnChainEventPostfix, RootPrefix } from "../types.js";
import { Result } from "neverthrow";
import { HubError, isSignerOnChainEvent, OnChainEvent, SignerEventType } from "@farcaster/hub-nodejs";
import { SyncId } from "../../../network/sync/syncId.js";
import { MerkleTrie } from "../../../network/sync/merkleTrie.js";

const log = logger.child({ component: "clearAdminResets" });

export const clearAdminResets = async (db: RocksDB): Promise<boolean> => {
  log.info({}, "Starting clearAdminResets migration");
  const start = Date.now();

  const syncTrie = new MerkleTrie(db);
  await syncTrie.initialize();
  let count = 0;

  await db.forEachIteratorByPrefix(
    Buffer.from([RootPrefix.OnChainEvent, OnChainEventPostfix.OnChainEvents]),
    async (key, value) => {
      if (!key || !value) {
        return;
      }

      const result = Result.fromThrowable(
        () => OnChainEvent.decode(new Uint8Array(value as Buffer)),
        (e) => e as HubError,
      )();
      if (result.isOk()) {
        const event = result.value;
        if (isSignerOnChainEvent(event) && event.signerEventBody.eventType === SignerEventType.ADMIN_RESET) {
          count += 1;
          try {
            await db.del(key);
            await syncTrie.delete(SyncId.fromOnChainEvent(event));
          } catch (e) {
            log.error({ err: e }, `Failed to delete event ${event.type} ${event.fid} from block ${event.blockNumber}`);
          }
        }
      }
    },
  );

  await syncTrie.stop();
  log.info({ duration: Date.now() - start }, `Finished clearAdminResets migration. Removed ${count} events`);
  return true;
};
