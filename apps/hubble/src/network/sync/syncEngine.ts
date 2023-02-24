import * as protobufs from '@farcaster/protobufs';
import {
  bytesToUtf8String,
  getFarcasterTime,
  HubAsyncResult,
  HubError,
  HubResult,
  HubRpcClient,
} from '@farcaster/utils';
import { PeerId } from '@libp2p/interface-peer-id';
import { err, ok } from 'neverthrow';
import { TypedEmitter } from 'tiny-typed-emitter';
import { Hub } from '~/hubble';
import { MerkleTrie, NodeMetadata } from '~/network/sync/merkleTrie';
import { SyncId, timestampToPaddedTimestampPrefix } from '~/network/sync/syncId';
import { TrieSnapshot } from '~/network/sync/trieNode';
import RocksDB from '~/storage/db/rocksdb';

import Engine from '~/storage/engine';
import { sleepWhile } from '~/utils/crypto';
import { logger } from '~/utils/logger';

// Number of seconds to wait for the network to "settle" before syncing. We will only
// attempt to sync messages that are older than this time.
const SYNC_THRESHOLD_IN_SECONDS = 10;
const HASHES_PER_FETCH = 50;
const SYNC_INTERRUPT_TIMEOUT = 30 * 1000; // 30 seconds

const log = logger.child({
  component: 'SyncEngine',
});

interface SyncEvents {
  /** Emit an event when diff starts */
  syncStart: () => void;

  /** Emit an event when diff sync completes */
  syncComplete: (success: boolean) => void;
}

type PeerContact = {
  contactInfo: protobufs.ContactInfoContent;
  peerId: PeerId;
};

class SyncEngine extends TypedEmitter<SyncEvents> {
  private readonly _trie: MerkleTrie;
  private readonly engine: Engine;

  private _isSyncing = false;
  private _interruptSync = false;

  private currentHubPeerContacts: Map<string, PeerContact> = new Map();
  private _messagesQueuedForSync = 0;

  constructor(engine: Engine, rocksDb: RocksDB) {
    super();

    this._trie = new MerkleTrie(rocksDb);
    this.engine = engine;

    this.engine.eventHandler.on('mergeMessage', async (event: protobufs.MergeMessageHubEvent) => {
      const { message, deletedMessages } = event.mergeMessageBody;
      const totalMessages = 1 + (deletedMessages?.length ?? 0);
      this._messagesQueuedForSync += totalMessages;

      await this.addMessage(message);

      for (const deletedMessage of deletedMessages ?? []) {
        await this.removeMessage(deletedMessage);
      }
      this._messagesQueuedForSync -= totalMessages;
    });

    // Note: There's no guarantee that the message is actually deleted, because the transaction could fail.
    // This is fine, because we'll just end up syncing the message again. It's much worse to miss a removal and cause
    // the trie to diverge in a way that's not recoverable without reconstructing it from the db.
    // Order of events does not matter. The trie will always converge to the same state.
    this.engine.eventHandler.on('pruneMessage', async (event: protobufs.PruneMessageHubEvent) => {
      this._messagesQueuedForSync += 1;
      await this.removeMessage(event.pruneMessageBody.message);
      this._messagesQueuedForSync -= 1;
    });
    this.engine.eventHandler.on('revokeMessage', async (event: protobufs.RevokeMessageHubEvent) => {
      this._messagesQueuedForSync += 1;
      await this.removeMessage(event.revokeMessageBody.message);
      this._messagesQueuedForSync -= 1;
    });
  }

  public get messagesQueuedForSync(): number {
    return this._messagesQueuedForSync;
  }

  public async initialize(rebuildSyncTrie = false) {
    // Check if we need to rebuild sync trie
    if (rebuildSyncTrie) {
      await this.rebuildSyncTrie();
    } else {
      // Wait for the Merkle trie to be fully loaded
      await this._trie.initialize();
    }
    const rootHash = await this._trie.rootHash();

    log.info({ rootHash }, 'Sync engine initialized');
  }

  public async rebuildSyncTrie() {
    log.info('Rebuilding sync trie...');
    await this._trie.rebuild(this.engine);
    log.info('Rebuilding sync trie complete');
  }

  public async stop() {
    // Interrupt any ongoing sync
    this._interruptSync = true;

    // Wait for syncing to stop.
    await sleepWhile(() => this._isSyncing, SYNC_INTERRUPT_TIMEOUT);
    await sleepWhile(() => this.messagesQueuedForSync > 0, SYNC_INTERRUPT_TIMEOUT);

    this._interruptSync = false;
  }

  public isSyncing(): boolean {
    return this._isSyncing;
  }

  public getContactInfoForPeerId(peerId: string): PeerContact | undefined {
    return this.currentHubPeerContacts.get(peerId);
  }

  public addContactInfoForPeerId(peerId: PeerId, contactInfo: protobufs.ContactInfoContent) {
    this.currentHubPeerContacts.set(peerId.toString(), { peerId, contactInfo });
  }

  public removeContactInfoForPeerId(peerId: string) {
    this.currentHubPeerContacts.delete(peerId);
  }

  /** ---------------------------------------------------------------------------------- */
  /**                                      Sync Methods                                  */
  /** ---------------------------------------------------------------------------------- */

  public async diffSyncIfRequired(hub: Hub, peerIdString?: string) {
    this.emit('syncStart');

    if (this.currentHubPeerContacts.size === 0) {
      log.warn(`No peer contacts, skipping sync`);
      this.emit('syncComplete', false);
      return;
    }

    let peerContact;
    let peerId;

    if (peerIdString) {
      const c = this.currentHubPeerContacts.get(peerIdString);
      peerContact = c?.contactInfo;
      peerId = c?.peerId;
    }

    // If we don't have a peer contact, get a random one from the current list
    if (!peerContact) {
      // Pick a random key
      const randomPeer = Array.from(this.currentHubPeerContacts.keys())[
        Math.floor(Math.random() * this.currentHubPeerContacts.size)
      ] as string;

      const c = this.currentHubPeerContacts.get(randomPeer);
      peerContact = c?.contactInfo;
      peerId = c?.peerId;
    }

    // If we still don't have a peer, skip the sync
    if (!peerContact || !peerId) {
      log.warn({ peerContact, peerId }, `No contact info for peer, skipping sync`);
      this.emit('syncComplete', false);
      return;
    }

    const rpcClient = await hub.getRPCClientForPeer(peerId, peerContact);
    if (!rpcClient) {
      log.warn(`Failed to get RPC client for peer, skipping sync`);
      this.emit('syncComplete', false);
      return;
    }

    // First, get the latest state from the peer
    const peerStateResult = await rpcClient.getSyncSnapshotByPrefix(
      protobufs.TrieNodePrefix.create({ prefix: new Uint8Array() })
    );
    if (peerStateResult.isErr()) {
      log.warn(`Failed to get peer state, skipping sync`);
      this.emit('syncComplete', false);
      return;
    }

    const peerState = peerStateResult.value;
    const shouldSync = await this.shouldSync(peerState);
    if (shouldSync.isErr()) {
      log.warn(`Failed to get shouldSync`);
      this.emit('syncComplete', false);
      return;
    }

    if (shouldSync.value === true) {
      log.info(`Syncing with peer`);
      await this.performSync(peerState, rpcClient);
    } else {
      log.info(`No need to sync`);
      this.emit('syncComplete', false);
      return;
    }

    this.emit('syncComplete', false);
    return;
  }

  public async shouldSync(otherSnapshot: TrieSnapshot): HubAsyncResult<boolean> {
    if (this._isSyncing) {
      log.debug('shouldSync: already syncing');
      return ok(false);
    }

    return (await this.getSnapshot(otherSnapshot.prefix)).map((ourSnapshot) => {
      const excludedHashesMatch =
        ourSnapshot.excludedHashes.length === otherSnapshot.excludedHashes.length &&
        // NOTE: `index` is controlled by `every` and so not at risk of object injection.
        // eslint-disable-next-line security/detect-object-injection
        ourSnapshot.excludedHashes.every((value, index) => value === otherSnapshot.excludedHashes[index]);

      log.debug(`shouldSync: excluded hashes check: ${otherSnapshot.excludedHashes}`);
      return !excludedHashesMatch;
    });
  }

  async performSync(otherSnapshot: TrieSnapshot, rpcClient: HubRpcClient): Promise<boolean> {
    let success = false;
    try {
      this._isSyncing = true;
      const snapshot = await this.getSnapshot(otherSnapshot.prefix);
      if (snapshot.isErr()) {
        log.warn(snapshot.error, `Error performing sync`);
      } else {
        const ourSnapshot = snapshot.value;
        const divergencePrefix = await this._trie.getDivergencePrefix(ourSnapshot.prefix, otherSnapshot.excludedHashes);
        log.info({ divergencePrefix, prefix: ourSnapshot.prefix }, 'Divergence prefix');

        let missingCount = 0;
        await this.fetchMissingHashesByPrefix(divergencePrefix, rpcClient, async (missingIds: Uint8Array[]) => {
          missingCount += missingIds.length;
          await this.fetchAndMergeMessages(missingIds, rpcClient);
        });

        log.info({ missingCount }, 'Fetched missing hashes');
        log.info(`Sync complete`);
        success = true;
      }
    } catch (e) {
      log.warn(e, `Error performing sync`);
    } finally {
      this._isSyncing = false;
    }

    return success;
  }

  public async fetchAndMergeMessages(syncIds: Uint8Array[], rpcClient: HubRpcClient): Promise<boolean> {
    if (syncIds.length === 0) {
      return false;
    }

    let result = true;
    const messagesResult = await rpcClient.getAllMessagesBySyncIds(protobufs.SyncIds.create({ syncIds }));
    await messagesResult.match(
      async (msgs) => {
        await this.mergeMessages(msgs.messages, rpcClient);
      },
      async (err) => {
        // e.g. Node goes down while we're performing the sync. No need to handle it, the next round of sync will retry.
        log.warn(err, `Error fetching messages for sync`);
        result = false;
      }
    );
    return result;
  }

  public async mergeMessages(messages: protobufs.Message[], rpcClient: HubRpcClient): Promise<HubResult<number>[]> {
    const mergeResults: HubResult<number>[] = [];
    // First, sort the messages by timestamp to reduce thrashing and refetching
    messages.sort((a, b) => (a.data?.timestamp || 0) - (b.data?.timestamp || 0));

    // Merge messages sequentially, so we can handle missing users.
    // TODO: Optimize by collecting all failures and retrying them in a batch
    for (const msg of messages) {
      const result = await this.engine.mergeMessage(msg);
      // Unknown user error
      if (
        result.isErr() &&
        result.error.errCode === 'bad_request.validation_failure' &&
        (result.error.message === 'invalid signer' || result.error.message.startsWith('unknown fid'))
      ) {
        log.warn({ fid: msg.data?.fid }, 'Unknown user, fetching custody event');
        const result = await this.syncUserAndRetryMessage(msg, rpcClient);
        mergeResults.push(result);
      } else {
        mergeResults.push(result);
      }
    }

    log.info(
      {
        total: mergeResults.length,
        success: mergeResults.filter((r) => r.isOk()).length,
      },
      'Merged messages'
    );

    // If there was a failed merge, log the error and move on. We'll only log one error, since they're likely all the same.
    const failedMerge = mergeResults.find((r) => r.isErr());
    if (failedMerge) {
      log.warn(
        { error: failedMerge._unsafeUnwrapErr(), errorMessage: failedMerge._unsafeUnwrapErr().message },
        'Failed to merge message'
      );
    }

    return mergeResults;
  }

  async fetchMissingHashesByPrefix(
    prefix: Uint8Array,
    rpcClient: HubRpcClient,
    onMissingHashes: (missingHashes: Uint8Array[]) => Promise<void>
  ): Promise<void> {
    // Check if we should interrupt the sync
    if (this._interruptSync) {
      log.info(`Interrupting sync`);
      return;
    }

    const ourNode = await this._trie.getTrieNodeMetadata(prefix);
    const theirNodeResult = await rpcClient.getSyncMetadataByPrefix(protobufs.TrieNodePrefix.create({ prefix }));

    if (theirNodeResult.isErr()) {
      log.warn(theirNodeResult.error, `Error fetching metadata for prefix ${prefix}`);
    } else if (theirNodeResult.value.numMessages === 0) {
      // If there are no messages, we're done, but something is probably wrong, since we should never have
      // a node with no messages.
      log.warn({ prefix }, `No messages for prefix, skipping`);
      return;
    } else if (ourNode?.hash === theirNodeResult.value.hash) {
      // Hashes match, we're done.
      return;
    } else {
      await this.fetchMissingHashesByNode(
        fromNodeMetadataResponse(theirNodeResult.value),
        ourNode,
        rpcClient,
        onMissingHashes
      );
    }
  }

  async fetchMissingHashesByNode(
    theirNode: NodeMetadata,
    ourNode: NodeMetadata | undefined,
    rpcClient: HubRpcClient,
    onMissingHashes: (missingHashes: Uint8Array[]) => Promise<void>
  ): Promise<void> {
    if (this._interruptSync) {
      log.info(`Interrupting sync`);
      return;
    }

    // If the node has fewer than HASHES_PER_FETCH, just fetch them all in go, otherwise,
    // iterate through the node's children and fetch them in batches.
    if (theirNode.numMessages <= HASHES_PER_FETCH) {
      if (ourNode && ourNode.numMessages > theirNode.numMessages) {
        // If we have more messages than the other node, we're done. This might happen if the remote node is
        // still syncing, or if they have deleted messages (because of pruning), in which case we should
        // just wait, and our node will also prune the messages.
        log.info(
          {
            ourNum: ourNode.numMessages,
            theirNum: theirNode.numMessages,
            prefix: bytesToUtf8String(theirNode.prefix),
          },
          `Our node has more messages, skipping this node.`
        );
      } else {
        const result = await rpcClient.getAllSyncIdsByPrefix(
          protobufs.TrieNodePrefix.create({ prefix: theirNode.prefix })
        );

        if (result.isErr()) {
          log.warn(result.error, `Error fetching ids for prefix ${theirNode.prefix}`);
        } else {
          await onMissingHashes(result.value.syncIds);
        }
      }
    } else if (theirNode.children) {
      for (const [theirChildChar, theirChild] of theirNode.children.entries()) {
        // recursively fetch hashes for every node where the hashes don't match
        const allPromises = [];
        if (ourNode?.children?.get(theirChildChar)?.hash !== theirChild.hash) {
          allPromises.push(this.fetchMissingHashesByPrefix(theirChild.prefix, rpcClient, onMissingHashes));
        }
        await Promise.all(allPromises);
      }
    }
  }

  /** ---------------------------------------------------------------------------------- */
  /**                                      Trie Methods                                  */
  /** ---------------------------------------------------------------------------------- */
  public async addMessage(message: protobufs.Message): Promise<void> {
    await this._trie.insert(new SyncId(message));
  }

  public async removeMessage(message: protobufs.Message): Promise<void> {
    await this._trie.delete(new SyncId(message));
  }

  public async getTrieNodeMetadata(prefix: Uint8Array): Promise<NodeMetadata | undefined> {
    return this._trie.getTrieNodeMetadata(prefix);
  }

  public async getAllSyncIdsByPrefix(prefix: Uint8Array): Promise<Uint8Array[]> {
    return await this._trie.getAllValues(prefix);
  }

  public get trie(): MerkleTrie {
    return this._trie;
  }

  public async getSnapshotByPrefix(prefix?: Uint8Array): HubAsyncResult<TrieSnapshot> {
    if (!prefix || prefix.length === 0) {
      return this.getSnapshot();
    } else {
      return ok(await this._trie.getSnapshot(prefix));
    }
  }

  public async getSnapshot(prefix?: Uint8Array): HubAsyncResult<TrieSnapshot> {
    return this.snapshotTimestamp.asyncMap((snapshotTimestamp) => {
      // Ignore the least significant digit when fetching the snapshot timestamp because
      // second resolution is too fine grained, and fall outside sync threshold anyway
      return this._trie.getSnapshot(prefix ?? Buffer.from(timestampToPaddedTimestampPrefix(snapshotTimestamp)));
    });
  }

  // Returns the most recent timestamp in seconds that's within the sync threshold
  // (i.e. highest timestamp that's < current time and timestamp % sync_threshold == 0)
  public get snapshotTimestamp(): HubResult<number> {
    return getFarcasterTime().map((farcasterTime) => {
      const currentTimeInSeconds = Math.floor(farcasterTime);
      return Math.floor(currentTimeInSeconds / SYNC_THRESHOLD_IN_SECONDS) * SYNC_THRESHOLD_IN_SECONDS;
    });
  }

  private async syncUserAndRetryMessage(
    message: protobufs.Message,
    rpcClient: HubRpcClient
  ): Promise<HubResult<number>> {
    const fid = message.data?.fid;
    if (!fid) {
      return err(new HubError('bad_request.invalid_param', 'Invalid fid'));
    }

    const custodyEventResult = await rpcClient.getIdRegistryEvent(protobufs.FidRequest.create({ fid }));
    if (custodyEventResult.isErr()) {
      return err(new HubError('unavailable.network_failure', 'Failed to fetch custody event'));
    }

    const custodyResult = await this.engine.mergeIdRegistryEvent(custodyEventResult._unsafeUnwrap());
    if (custodyResult.isErr()) {
      return err(new HubError('unavailable.storage_failure', 'Failed to merge custody event'));
    }

    // Probably not required to fetch the signer messages, but doing it here means
    // sync will complete in one round (prevents messages failing to merge due to missed or out of
    // order signer message)
    const signerMessagesResult = await rpcClient.getAllSignerMessagesByFid(protobufs.FidRequest.create({ fid }));
    if (signerMessagesResult.isErr()) {
      return err(new HubError('unavailable.network_failure', 'Failed to fetch signer messages'));
    }

    const results = await this.engine.mergeMessages(signerMessagesResult._unsafeUnwrap().messages);
    if (results.every((r) => r.isErr())) {
      return err(new HubError('unavailable.storage_failure', 'Failed to merge signer messages'));
    } else {
      // if at least one signer message was merged, retry the original message
      return (await this.engine.mergeMessage(message)).mapErr((e) => {
        log.warn(e, `Failed to merge message type ${message.data?.type}`);
        return new HubError('unavailable.storage_failure', e);
      });
    }
  }
}

const fromNodeMetadataResponse = (response: protobufs.TrieNodeMetadataResponse): NodeMetadata => {
  const children = new Map<number, NodeMetadata>();
  for (let i = 0; i < response.children.length; i++) {
    // Safety: i is controlled by the loop
    // eslint-disable-next-line security/detect-object-injection
    const child = response.children[i];

    if (child && child.prefix.length > 0) {
      const prefix = child.prefix;
      // Char is the last char of prefix
      const char = prefix[prefix.length - 1] as number;

      children.set(char, {
        numMessages: Number(child?.numMessages),
        prefix,
        hash: child?.hash ?? '',
      });
    }
  }

  return {
    prefix: response.prefix ?? '',
    numMessages: Number(response.numMessages),
    hash: response.hash ?? '',
    children,
  };
};

export default SyncEngine;
