import { Message } from '~/types';
import { MerkleTrie, NodeMetadata, TrieSnapshot } from '~/network/sync/merkleTrie';
import { SyncId } from '~/network/sync/syncId';
import Engine from '~/storage/engine';
import { RPCClient } from '~/network/rpc';
import { err, Result } from 'neverthrow';
import { FarcasterError, ServerError } from '~/utils/errors';

// Number of seconds to wait for the network to "settle" before syncing. We will only
// attempt to sync messages that are older than this time.
const SYNC_THRESHOLD_IN_SECONDS = 10;
const HASHES_PER_FETCH = 50;

/**
 * SyncEngine handles the logic required to determine where and how two hubs differ
 * from each other and bring them into sync efficiently. See https://github.com/farcasterxyz/hub/issues/66
 * for more details on design of the sync algorithm.
 */
class SyncEngine {
  private readonly _trie: MerkleTrie;
  private readonly engine: Engine;
  private _isSyncing = false;

  constructor(engine: Engine) {
    this._trie = new MerkleTrie();
    this.engine = engine;

    this.engine.on('messageMerged', async (_fid, _type, message) => {
      this.addMessage(message);
    });
  }

  public addMessage(message: Message): void {
    this._trie.insert(new SyncId(message));
  }

  public shouldSync(excludedHashes: string[], numMessages: number): boolean {
    if (this._isSyncing) {
      console.log(`Already syncing, skipping`);
      return false;
    }
    const ourSnapshot = this.snapshot;
    console.log(`shouldSync: Our snapshot: ${ourSnapshot.prefix}`);
    const excludedHashesMatch =
      ourSnapshot.excludedHashes.length === excludedHashes.length &&
      ourSnapshot.excludedHashes.every((value, index) => value === excludedHashes[index]);
    if (excludedHashesMatch) {
      console.log(`Excluded hashes match, skipping`);
      // Excluded hashes match exactly, so we don't need to sync
      return false;
    }
    if (ourSnapshot.numMessages > numMessages) {
      console.log(`Excluded hashes match for ${ourSnapshot.prefix}, skipping`);
      // We have more messages than the other hub, we don't need to sync
      return false;
    } else if (ourSnapshot.numMessages === numMessages) {
      // We have the same number of messages as the other hub, randomly return true or false to determine if we should sync
      const result = Math.random() < 0.5;
      console.log(`Random sync result ${result}`);
      return result;
    } else if (ourSnapshot.numMessages < numMessages) {
      console.log(`message count mismatch, syncing`);
      // We have fewer messages, so we should sync
      return true;
    }
    return false;
  }

  async performSync(excludedHashes: string[], rpcClient: RPCClient) {
    try {
      this._isSyncing = true;
      const ourSnapshot = this.snapshot;
      const divergencePrefix = this._trie.getDivergencePrefix(ourSnapshot.prefix, excludedHashes);
      console.log(`Divergence prefix: ${divergencePrefix}`);
      const missingIds = await this.fetchMissingHashes(divergencePrefix, rpcClient);
      console.log(`Found ${missingIds.length} missing hashes`);
      await this.fetchAndMergeMessages(missingIds, rpcClient);
      console.log(`Sync complete`);
      // TODO: sort missingIds by timestamp and fetch messages in batches
    } catch (e) {
      console.log(`Error performing sync: ${e}`);
      throw e;
    } finally {
      console.log(`Finished syncing`);
      this._isSyncing = false;
    }
  }

  async fetchMissingHashes(prefix: string, rpcClient: RPCClient): Promise<string[]> {
    const ourNode = this._trie.getNodeMetadata(prefix);
    const theirNodeResult = await rpcClient.getSyncMetadataByPrefix(prefix);

    const missingHashes: string[] = [];
    await theirNodeResult.match(
      async (theirNode) => {
        // console.log(
        //   `Prefix: ${prefix}. Our node: ${ourNode?.numMessages} in ${
        //     ourNode?.children?.size || 0
        //   } children. Their node: ${theirNode.numMessages} in ${theirNode.children?.size || 0} children`
        // );
        if (theirNode.numMessages <= HASHES_PER_FETCH) {
          // console.log(`Got ${theirNode.numMessages} hashes, fetching all`);
          const result = await rpcClient.getSyncIdsByPrefix(prefix);
          result.match(
            (ids) => {
              missingHashes.push(...ids);
            },
            (err) => {
              console.log(
                `Error fetching ids for prefix: ${prefix} expected: ${theirNode.numMessages} error: ${err.message}`
              );
            }
          );
        } else if (theirNode.children) {
          for (const [theirChildChar, theirChild] of theirNode.children.entries()) {
            // recursively fetch hashes for every node where the hashes don't match
            // console.log(
            //   `Their child: ${theirChildChar}, hash: ${theirChild.hash}, our hash: ${
            //     ourNode?.children?.get(theirChildChar)?.hash
            //   }`
            // );
            if (ourNode?.children?.get(theirChildChar)?.hash !== theirChild.hash) {
              missingHashes.push(...(await this.fetchMissingHashes(theirChild.prefix, rpcClient)));
            }
          }
        }
      },
      async () => {
        // TODO: handle error
        console.log(`Error fetching metadata for prefix ${prefix}`);
      }
    );
    return missingHashes;
  }

  public async fetchAndMergeMessages(hashes: string[], rpcClient: RPCClient): Promise<boolean> {
    const messages = await rpcClient.getMessagesByHashes(hashes.map((hash) => '0x' + hash));
    let result = true;
    await messages.match(
      async (msgs) => {
        console.log(`Got ${msgs.length} messages`);
        const mergeResults = [];
        // TODO: we have to merge the messages sequentially, because of a race condition with reactions (https://github.com/farcasterxyz/hub/issues/178)
        for (const msg of msgs) {
          const result = await this.engine.mergeMessage(msg);
          if (result.isErr() && result.error.message.includes('unknown user')) {
            const result = await this.syncUserAndRetryMessage(msg, rpcClient);
            mergeResults.push(result);
          } else {
            mergeResults.push(result);
          }
        }
        console.log(`Merged ${mergeResults.length} messages. Success: ${mergeResults.filter((r) => r.isOk()).length}`);
        mergeResults
          .filter((r) => r.isErr())
          .forEach((r) => console.log(`Failed to merge message: ${r._unsafeUnwrapErr().message}`));
      },
      async () => {
        result = false;
      }
    );
    return result;
  }

  public getNodeMetadata(prefix: string): NodeMetadata | undefined {
    return this._trie.getNodeMetadata(prefix);
  }

  public getIdsByPrefix(prefix: string): string[] {
    return this._trie.root.getNode(prefix)?.getAllValues() ?? [];
  }

  public get trie(): MerkleTrie {
    return this._trie;
  }

  public get snapshot(): TrieSnapshot {
    return this._trie.getSnapshot(this.snapshotTimestamp.toString());
  }

  public get isSyncing(): boolean {
    return this._isSyncing;
  }

  // Returns the most recent timestamp that's within the sync threshold
  // (i.e. highest timestamp that's < current time and timestamp % sync_thershold == 0)
  public get snapshotTimestamp(): number {
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    return Math.floor(currentTimeInSeconds / SYNC_THRESHOLD_IN_SECONDS) * SYNC_THRESHOLD_IN_SECONDS;
  }

  private async syncUserAndRetryMessage(message: Message, rpcClient: RPCClient): Promise<Result<void, FarcasterError>> {
    const user = message.data.fid;
    const custodyEventResult = await rpcClient.getCustodyEventByUser(user);
    if (custodyEventResult.isErr()) {
      return err(new ServerError('Failed to fetch custody event'));
    }
    await this.engine.mergeIdRegistryEvent(custodyEventResult._unsafeUnwrap());
    // Probably not required to fetch the signer messages, but doing it here means
    //  sync will complete in one round (prevents messages failing to merge due to missed or out of order signer message)
    const signerMessagesResult = await rpcClient.getAllSignerMessagesByUser(user);
    if (signerMessagesResult.isErr()) {
      return err(new ServerError('Failed to fetch signer messages'));
    }
    const results = await Promise.all(this.engine.mergeMessages([...signerMessagesResult._unsafeUnwrap()]));
    if (results.every((r) => r.isErr())) {
      return err(new ServerError('Failed to signer messages'));
    } else {
      // if at least one signer message was merged, retry the original message
      return this.engine.mergeMessage(message);
    }
  }
}

export { SyncEngine };
