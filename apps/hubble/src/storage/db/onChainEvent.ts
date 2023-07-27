import RocksDB, { Transaction } from "./rocksdb.js";
import { Message, OnChainEvent, OnChainEventType } from "@farcaster/hub-nodejs";
import { RootPrefix } from "./types.js";
import { makeFidKey } from "./message.js";

// With a 2-second block time on optimism, 2^32 blocks is ~68 years
export const BLOCK_NUMBER_BYTES = 4;
// Log index sequential within a block, and there's no practical limit on the index.
// with a 30M max block size on optimism, and 375 gas for a log event, we can assume a max of 80K events,
// which is unfortunately larger than 2^16. So, we'll use 32 bits for log index even though it's pretty unlikely
// we'll cross 2^16 events in a block.
export const LOG_INDEX_BYTES = 4;

export const makeBlockNumberKey = (blockNumber: number): Buffer => {
  const buffer = Buffer.alloc(BLOCK_NUMBER_BYTES);
  buffer.writeUInt32BE(blockNumber, 0);
  return buffer;
};

export const makeLogIndexKey = (logIndex: number): Buffer => {
  const buffer = Buffer.alloc(LOG_INDEX_BYTES);
  buffer.writeUInt32BE(logIndex, 0);
  return buffer;
};

export const makeOnChainEventPrimaryKey = (
  type: OnChainEventType,
  fid: number,
  blockNumber: number,
  logIndex: number,
): Buffer => {
  return Buffer.concat([
    Buffer.from([RootPrefix.OnChainEvent]),
    Buffer.from([type]),
    makeFidKey(fid),
    makeBlockNumberKey(blockNumber),
    makeLogIndexKey(logIndex),
  ]);
};

export const makeOnChainEventIteratorPrefix = (type: OnChainEventType, fid?: number): Buffer => {
  let prefix = Buffer.concat([Buffer.from([RootPrefix.OnChainEvent]), Buffer.from([type])]);
  if (fid) {
    prefix = Buffer.concat([prefix, makeFidKey(fid)]);
  }
  return prefix;
};

export const putOnChainEventTransaction = (txn: Transaction, event: OnChainEvent): Transaction => {
  const eventBuffer = Buffer.from(OnChainEvent.encode(event).finish());
  const primaryKey = makeOnChainEventPrimaryKey(event.type, event.fid, event.blockNumber, event.logIndex);
  return txn.put(primaryKey, eventBuffer);
};

export const getManyOnChainEvents = async <T extends OnChainEvent>(
  db: RocksDB,
  primaryKeys: Buffer[],
): Promise<T[]> => {
  const buffers = await db.getMany(primaryKeys);
  return buffers.map((buffer) => OnChainEvent.decode(new Uint8Array(buffer)) as T);
};
