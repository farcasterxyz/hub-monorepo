import {
  getFarcasterTime,
  HubAsyncResult,
  HubError,
  HubResult,
  HubRpcClient,
  Metadata,
  ContactInfoContent,
  MergeMessageHubEvent,
  PruneMessageHubEvent,
  RevokeMessageHubEvent,
  TrieNodePrefix,
  SyncIds,
  Message,
  FidRequest,
  TrieNodeMetadataResponse,
  bytesToHexString,
} from "@farcaster/hub-nodejs";
import { PeerId } from "@libp2p/interface-peer-id";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { TypedEmitter } from "tiny-typed-emitter";
import { EthEventsProvider } from "../../eth/ethEventsProvider.js";
import { Hub, HubInterface } from "../../hubble.js";
import { MerkleTrie, NodeMetadata } from "../../network/sync/merkleTrie.js";
import { prefixToTimestamp, SyncId, timestampToPaddedTimestampPrefix } from "../../network/sync/syncId.js";
import { TrieSnapshot } from "./trieNode.js";
import { getManyMessages } from "../../storage/db/message.js";
import RocksDB from "../../storage/db/rocksdb.js";
import { sleepWhile } from "../../utils/crypto.js";
import { logger } from "../../utils/logger.js";
import { RootPrefix } from "../../storage/db/types.js";
import { fromFarcasterTime } from "@farcaster/core";
import { SyncEngineProfiler } from "./syncEngineProfiler.js";

// Number of seconds to wait for the network to "settle" before syncing. We will only
// attempt to sync messages that are older than this time.
const SYNC_THRESHOLD_IN_SECONDS = 10;
const HASHES_PER_FETCH = 256;
const SYNC_PARALLELISM = 4; // Fetch upto 4 leaf nodes in parallel
const SYNC_INTERRUPT_TIMEOUT = 30 * 1000; // 30 seconds
const COMPACTION_THRESHOLD = 100_000; // Sync
const BAD_PEER_BLOCK_TIMEOUT = 5 * 60 * 60 * 1000; // 5 hours, arbitrary, may need to be adjusted as network grows
const BAD_PEER_MESSAGE_THRESHOLD = 1000; // Number of messages we can't merge before we consider a peer "bad"

const log = logger.child({
  component: "SyncEngine",
});

interface SyncEvents {
  /** Emit an event when diff starts */
  syncStart: () => void;

  /** Emit an event when diff sync completes */
  syncComplete: (success: boolean) => void;
}

type PeerContact = {
  contactInfo: ContactInfoContent;
  peerId: PeerId;
};

type MergeResult = {
  total: number;
  successCount: number;
  deferredCount: number;
  errCount: number;
};

type SyncStatus = {
  isSyncing: boolean;
  inSync: "true" | "false" | "unknown" | "blocked";
  shouldSync: boolean;
  theirSnapshot: TrieSnapshot;
  ourSnapshot: TrieSnapshot;
  divergencePrefix: string;
  divergenceSecondsAgo: number;
  lastBadSync: number;
};

type DbStats = {
  numMessages: number;
  numFids: number;
  numFnames: number;
};

class SyncEngine extends TypedEmitter<SyncEvents> {
  private readonly _trie: MerkleTrie;
  private readonly _db: RocksDB;
  private readonly _hub: HubInterface;
  private readonly _ethEventsProvider: EthEventsProvider | undefined;

  private _isSyncing = false;
  private _interruptSync = false;
  private _syncProfiler?: SyncEngineProfiler;

  private currentHubPeerContacts: Map<string, PeerContact> = new Map();
  // Map of peerId to last time we attempted to sync with them without merging any new messages succesfully
  private _unproductivePeers: Map<string, Date> = new Map();

  // Number of messages waiting to get into the SyncTrie.
  private _syncTrieQ = 0;
  // Number of messages waiting to get into the merge stores.
  private _syncMergeQ = 0;

  // Number of messages since last compaction
  private _messagesSinceLastCompaction = 0;
  private _isCompacting = false;

  constructor(hub: HubInterface, rocksDb: RocksDB, ethEventsProvider?: EthEventsProvider, profileSync = false) {
    super();

    this._db = rocksDb;
    this._trie = new MerkleTrie(rocksDb);
    this._ethEventsProvider = ethEventsProvider;

    if (profileSync) {
      this._syncProfiler = new SyncEngineProfiler();
    }

    this._hub = hub;

    this._hub.engine.eventHandler.on("mergeMessage", async (event: MergeMessageHubEvent) => {
      const { message, deletedMessages } = event.mergeMessageBody;
      const totalMessages = 1 + (deletedMessages?.length ?? 0);
      this._syncTrieQ += totalMessages;

      await this.addMessage(message);

      for (const deletedMessage of deletedMessages ?? []) {
        await this.removeMessage(deletedMessage);
      }
      this._syncTrieQ -= totalMessages;
    });

    // Note: There's no guarantee that the message is actually deleted, because the transaction could fail.
    // This is fine, because we'll just end up syncing the message again. It's much worse to miss a removal and cause
    // the trie to diverge in a way that's not recoverable without reconstructing it from the db.
    // Order of events does not matter. The trie will always converge to the same state.
    this._hub.engine.eventHandler.on("pruneMessage", async (event: PruneMessageHubEvent) => {
      this._syncTrieQ += 1;
      await this.removeMessage(event.pruneMessageBody.message);
      this._syncTrieQ -= 1;
    });
    this._hub.engine.eventHandler.on("revokeMessage", async (event: RevokeMessageHubEvent) => {
      this._syncTrieQ += 1;
      await this.removeMessage(event.revokeMessageBody.message);
      this._syncTrieQ -= 1;
    });
  }

  public get syncTrieQSize(): number {
    return this._syncTrieQ;
  }

  public get syncMergeQSize(): number {
    return this._syncMergeQ;
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

    log.info({ rootHash }, "Sync engine initialized");
  }

  /** Rebuild the entire Sync Trie */
  public async rebuildSyncTrie() {
    log.info("Rebuilding sync trie...");
    await this._trie.rebuild();
    log.info("Rebuilding sync trie complete");
  }

  /** Rebuild the individual syncIDs in the Sync Trie */
  public async rebuildSyncIds(syncIds: Uint8Array[]) {
    for (const syncId of syncIds) {
      await this._trie.deleteByBytes(syncId);
    }
  }

  public async stop() {
    // Interrupt any ongoing sync
    this._interruptSync = true;

    // First, save the trie to disk
    await this._trie.commitToDb();

    // Wait for syncing to stop.
    try {
      await sleepWhile(() => this._isSyncing, SYNC_INTERRUPT_TIMEOUT);
      await sleepWhile(() => this.syncTrieQSize > 0, SYNC_INTERRUPT_TIMEOUT);

      // Write the trie to disk one last time, in case there were any changes
      await this._trie.commitToDb();
    } catch (e) {
      log.error({ err: e }, "Interrupting sync timed out");
    }

    this._interruptSync = false;
  }

  public getSyncProfile(): SyncEngineProfiler | undefined {
    return this._syncProfiler;
  }

  public isSyncing(): boolean {
    return this._isSyncing;
  }

  public getContactInfoForPeerId(peerId: string): PeerContact | undefined {
    return this.currentHubPeerContacts.get(peerId);
  }

  public addContactInfoForPeerId(peerId: PeerId, contactInfo: ContactInfoContent) {
    this.currentHubPeerContacts.set(peerId.toString(), { peerId, contactInfo });
  }

  public removeContactInfoForPeerId(peerId: string) {
    this.currentHubPeerContacts.delete(peerId);
  }

  /** ---------------------------------------------------------------------------------- */
  /**                                      Sync Methods                                  */
  /** ---------------------------------------------------------------------------------- */

  public async diffSyncIfRequired(hub: Hub, peerIdString?: string) {
    this.emit("syncStart");
    log.info({ peerIdString }, "Diffsync: Starting diff sync");

    if (this.currentHubPeerContacts.size === 0) {
      log.warn("Diffsync: No peer contacts, skipping sync");
      this.emit("syncComplete", false);
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
      log.warn({ peerContact, peerId }, "Diffsync: No contact info for peer, skipping sync");
      this.emit("syncComplete", false);
      return;
    } else {
      log.info({ peerId, peerContact }, "Diffsync: Starting diff sync with peer");
    }

    const updatedPeerIdString = peerId.toString();
    let rpcClient = await hub.getRPCClientForPeer(peerId, peerContact);
    if (!rpcClient) {
      log.warn("Diffsync: Failed to get RPC client for peer, skipping sync");
      // If we're unable to reach the peer, remove it from our contact list. We'll retry when it's added back by
      // the periodic ContactInfo gossip job.
      this.removeContactInfoForPeerId(updatedPeerIdString);
      this.emit("syncComplete", false);
      return;
    }

    // If a sync profile is enabled, wrap the rpcClient in a profiler
    if (this._syncProfiler) {
      rpcClient = this._syncProfiler.profiledRpcClient(rpcClient);
    }

    try {
      // First, get the latest state from the peer
      const peerStateResult = await rpcClient.getSyncSnapshotByPrefix(
        TrieNodePrefix.create({ prefix: new Uint8Array() }),
        new Metadata(),
        rpcDeadline(),
      );
      if (peerStateResult.isErr()) {
        log.warn(
          { error: peerStateResult.error, errMsg: peerStateResult.error.message, peerId, peerContact },
          "Diffsync: Failed to get peer state, skipping sync",
        );
        this.emit("syncComplete", false);
        return;
      }

      const peerState = peerStateResult.value;
      const syncStatusResult = await this.syncStatus(updatedPeerIdString, peerState);
      if (syncStatusResult.isErr()) {
        log.warn("Diffsync: Failed to get shouldSync");
        this.emit("syncComplete", false);
        return;
      }

      // Log sync status for visibility
      const syncStatus = syncStatusResult.value;
      log.info(
        {
          peerId,
          inSync: syncStatus.inSync,
          isSyncing: syncStatus.isSyncing,
          theirMessages: syncStatus.theirSnapshot.numMessages,
          ourMessages: syncStatus.ourSnapshot?.numMessages,
          peerNetwork: peerContact.network,
          peerVersion: peerContact.hubVersion,
          peerAppVersion: peerContact.appVersion,
          divergencePrefix: syncStatus.divergencePrefix,
          divergenceSeconds: syncStatus.divergenceSecondsAgo,
          lastBadSync: syncStatus.lastBadSync,
        },
        "SyncStatus", // Search for this string in the logs to get summary of sync status
      );

      if (syncStatus.shouldSync === true) {
        log.info({ peerId }, "Diffsync: Syncing with peer");
        await this.performSync(updatedPeerIdString, peerState, rpcClient);

        log.info({ peerId }, "Diffsync: complete");
        this.emit("syncComplete", true);
        return;
      } else {
        log.info({ peerId }, "No need to sync");
        this.emit("syncComplete", false);
        return;
      }
    } finally {
      const closeResult = Result.fromThrowable(
        () => rpcClient?.close(),
        (e) => e as Error,
      )();
      if (closeResult.isErr()) {
        log.warn({ err: closeResult.error }, "Failed to close RPC client after sync");
      }
    }
  }

  public async syncStatus(peerId: string, theirSnapshot: TrieSnapshot): HubAsyncResult<SyncStatus> {
    const lastBadSync = this._unproductivePeers.get(peerId);
    const ourSnapshotResult = await this.getSnapshot(theirSnapshot.prefix);

    if (ourSnapshotResult.isErr()) {
      return err(ourSnapshotResult.error);
    }
    const ourSnapshot = ourSnapshotResult.value;

    if (this._isSyncing) {
      return ok({
        isSyncing: true,
        inSync: "unknown",
        shouldSync: false,
        theirSnapshot,
        ourSnapshot,
        divergencePrefix: "",
        divergenceSecondsAgo: -1,
        lastBadSync: -1,
      });
    }

    if (lastBadSync && Date.now() < lastBadSync.getTime() + BAD_PEER_BLOCK_TIMEOUT) {
      return ok({
        isSyncing: false,
        inSync: "blocked",
        shouldSync: false,
        theirSnapshot,
        ourSnapshot,
        divergencePrefix: "",
        divergenceSecondsAgo: -1,
        lastBadSync: lastBadSync.getTime(),
      });
    }

    const excludedHashesMatch =
      ourSnapshot.excludedHashes.length === theirSnapshot.excludedHashes.length &&
      // NOTE: `index` is controlled by `every` and so not at risk of object injection.
      ourSnapshot.excludedHashes.every((value, index) => value === theirSnapshot.excludedHashes[index]);

    const divergencePrefix = Buffer.from(this.getDivergencePrefix(ourSnapshot, theirSnapshot.excludedHashes)).toString(
      "ascii",
    );
    const divergedAt = fromFarcasterTime(prefixToTimestamp(divergencePrefix));
    let divergenceSecondsAgo = -1;
    if (divergedAt.isOk()) {
      divergenceSecondsAgo = Math.floor((Date.now() - divergedAt.value) / 1000);
    }

    return ok({
      isSyncing: false,
      inSync: excludedHashesMatch ? "true" : "false",
      shouldSync: !excludedHashesMatch,
      ourSnapshot,
      theirSnapshot,
      divergencePrefix,
      divergenceSecondsAgo,
      lastBadSync: lastBadSync?.getTime() ?? -1,
    });
  }

  async performSync(peerId: string, otherSnapshot: TrieSnapshot, rpcClient: HubRpcClient): Promise<boolean> {
    log.info("Perform sync: Start");

    let success = false;
    try {
      this._isSyncing = true;
      const snapshot = await this.getSnapshot(otherSnapshot.prefix);
      if (snapshot.isErr()) {
        log.warn({ errCode: snapshot.error.errCode }, `Error performing sync: ${snapshot.error.message}}`);
      } else {
        const ourSnapshot = snapshot.value;
        const divergencePrefix = this.getDivergencePrefix(ourSnapshot, otherSnapshot.excludedHashes);
        log.info(
          {
            divergencePrefix: Buffer.from(divergencePrefix).toString("ascii"),
            prefix: Buffer.from(ourSnapshot.prefix).toString("ascii"),
          },
          "Divergence prefix",
        );

        const fullSyncResult: MergeResult = { total: 0, successCount: 0, deferredCount: 0, errCount: 0 };
        await this.fetchMissingHashesByPrefix(divergencePrefix, rpcClient, async (missingIds: Uint8Array[]) => {
          fullSyncResult.total += missingIds.length;
          const result = await this.fetchAndMergeMessages(missingIds, rpcClient);
          fullSyncResult.successCount += result.successCount;
          fullSyncResult.deferredCount += result.deferredCount;
          fullSyncResult.errCount += result.errCount;
        });
        log.info({ syncResult: fullSyncResult }, "Fetched missing hashes");

        // If we did not merge any messages and didn't defer any. Then this peer only had old messages.
        if (
          fullSyncResult.total > BAD_PEER_MESSAGE_THRESHOLD &&
          fullSyncResult.successCount === 0 &&
          fullSyncResult.deferredCount === 0
        ) {
          log.warn("No messages were successfully fetched");
          this._unproductivePeers.set(peerId, new Date());
        }

        log.info("Sync complete");
        success = true;
      }
    } catch (e) {
      log.warn(e, "Error performing sync");
    } finally {
      this._isSyncing = false;
    }

    return success;
  }

  async getAllMessagesBySyncIds(syncIds: Uint8Array[]): HubAsyncResult<Message[]> {
    const hashesBuf = syncIds.map((syncIdHash) => SyncId.pkFromSyncId(syncIdHash));
    return ResultAsync.fromPromise(getManyMessages(this._db, hashesBuf), (e) => e as HubError);
  }

  /**
   * Returns the subset of the prefix common to two different tries by comparing excluded hashes.
   *
   * @param prefix - the prefix of the external trie.
   * @param otherExcludedHashes - the excluded hashes of the external trie.
   */
  getDivergencePrefix(ourSnapshot: TrieSnapshot, otherExcludedHashes: string[]): Uint8Array {
    const { prefix, excludedHashes } = ourSnapshot;

    for (let i = 0; i < prefix.length; i++) {
      // NOTE: `i` is controlled by for loop and hence not at risk of object injection.
      if (excludedHashes[i] !== otherExcludedHashes[i]) {
        return prefix.slice(0, i);
      }
    }

    return prefix;
  }

  public async fetchAndMergeMessages(syncIds: Uint8Array[], rpcClient: HubRpcClient): Promise<MergeResult> {
    const empty = { successCount: 0, deferredCount: 0, errCount: 0, total: 0 };
    if (syncIds.length === 0) {
      return empty;
    }

    let result = empty;
    const messagesResult = await rpcClient.getAllMessagesBySyncIds(
      SyncIds.create({ syncIds }),
      new Metadata(),
      rpcDeadline(),
    );
    await messagesResult.match(
      async (msgs) => {
        result = await this.mergeMessages(msgs.messages, rpcClient);
      },
      async (err) => {
        // e.g. Node goes down while we're performing the sync. No need to handle it, the next round of sync will retry.
        log.warn(err, "Error fetching messages for sync");
      },
    );
    return result;
  }

  public async mergeMessages(messages: Message[], rpcClient: HubRpcClient): Promise<MergeResult> {
    const mergeResults: HubResult<number>[] = [];
    let deferredCount = 0;
    let errCount = 0;
    // First, sort the messages by timestamp to reduce thrashing and refetching
    messages.sort((a, b) => (a.data?.timestamp || 0) - (b.data?.timestamp || 0));

    // Merge messages sequentially, so we can handle missing users.
    this._syncMergeQ += messages.length;

    await this.compactDbIfRequired(messages.length);

    for (const msg of messages) {
      const result = await this._hub.submitMessage(msg, "sync");

      if (result.isErr()) {
        if (result.error.errCode === "bad_request.validation_failure") {
          if (result.error.message.startsWith("invalid signer")) {
            // The user's signer was not found. So fetch all signers from the peer and retry.
            log.warn(
              { fid: msg.data?.fid, err: result.error.message },
              `Invalid signer ${bytesToHexString(msg.signer)._unsafeUnwrap()}, fetching signers from peer`,
            );
            const retryResult = await this.syncUserAndRetryMessage(msg, rpcClient);
            mergeResults.push(retryResult);
          } else if (result.error.message.startsWith("unknown fid")) {
            // We've missed this user's ID registry event? This is somewhat unlikely, but possible
            // if we don't get all the events from the Ethereum RPC provider.
            // We'll do it in the background, since this will not block the sync.
            setTimeout(async () => {
              log.warn(
                { fid: msg.data?.fid, err: result.error.message },
                `Unknown fid ${msg.data?.fid}, reprocessing ID registry event`,
              );
              await this.retryIdRegistryEvent(msg, rpcClient);
            }, 0);

            // We'll push this message as a failure, and we'll retry it on the next sync.
            mergeResults.push(result);
            deferredCount += 1;
          }
        } else if (result.error.errCode === "bad_request.duplicate") {
          // This message has been merged into the DB, but for some reason is not in the Trie.
          // Just update the trie.
          await this.trie.insert(new SyncId(msg));
          mergeResults.push(result);
          errCount += 1;
        } else {
          errCount += 1;
        }
      } else {
        mergeResults.push(result);
      }
    }
    this._syncMergeQ -= messages.length;

    const successCount = mergeResults.filter((r) => r.isOk()).length;
    if (mergeResults.length > 0) {
      log.info(
        {
          total: mergeResults.length,
          success: successCount,
          deferred: deferredCount,
          errored: errCount,
        },
        `Merged ${successCount} messages during sync with ${mergeResults.length - successCount} failures`,
      );
    }

    return { total: mergeResults.length, successCount, deferredCount, errCount };
  }

  async fetchMissingHashesByPrefix(
    prefix: Uint8Array,
    rpcClient: HubRpcClient,
    onMissingHashes: (missingHashes: Uint8Array[]) => Promise<void>,
  ): Promise<void> {
    // Check if we should interrupt the sync
    if (this._interruptSync) {
      log.info("Interrupting sync");
      return;
    }

    const ourNode = await this._trie.getTrieNodeMetadata(prefix);
    const theirNodeResult = await rpcClient.getSyncMetadataByPrefix(
      TrieNodePrefix.create({ prefix }),
      new Metadata(),
      rpcDeadline(),
    );

    if (theirNodeResult.isErr()) {
      log.warn(theirNodeResult.error, `Error fetching metadata for prefix ${prefix}`);
    } else if (theirNodeResult.value.numMessages === 0) {
      // If there are no messages, we're done, but something is probably wrong, since we should never have
      // a node with no messages.
      log.warn({ prefix }, "No messages for prefix, skipping");
      return;
    } else if (ourNode?.hash === theirNodeResult.value.hash) {
      // Hashes match, we're done.
      return;
    } else {
      await this.fetchMissingHashesByNode(
        fromNodeMetadataResponse(theirNodeResult.value),
        ourNode,
        rpcClient,
        onMissingHashes,
      );
      return;
    }
  }

  async fetchMissingHashesByNode(
    theirNode: NodeMetadata,
    ourNode: NodeMetadata | undefined,
    rpcClient: HubRpcClient,
    onMissingHashes: (missingHashes: Uint8Array[]) => Promise<void>,
  ): Promise<void> {
    if (this._interruptSync) {
      log.info("Interrupting sync");
      return;
    }

    let fetchMessagesThreshold = HASHES_PER_FETCH;
    // If we have more messages but the hashes still mismatch, we need to find the exact message that's missing.
    if (ourNode && ourNode.numMessages >= theirNode.numMessages) {
      fetchMessagesThreshold = 1;
    }

    // If the other hub's node has fewer than the fetchMessagesThreshold, just fetch them all in go, otherwise, iterate through
    // the node's children and fetch them in batches.
    if (theirNode.numMessages <= fetchMessagesThreshold) {
      const result = await rpcClient.getAllSyncIdsByPrefix(
        TrieNodePrefix.create({ prefix: theirNode.prefix }),
        new Metadata(),
        rpcDeadline(),
      );

      if (result.isErr()) {
        log.warn(result.error, `Error fetching ids for prefix ${theirNode.prefix}`);
      } else {
        // Strip out all syncIds that we already have. This can happen if our node has more messages than the other
        // hub at this node.
        // Note that we can optimize this check for the common case of a single missing syncId, since the diff
        // algorithm will drill down right to the missing syncId.
        let missingHashes = result.value.syncIds;
        if (result.value.syncIds.length === 1) {
          if (await this._trie.existsByBytes(missingHashes[0] as Uint8Array)) {
            missingHashes = [];
          }
        }
        await onMissingHashes(missingHashes);
      }
    } else if (theirNode.children) {
      const promises = [];

      for (const [theirChildChar, theirChild] of theirNode.children.entries()) {
        // recursively fetch hashes for every node where the hashes don't match
        if (ourNode?.children?.get(theirChildChar)?.hash !== theirChild.hash) {
          const r = this.fetchMissingHashesByPrefix(theirChild.prefix, rpcClient, onMissingHashes);

          // If we're fetching more than HASHES_PER_FETCH, we'll wait for the first batch to finish before starting
          // the next.
          if (theirNode.numMessages < HASHES_PER_FETCH * SYNC_PARALLELISM) {
            promises.push(r);
          } else {
            await r;
          }
        }
      }

      await Promise.all(promises);
    } else {
      log.error(
        { theirNode, ourNode },
        `Their node has no children, but has more than ${fetchMessagesThreshold} messages`,
      );
    }
  }

  /** ---------------------------------------------------------------------------------- */
  /**                                      Trie Methods                                  */
  /** ---------------------------------------------------------------------------------- */
  public async addMessage(message: Message): Promise<void> {
    await this._trie.insert(new SyncId(message));
  }

  public async removeMessage(message: Message): Promise<void> {
    await this._trie.deleteBySyncId(new SyncId(message));
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

  public async compactDbIfRequired(messagesLength: number): Promise<boolean> {
    this._messagesSinceLastCompaction += messagesLength;
    if (this.shouldCompactDb && !this._isCompacting) {
      this._isCompacting = true;
      logger.info("Starting DB compaction");

      await this._db.compact().catch((e) => log.warn(e, `Error compacting DB: ${e.message}`));

      logger.info("Completed DB compaction");
      this._messagesSinceLastCompaction = 0;
      this._isCompacting = false;
      return true;
    }
    return false;
  }

  public async getDbStats(): Promise<DbStats> {
    let numFids = 0;
    let numFnames = 0;

    for await (const [,] of this._db.iteratorByPrefix(Buffer.from([RootPrefix.IdRegistryEvent]), {
      keys: false,
      values: false,
    })) {
      numFids += 1;
    }

    for await (const [,] of this._db.iteratorByPrefix(Buffer.from([RootPrefix.NameRegistryEvent]), {
      keys: false,
      values: false,
    })) {
      numFnames += 1;
    }

    return {
      numMessages: await this._trie.items(),
      numFids: numFids,
      numFnames: numFnames,
    };
  }

  public async getSyncStatusForPeer(peerId: string, hub: HubInterface): HubAsyncResult<SyncStatus> {
    const c = this.currentHubPeerContacts.get(peerId);
    if (!c?.peerId || !c?.contactInfo) {
      return err(new HubError("unavailable.network_failure", `No contact info for peer ${peerId}`));
    }
    const rpcClient = await hub.getRPCClientForPeer(c?.peerId, c?.contactInfo);
    if (!rpcClient) {
      return err(new HubError("unavailable.network_failure", `Could not create a RPC client for peer ${peerId}`));
    }
    const peerStateResult = await rpcClient.getSyncSnapshotByPrefix(
      TrieNodePrefix.create({ prefix: new Uint8Array() }),
      new Metadata(),
      rpcDeadline(),
    );
    if (peerStateResult.isErr()) {
      return err(peerStateResult.error);
    }

    const theirSnapshot = peerStateResult.value;
    return this.syncStatus(peerId, theirSnapshot);
  }

  public get shouldCompactDb(): boolean {
    return this._messagesSinceLastCompaction > COMPACTION_THRESHOLD;
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

  private async retryIdRegistryEvent(message: Message, rpcClient: HubRpcClient) {
    const fid = message.data?.fid;
    if (!fid) {
      log.error({ fid }, "Invalid fid while fetching custody event");
      return;
    }

    const custodyEventResult = await rpcClient.getIdRegistryEvent(
      FidRequest.create({ fid }),
      new Metadata(),
      rpcDeadline(),
    );
    if (custodyEventResult.isErr()) {
      log.warn({ fid }, "Failed to fetch custody event from peer");
      return;
    }

    // Get the ethereum block number from the custody event
    const custodyEventBlockNumber = custodyEventResult.value.blockNumber;

    logger.info({ fid }, `Retrying events from block ${custodyEventBlockNumber}`);
    // We'll retry all events from this block number
    await this._ethEventsProvider?.retryEventsFromBlock(custodyEventBlockNumber);
  }

  private async syncUserAndRetryMessage(message: Message, rpcClient: HubRpcClient): Promise<HubResult<number>> {
    const fid = message.data?.fid;
    if (!fid) {
      return err(new HubError("bad_request.invalid_param", "Invalid fid while retrying message"));
    }

    // Probably not required to fetch the signer messages, but doing it here means
    // sync will complete in one round (prevents messages failing to merge due to missed or out of
    // order signer message)
    const signerMessagesResult = await rpcClient.getAllSignerMessagesByFid(
      FidRequest.create({ fid }),
      new Metadata(),
      rpcDeadline(),
    );
    if (signerMessagesResult.isErr()) {
      return err(new HubError("unavailable.network_failure", "Failed to fetch signer messages"));
    }

    const results = await Promise.all(
      signerMessagesResult.value.messages.map((message) => this._hub.submitMessage(message, "sync")),
    );
    if (results.every((r) => r.isErr())) {
      return err(new HubError("unavailable.storage_failure", "Failed to merge signer messages"));
    } else {
      // if at least one signer message was merged, retry the original message
      return (await this._hub.submitMessage(message, "sync")).mapErr((e) => {
        return new HubError("unavailable.storage_failure", e);
      });
    }
  }
}

// RPC Deadline is 5 seconds by default
const rpcDeadline = () => {
  return { deadline: Date.now() + 1000 * 5 };
};

const fromNodeMetadataResponse = (response: TrieNodeMetadataResponse): NodeMetadata => {
  const children = new Map<number, NodeMetadata>();
  for (let i = 0; i < response.children.length; i++) {
    // Safety: i is controlled by the loop
    const child = response.children[i];

    if (child && child.prefix.length > 0) {
      const prefix = child.prefix;
      // Char is the last char of prefix
      const char = prefix[prefix.length - 1] as number;

      children.set(char, {
        numMessages: Number(child?.numMessages),
        prefix,
        hash: child?.hash ?? "",
      });
    }
  }

  return {
    prefix: response.prefix ?? "",
    numMessages: Number(response.numMessages),
    hash: response.hash ?? "",
    children,
  };
};

export default SyncEngine;
