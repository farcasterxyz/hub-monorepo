import {
  bytesIncrement,
  HubAsyncResult,
  HubError,
  HubResult,
  RevokeMessagesBySignerJobPayload,
} from "@farcaster/hub-nodejs";
import { blake3 } from "@noble/hashes/blake3";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { TypedEmitter } from "tiny-typed-emitter";
import RocksDB, { RocksDbIteratorOptions } from "../db/rocksdb.js";
import { logger } from "../../utils/logger.js";
import { RootPrefix } from "../db/types.js";
import Engine from "../engine/index.js";

export type JobQueueEvents = {
  enqueueJob: (jobKey: Buffer) => void;
};

export class RevokeMessagesBySignerJobWorker {
  private _queue: RevokeMessagesBySignerJobQueue;
  private _db: RocksDB;
  private _engine: Engine;
  private _status: "working" | "waiting";
  private _processJobs: () => Promise<void>;

  constructor(queue: RevokeMessagesBySignerJobQueue, db: RocksDB, engine: Engine) {
    this._queue = queue;
    this._db = db;
    this._engine = engine;
    this._status = "waiting";

    this._processJobs = async () => {
      await this.processJobs();
    };
  }

  start() {
    this._queue.on("enqueueJob", this._processJobs);
  }

  stop() {
    this._queue.off("enqueueJob", this._processJobs);
  }

  async processJobs(doBefore?: number): HubAsyncResult<void> {
    const doBeforeTs = doBefore || Date.now() + 500; // Add a 500ms buffer for tests
    if (this._status === "working") {
      return err(new HubError("unavailable", "worker is already processing jobs"));
    }

    const log = logger.child({ component: "RevokeMessagesBySignerJobWorker" });
    log.info("RevokeMessagesBySignerJobWorker starting");

    this._status = "working";

    let nextJob = await this._queue.popNextJob(doBeforeTs);
    while (nextJob.isOk()) {
      await this.processJob(nextJob.value);

      nextJob = await this._queue.popNextJob(doBeforeTs);
    }

    this._status = "waiting";
    log.info("RevokeMessagesBySignerJobWorker stopping");
    return ok(undefined);
  }

  private async processJob(payload: RevokeMessagesBySignerJobPayload): HubAsyncResult<void> {
    return this._engine.revokeMessagesBySigner(payload.fid, payload.signer);
  }
}

export class RevokeMessagesBySignerJobQueue extends TypedEmitter<JobQueueEvents> {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    super();
    this._db = db;
  }

  static jobKeyPrefix(): Buffer {
    return Buffer.from([RootPrefix.JobRevokeMessageBySigner]);
  }

  /**
   * makeJobKey constructs buffer for rocksdb key in the format:
   * - 1 byte for RevokeMessagesBySignerJob prefix
   * - 8 bytes for timestamp
   * - 4 bytes for hash
   */
  static makeJobKey(doAt: number, hash?: Uint8Array): HubResult<Buffer> {
    const doAtBuffer = Buffer.alloc(8);
    doAtBuffer.writeBigUInt64BE(BigInt(doAt));

    if (hash && hash.length !== 4) {
      return err(new HubError("bad_request.invalid_param", "hash must be 4 bytes"));
    }

    return ok(Buffer.concat([RevokeMessagesBySignerJobQueue.jobKeyPrefix(), doAtBuffer, Buffer.from(hash ?? "")]));
  }

  /** Return rocksdb iterator for revoke signer jobs. If doBefore timestamp is missing, iterate over all jobs  */
  iteratorOpts(doBefore?: number): HubResult<RocksDbIteratorOptions> {
    const gte = RevokeMessagesBySignerJobQueue.jobKeyPrefix();
    let lt: Buffer;
    if (doBefore) {
      const maxJobKey = RevokeMessagesBySignerJobQueue.makeJobKey(doBefore);
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

    return ok({ gte, lt });
  }

  async enqueueJob(payload: RevokeMessagesBySignerJobPayload, doAt?: number): HubAsyncResult<Buffer> {
    // If doAt timestamp is missing, use current timestamp
    const doAtTimestamp = doAt ? doAt : Date.now();

    const payloadBytes = RevokeMessagesBySignerJobPayload.encode(payload).finish();

    // Create payload hash
    const hash = blake3(Uint8Array.from(payloadBytes), { dkLen: 4 });

    // Create job key
    const key = RevokeMessagesBySignerJobQueue.makeJobKey(doAtTimestamp, hash);
    if (key.isErr()) {
      return err(key.error);
    }

    // Save to rocksdb
    const result = await ResultAsync.fromPromise(
      this._db.put(key.value, Buffer.from(payloadBytes)),
      (e) => e as HubError,
    );

    if (result.isErr()) {
      return err(result.error);
    }

    if (doAt) {
      setTimeout(() => {
        this.emit("enqueueJob", key.value);
      }, doAt - Date.now() + 1000);
    } else {
      this.emit("enqueueJob", key.value);
    }

    return ok(key.value);
  }

  async popNextJob(doBefore?: number): HubAsyncResult<RevokeMessagesBySignerJobPayload> {
    const iteratorOpts = this.iteratorOpts(doBefore);
    if (iteratorOpts.isErr()) {
      return err(iteratorOpts.error);
    }

    let nextKey: Buffer | undefined;
    let nextValue: Buffer | undefined;
    await this._db.forEachIteratorByOpts(iteratorOpts.value, (key, value) => {
      nextKey = key;
      nextValue = value;
      return true; // Finish the itearation after the first key-value pair
    });

    if (!nextKey || !nextValue) {
      return err(new HubError("not_found", "No jobs found"));
    }

    const payload = Result.fromThrowable(
      () => RevokeMessagesBySignerJobPayload.decode(Uint8Array.from(nextValue as Buffer)),
      (err) =>
        new HubError("bad_request.parse_failure", {
          cause: err as Error,
          message: "Failed to parse RevokeMessagesBySignerJobPayload",
        }),
    )();

    // Delete job from rocksdb to prevent it from being done multiple times
    await this._db.del(nextKey as Buffer);

    return payload;
  }
}
