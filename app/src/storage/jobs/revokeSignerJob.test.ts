import { RevokeSignerJobPayload } from '@hub/flatbuffers';
import Factories from '~/flatbuffers/factories';
import MessageModel from '~/flatbuffers/models/messageModel';
import { AmpAddModel, CastAddModel, KeyPair, VerificationRemoveModel } from '~/flatbuffers/models/types';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { seedSigner } from '~/storage/engine/seed';
import {
  DEFAULT_REVOKE_SIGNER_JOB_DELAY,
  RevokeSignerJobQueue,
  RevokeSignerJobScheduler,
} from '~/storage/jobs/revokeSignerJob';
import { generateEd25519KeyPair } from '~/utils/crypto';
import { HubError } from '~/utils/hubErrors';

const db = jestRocksDB('jobs.revokeSignerJob.test');

const queue = new RevokeSignerJobQueue(db);
const engine = new Engine(db);
const scheduler = new RevokeSignerJobScheduler(queue, engine);

// Test payloads
let payload: RevokeSignerJobPayload;
let payload2: RevokeSignerJobPayload;
let payload3: RevokeSignerJobPayload;

// Integration test data
const fid = Factories.FID.build();
let signer: KeyPair;
let revokeSignerPayload: RevokeSignerJobPayload;
let castAdd: CastAddModel;
let ampAdd: AmpAddModel;
let verificationRemove: VerificationRemoveModel;

beforeAll(async () => {
  // Test payloads
  payload = await Factories.RevokeSignerJobPayload.create();
  payload2 = await Factories.RevokeSignerJobPayload.create();
  payload3 = await Factories.RevokeSignerJobPayload.create();

  // Integration test data
  signer = await generateEd25519KeyPair();
  revokeSignerPayload = RevokeSignerJobQueue.makePayload(fid, signer.publicKey)._unsafeUnwrap();

  const castAddData = await Factories.CastAddData.create({ fid: Array.from(fid) });
  castAdd = new MessageModel(
    await Factories.Message.create(
      { data: Array.from(castAddData.bb?.bytes() ?? new Uint8Array()) },
      { transient: { signer } }
    )
  ) as CastAddModel;

  const ampAddData = await Factories.AmpAddData.create({ fid: Array.from(fid) });
  ampAdd = new MessageModel(
    await Factories.Message.create(
      { data: Array.from(ampAddData.bb?.bytes() ?? new Uint8Array()) },
      { transient: { signer } }
    )
  ) as AmpAddModel;

  const verificationRemoveData = await Factories.VerificationRemoveData.create({ fid: Array.from(fid) });
  verificationRemove = new MessageModel(
    await Factories.Message.create(
      { data: Array.from(verificationRemoveData.bb?.bytes() ?? new Uint8Array()) },
      { transient: { signer } }
    )
  ) as VerificationRemoveModel;
});

beforeEach(async () => {
  await seedSigner(engine, fid, signer.publicKey);
});

describe('jobKeyToTimestamp', () => {
  test('extracts doAt timestamp from key', () => {
    const timestamp = Date.now();
    const hash = Factories.Bytes.build({}, { transient: { length: 4 } });
    const jobKey = RevokeSignerJobQueue.makeJobKey(timestamp, hash);
    const recoveredTimestamp = RevokeSignerJobQueue.jobKeyToTimestamp(jobKey._unsafeUnwrap());
    expect(recoveredTimestamp._unsafeUnwrap()).toEqual(timestamp);
  });
});

describe('makePayload', () => {
  test('makes flatbuffer RevokeSignerJobPayload', () => {
    const newPayload = RevokeSignerJobQueue.makePayload(
      payload.fidArray() ?? new Uint8Array(),
      payload.signerArray() ?? new Uint8Array()
    );
    expect(newPayload._unsafeUnwrap()).toEqual(payload);
  });

  test('fails with invalid fid', () => {
    const newPayload = RevokeSignerJobQueue.makePayload(new Uint8Array(), payload.signerArray() ?? new Uint8Array());
    expect(newPayload._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });

  test('fails with invalid signer', () => {
    const newPayload = RevokeSignerJobQueue.makePayload(payload.fidArray() ?? new Uint8Array(), new Uint8Array());
    expect(newPayload._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'signer is not a valid Ed25519 or Eth signer')
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
    expect(jobs._unsafeUnwrap()).toEqual([[timestamp, payload]]);
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
      await engine.mergeMessages([castAdd, ampAdd, verificationRemove]);
      await queue.enqueueJob(revokeSignerPayload, Date.now() - DEFAULT_REVOKE_SIGNER_JOB_DELAY - 1000);
    });

    test('processes jobs and deletes messages from signer', async () => {
      const getMessages = () => MessageModel.getAllBySigner(db, fid, signer.publicKey);
      expect(await getMessages()).toEqual([castAdd, ampAdd, verificationRemove]);
      const result = await scheduler.doJobs();
      expect(result._unsafeUnwrap()).toEqual(undefined);
      expect(await getMessages()).toEqual([]);
    });
  });
});
