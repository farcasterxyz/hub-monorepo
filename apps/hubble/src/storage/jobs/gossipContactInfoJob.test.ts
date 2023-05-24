import { GossipContactInfoJobScheduler } from './gossipContactInfoJob';
import { MockHub } from '../../test/mocks';
import { jestRocksDB } from '../db/jestUtils';
import Engine from '../engine';
import { FarcasterNetwork } from '@farcaster/core';

const db = jestRocksDB('jobs.GossipContactInfoJobScheduler.test');

describe('GossipContactInfoJobScheduler', () => {
  test('doJobs', async () => {
    const engine = new Engine(db, FarcasterNetwork.TESTNET);
    const hub = new MockHub(db, engine);
    const scheduler = new GossipContactInfoJobScheduler(hub);
    await scheduler.doJobs();
    expect(hub.gossipCount).toBe(1);
  });
});
