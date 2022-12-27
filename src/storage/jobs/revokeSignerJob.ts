import { utils } from 'ethers';
import { Builder, ByteBuffer } from 'flatbuffers';
import { err, ok, ResultAsync } from 'neverthrow';
import AbstractRocksDB from 'rocksdb';
import { RevokeSignerJobPayload, RevokeSignerJobPayloadT } from '~/flatbuffers/generated/job_generated';
import { RootPrefix } from '~/flatbuffers/models/types';
import { validateEd25519PublicKey, validateEthAddress, validateFid } from '~/flatbuffers/models/validations';
import { bigEndianBytesToNumber, bytesIncrement } from '~/flatbuffers/utils/bytes';
import RocksDB from '~/storage/db/rocksdb';
import Engine from '~/storage/engine';
import { HubAsyncResult, HubError, HubResult } from '~/utils/hubErrors';
import { logger } from '~/utils/logger';

export const DEFAULT_REVOKE_SIGNER_JOB_DELAY = 1000 * 60 * 60; // 1 hour in ms
export const DEFAULT_REVOKE_SIGNER_JOB_CRON = '0 * * * *'; // Every hour

const log = logger.child({
  component: 'RevokeSignerJob',
});

class RevokeSignerJob {
  static jobKey(doAt?: number): Buffer {
    return Buffer.concat([
      Buffer.from([RootPrefix.JobRevokeSigner]),
      doAt ? Buffer.from(utils.arrayify(doAt)) : new Uint8Array(), // arrayify uses big endian for ordering
    ]);
  }

  static jobKeyToTimestamp(key: Buffer): number {
    return bigEndianBytesToNumber(new Uint8Array(key).subarray(1));
  }

  static validatePayload(payload: RevokeSignerJobPayload): HubResult<RevokeSignerJobPayload> {
    const fidResult = validateFid(payload.fidArray());
    if (fidResult.isErr()) {
      return err(fidResult.error);
    }

    const ethSignerResult = validateEthAddress(payload.signerArray());
    const ed25519SignerResult = validateEd25519PublicKey(payload.signerArray());
    if (ethSignerResult.isErr() && ed25519SignerResult.isErr()) {
      return err(new HubError('bad_request.validation_failure', 'signer is not a valid Ed25519 or Eth signer'));
    }

    return ok(payload);
  }

  static makePayload(fid: Uint8Array, signer: Uint8Array): HubResult<RevokeSignerJobPayload> {
    const fidResult = validateFid(fid);
    if (fidResult.isErr()) {
      return err(fidResult.error);
    }

    const ethSignerResult = validateEthAddress(signer);
    const ed25519SignerResult = validateEd25519PublicKey(signer);
    if (ethSignerResult.isErr() && ed25519SignerResult.isErr()) {
      return err(new HubError('bad_request.validation_failure', 'signer is not a valid Ed25519 or Eth signer'));
    }

    const builder = new Builder(1);
    const payloadT = new RevokeSignerJobPayloadT(Array.from(fid), Array.from(signer));
    builder.finish(payloadT.pack(builder));
    const payload = RevokeSignerJobPayload.getRootAsRevokeSignerJobPayload(new ByteBuffer(builder.asUint8Array()));

    return ok(payload);
  }

  static async enqueueJob(db: RocksDB, payload: RevokeSignerJobPayload, doAt?: number): HubAsyncResult<void> {
    /** If doAt timestamp is missing, use default delay to calculate timestamp in future */
    if (!doAt) {
      doAt = Date.now() + DEFAULT_REVOKE_SIGNER_JOB_DELAY;
    }
    const key = RevokeSignerJob.jobKey(doAt);
    const value = Buffer.from(payload.bb?.bytes() ?? new Uint8Array());
    return ResultAsync.fromPromise(db.put(key, value), (e) => e as HubError);
  }

  /** Return rocksdb iterator for revoke signer jobs. If doBefore timestamp is missing, iterate over all jobs  */
  static iterator(db: RocksDB, doBefore?: number): AbstractRocksDB.Iterator {
    const gte = RevokeSignerJob.jobKey();
    const lt = doBefore ? RevokeSignerJob.jobKey(doBefore) : Buffer.from(bytesIncrement(new Uint8Array(gte)));
    return db.iterator({ gte, lt });
  }

  static popNextJob(db: RocksDB, doBefore?: number): HubAsyncResult<RevokeSignerJobPayload> {
    const iterator = RevokeSignerJob.iterator(db, doBefore);
    return new Promise((resolve) => {
      iterator.next(async (e: Error | undefined, key: AbstractRocksDB.Bytes, value: AbstractRocksDB.Bytes) => {
        if (e) {
          resolve(err(new HubError('unknown', e as Error)));
        } else if (!key && !value) {
          resolve(err(new HubError('not_found', 'record not found')));
        } else {
          const payload = RevokeSignerJobPayload.getRootAsRevokeSignerJobPayload(
            new ByteBuffer(new Uint8Array(value as Buffer))
          );
          /** Delete job from rocksdb to prevent it from being done multiple times */
          db.del(key as Buffer);
          resolve(ok(payload));
        }
      });
    });
  }

  static async doJobs(db: RocksDB, engine: Engine, doBefore?: number): HubAsyncResult<void> {
    /** If doBefore timestamp is missing, do all jobs before current timestamp */
    if (!doBefore) {
      doBefore = Date.now();
    }

    log.info({ doBefore }, 'starting doJobs');

    let nextJob = await RevokeSignerJob.popNextJob(db, doBefore);
    while (nextJob.isOk()) {
      const payload = nextJob.value;
      await engine.revokeMessagesBySigner(
        payload.fidArray() ?? new Uint8Array(),
        payload.signerArray() ?? new Uint8Array()
      );
      nextJob = await RevokeSignerJob.popNextJob(db, doBefore);
    }

    return ok(undefined);
  }

  static async getAllJobs(db: RocksDB, doBefore?: number): HubAsyncResult<[number, RevokeSignerJobPayload][]> {
    const jobs: [number, RevokeSignerJobPayload][] = [];
    const iterator = RevokeSignerJob.iterator(db, doBefore);
    for await (const [key, value] of iterator) {
      const timestamp = RevokeSignerJob.jobKeyToTimestamp(key as Buffer);
      const payload = RevokeSignerJobPayload.getRootAsRevokeSignerJobPayload(
        new ByteBuffer(new Uint8Array(value as Buffer))
      );
      jobs.push([timestamp, payload]);
    }
    return ok(jobs);
  }
}

export default RevokeSignerJob;
