import * as protobufs from '@farcaster/protobufs';
import { Ed25519Signer, Factories } from '@farcaster/utils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { seedSigner } from '~/storage/engine/seed';
import { PruneMessagesJobScheduler } from '~/storage/jobs/pruneMessagesJob';

const db = jestRocksDB('jobs.pruneMessagesJob.test');

const engine = new Engine(db, protobufs.FarcasterNetwork.TESTNET);
const scheduler = new PruneMessagesJobScheduler(engine);

// Use farcaster timestamp
const seedMessagesFromTimestamp = async (engine: Engine, fid: number, signer: Ed25519Signer, timestamp: number) => {
  const castAdd = await Factories.CastAddMessage.create({ data: { fid, timestamp } }, { transient: { signer } });
  const reactionAdd = await Factories.ReactionAddMessage.create(
    { data: { fid, timestamp } },
    { transient: { signer } }
  );
  return engine.mergeMessages([castAdd, reactionAdd]);
};

let prunedMessages: protobufs.Message[] = [];

const pruneMessageListener = (event: protobufs.PruneMessageHubEvent) => {
  prunedMessages.push(event.pruneMessageBody.message);
};

beforeAll(() => {
  engine.eventHandler.on('pruneMessage', pruneMessageListener);
});

beforeEach(() => {
  prunedMessages = [];
});

afterAll(() => {
  engine.eventHandler.off('pruneMessage', pruneMessageListener);
});

describe('doJobs', () => {
  test('succeeds without fids', async () => {
    const result = await scheduler.doJobs();
    expect(result._unsafeUnwrap()).toEqual(undefined);
  });

  test('prunes messages for all fids', async () => {
    const timestampToPrune = 1; // 1 second after farcaster epoch (1/1/22)

    const fid1 = Factories.Fid.build();

    const signer1 = Factories.Ed25519Signer.build();
    await seedSigner(engine, fid1, signer1.signerKey);
    await seedMessagesFromTimestamp(engine, fid1, signer1, timestampToPrune);

    const fid2 = Factories.Fid.build();

    const signer2 = Factories.Ed25519Signer.build();
    await seedSigner(engine, fid2, signer2.signerKey);
    await seedMessagesFromTimestamp(engine, fid2, signer2, timestampToPrune);

    for (const fid of [fid1, fid2]) {
      const casts = await engine.getCastsByFid(fid);
      expect(casts._unsafeUnwrap().length).toEqual(1);

      const reactions = await engine.getReactionsByFid(fid);
      expect(reactions._unsafeUnwrap().length).toEqual(1);
    }

    const result = await scheduler.doJobs();
    expect(result._unsafeUnwrap()).toEqual(undefined);

    for (const fid of [fid1, fid2]) {
      const casts = await engine.getCastsByFid(fid);
      expect(casts._unsafeUnwrap()).toEqual([]);

      const reactions = await engine.getReactionsByFid(fid);
      expect(reactions._unsafeUnwrap()).toEqual([]);
    }

    expect(prunedMessages.length).toEqual(4);
  });
});
