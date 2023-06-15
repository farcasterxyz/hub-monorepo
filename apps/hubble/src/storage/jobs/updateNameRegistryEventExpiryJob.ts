import {
  bytesIncrement,
  bytesToUtf8String,
  fromFarcasterTime,
  HubAsyncResult,
  HubError,
  HubResult,
  NameRegistryEvent,
  toFarcasterTime,
  UpdateNameRegistryEventExpiryJobPayload,
  validations,
} from '@farcaster/hub-nodejs';
import { blake3 } from '@noble/hashes/blake3';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import { TypedEmitter } from 'tiny-typed-emitter';
import { EthEventsProvider } from '../../eth/ethEventsProvider.js';
import RocksDB, { Iterator } from '../db/rocksdb.js';
import { logger, nameRegistryEventToLog } from '../../utils/logger.js';
import { getNameRegistryEvent, putNameRegistryEvent } from '../db/nameRegistryEvent.js';
import { RootPrefix } from '../db/types.js';

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

    this.processJobs = this.processJobs.bind(this);
  }

  start() {
    this._queue.on('enqueueJob', this.processJobs);
  }

  stop() {
    this._queue.off('enqueueJob', this.processJobs);
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
            `updated ${bytesToUtf8String(event.fname)._unsafeUnwrap()} expiry to ${fromFarcasterTime(
              event.expiry
            )._unsafeUnwrap()}`
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

  private async processJob(payload: UpdateNameRegistryEventExpiryJobPayload): HubAsyncResult<NameRegistryEvent> {
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

    const updatedEvent: NameRegistryEvent = { ...eventResult.value, expiry: farcasterTimeExpiry.value };
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
    return Buffer.from([RootPrefix.JobUpdateNameExpiry]);
  }

  static jobKeyToTimestamp(key: Buffer): HubResult<number> {
    return ok(Number(key.readBigUint64BE(1)));
  }

  static validatePayload(
    payload: UpdateNameRegistryEventExpiryJobPayload
  ): HubResult<UpdateNameRegistryEventExpiryJobPayload> {
    const fnameResult = validations.validateFname(payload.fname);
    if (fnameResult.isErr()) {
      return err(fnameResult.error);
    }

    return ok(payload);
  }

  static makePayload(fname: Uint8Array): HubResult<UpdateNameRegistryEventExpiryJobPayload> {
    const payload = UpdateNameRegistryEventExpiryJobPayload.create({ fname });
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
  iterator(doBefore?: number): HubResult<Iterator> {
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

  async enqueueJob(payload: UpdateNameRegistryEventExpiryJobPayload, doAt?: number): HubAsyncResult<Buffer> {
    // If doAt timestamp is missing, use current timestamp
    if (!doAt) {
      doAt = Date.now();
    }

    const payloadBytes = UpdateNameRegistryEventExpiryJobPayload.encode(payload).finish();

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

  async popNextJob(doBefore?: number): HubAsyncResult<UpdateNameRegistryEventExpiryJobPayload> {
    const iterator = this.iterator(doBefore);
    if (iterator.isErr()) {
      return err(iterator.error);
    }

    const result = await ResultAsync.fromPromise(iterator.value.next(), (e) => e as HubError);
    if (result.isErr()) {
      await iterator.value.end();
      return err(result.error);
    }

    const [key, value] = result.value;

    const payload = Result.fromThrowable(
      () => UpdateNameRegistryEventExpiryJobPayload.decode(Uint8Array.from(value as Buffer)),
      (err) =>
        new HubError('bad_request.parse_failure', {
          cause: err as Error,
          message: `Failed to parse UpdateNameRegistryEventExpiryJobPayload`,
        })
    )();

    // clear rocksdb iterator
    await iterator.value.end();
    // Delete job from rocksdb to prevent it from being done multiple times
    await this._db.del(key as Buffer);

    return payload;
  }

  async getAllJobs(doBefore?: number): HubAsyncResult<[number, UpdateNameRegistryEventExpiryJobPayload][]> {
    const jobs: [number, UpdateNameRegistryEventExpiryJobPayload][] = [];
    const iterator = this.iterator(doBefore);
    if (iterator.isErr()) {
      return err(iterator.error);
    }
    for await (const [key, value] of iterator.value) {
      const timestamp = UpdateNameRegistryEventExpiryJobQueue.jobKeyToTimestamp(key as Buffer);
      const payload = UpdateNameRegistryEventExpiryJobPayload.decode(Uint8Array.from(value as Buffer));
      if (timestamp.isOk()) {
        jobs.push([timestamp.value, payload]);
      }
    }
    return ok(jobs);
  }
}
