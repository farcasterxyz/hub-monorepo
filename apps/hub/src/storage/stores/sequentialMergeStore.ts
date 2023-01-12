import { HubAsyncResult, HubError, HubResult } from '@farcaster/utils';
import { err, ok, ResultAsync } from 'neverthrow';
import { TypedEmitter } from 'tiny-typed-emitter';
import MessageModel from '~/flatbuffers/models/messageModel';

const MIN_NONCE = 1;
const MERGE_TIMEOUT = 2 * 1000; // 2 seconds

export type MergeProcessingEvents = {
  processed: (messageId: string, result?: HubResult<void>) => void;
};

abstract class SequentialMergeStore extends TypedEmitter<MergeProcessingEvents> {
  protected _mergeLastTimestamp: number;
  protected _mergeLastNonce: number;
  protected _mergeIdsQueue: string[];
  protected _mergeIdsStore: Map<string, MessageModel>;
  protected _mergeIsProcessing: boolean;

  protected abstract mergeFromSequentialQueue(message: MessageModel): Promise<void>;

  constructor() {
    super();

    this._mergeLastTimestamp = Date.now();
    this._mergeLastNonce = MIN_NONCE;
    this._mergeIdsQueue = [];
    this._mergeIdsStore = new Map();
    this._mergeIsProcessing = false;
  }

  /**
   * mergeSequential enqueues a given message for merging and returns a promise that will
   * resolve once the merge has been processed
   */
  protected mergeSequential(message: MessageModel): HubAsyncResult<void> {
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
      const listenForMerge = (mergedId: string) => {
        if (mergedId === mergeId) {
          clearTimeout(timeoutId);
          resolve(ok(undefined));
        }
      };
      this.on('processed', listenForMerge);

      const timeoutId = setTimeout(() => {
        // Remove listener and remove message from store, which will prevent it from being processed
        this.off('processed', listenForMerge);
        this._mergeIdsStore.delete(mergeId);
      }, MERGE_TIMEOUT);
    });
  }

  protected async processMerges(): HubAsyncResult<void> {
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

  protected async processMergeId(nextMergeId?: string): HubAsyncResult<void> {
    // If mergeId is missing, return not found
    if (!nextMergeId) {
      return err(new HubError('not_found', 'next mergeId not found'));
    }

    // Get message for next mergeId
    const nextMessage = this._mergeIdsStore.get(nextMergeId);

    // Delete processed merge from store immediately, so it doesn't leak memory if the merge is cancelled
    this._mergeIdsStore.delete(nextMergeId);

    // If message is missing, it means the merge was cancelled, so no-op
    if (!nextMessage) {
      return ok(undefined);
    }

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
