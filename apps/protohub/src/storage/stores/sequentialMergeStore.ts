import * as protobufs from '@farcaster/protobufs';
import { HubAsyncResult, HubError, HubResult } from '@farcaster/protoutils';
import { err, ok, ResultAsync } from 'neverthrow';
import { TypedEmitter } from 'tiny-typed-emitter';

const MIN_NONCE = 1;
const MERGE_TIMEOUT = 2 * 1000; // 2 seconds

export type MergeProcessingEvents = {
  processed: (messageId: string, result?: HubResult<void>) => void;
};

abstract class SequentialMergeStore extends TypedEmitter<MergeProcessingEvents> {
  protected _mergeLastTimestamp: number;
  protected _mergeLastNonce: number;
  protected _mergeIdsQueue: string[];
  protected _mergeIdsStore: Map<string, protobufs.Message>;
  protected _mergeIsProcessing: boolean;

  protected abstract mergeFromSequentialQueue(message: protobufs.Message): Promise<void>;

  constructor() {
    super();

    this._mergeLastTimestamp = Date.now();
    this._mergeLastNonce = MIN_NONCE;
    this._mergeIdsQueue = [];
    this._mergeIdsStore = new Map();
    this._mergeIsProcessing = false;
    this.setMaxListeners(1_000);
  }

  /**
   * mergeSequential enqueues a given message for merging and returns a promise that will
   * resolve once the merge has been processed
   */
  protected mergeSequential(message: protobufs.Message): HubAsyncResult<void> {
    // Create mergeId
    const mergeId = this.makeNewMergeId();

    // Enqueue message with mergeId
    this._mergeIdsStore.set(mergeId, message);
    this._mergeIdsQueue.push(mergeId);

    // Start processing merges if not already
    if (!this._mergeIsProcessing) {
      this.processMerges();
    }

    // Return promise that resolves once the merge is processed
    return new Promise((resolve) => {
      const listenForMerge = (mergedId: string, mergeResult?: HubResult<void>) => {
        if (mergedId === mergeId) {
          clearTimeout(timeoutId);
          this.off('processed', listenForMerge);
          resolve(mergeResult ?? ok(undefined));
        }
      };
      this.on('processed', listenForMerge);

      const timeoutId = setTimeout(() => {
        // Remove listener and remove message from store, which will prevent it from being processed
        this.off('processed', listenForMerge);
        this._mergeIdsStore.delete(mergeId);
        resolve(err(new HubError('unavailable.storage_failure', 'mergeSequential timed out')));
      }, MERGE_TIMEOUT);
    });
  }

  private async processMerges(): HubAsyncResult<void> {
    this._mergeIsProcessing = true;

    while (this._mergeIdsQueue.length > 0) {
      // Move to the next mergeId in the queue
      const nextMergeId = this._mergeIdsQueue.shift();

      const result = await this.processMergeId(nextMergeId);
      if (result.isErr()) {
        this._mergeIsProcessing = false;
        return err(result.error);
      }
    }

    this._mergeIsProcessing = false;
    return ok(undefined);
  }

  private async processMergeId(nextMergeId?: string): HubAsyncResult<void> {
    // If mergeId is missing, return not found
    if (!nextMergeId) {
      return err(new HubError('not_found', 'next mergeId not found'));
    }

    // Get message for next mergeId
    const nextMessage = this._mergeIdsStore.get(nextMergeId);

    // If message is missing, it means the merge was cancelled, so no-op
    if (!nextMessage) {
      return ok(undefined);
    }

    // Delete processed merge from store immediately, so it doesn't leak memory if the merge is cancelled
    this._mergeIdsStore.delete(nextMergeId);

    // Process merge and emit event with result
    const mergeResult = await ResultAsync.fromPromise(this.mergeFromSequentialQueue(nextMessage), (e) => e as HubError);
    this.emit('processed', nextMergeId, mergeResult);

    return ok(undefined);
  }

  /**
   * Generate unique mergeId using timestamp and nonce
   */
  private makeNewMergeId(): string {
    const timestamp = Date.now();
    if (timestamp === this._mergeLastTimestamp) {
      this._mergeLastNonce += 1;
    } else {
      this._mergeLastTimestamp = timestamp;
      this._mergeLastNonce = MIN_NONCE;
    }
    return `${this._mergeLastTimestamp}:${this._mergeLastNonce}`;
  }
}

export default SequentialMergeStore;
