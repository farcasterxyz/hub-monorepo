/**
 Remove old id and key registry events
 */

import { logger } from "../../../utils/logger.js";
import RocksDB from "../rocksdb.js";
import { OnChainEventPostfix, RootPrefix } from "../types.js";
import { Result } from "neverthrow";
import { HubError, OnChainEvent, OnChainEventType } from "@farcaster/hub-nodejs";
import { SyncId } from "../../../network/sync/syncId.js";
import { MerkleTrie } from "../../../network/sync/merkleTrie.js";

const log = logger.child({ component: "oldContractEvents" });

export const oldContractEvents = async (db: RocksDB): Promise<boolean> => {
  log.info({}, "Starting oldContractEvents migration");
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
        if (event.type !== OnChainEventType.EVENT_TYPE_STORAGE_RENT && event.version === 0) {
          // We expect all events to be before when the contract was paused for migration. This should not be true
          if (event.blockNumber >= 111888232) {
            log.warn(`Would have deleted event ${event.type} ${event.fid} from block ${event.blockNumber}. Skipping`);
            return;
          }
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
  log.info({ duration: Date.now() - start }, `Finished oldContractEvents migration. Removed ${count} events`);
  return true;
};
