import * as protobufs from '@farcaster/protobufs';
import {
  bytesIncrement,
  bytesToUtf8String,
  fromFarcasterTime,
  HubAsyncResult,
  HubError,
  HubResult,
  toFarcasterTime,
  validations,
} from '@farcaster/utils';
import { blake3 } from '@noble/hashes/blake3';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import AbstractRocksDB from 'rocksdb';
import { TypedEmitter } from 'tiny-typed-emitter';
import { EthEventsProvider } from '~/eth/ethEventsProvider';
import RocksDB from '~/storage/db/rocksdb';
import { logger, nameRegistryEventToLog } from '~/utils/logger';
import { getNameRegistryEvent, putNameRegistryEvent } from '../db/nameRegistryEvent';
import { RootPrefix } from '../db/types';

export type JobQueueEvents = {
  enqueueJob: (jobKey: Buffer) => void;
};

export class UpdateNameRegistryEventExpiryJobWorker {
  private _queue: UpdateNameRegistryEventExpiryJobQueue;
  private _db: RocksDB;
  private _ethEventsProvider: EthEventsProvider;
  private _status: 'working' | 'waiting';

  constructor(queue: UpdateNameRegistryEventExpiryJobQueue, db: RocksDB, ethEventsProvider: EthEventsProvider) {
    this._queue = queue;
    this._db = db;
    this._ethEventsProvider = ethEventsProvider;
    this._status = 'waiting';

    this._queue.on('enqueueJob', () => this.processJobs());
  }

  async processJobs(): HubAsyncResult<void> {
    if (this._status === 'working') {
      return err(new HubError('unavailable', 'worker is already processing jobs'));
    }
    const log = logger.child({ component: 'UpdateNameRegistryEventExpiryJobWorker' });
    log.info('UpdateNameRegistryEventExpiryJobWorker starting');
    this._status = 'working';
    let nextJob = await this._queue.popNextJob();
    while (nextJob.isOk()) {
      const result = await this.processJob(nextJob.value);
      result.match(
        (event) => {
          log.info(
            { event: nameRegistryEventToLog(event) },
            `updated ${bytesToUtf8String(event.fname)._unsafeUnwrap()} expiry to ${fromFarcasterTime(event.expiry)}`
          );
        },
        (e) => {
          log.error(e, `error updating expiry for ${bytesToUtf8String(nextJob._unsafeUnwrap().fname)._unsafeUnwrap()}`);
        }
      );
      nextJob = await this._queue.popNextJob();
    }
    this._status = 'waiting';
    log.info('UpdateNameRegistryEventExpiryJobWorker stopping');
    return ok(undefined);
  }

  private async processJob(
    payload: protobufs.UpdateNameRegistryEventExpiryJobPayload
  ): HubAsyncResult<protobufs.NameRegistryEvent> {
    const eventResult = await ResultAsync.fromPromise(
      getNameRegistryEvent(this._db, payload.fname),
      (e) => e as HubError
    );
    if (eventResult.isErr()) {
      return err(eventResult.error);
    }

    const expiryResult = await this._ethEventsProvider.getFnameExpiry(payload.fname);
    if (expiryResult.isErr()) {
      return err(expiryResult.error);
    }

    const farcasterTimeExpiry = toFarcasterTime(expiryResult.value);
    if (farcasterTimeExpiry.isErr()) {
      return err(farcasterTimeExpiry.error);
    }

    const updatedEvent: protobufs.NameRegistryEvent = { ...eventResult.value, expiry: farcasterTimeExpiry.value };
    const result = await ResultAsync.fromPromise(putNameRegistryEvent(this._db, updatedEvent), (e) => e as HubError);
    if (result.isErr()) {
      return err(result.error);
    }

    return ok(updatedEvent);
  }
}

export class UpdateNameRegistryEventExpiryJobQueue extends TypedEmitter<JobQueueEvents> {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    super();
    this._db = db;
  }

  static jobKeyPrefix(): Buffer {
    return Buffer.from([RootPrefix.JobRevokeSigner]);
  }

  static jobKeyToTimestamp(key: Buffer): HubResult<number> {
    return ok(Number(key.readBigUint64BE(1)));
  }

  static validatePayload(
    payload: protobufs.UpdateNameRegistryEventExpiryJobPayload
  ): HubResult<protobufs.UpdateNameRegistryEventExpiryJobPayload> {
    const fnameResult = validations.validateFname(payload.fname);
    if (fnameResult.isErr()) {
      return err(fnameResult.error);
    }

    return ok(payload);
  }

  static makePayload(fname: Uint8Array): HubResult<protobufs.UpdateNameRegistryEventExpiryJobPayload> {
    const payload = protobufs.UpdateNameRegistryEventExpiryJobPayload.create({ fname });
    return UpdateNameRegistryEventExpiryJobQueue.validatePayload(payload);
  }

  /**
   * makeJobKey constructs buffer for rocksdb key in the format:
   * - 1 byte for UpdateNameRegistryEventExpiryJob prefix
   * - 8 bytes for timestamp
   * - 4 bytes for hash
   */
  static makeJobKey(doAt: number, hash?: Uint8Array): HubResult<Buffer> {
    const doAtBuffer = Buffer.alloc(8);
    doAtBuffer.writeBigUInt64BE(BigInt(doAt));

    if (hash && hash.length !== 4) {
      return err(new HubError('bad_request.invalid_param', 'hash must be 4 bytes'));
    }

    return ok(
      Buffer.concat([UpdateNameRegistryEventExpiryJobQueue.jobKeyPrefix(), doAtBuffer, Buffer.from(hash ?? '')])
    );
  }

  /** Return rocksdb iterator for revoke signer jobs. If doBefore timestamp is missing, iterate over all jobs  */
  iterator(doBefore?: number): HubResult<AbstractRocksDB.Iterator> {
    const gte = UpdateNameRegistryEventExpiryJobQueue.jobKeyPrefix();
    let lt: Buffer;
    if (doBefore) {
      const maxJobKey = UpdateNameRegistryEventExpiryJobQueue.makeJobKey(doBefore);
      if (maxJobKey.isErr()) {
        return err(maxJobKey.error);
      }
      lt = maxJobKey.value;
    } else {
      const nextKey = bytesIncrement(Uint8Array.from(gte));
      if (nextKey.isErr()) {
        return err(nextKey.error);
      }
      lt = Buffer.from(nextKey.value);
    }

    return ok(this._db.iterator({ gte, lt }));
  }

  async enqueueJob(payload: protobufs.UpdateNameRegistryEventExpiryJobPayload, doAt?: number): HubAsyncResult<Buffer> {
    // If doAt timestamp is missing, use current timestamp
    if (!doAt) {
      doAt = Date.now();
    }

    const payloadBytes = protobufs.UpdateNameRegistryEventExpiryJobPayload.encode(payload).finish();

    // Create payload hash
    const hash = blake3(Uint8Array.from(payloadBytes), { dkLen: 4 });

    // Create job key
    const key = UpdateNameRegistryEventExpiryJobQueue.makeJobKey(doAt, hash);
    if (key.isErr()) {
      return err(key.error);
    }

    // Save to rocksdb
    const result = await ResultAsync.fromPromise(
      this._db.put(key.value, Buffer.from(payloadBytes)),
      (e) => e as HubError
    );

    if (result.isErr()) {
      return err(result.error);
    }

    this.emit('enqueueJob', key.value);

    return ok(key.value);
  }

  async popNextJob(doBefore?: number): HubAsyncResult<protobufs.UpdateNameRegistryEventExpiryJobPayload> {
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
          const payload = Result.fromThrowable(
            () => protobufs.UpdateNameRegistryEventExpiryJobPayload.decode(Uint8Array.from(value as Buffer)),
            (err) =>
              new HubError('bad_request.parse_failure', {
                cause: err as Error,
                message: `Failed to parse UpdateNameRegistryEventExpiryJobPayload`,
              })
          )();
          // Delete job from rocksdb to prevent it from being done multiple times
          await this._db.del(key as Buffer);
          resolve(payload);
        }
      });
    });
  }

  async getAllJobs(doBefore?: number): HubAsyncResult<[number, protobufs.UpdateNameRegistryEventExpiryJobPayload][]> {
    const jobs: [number, protobufs.UpdateNameRegistryEventExpiryJobPayload][] = [];
    const iterator = this.iterator(doBefore);
    if (iterator.isErr()) {
      return err(iterator.error);
    }
    for await (const [key, value] of iterator.value) {
      const timestamp = UpdateNameRegistryEventExpiryJobQueue.jobKeyToTimestamp(key as Buffer);
      const payload = protobufs.UpdateNameRegistryEventExpiryJobPayload.decode(Uint8Array.from(value));
      if (timestamp.isOk()) {
        jobs.push([timestamp.value, payload]);
      }
    }
    return ok(jobs);
  }
}
