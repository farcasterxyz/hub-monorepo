/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable security/detect-object-injection */
import { Writable } from 'node:stream';

import Chance from 'chance';
import { ok } from 'neverthrow';

import {
  CastAddBody,
  FarcasterNetwork,
  FARCASTER_EPOCH,
  HubEventType,
  HubResult,
  HubRpcClient,
  Message,
  MessageData,
  MessageType,
} from '@farcaster/hub-nodejs';
import { MockRpcClient } from '~/network/sync/mock';
import SyncEngine from '~/network/sync/syncEngine';
import { SyncId } from '~/network/sync/syncId';
import RocksDB from '~/storage/db/rocksdb';
import Engine from '~/storage/engine';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { blake3Truncate160, sleepWhile } from '~/utils/crypto';
import { avgRecords } from './helpers';
import { yieldToEventLoop } from './utils';
import { StorageCache } from '~/storage/engine/storageCache';

const INITIAL_MESSAGES_COUNT = 10_000;
const FID_COUNT = 10_000;

const messages: Message[] = [];
const peers: SyncEngine[] = [];

class MockEngine {
  eventHandler: StoreEventHandler;
  db: RocksDB;

  constructor(db: RocksDB) {
    this.db = db;
    this.eventHandler = new StoreEventHandler(db, new StorageCache());
  }

  async mergeMessage(message: Message): Promise<HubResult<void>> {
    await this.eventHandler.commitTransaction(this.db.transaction(), {
      type: HubEventType.MERGE_MESSAGE,
      mergeMessageBody: { message, deletedMessages: [] },
    });

    return ok(undefined);
  }

  async getAllMessagesBySyncIds(syncIds: Uint8Array[]): Promise<HubResult<Message[]>> {
    return ok(
      syncIds.map((syncId) => {
        // The index is embeded in the last 10 bytes of the hash
        const i = parseInt(
          Buffer.from(syncId)
            .subarray(syncId.length - 10)
            .toString('utf8')
        );
        const m = messages[i];
        if (!m) {
          throw new Error(`syncid not found`);
        }
        return m;
      })
    );
  }
}

const makeSyncEninge = async (id: number) => {
  const db = new RocksDB(`engine.syncEngine${id}.benchmark`);
  await db.open();
  await db.clear();
  const syncEngine = new SyncEngine(new MockEngine(db) as unknown as Engine, db);
  (syncEngine as any)['_id'] = id;
  return syncEngine;
};

const makeMessage = (fid: number, messageId: number, timestamp: number) => {
  const hash = Buffer.from(blake3Truncate160(Buffer.from(messageId.toString())));
  hash.fill(' ', 10);
  hash.write(messageId.toString(), 10);
  return Message.create({
    data: MessageData.create({
      type: MessageType.CAST_ADD,
      fid,
      timestamp,
      network: FarcasterNetwork.DEVNET,
      castAddBody: CastAddBody.create({
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam pharetra dolor leo, vitae tincidunt justo scelerisque vel. Praesent ac leo at nibh rutrum aliquet. Fusce rhoncus ligula a ipsum porta, nec.',
      }),
    }),
    hash,
  });
};

const messageGenerator = function* (chance: Chance.Chance): Generator<Message> {
  const fids: number[] = [];
  for (let i = 1; i <= FID_COUNT; i++) {
    fids.push(i);
  }
  let ts = 1;
  for (let i = 0; ; i++) {
    const fid = chance.pickone(fids);
    const msg = makeMessage(fid, i, ts);
    ts += chance.integer({ min: 1, max: 600 });
    yield msg;
  }
};

let estimateEntropySkip = INITIAL_MESSAGES_COUNT;

export const estimateEntropy = async () => {
  let sum = 0;
  for (let i = estimateEntropySkip; i < messages.length; i++) {
    let pm = 0;
    const syncId = new SyncId(messages[i]!);
    for (let j = 0; j < peers.length; j++) {
      const exists = await peers[j]?.trie.exists(syncId);
      if (exists) {
        pm++;
      }
    }
    pm /= peers.length;

    // Skip unnecessary check in next round
    if (pm == 1 && i == estimateEntropySkip) {
      estimateEntropySkip++;
    }

    if (pm > 0 && pm < 1) {
      sum += -pm * Math.log2(pm) - (1 - pm) * Math.log2(1 - pm);
    }
  }
  return sum;
};

/**
 * SyncEngine simulation. It is a round-based test (not CPU bound). This test aims at measuring the
 * performance of the sync algorithm.
 *
 * Methodology
 *
 * 1. Pre-generate 10,000 messages and populate `peersCount` SyncEngine instances.
 * 2. For each round `1..count`:
 *     1. Generate `round * cycle` new messages
 *     2. Add messages to each peers with `dropRate` chance of dropping that message
 *     3. For each SyncEngine, randomly pick another SyncEngine and perform sync.
 *     4. Measure number of RPC requests and estimate binary entropy of the network after each
 *        round.
 *     5. Repeat each round `cycle` times and output average of measurements.
 *
 * The performance of sync is measured by binary entropy in the network. With this measure, lower
 * entropy values indicate more uniform diffusion of events and therefore better consistency of the
 * overall network state.
 *
 * $H = \sum_{m \subseteq M} - p_mlog_2p_m - (1 - p_m)log_2(1 - p_m)$
 *
 * @param args.count Target number of rounds.
 * @param args.cycle Number of new messages in each round.
 * @param args.peersCount Number of peers to simulate.
 * @param args.dropRate Rate of message drop.
 * @param args.writer Output writer
 */
export const benchSyncEngine = async ({
  count,
  cycle,
  peersCount,
  dropRate,
  writer,
}: {
  count: number;
  cycle: number;
  peersCount: number;
  dropRate: number;
  writer: Writable;
}) => {
  if (isNaN(count) || count < 1) {
    count = 100;
  }
  if (isNaN(cycle) || cycle < 1) {
    cycle = 1;
  }
  if (isNaN(peersCount) || peersCount < 2) {
    peersCount = 2;
  }
  if (isNaN(dropRate) || dropRate < 0 || dropRate > 1) {
    dropRate = 0.5;
  }

  // Initialization

  const chance = new Chance(1); // use constant seed for repeatable data
  const g = messageGenerator(chance);

  for (let i = 0; i < INITIAL_MESSAGES_COUNT; i++) {
    messages.push(g.next().value);
  }

  for (let i = 0; i < peersCount; i++) {
    const syncEngine = await makeSyncEninge(i);
    await syncEngine.initialize();
    await Promise.all(messages.map((m) => syncEngine.addMessage(m)));

    peers.push(syncEngine);
  }

  await yieldToEventLoop();

  // Stub the timestamp
  global.Date.now = () =>
    (messages[messages.length - 1]!.data!.timestamp + chance.integer({ min: 1, max: 60 })) * 1000 + FARCASTER_EPOCH;

  writer.write([0, '', '', '', '', '']);

  try {
    // Rounds
    const cycleStats = new Array(cycle).fill({});
    for (let round = 1; round <= count; round++) {
      process.stderr.write(`Round #${round}\n`);
      // Deliver `round * cycle` messages
      const roundSize = round * cycle;
      for (let c = 0; c < cycle; c++) {
        let realDelivered = 0;
        for (let i = 0; i < roundSize; i++) {
          const msg = g.next().value;
          messages.push(msg);
          let delivered = 0;
          peers.forEach((peer) => {
            if (chance.bool({ likelihood: (1 - dropRate) * 100 })) {
              peer.addMessage(msg);
              delivered++;
            }
          });
          // Deliver to at least one peer
          if (delivered === 0) {
            const peer = chance.pickone(peers);
            peer.addMessage(msg);
            delivered++;
          }
          realDelivered += delivered;
        }
        await yieldToEventLoop();

        // Pick a random peer to sync
        const stats = new Array(peers.length).fill({});
        for (let i = 0; i < peers.length; i++) {
          const ourSyncEngine = peers[i]!;
          let theirSyncEngine;
          do {
            theirSyncEngine = chance.pickone(peers);
          } while (theirSyncEngine === ourSyncEngine);

          const otherSnapshot = (await theirSyncEngine.getSnapshot())._unsafeUnwrap();
          if ((await ourSyncEngine.shouldSync(otherSnapshot))._unsafeUnwrap()) {
            const rpcClient = new MockRpcClient((theirSyncEngine as any).engine, theirSyncEngine);
            await ourSyncEngine.performSync(otherSnapshot, rpcClient as unknown as HubRpcClient);

            const nodeMetadata = await ourSyncEngine.getTrieNodeMetadata(new Uint8Array());
            stats[i] = {
              synced: 1,
              staled: messages.length > nodeMetadata!.numMessages,
              ...rpcClient.stats(),
            };
            await sleepWhile(() => ourSyncEngine.syncTrieQSize > 0, 1000);
          }
        }

        const entropy = await estimateEntropy();
        const avg = avgRecords(stats);

        cycleStats[c] = {
          dropped: (peers.length * roundSize - realDelivered) / peers.length, // Average drop per peer
          synced: avg['synced'] ?? 0,
          getSyncMetadataByPrefixCalls: avg['getSyncMetadataByPrefixCalls'] ?? 0,
          getAllSyncIdsByPrefixCalls: avg['getAllSyncIdsByPrefixCalls'] ?? 0,
          getAllMessagesBySyncIdsReturns: avg['getAllMessagesBySyncIdsReturns'] ?? 0,
          entropy,
        };
      }

      const avg = avgRecords(cycleStats);

      writer.write([
        round,
        avg['dropped'] ?? 0,
        avg['synced'] ?? 0,
        avg['getSyncMetadataByPrefixCalls'] ?? 0,
        avg['getAllSyncIdsByPrefixCalls'] ?? 0,
        avg['getAllMessagesBySyncIdsReturns'] ?? 0,
        avg['entropy'],
      ]);

      await yieldToEventLoop();
    }
  } finally {
    // Clean up RocksDb
    process.stderr.write('Cleaning up\n');
    peers.forEach((syncEngine) => {
      const db = (syncEngine.trie as any)._db;
      db.destroy();
    });
  }
};
