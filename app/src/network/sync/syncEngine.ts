import { utf8StringToBytes } from '@hub/bytes';
import { HubError, HubResult } from '@hub/errors';
import { err } from 'neverthrow';
import MessageModel from '~/flatbuffers/models/messageModel';
import { getFarcasterTime } from '~/flatbuffers/utils/time';
import { MerkleTrie, NodeMetadata } from '~/network/sync/merkleTrie';
import { SyncId, timestampToPaddedTimestampPrefix } from '~/network/sync/syncId';
import { TrieSnapshot } from '~/network/sync/trieNode';
import Client from '~/rpc/client';
import Engine from '~/storage/engine';
import { logger } from '~/utils/logger';

// Number of seconds to wait for the network to "settle" before syncing. We will only
// attempt to sync messages that are older than this time.
const SYNC_THRESHOLD_IN_SECONDS = 10;
const HASHES_PER_FETCH = 50;

const log = logger.child({
  component: 'SyncEngine',
});

class SyncEngine {
  private readonly _trie: MerkleTrie;
  private readonly engine: Engine;
  private _isSyncing = false;

  constructor(engine: Engine) {
    this._trie = new MerkleTrie();
    this.engine = engine;

    this.engine.eventHandler.on('mergeMessage', async (message) => {
      this.addMessage(message);
    });

    // Note: There's no guarantee that the message is actually deleted, because the transaction could fail.
    // This is fine, because we'll just end up syncing the message again. It's much worse to miss a removal and cause
    // the trie to diverge in a way that's not recoverable without reconstructing it from the db.
    // Order of events does not matter. The trie will always converge to the same state.
    this.engine.eventHandler.on('pruneMessage', async (message) => {
      this.removeMessage(message);
    });
    this.engine.eventHandler.on('revokeMessage', async (message) => {
      this.removeMessage(message);
    });
  }

  public async initialize() {
    // TODO: cache the trie to disk, and use this only when the cache doesn't exist
    let processedMessages = 0;
    await this.engine.forEachMessage((message) => {
      this.addMessage(message);
      processedMessages += 1;
      if (processedMessages % 10_000 === 0) {
        log.info({ processedMessages }, 'Initializing sync engine');
      }
    });
    log.info({ processedMessages }, 'Sync engine initialized');
  }

  /** ---------------------------------------------------------------------------------- */
  /**                                      Sync Methods                                  */
  /** ---------------------------------------------------------------------------------- */

  public shouldSync(excludedHashes: string[]): boolean {
    if (this._isSyncing) {
      log.debug('shouldSync: already syncing');
      return false;
    }

    const ourSnapshot = this.snapshot;
    const excludedHashesMatch =
      ourSnapshot.excludedHashes.length === excludedHashes.length &&
      ourSnapshot.excludedHashes.every((value, index) => value === excludedHashes[index]);

    log.debug(`shouldSync: excluded hashes check: ${excludedHashes}`);
    return !excludedHashesMatch;
  }

  async performSync(excludedHashes: string[], rpcClient: Client) {
    try {
      this._isSyncing = true;
      const ourSnapshot = this.snapshot;

      const divergencePrefix = this._trie.getDivergencePrefix(ourSnapshot.prefix, excludedHashes);
      log.info({ divergencePrefix, prefix: ourSnapshot.prefix }, 'Divergence prefix');
      const missingIds = await this.fetchMissingHashesByPrefix(divergencePrefix, rpcClient);
      log.info({ missingCount: missingIds.length }, 'Fetched missing hashes');

      // TODO: sort missingIds by timestamp and fetch messages in batches
      await this.fetchAndMergeMessages(missingIds, rpcClient);
      log.info(`Sync complete`);
    } catch (e) {
      log.warn(e, `Error performing sync`);
    } finally {
      this._isSyncing = false;
    }
  }

  public async fetchAndMergeMessages(syncIDs: string[], rpcClient: Client): Promise<boolean> {
    let result = true;
    if (syncIDs.length === 0) {
      return false;
    }

    const messages = await rpcClient.getAllMessagesBySyncIds(
      syncIDs.map((syncIdhash) => utf8StringToBytes(syncIdhash)._unsafeUnwrap())
    );
    await messages.match(
      async (msgs) => {
        const mergeResults = [];
        // Merge messages sequentially, so we can handle missing users.
        // TODO: Optimize by collecting all failures and retrying them in a batch
        for (const msg of msgs) {
          const result = await this.engine.mergeMessage(msg);
          // Unknown user error
          if (
            result.isErr() &&
            result.error.errCode === 'bad_request.validation_failure' &&
            (result.error.message === 'invalid signer' || result.error.message.startsWith('unknown fid'))
          ) {
            log.warn({ fid: msg.data.fid }, 'Unknown user, fetching custody event');
            const result = await this.syncUserAndRetryMessage(msg, rpcClient);
            mergeResults.push(result);
          } else {
            mergeResults.push(result);
          }
        }
        log.info(
          { messages: mergeResults.length, success: mergeResults.filter((r) => r.isOk()).length },
          'Merged messages'
        );
      },
      async (err) => {
        // e.g. Node goes down while we're performing the sync. No need to handle it, the next round of sync will retry.
        log.warn(err, `Error fetching messages for sync`);
        result = false;
      }
    );
    return result;
  }

  async fetchMissingHashesByNode(
    theirNode: NodeMetadata,
    ourNode: NodeMetadata | undefined,
    rpcClient: Client
  ): Promise<string[]> {
    const missingHashes: string[] = [];
    // If the node has fewer than HASHES_PER_FETCH, just fetch them all in go, otherwise,
    // iterate through the node's children and fetch them in batches.
    if (theirNode.numMessages <= HASHES_PER_FETCH) {
      const result = await rpcClient.getSyncIdsByPrefix(theirNode.prefix);
      result.match(
        (ids) => {
          missingHashes.push(...ids);
        },
        (err) => {
          log.warn(err, `Error fetching ids for prefix ${theirNode.prefix}`);
        }
      );
    } else if (theirNode.children) {
      for (const [theirChildChar, theirChild] of theirNode.children.entries()) {
        // recursively fetch hashes for every node where the hashes don't match
        if (ourNode?.children?.get(theirChildChar)?.hash !== theirChild.hash) {
          missingHashes.push(...(await this.fetchMissingHashesByPrefix(theirChild.prefix, rpcClient)));
        }
      }
    }
    return missingHashes;
  }

  async fetchMissingHashesByPrefix(prefix: string, rpcClient: Client): Promise<string[]> {
    const ourNode = this._trie.getTrieNodeMetadata(prefix);
    const theirNodeResult = await rpcClient.getSyncMetadataByPrefix(prefix);

    const missingHashes: string[] = [];
    await theirNodeResult.match(
      async (theirNode) => {
        missingHashes.push(...(await this.fetchMissingHashesByNode(theirNode, ourNode, rpcClient)));
      },
      async (err) => {
        log.warn(err, `Error fetching metadata for prefix ${prefix}`);
      }
    );
    return missingHashes;
  }

  /** ---------------------------------------------------------------------------------- */
  /**                                      Trie Methods                                  */
  /** ---------------------------------------------------------------------------------- */
  public addMessage(message: MessageModel): void {
    this._trie.insert(new SyncId(message));
  }

  public removeMessage(message: MessageModel): void {
    this._trie.delete(new SyncId(message));
  }

  public getTrieNodeMetadata(prefix: string): NodeMetadata | undefined {
    return this._trie.getTrieNodeMetadata(prefix);
  }

  public getIdsByPrefix(prefix: string): string[] {
    return this._trie.root.getNode(prefix)?.getAllValues() ?? [];
  }

  public get trie(): MerkleTrie {
    return this._trie;
  }

  public getSnapshotByPrefix(prefix?: string): TrieSnapshot {
    if (!prefix || prefix === '') {
      return this.snapshot;
    } else {
      return this._trie.getSnapshot(prefix);
    }
  }

  public get snapshot(): TrieSnapshot {
    // Ignore the least significant digit when fetching the snapshot timestamp because
    // second resolution is too fine grained, and fall outside sync threshold anyway
    return this._trie.getSnapshot(timestampToPaddedTimestampPrefix(this.snapshotTimestamp / 10).toString());
  }

  // Returns the most recent timestamp in seconds that's within the sync threshold
  // (i.e. highest timestamp that's < current time and timestamp % sync_threshold == 0)
  public get snapshotTimestamp(): number {
    const currentTimeInSeconds = Math.floor(getFarcasterTime());
    return Math.floor(currentTimeInSeconds / SYNC_THRESHOLD_IN_SECONDS) * SYNC_THRESHOLD_IN_SECONDS;
  }

  private async syncUserAndRetryMessage(message: MessageModel, rpcClient: Client): Promise<HubResult<void>> {
    const fid = message.data.fidArray();
    if (!fid) {
      return err(new HubError('bad_request.invalid_param', 'Invalid fid'));
    }

    const custodyEventResult = await rpcClient.getCustodyEvent(fid);
    if (custodyEventResult.isErr()) {
      return err(new HubError('unavailable.network_failure', 'Failed to fetch custody event'));
    }
    const custodyResult = await this.engine.mergeIdRegistryEvent(custodyEventResult.value);
    if (custodyResult.isErr()) {
      return err(new HubError('unavailable.storage_failure', 'Failed to merge custody event'));
    }

    // Probably not required to fetch the signer messages, but doing it here means
    //  sync will complete in one round (prevents messages failing to merge due to missed or out of order signer message)
    const signerMessagesResult = await rpcClient.getAllSignerMessagesByFid(fid);
    if (signerMessagesResult.isErr()) {
      return err(new HubError('unavailable.network_failure', 'Failed to fetch signer messages'));
    }

    const results = await this.engine.mergeMessages(signerMessagesResult.value);
    if (results.every((r) => r.isErr())) {
      return err(new HubError('unavailable.storage_failure', 'Failed to merge signer messages'));
    } else {
      // if at least one signer message was merged, retry the original message
      return (await this.engine.mergeMessage(message)).mapErr((e) => {
        log.warn(e, `Failed to merge message type ${message.type()}`);
        return new HubError('unavailable.storage_failure', e);
      });
    }
  }
}

export default SyncEngine;
