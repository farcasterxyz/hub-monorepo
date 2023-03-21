import * as protobufs from '@farcaster/protobufs';
import { Factories, HubError } from '@farcaster/utils';
import { err, ok } from 'neverthrow';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { seedSigner } from '~/storage/engine/seed';
import {
  DEFAULT_REVOKE_SIGNER_JOB_DELAY,
  RevokeSignerJobQueue,
  RevokeSignerJobScheduler,
} from '~/storage/jobs/revokeSignerJob';
import { JobFactories } from '~/storage/jobs/utils/factories';
import { getAllMessagesBySigner } from '../db/message';

const db = jestRocksDB('jobs.revokeSignerJob.test');

const queue = new RevokeSignerJobQueue(db);
const engine = new Engine(db, protobufs.FarcasterNetwork.TESTNET);
const scheduler = new RevokeSignerJobScheduler(queue, engine);

// Test payloads
let payload: protobufs.RevokeSignerJobPayload;
let payload2: protobufs.RevokeSignerJobPayload;
let payload3: protobufs.RevokeSignerJobPayload;

// Integration test data
const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
let signerKey: Uint8Array;
let revokeSignerPayload: protobufs.RevokeSignerJobPayload;
let castAdd: protobufs.CastAddMessage;
let reactionAdd: protobufs.ReactionAddMessage;
let verificationRemove: protobufs.VerificationRemoveMessage;

beforeAll(async () => {
  // Test payloads
  payload = JobFactories.RevokeSignerJobPayload.build();
  payload2 = JobFactories.RevokeSignerJobPayload.build();
  payload3 = JobFactories.RevokeSignerJobPayload.build();

  // Integration test data
  signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const constructedPayload = RevokeSignerJobQueue.makePayload(fid, signerKey);
  expect(constructedPayload.isOk()).toBeTruthy();
  revokeSignerPayload = constructedPayload._unsafeUnwrap();

  castAdd = await Factories.CastAddMessage.create({ data: { fid } }, { transient: { signer } });
  reactionAdd = await Factories.ReactionAddMessage.create({ data: { fid } }, { transient: { signer } });
  verificationRemove = await Factories.VerificationRemoveMessage.create({ data: { fid } }, { transient: { signer } });
});

afterAll(async () => {
  await engine.stop();
});

beforeEach(async () => {
  await seedSigner(engine, fid, signerKey);
});

describe('jobKeyToTimestamp', () => {
  test('extracts doAt timestamp from key', () => {
    const timestamp = Date.now();
    const hash = Factories.Bytes.build({}, { transient: { length: 4 } });
    const jobKey = RevokeSignerJobQueue.makeJobKey(timestamp, hash);
    const recoveredTimestamp = RevokeSignerJobQueue.jobKeyToTimestamp(jobKey._unsafeUnwrap());
    expect(recoveredTimestamp).toEqual(ok(timestamp));
  });
});

describe('makePayload', () => {
  test('makes protobuf RevokeSignerJobPayload', () => {
    const newPayload = RevokeSignerJobQueue.makePayload(payload.fid, payload.signer);
    expect(newPayload).toEqual(ok(payload));
  });

  test('fails with invalid fid', () => {
    const newPayload = RevokeSignerJobQueue.makePayload(0, payload.signer);
    expect(newPayload).toEqual(err(new HubError('bad_request.validation_failure', 'fid is missing')));
  });

  test('fails with invalid signer', () => {
    const newPayload = RevokeSignerJobQueue.makePayload(payload.fid, new Uint8Array());
    expect(newPayload).toEqual(
      err(new HubError('bad_request.validation_failure', 'signer is not a valid Ed25519 or Eth signer'))
    );
  });
});

describe('enqueueJob', () => {
  test('saves job in db with doAt timestamp in the future', async () => {
    const result = await queue.enqueueJob(payload);
    expect(result.isOk()).toBeTruthy();
    const jobs = await queue.getAllJobs();
    expect(jobs._unsafeUnwrap().length).toEqual(1);
    for (const [doAt, jobPayload] of jobs._unsafeUnwrap()) {
      expect(doAt).toBeGreaterThan(Date.now());
      expect(jobPayload).toEqual(payload);
    }
  });

  test('saves job in db with specified doAt timestamp', async () => {
    const timestamp = Date.now() + 1000;
    const result = await queue.enqueueJob(payload, timestamp);
    expect(result.isOk()).toBeTruthy();
    const jobs = await queue.getAllJobs();
    expect(jobs).toEqual(ok([[timestamp, payload]]));
  });

  test('appends hash to key for each enqueued job', async () => {
    const timestamp = Date.now() + 1000;

    await queue.enqueueJob(payload, timestamp);
    await queue.enqueueJob(payload2, timestamp);
    await queue.enqueueJob(payload3, timestamp);

    const jobs = await queue.getAllJobs();

    // Comparing with a set, because the hash determines actual order
    expect(new Set(jobs._unsafeUnwrap())).toEqual(
      new Set([
        [timestamp, payload],
        [timestamp, payload2],
        [timestamp, payload3],
      ])
    );
  });

  test('overwrites jobs with same payload and doAt timestamp', async () => {
    const timestamp = Date.now() + 1000;

    await queue.enqueueJob(payload, timestamp);
    await queue.enqueueJob(payload, timestamp);

    const jobs = await queue.getAllJobs();
    expect(jobs._unsafeUnwrap()).toEqual([[timestamp, payload]]);
  });

  test('saves jobs in doAt order', async () => {
    const timestamp = Date.now();
    await queue.enqueueJob(payload2, timestamp + 1);
    await queue.enqueueJob(payload, timestamp);

    const jobs = await queue.getAllJobs();
    expect(jobs._unsafeUnwrap()).toEqual([
      [timestamp, payload],
      [timestamp + 1, payload2],
    ]);
  });
});

describe('popNextJob', () => {
  describe('with jobs', () => {
    let timestamp: number;

    beforeEach(async () => {
      timestamp = Date.now() + 1000;
      await queue.enqueueJob(payload, timestamp);
      await queue.enqueueJob(payload2, timestamp + 1);
    });

    test('returns next job and removes it from the queue', async () => {
      const nextJob = await queue.popNextJob();
      expect(nextJob._unsafeUnwrap()).toEqual(payload);
      const jobs = await queue.getAllJobs();
      expect(jobs._unsafeUnwrap()).toEqual([[timestamp + 1, payload2]]);
    });

    test('returns not_found error if no jobs enqueued before given timestamp', async () => {
      const nextJob = await queue.popNextJob(timestamp);
      expect(nextJob._unsafeUnwrapErr()).toEqual(new HubError('not_found', 'record not found'));
      const jobs = await queue.getAllJobs();
      expect(jobs._unsafeUnwrap()).toEqual([
        [timestamp, payload],
        [timestamp + 1, payload2],
      ]);
    });
  });

  describe('without jobs', () => {
    test('returns not_found error', async () => {
      const nextJob = await queue.popNextJob();
      expect(nextJob._unsafeUnwrapErr()).toEqual(new HubError('not_found', 'record not found'));
    });
  });
});

describe('doJobs', () => {
  describe('with jobs', () => {
    let timestamp: number;

    beforeEach(async () => {
      timestamp = Date.now();
      // Enqueue two jobs in the past
      await queue.enqueueJob(payload, timestamp - 1000);
      await queue.enqueueJob(payload2, timestamp - 999);
      // Enqueue one job in the future
      await queue.enqueueJob(payload3, timestamp + 1000);
    });

    test('processes two jobs whose doAt timestamp has passed', async () => {
      const result = await scheduler.doJobs();
      expect(result._unsafeUnwrap()).toEqual(undefined);
      const jobs = await queue.getAllJobs();
      expect(jobs._unsafeUnwrap()).toEqual([[timestamp + 1000, payload3]]);
    });
  });

  describe('with jobs and messages to revoke', () => {
    beforeEach(async () => {
      await engine.mergeMessages([castAdd, reactionAdd, verificationRemove]);
      await queue.enqueueJob(revokeSignerPayload, Date.now() - DEFAULT_REVOKE_SIGNER_JOB_DELAY - 1000);
    });

    test('processes jobs and deletes messages from signer', async () => {
      const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
      const getMessages = () => getAllMessagesBySigner(db, fid, signerKey);
      expect(await getMessages()).toEqual([castAdd, reactionAdd, verificationRemove]);
      const result = await scheduler.doJobs();
      expect(result._unsafeUnwrap()).toEqual(undefined);
      expect(await getMessages()).toEqual([]);
    });
  });
});
