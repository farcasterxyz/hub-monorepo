import RocksDB, { Iterator, Transaction } from "./rocksdb.js";
import { HubError, OnChainEvent, OnChainEventType } from "@farcaster/hub-nodejs";
import { OnChainEventPostfix, RootPrefix } from "./types.js";
import { getPageIteratorByPrefix, makeFidKey } from "./message.js";
import { PAGE_SIZE_MAX, PageOptions } from "../stores/types.js";
import { ResultAsync } from "neverthrow";

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
    Buffer.from([RootPrefix.OnChainEvent, OnChainEventPostfix.OnChainEvents, type]),
    makeFidKey(fid),
    makeBlockNumberKey(blockNumber),
    makeLogIndexKey(logIndex),
  ]);
};

export const makeSignerOnChainEventBySignerKey = (fid: number, signer: Uint8Array): Buffer => {
  return Buffer.concat([
    Buffer.from([RootPrefix.OnChainEvent, OnChainEventPostfix.SignerByFid]),
    makeFidKey(fid),
    Buffer.from(signer),
  ]);
};

export const makeIdRegisterEventByFidKey = (fid: number): Buffer => {
  return Buffer.concat([Buffer.from([RootPrefix.OnChainEvent, OnChainEventPostfix.IdRegisterByFid]), makeFidKey(fid)]);
};

export const makeIdRegisterEventByCustodyKey = (custodyAddress: Uint8Array): Buffer => {
  return Buffer.concat([
    Buffer.from([RootPrefix.OnChainEvent, OnChainEventPostfix.IdRegisterByCustodyAddress]),
    Buffer.from(custodyAddress),
  ]);
};

export const makeOnChainEventIteratorPrefix = (type: OnChainEventType, fid?: number): Buffer => {
  let prefix = Buffer.concat([Buffer.from([RootPrefix.OnChainEvent, OnChainEventPostfix.OnChainEvents, type])]);
  if (fid) {
    prefix = Buffer.concat([prefix, makeFidKey(fid)]);
  }
  return prefix;
};

export const makeOnChainEventSecondaryIteratorPrefix = (postfix: OnChainEventPostfix, fid?: number): Buffer => {
  let prefix = Buffer.concat([Buffer.from([RootPrefix.OnChainEvent]), Buffer.from([postfix])]);
  if (fid) {
    prefix = Buffer.concat([prefix, makeFidKey(fid)]);
  }
  return prefix;
};

export const getOnChainEvent = async <T extends OnChainEvent>(
  db: RocksDB,
  type: OnChainEventType,
  fid: number,
  blockNumber: number,
  logIndex: number,
) => {
  const primaryKey = makeOnChainEventPrimaryKey(type, fid, blockNumber, logIndex);
  return getOnChainEventByKey<T>(db, primaryKey);
};

export const getOnChainEventByKey = async <T extends OnChainEvent>(db: RocksDB, primaryKey: Buffer) => {
  const buffer = await db.get(primaryKey);
  return OnChainEvent.decode(new Uint8Array(buffer)) as T;
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

export const forEachOnChainEvent = async (
  db: RocksDB,
  type: OnChainEventType,
  callback: (event: OnChainEvent) => void,
  fid?: number,
  timeout?: number,
): Promise<void> => {
  await db.forEachIteratorByPrefix(
    makeOnChainEventIteratorPrefix(type, fid),
    async (_, value) => {
      if (!value) {
        return;
      }
      const event = OnChainEvent.decode(value);
      callback(event);
    },
    { values: true },
    timeout || 15 * 60 * 1000,
  );
};

export const onChainEventSorter = (a: OnChainEvent, b: OnChainEvent): number => {
  if (a.blockNumber === b.blockNumber) {
    return a.logIndex - b.logIndex;
  }
  return a.blockNumber - b.blockNumber;
};

export const getOnChainEventsPageByPrefix = async <T extends OnChainEvent>(
  db: RocksDB,
  prefix: Buffer,
  filter: (event: OnChainEvent) => event is T,
  pageOptions: PageOptions = {},
): Promise<{
  events: T[];
  nextPageToken: Uint8Array | undefined;
}> => {
  const iterator = getPageIteratorByPrefix(db, prefix, pageOptions);

  const limit = pageOptions.pageSize || PAGE_SIZE_MAX;

  const eventsPrimaryKeys: Buffer[] = [];

  const getNextIteratorRecord = async (iterator: Iterator): Promise<[Buffer, Buffer]> => {
    const [key, value] = await iterator.next();
    return [key as Buffer, value as Buffer];
  };

  let iteratorFinished = false;
  let lastPageToken: Uint8Array | undefined;
  do {
    const result = await ResultAsync.fromPromise(getNextIteratorRecord(iterator), (e) => e as HubError);
    if (result.isErr()) {
      iteratorFinished = true;
      break;
    }

    const [key, value] = result.value;
    lastPageToken = Uint8Array.from(key.subarray(prefix.length));
    if (value) {
      eventsPrimaryKeys.push(value);
    }
  } while (eventsPrimaryKeys.length < limit);

  const events = (await getManyOnChainEvents<T>(db, eventsPrimaryKeys)).filter(filter);

  await iterator.end();
  if (!iteratorFinished) {
    return { events: events, nextPageToken: lastPageToken };
  } else {
    return { events: events, nextPageToken: undefined };
  }
};
