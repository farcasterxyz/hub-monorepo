import { GossipContactInfoJobScheduler } from '~/storage/jobs/gossipContactInfoJob';
import { MockHub } from '~/test/mocks';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
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
