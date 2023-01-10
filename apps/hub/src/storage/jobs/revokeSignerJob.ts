import { RevokeSignerJobPayload, RevokeSignerJobPayloadT } from '@farcaster/flatbuffers';
import {
  bytesIncrement,
  bytesToNumber,
  HubAsyncResult,
  HubError,
  HubResult,
  numberToBytes,
  validations,
} from '@farcaster/utils';
import { blake3 } from '@noble/hashes/blake3';
import { Builder, ByteBuffer } from 'flatbuffers';
import { err, ok, ResultAsync } from 'neverthrow';
import cron from 'node-cron';
import AbstractRocksDB from 'rocksdb';
import { RootPrefix } from '~/flatbuffers/models/types';
import RocksDB from '~/storage/db/rocksdb';
import Engine from '~/storage/engine';
import { logger } from '~/utils/logger';

export const DEFAULT_REVOKE_SIGNER_JOB_DELAY = 1000 * 60 * 60; // 1 hour in ms
export const DEFAULT_REVOKE_SIGNER_JOB_CRON = '0 * * * *'; // Every hour

const log = logger.child({
  component: 'RevokeSignerJob',
});

type SchedulerStatus = 'started' | 'stopped';

export class RevokeSignerJobScheduler {
  private _queue: RevokeSignerJobQueue;
  private _engine: Engine;
  private _cronTask?: cron.ScheduledTask;

  constructor(queue: RevokeSignerJobQueue, engine: Engine) {
    this._queue = queue;
    this._engine = engine;
  }

  start(cronSchedule?: string) {
    this._cronTask = cron.schedule(cronSchedule ?? DEFAULT_REVOKE_SIGNER_JOB_CRON, () => {
      this.doJobs();
    });
  }

  stop() {
    if (this._cronTask) {
      this._cronTask.stop();
    }
  }

  status(): SchedulerStatus {
    return this._cronTask ? 'started' : 'stopped';
  }

  async doJobs(doBefore?: number): HubAsyncResult<void> {
    // If doBefore timestamp is missing, do all jobs before current timestamp
    if (!doBefore) {
      doBefore = Date.now();
    }

    log.info({ doBefore }, 'starting doJobs');

    let nextJob = await this._queue.popNextJob(doBefore);
    while (nextJob.isOk()) {
      const payload = nextJob.value;
      await this._engine.revokeMessagesBySigner(
        payload.fidArray() ?? new Uint8Array(),
        payload.signerArray() ?? new Uint8Array()
      );
      nextJob = await this._queue.popNextJob(doBefore);
    }

    return ok(undefined);
  }
}

export class RevokeSignerJobQueue {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
  }

  static jobKeyPrefix(): Buffer {
    return Buffer.from([RootPrefix.JobRevokeSigner]);
  }

  static jobKeyToTimestamp(key: Buffer): HubResult<number> {
    return bytesToNumber(new Uint8Array(key).subarray(1, 7), { endianness: 'big' });
  }

  static validatePayload(payload: RevokeSignerJobPayload): HubResult<RevokeSignerJobPayload> {
    const fidResult = validations.validateFid(payload.fidArray());
    if (fidResult.isErr()) {
      return err(fidResult.error);
    }

    const ethSignerResult = validations.validateEthAddress(payload.signerArray());
    const ed25519SignerResult = validations.validateEd25519PublicKey(payload.signerArray());
    if (ethSignerResult.isErr() && ed25519SignerResult.isErr()) {
      return err(new HubError('bad_request.validation_failure', 'signer is not a valid Ed25519 or Eth signer'));
    }

    return ok(payload);
  }

  static makePayload(fid: Uint8Array, signer: Uint8Array): HubResult<RevokeSignerJobPayload> {
    const fidResult = validations.validateFid(fid);
    if (fidResult.isErr()) {
      return err(fidResult.error);
    }

    const ethSignerResult = validations.validateEthAddress(signer);
    const ed25519SignerResult = validations.validateEd25519PublicKey(signer);
    if (ethSignerResult.isErr() && ed25519SignerResult.isErr()) {
      return err(new HubError('bad_request.validation_failure', 'signer is not a valid Ed25519 or Eth signer'));
    }

    const builder = new Builder(1);
    const payloadT = new RevokeSignerJobPayloadT(Array.from(fid), Array.from(signer));
    builder.finish(payloadT.pack(builder));
    const payload = RevokeSignerJobPayload.getRootAsRevokeSignerJobPayload(new ByteBuffer(builder.asUint8Array()));

    return ok(payload);
  }

  /**
   * makeJobKey constructs buffer for rocksdb key in the format:
   * - 1 byte for RevokeSignerJob prefix
   * - 6 bytes for timestamp
   * - 4 bytes for hash
   */
  static makeJobKey(doAt: number, hash?: Uint8Array): HubResult<Buffer> {
    const buffers: Buffer[] = [];

    // Add 1 byte prefix
    buffers.push(RevokeSignerJobQueue.jobKeyPrefix());

    // Add 6 byte doAt timestamp
    const doAtBytes = numberToBytes(doAt, { size: 6, endianness: 'big' });
    if (doAtBytes.isErr()) {
      return err(doAtBytes.error);
    }
    buffers.push(Buffer.from(doAtBytes.value));

    // Add 4 byte hash (if present)
    if (hash) {
      if (hash.length !== 4) {
        return err(new HubError('bad_request.invalid_param', 'hash must be 4 bytes'));
      }
      buffers.push(Buffer.from(hash));
    }

    // Combine buffers
    return ok(Buffer.concat(buffers));
  }

  /** Return rocksdb iterator for revoke signer jobs. If doBefore timestamp is missing, iterate over all jobs  */
  iterator(doBefore?: number): HubResult<AbstractRocksDB.Iterator> {
    const gte = RevokeSignerJobQueue.jobKeyPrefix();
    let lt: Buffer;
    if (doBefore) {
      const maxJobKey = RevokeSignerJobQueue.makeJobKey(doBefore);
      if (maxJobKey.isErr()) {
        return err(maxJobKey.error);
      }
      lt = maxJobKey.value;
    } else {
      lt = Buffer.from(bytesIncrement(new Uint8Array(gte)));
    }

    return ok(this._db.iterator({ gte, lt }));
  }

  async enqueueJob(payload: RevokeSignerJobPayload, doAt?: number): HubAsyncResult<Buffer> {
    // If doAt timestamp is missing, use default delay to calculate timestamp in future
    if (!doAt) {
      doAt = Date.now() + DEFAULT_REVOKE_SIGNER_JOB_DELAY;
    }

    // Create payload hash
    const hash = blake3(payload.bb?.bytes() ?? new Uint8Array(), { dkLen: 4 });

    // Create job key
    const key = RevokeSignerJobQueue.makeJobKey(doAt, hash);
    if (key.isErr()) {
      return err(key.error);
    }

    // Create value from payload
    const value = Buffer.from(payload.bb?.bytes() ?? new Uint8Array());

    // Save to rocksdb
    return (await ResultAsync.fromPromise(this._db.put(key.value, value), (e) => e as HubError)).asyncMap(
      async () => key.value
    );
  }

  async popNextJob(doBefore?: number): HubAsyncResult<RevokeSignerJobPayload> {
    const iterator = this.iterator(doBefore);
    if (iterator.isErr()) {
      return err(iterator.error);
    }
    return new Promise((resolve) => {
      iterator.value.next(async (e: Error | undefined, key: AbstractRocksDB.Bytes, value: AbstractRocksDB.Bytes) => {
        if (e) {
          resolve(err(new HubError('unknown', e as Error)));
        } else if (!key && !value) {
          resolve(err(new HubError('not_found', 'record not found')));
        } else {
          const payload = RevokeSignerJobPayload.getRootAsRevokeSignerJobPayload(
            new ByteBuffer(new Uint8Array(value as Buffer))
          );
          // Delete job from rocksdb to prevent it from being done multiple times
          await this._db.del(key as Buffer);
          resolve(ok(payload));
        }
      });
    });
  }

  async getAllJobs(doBefore?: number): HubAsyncResult<[number, RevokeSignerJobPayload][]> {
    const jobs: [number, RevokeSignerJobPayload][] = [];
    const iterator = this.iterator(doBefore);
    if (iterator.isErr()) {
      return err(iterator.error);
    }
    for await (const [key, value] of iterator.value) {
      const timestamp = RevokeSignerJobQueue.jobKeyToTimestamp(key as Buffer);
      const payload = RevokeSignerJobPayload.getRootAsRevokeSignerJobPayload(
        new ByteBuffer(new Uint8Array(value as Buffer))
      );
      if (timestamp.isOk()) {
        jobs.push([timestamp.value, payload]);
      }
    }
    return ok(jobs);
  }
}
