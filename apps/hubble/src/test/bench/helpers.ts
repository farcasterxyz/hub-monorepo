/* eslint-disable security/detect-object-injection */
import Chance from 'chance';

import { Message } from '@farcaster/hub-nodejs';
import { SyncId } from '~/network/sync/syncId';

/**
 * Generate `n` SyncId. The SyncIds are sampled from FIDs between 1 to `numFids`.  Timestamp in
 * returned SyncIds are strictly increasing by a uniformly random number between 1 to `maxTsDelta`.
 * The generated result set is repeatable.
 *
 * @param n the total number of SyncId
 * @param numFids number of FIDs
 * @param maxTimeShift generate timestamp between 1 to maxTsDelta
 */
export const generateSyncIds = (n: number, numFids = 1, maxTimeShift = 1): SyncId[] => {
  const chance = new Chance(1); // use constant seed for repeatable data
  const fids: number[] = [];
  for (let i = 1; i <= numFids; i++) {
    fids.push(i);
  }
  const syncIds: SyncId[] = [];
  let ts = 1;
  for (let i = 0; i < n; i++) {
    const fid = chance.pickone(fids);
    const hash = chance.hash({ length: 40 });
    const syncId = fastSyncId(fid, Buffer.from(hash, 'hex'), ts, 1);
    syncIds.push(syncId);
    ts += chance.integer({ min: 1, max: maxTimeShift });
  }
  return syncIds;
};

/**
 * Create SyncId quickly for test cases.
 * @param fid
 * @param tsHash
 * @param timestamp
 * @param type
 */
export const fastSyncId = (fid: number, hash: Uint8Array, timestamp: number, type: number) => {
  // Ducktyping message model to avoid creating the whole message.
  return new SyncId({
    data: {
      fid,
      timestamp,
      type,
    },
    hash,
  } as Message);
};

export const sumRecords = (series: Record<string, number>[]): Record<string, number> =>
  series.reduce((prev, curr) => Object.fromEntries(Object.entries(curr).map(([k, v]) => [k, (prev[k] ?? 0) + v])));

export const avgRecords = (series: Record<string, number>[]): Record<string, number> =>
  Object.fromEntries(Object.entries(sumRecords(series)).map(([k, v]) => [k, v / series.length]));
