import {
  bytesToHexString,
  ContactInfoContentBody,
  FidRequest,
  getFarcasterTime,
  HubAsyncResult,
  HubError,
  HubResult,
  HubRpcClient,
  MergeMessageHubEvent,
  MergeOnChainEventHubEvent,
  MergeUsernameProofHubEvent,
  Message,
  Metadata,
  OnChainEvent,
  OnChainEventRequest,
  OnChainEventType,
  PruneMessageHubEvent,
  RevokeMessageHubEvent,
  SyncIds,
  TrieNodeMetadataResponse,
  TrieNodePrefix,
  UserNameProof,
  UserNameType,
} from "@farcaster/hub-nodejs";
import { PeerId } from "@libp2p/interface";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { TypedEmitter } from "tiny-typed-emitter";
import { APP_VERSION, FARCASTER_VERSION, Hub, HubInterface } from "../../hubble.js";
import { MerkleTrie, NodeMetadata, TrieSnapshot } from "./merkleTrie.js";
import {
  formatPrefix,
  prefixToTimestamp,
  SyncId,
  SyncIdType,
  TIMESTAMP_LENGTH,
  timestampToPaddedTimestampPrefix,
} from "./syncId.js";
import { getManyMessages } from "../../storage/db/message.js";
import RocksDB from "../../storage/db/rocksdb.js";
import { sleepWhile } from "../../utils/crypto.js";
import { statsd } from "../../utils/statsd.js";
import { logger, messageToLog } from "../../utils/logger.js";
import { OnChainEventPostfix, RootPrefix } from "../../storage/db/types.js";
import {
  bytesCompare,
  bytesStartsWith,
  fromFarcasterTime,
  isIdRegisterOnChainEvent,
  toFarcasterTime,
} from "@farcaster/core";
import { L2EventsProvider } from "../../eth/l2EventsProvider.js";
import { SyncEngineProfiler } from "./syncEngineProfiler.js";
import os from "os";
import { addProgressBar, finishAllProgressBars } from "../../utils/progressBars.js";
import { SingleBar } from "cli-progress";
import { SemVer } from "semver";
import { FNameRegistryEventsProvider } from "../../eth/fnameRegistryEventsProvider.js";
import { PeerScore, PeerScorer } from "./peerScore.js";
import { getOnChainEvent } from "../../storage/db/onChainEvent.js";
import { getUserNameProof } from "../../storage/db/nameRegistryEvent.js";

// Number of seconds to wait for the network to "settle" before syncing. We will only
// attempt to sync messages that are older than this time.
const SYNC_THRESHOLD_IN_SECONDS = 10;
const HASHES_PER_FETCH = 128;
const SYNC_MAX_DURATION = 110 * 60 * 1000; // 110 minutes, just slightly less than the periodic sync job frequency
// 4x the number of CPUs, clamped between 2 and 16
const SYNC_PARALLELISM = Math.max(Math.min(os.cpus().length * 4, 16), 2);
const SYNC_INTERRUPT_TIMEOUT = 30 * 1000; // 30 seconds

// A quick sync will only sync messages that are newer than 2 weeks.
const QUICK_SYNC_PROBABILITY = 0.7; // 70% of the time, we'll do a quick sync
export const QUICK_SYNC_TS_CUTOFF = 2 * 24 * 60 * 60; // 2 days, in seconds

const COMPACTION_THRESHOLD = 100_000; // Sync
const BAD_PEER_BLOCK_TIMEOUT = 5 * 60 * 60 * 1000; // 5 hours, arbitrary, may need to be adjusted as network grows

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
  contactInfo: ContactInfoContentBody;
  peerId: PeerId;
};

export class MergeResult {
  total: number;
  successCount: number;
  deferredCount: number;
  errCount: number;

  constructor(total = 0, successCount = 0, deferredCount = 0, errCount = 0) {
    this.total = total;
    this.successCount = successCount;
    this.deferredCount = deferredCount;
    this.errCount = errCount;
  }

  addResult(result: MergeResult) {
    this.total += result.total;
    this.successCount += result.successCount;
    this.deferredCount += result.deferredCount;
    this.errCount += result.errCount;
  }
}

type DbStats = {
  numItems: number;
  numFids: number;
  numFnames: number;
};

// The Status of the node's sync with the network.
type SyncStatus = {
  isSyncing: boolean;
  inSync: "true" | "false" | "unknown" | "blocked";
  shouldSync: boolean;
  theirSnapshot: TrieSnapshot;
  ourSnapshot: TrieSnapshot;
  divergencePrefix: string;
  divergenceSecondsAgo: number;
  lastBadSync: number;
  score: number;
};

// Status of the current (ongoing) sync.
class CurrentSyncStatus {
  isSyncing = false;
  interruptSync = false;
  peerId: string | undefined;
  startTimestamp?: number;
  fidRetryMessageQ = new Map<number, Message[]>();
  seriousValidationFailures = 0;
  initialSync = false;
  numParallelFetches = 0;

  constructor(peerId?: string) {
    if (peerId) {
      this.peerId = peerId;
      this.isSyncing = true;
      this.startTimestamp = Date.now();
    } else {
      this.peerId = undefined;
      this.isSyncing = false;
      this.startTimestamp = 0;
    }

    this.interruptSync = false;
    this.fidRetryMessageQ = new Map();
  }
}

class SyncEngine extends TypedEmitter<SyncEvents> {
  private readonly _trie: MerkleTrie;
  private readonly _db: RocksDB;
  private readonly _hub: HubInterface;

  private readonly _l2EventsProvider: L2EventsProvider | undefined;
  private readonly _fnameEventsProvider: FNameRegistryEventsProvider | undefined;

  private _currentSyncStatus: CurrentSyncStatus;
  private _syncProfiler?: SyncEngineProfiler;

  private currentHubPeerContacts: Map<string, PeerContact> = new Map();

  // Number of messages waiting to get into the SyncTrie.
  private _syncTrieQ = 0;
  // Number of messages waiting to get into the merge stores.
  private _syncMergeQ = 0;

  // Number of messages since last compaction
  private _messagesSinceLastCompaction = 0;
  private _isCompacting = false;

  // The latest sync snapshot for each peer
  private _peerSyncSnapshot = new Map<string, TrieSnapshot>();

  // Peer Scoring
  private _peerScorer: PeerScorer;

  // Has the syncengine started yet?
  private _started = false;

  private _dbStats: DbStats = {
    numItems: 0,
    numFids: 0,
    numFnames: 0,
  };

  constructor(
    hub: HubInterface,
    rocksDb: RocksDB,
    l2EventsProvider?: L2EventsProvider,
    fnameEventsProvider?: FNameRegistryEventsProvider,
    profileSync = false,
    minSyncWindow?: number,
  ) {
    super();

    this._db = rocksDb;
    this._trie = new MerkleTrie(rocksDb);
    this._l2EventsProvider = l2EventsProvider;
    this._fnameEventsProvider = fnameEventsProvider;

    this._currentSyncStatus = new CurrentSyncStatus();

    if (profileSync) {
      this._syncProfiler = new SyncEngineProfiler();
    }

    this._hub = hub;
    this._peerScorer = new PeerScorer({
      onPeerScoreChanged: this._hub.updateApplicationPeerScore,
      overrideBadSyncWindowThreshold: minSyncWindow,
    });

    this._hub.engine.eventHandler.on("mergeMessage", async (event: MergeMessageHubEvent) => {
      const { message, deletedMessages } = event.mergeMessageBody;
      const totalMessages = 1 + (deletedMessages?.length ?? 0);
      this._syncTrieQ += totalMessages;
      statsd().gauge("merkle_trie.merge_q", this._syncTrieQ);

      const result = await ResultAsync.fromPromise(this.addMessage(message), (e) => e);
      if (result.isErr()) {
        log.error({ err: result.error }, "Failed to add message to sync trie");
      }

      for (const deletedMessage of deletedMessages ?? []) {
        const result = await ResultAsync.fromPromise(this.removeMessage(deletedMessage), (e) => e);
        if (result.isErr()) {
          log.error({ err: result.error }, "Failed to remove message from sync trie");
        }
      }
      this._syncTrieQ -= totalMessages;
    });

    this._hub.engine.eventHandler.on("mergeOnChainEvent", async (event: MergeOnChainEventHubEvent) => {
      const onChainEvent = event.mergeOnChainEventBody.onChainEvent;
      this._syncTrieQ += 1;
      statsd().gauge("merkle_trie.merge_q", this._syncTrieQ);
      const result = await ResultAsync.fromPromise(this.addOnChainEvent(onChainEvent), (e) => e);
      if (result.isErr()) {
        log.error({ err: result.error }, "Failed to add on-chain event to sync trie");
      }
      this._syncTrieQ -= 1;

      // Keep track of total FIDs
      if (isIdRegisterOnChainEvent(event.mergeOnChainEventBody.onChainEvent)) {
        this._dbStats.numFids += 1;
      }
    });

    // Note: There's no guarantee that the message is actually deleted, because the transaction could fail.
    // This is fine, because we'll just end up syncing the message again. It's much worse to miss a removal and cause
    // the trie to diverge in a way that's not recoverable without reconstructing it from the db.
    // Order of events does not matter. The trie will always converge to the same state.
    this._hub.engine.eventHandler.on("pruneMessage", async (event: PruneMessageHubEvent) => {
      this._syncTrieQ += 1;
      statsd().gauge("merkle_trie.merge_q", this._syncTrieQ);
      const result = await ResultAsync.fromPromise(this.removeMessage(event.pruneMessageBody.message), (e) => e);
      if (result.isErr()) {
        log.error({ err: result.error }, "Failed to remove message from sync trie");
      }
      this._syncTrieQ -= 1;
    });

    this._hub.engine.eventHandler.on("revokeMessage", async (event: RevokeMessageHubEvent) => {
      this._syncTrieQ += 1;
      statsd().gauge("merkle_trie.merge_q", this._syncTrieQ);
      const result = await ResultAsync.fromPromise(this.removeMessage(event.revokeMessageBody.message), (e) => e);
      if (result.isErr()) {
        log.error({ err: result.error }, "Failed to remove message from sync trie");
      }
      this._syncTrieQ -= 1;
    });

    this._hub.engine.eventHandler.on("mergeUsernameProofEvent", async (event: MergeUsernameProofHubEvent) => {
      if (event.mergeUsernameProofBody.usernameProofMessage) {
        this._syncTrieQ += 1;
        statsd().gauge("merkle_trie.merge_q", this._syncTrieQ);
        const result = await ResultAsync.fromPromise(
          this.addMessage(event.mergeUsernameProofBody.usernameProofMessage),
          (e) => e,
        );
        if (result.isErr()) {
          log.error({ err: result.error }, "Failed to add username proof message to sync trie");
        }
        this._syncTrieQ -= 1;
      }
      if (event.mergeUsernameProofBody.deletedUsernameProofMessage) {
        this._syncTrieQ += 1;
        statsd().gauge("merkle_trie.merge_q", this._syncTrieQ);
        const result = await ResultAsync.fromPromise(
          this.removeMessage(event.mergeUsernameProofBody.deletedUsernameProofMessage),
          (e) => e,
        );
        if (result.isErr()) {
          log.error({ err: result.error }, "Failed to remove username proof message from sync trie");
        }
        this._syncTrieQ -= 1;
      }
      if (
        event.mergeUsernameProofBody.usernameProof &&
        event.mergeUsernameProofBody.usernameProof.type === UserNameType.USERNAME_TYPE_FNAME &&
        event.mergeUsernameProofBody.usernameProof.fid !== 0 // Deletes should not be added to the trie
      ) {
        this._syncTrieQ += 1;
        statsd().gauge("merkle_trie.merge_q", this._syncTrieQ);
        const result = await ResultAsync.fromPromise(
          this.addFname(event.mergeUsernameProofBody.usernameProof),
          (e) => e,
        );
        if (result.isErr()) {
          log.error(
            { err: result.error, usernameProof: event.mergeUsernameProofBody.usernameProof },
            "Failed to add fname to sync trie",
          );
        }
        this._syncTrieQ -= 1;

        this._dbStats.numFnames += 1;
      }
      if (
        event.mergeUsernameProofBody.deletedUsernameProof &&
        event.mergeUsernameProofBody.deletedUsernameProof.type === UserNameType.USERNAME_TYPE_FNAME
      ) {
        this._syncTrieQ += 1;
        statsd().gauge("merkle_trie.merge_q", this._syncTrieQ);
        const result = await ResultAsync.fromPromise(
          this.removeFname(event.mergeUsernameProofBody.deletedUsernameProof),
          (e) => e,
        );
        if (result.isErr()) {
          log.error(
            { err: result.error, deletedUsernameProof: event.mergeUsernameProofBody.deletedUsernameProof },
            "Failed to remove fname from sync trie",
          );
        }
        this._syncTrieQ -= 1;

        this._dbStats.numFnames -= 1;
      }
    });
    this._hub.engine.on("duplicateUserNameProofEvent", async (event: UserNameProof) => {
      const syncId = SyncId.fromFName(event);
      if (!(await this.trie.exists(syncId))) {
        const result = await ResultAsync.fromPromise(this._trie.insert(syncId), (e) => e);
        if (result.isErr()) {
          log.error({ err: result.error }, "Failed to add fname to sync trie (duplicateUserNameProofEvent)");
        }
      }
    });
    this._hub.engine.on("duplicateOnChainEvent", async (event: OnChainEvent) => {
      const syncId = SyncId.fromOnChainEvent(event);
      if (!(await this.trie.exists(syncId))) {
        const result = await ResultAsync.fromPromise(this._trie.insert(syncId), (e) => e);
        if (result.isErr()) {
          log.error({ err: result.error }, "Failed to add on-chain event to sync trie");
        }
      }
    });
  }

  public get syncTrieQSize(): number {
    return this._syncTrieQ;
  }

  public get syncMergeQSize(): number {
    return this._syncMergeQ;
  }

  public avgPeerNumMessages(): number {
    const filtered = Array.from(this._peerSyncSnapshot.values()).filter((snapshot) => snapshot.numMessages > 0);
    const total = filtered.reduce((acc, snapshot) => acc + snapshot.numMessages, 0);
    return filtered.length ? total / filtered.length : 0;
  }

  public isStarted(): boolean {
    return this._started;
  }

  public async start(rebuildSyncTrie = false) {
    // Check if we need to rebuild sync trie
    if (rebuildSyncTrie) {
      await this.rebuildSyncTrie();
    } else {
      // Wait for the Merkle trie to be fully loaded
      await this._trie.initialize();
    }

    const rootHash = await this._trie.rootHash();

    // Read the initial DB stats
    this._dbStats = await this.readDbStatsFromDb();

    this._started = true;
    log.info({ rootHash }, "Sync engine initialized");
  }

  /** Rebuild the entire Sync Trie */
  public async rebuildSyncTrie() {
    log.info("Rebuilding sync trie...");
    await this._trie.rebuild();
    log.info("Rebuilding sync trie complete");
  }

  /** Revoke the individual syncIDs in the Sync Trie */
  public async revokeSyncIds(syncIds: SyncId[]) {
    for (const syncId of syncIds) {
      await this._trie.deleteByBytes(syncId.syncId());
    }
  }

  public async stop() {
    // Interrupt any ongoing sync
    this._currentSyncStatus.interruptSync = true;

    // Wait for syncing to stop.
    try {
      await sleepWhile(() => this._currentSyncStatus.isSyncing, SYNC_INTERRUPT_TIMEOUT);
      await sleepWhile(() => this.syncTrieQSize > 0, SYNC_INTERRUPT_TIMEOUT);
    } catch (e) {
      log.error({ err: e }, "Interrupting sync timed out");
    }

    await this._trie.stop();

    this._started = false;
    this._currentSyncStatus.interruptSync = false;
    log.info("Sync engine stopped");
  }

  public getBadPeerIds(): string[] {
    return this._peerScorer.getBadPeerIds();
  }

  public getPeerScore(peerId: string): PeerScore | undefined {
    return this._peerScorer.getScore(peerId)?.clone();
  }

  public getSyncProfile(): SyncEngineProfiler | undefined {
    return this._syncProfiler;
  }

  public isSyncing(): boolean {
    return this._currentSyncStatus.isSyncing;
  }

  public getPeerCount(): number {
    return this.currentHubPeerContacts.size;
  }

  public getContactInfoForPeerId(peerId: string): PeerContact | undefined {
    return this.currentHubPeerContacts.get(peerId);
  }

  public getCurrentHubPeerContacts() {
    return this.currentHubPeerContacts.values();
  }

  public addContactInfoForPeerId(peerId: PeerId, contactInfo: ContactInfoContentBody) {
    const existingPeerInfo = this.getContactInfoForPeerId(peerId.toString());
    if (existingPeerInfo) {
      if (contactInfo.timestamp > existingPeerInfo.contactInfo.timestamp) {
        this.currentHubPeerContacts.set(peerId.toString(), { peerId, contactInfo });
      }
      return err(new HubError("bad_request.duplicate", "peer already exists"));
    } else {
      this.currentHubPeerContacts.set(peerId.toString(), { peerId, contactInfo });
    }
    log.info(
      {
        peerInfo: contactInfo,
        theirMessages: contactInfo.count,
        peerNetwork: contactInfo.network,
        peerVersion: contactInfo.hubVersion,
        peerAppVersion: contactInfo.appVersion,
        connectedPeers: this.getPeerCount(),
        peerId: peerId.toString(),
        isNew: !!existingPeerInfo,
        gossipDelay: (Date.now() - contactInfo.timestamp) / 1000,
      },
      "Updated Peer ContactInfo",
    );
    return ok(undefined);
  }

  public removeContactInfoForPeerId(peerId: string) {
    this.currentHubPeerContacts.delete(peerId);
  }

  /** ---------------------------------------------------------------------------------- */
  /**                                      Sync Methods                                  */
  /** ---------------------------------------------------------------------------------- */

  public async diffSyncIfRequired(hub: Hub, peerIdString?: string) {
    this.emit("syncStart");

    // Log the version number for the dashboard
    const fcversion = new SemVer(FARCASTER_VERSION);
    statsd().gauge("farcaster.fcversion.major", fcversion.major);
    statsd().gauge("farcaster.fcversion.minor", fcversion.minor);
    statsd().gauge("farcaster.fcversion.patch", fcversion.patch);

    const appversion = new SemVer(APP_VERSION);
    statsd().gauge("farcaster.appversion.major", appversion.major);
    statsd().gauge("farcaster.appversion.minor", appversion.minor);
    statsd().gauge("farcaster.appversion.patch", appversion.patch);

    if (this.currentHubPeerContacts.size === 0) {
      log.warn("Diffsync: No peer contacts, skipping sync");
      this.emit("syncComplete", false);

      if (!this._currentSyncStatus.isSyncing) {
        finishAllProgressBars(true);
      }
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
      let peers: PeerContact[] = [];

      // Prefer hubs that have more messages than us, if no such hub is available, pick a random one
      const snapshotResult = await this.getSnapshot();
      if (snapshotResult.isOk()) {
        // Use a buffer of 5% of our messages so the peer with the highest message count does not get picked
        // disproportionately
        const messageThreshold = snapshotResult.value.numMessages * 0.95;
        peers = Array.from(this.currentHubPeerContacts.values()).filter((p) => p.contactInfo.count > messageThreshold);
      }

      if (peers.length === 0) {
        peers = Array.from(this.currentHubPeerContacts.values());
        log.info(
          { peersCount: this.currentHubPeerContacts.size, eligiblePeers: peers.length },
          `Diffsync: Choosing random peer among ${peers.length} peers with fewer messages`,
        );
      } else {
        log.info(
          { peersCount: this.currentHubPeerContacts.size, eligiblePeers: peers.length },
          `Diffsync: Choosing random peer among ${peers.length} peers with more messages`,
        );
      }
      const randomPeer = peers[Math.floor(Math.random() * peers.length)];
      peerContact = randomPeer?.contactInfo;
      peerId = randomPeer?.peerId;
    }

    // If we still don't have a peer, skip the sync
    if (!peerContact || !peerId) {
      log.warn({ peerContact, peerId }, "Diffsync: No contact info for peer, skipping sync");
      this.emit("syncComplete", false);

      if (!this._currentSyncStatus.isSyncing) {
        finishAllProgressBars(true);
      }
      return;
    }

    const updatedPeerIdString = peerId.toString();
    let rpcClient = await hub.getRPCClientForPeer(peerId, peerContact);
    if (!rpcClient) {
      log.warn("Diffsync: Failed to get RPC client for peer, skipping sync");
      // If we're unable to reach the peer, remove it from our contact list. We'll retry when it's added back by
      // the periodic ContactInfo gossip job.
      this.removeContactInfoForPeerId(updatedPeerIdString);
      this.emit("syncComplete", false);

      if (!this._currentSyncStatus.isSyncing) {
        finishAllProgressBars(true);
      }
      return;
    }

    // If a sync profile is enabled, wrap the rpcClient in a profiler
    if (this._syncProfiler) {
      rpcClient = this._syncProfiler.profiledRpcClient(rpcClient);
    }

    try {
      // First, get the latest state and info from the peer
      const peerStateResult = await rpcClient.getSyncSnapshotByPrefix(
        TrieNodePrefix.create({ prefix: new Uint8Array() }),
        new Metadata(),
        rpcDeadline(),
      );
      const peerInfo = await rpcClient.getInfo({ dbStats: false }, new Metadata(), rpcDeadline());

      if (peerStateResult.isErr()) {
        log.warn(
          { error: peerStateResult.error, errMsg: peerStateResult.error.message, peerId, peerContact },
          "Diffsync: Failed to get peer state, skipping sync",
        );
        this.emit("syncComplete", false);

        if (!this._currentSyncStatus.isSyncing) {
          finishAllProgressBars(true);
        }
        return;
      }

      const peerState = peerStateResult.value;
      const syncStatusResult = await this.syncStatus(updatedPeerIdString, peerState);
      if (syncStatusResult.isErr()) {
        log.warn("Diffsync: Failed to get shouldSync");
        this.emit("syncComplete", false);

        if (!this._currentSyncStatus.isSyncing) {
          finishAllProgressBars(true);
        }
        return;
      }

      // Log sync status for visibility
      const syncStatus = syncStatusResult.value;
      log.info(
        {
          peerId,
          hubOperatorFid: peerInfo.map((info) => info.hubOperatorFid).unwrapOr(0),
          inSync: syncStatus.inSync,
          isSyncing: syncStatus.isSyncing,
          shouldSync: syncStatus.shouldSync,
          theirMessages: syncStatus.theirSnapshot.numMessages,
          ourMessages: syncStatus.ourSnapshot?.numMessages,
          peerNetwork: peerContact.network,
          peerVersion: peerContact.hubVersion,
          peerAppVersion: peerContact.appVersion,
          divergencePrefix: syncStatus.divergencePrefix,
          divergenceSeconds: syncStatus.divergenceSecondsAgo,
          lastBadSync: syncStatus.lastBadSync,
        },
        "DiffSync: SyncStatus", // Search for this string in the logs to get summary of sync status
      );

      // Save the peer's sync snapshot
      this._peerSyncSnapshot.set(updatedPeerIdString, syncStatus.theirSnapshot);

      if (syncStatus.shouldSync === true) {
        const start = Date.now();

        // Do a quick sync with a 70% chance. A quick sync will only sync messages that are newer than 2 weeks.
        const isQuickSync = Math.random() < QUICK_SYNC_PROBABILITY;
        const quickSyncCutoff = isQuickSync
          ? toFarcasterTime(Date.now() - QUICK_SYNC_TS_CUTOFF * 1000).unwrapOr(-1)
          : -1;

        log.info({ peerId, isQuickSync, quickSyncCutoff }, "Diffsync: Starting Sync with peer");
        const result = await this.performSync(updatedPeerIdString, peerState, rpcClient, true, quickSyncCutoff);

        log.info({ peerId, result, timeTakenMs: Date.now() - start }, "Diffsync: complete");
        this.emit("syncComplete", true);
        return;
      } else {
        log.info({ peerId }, "DiffSync: No need to sync");
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
    const ourSnapshotResult = await this.getSnapshot(theirSnapshot.prefix);

    if (ourSnapshotResult.isErr()) {
      return err(ourSnapshotResult.error);
    }
    const ourSnapshot = ourSnapshotResult.value;

    const peerScore = this._peerScorer.getScore(peerId);
    const lastBadSync = peerScore?.lastBadSyncTime;
    const isSyncing = this._currentSyncStatus.isSyncing;

    if (lastBadSync && Date.now() < lastBadSync + BAD_PEER_BLOCK_TIMEOUT) {
      return ok({
        isSyncing: false,
        inSync: "blocked",
        shouldSync: false,
        theirSnapshot,
        ourSnapshot,
        divergencePrefix: "",
        divergenceSecondsAgo: -1,
        lastBadSync: lastBadSync,
        score: peerScore?.score ?? 0,
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
      isSyncing,
      inSync: excludedHashesMatch ? "true" : "false",
      shouldSync: !isSyncing && !excludedHashesMatch,
      ourSnapshot,
      theirSnapshot,
      divergencePrefix,
      divergenceSecondsAgo,
      lastBadSync: lastBadSync ?? -1,
      score: peerScore?.score ?? 0,
    });
  }

  async performSync(
    peerId: string,
    otherSnapshot: TrieSnapshot,
    rpcClient: HubRpcClient,
    doAudit = false,
    quickSyncCutoff = -1,
  ): Promise<MergeResult> {
    log.info({ peerId }, "Perform sync: Start");

    const start = Date.now();
    const fullSyncResult = new MergeResult();

    this._currentSyncStatus = new CurrentSyncStatus(peerId);
    const syncTimeout = setTimeout(() => {
      this._currentSyncStatus.interruptSync = true;
      log.warn({ peerId, durationMs: Date.now() - start }, "Perform sync: Sync timed out, interrupting sync");
    }, SYNC_MAX_DURATION);

    try {
      // Get the snapshot of our trie, at the same prefix as the peer's snapshot
      const snapshot = await this.getSnapshot(otherSnapshot.prefix);
      if (snapshot.isErr()) {
        log.warn({ errCode: snapshot.error.errCode, errorMessage: snapshot.error.message }, "Perform sync: Error");
      } else {
        const ourSnapshot = snapshot.value;

        let progressBar: SingleBar | undefined;

        const missingMessages = otherSnapshot.numMessages - ourSnapshot.numMessages;
        if (missingMessages > 1_000_000) {
          this._currentSyncStatus.initialSync = true;
          progressBar = addProgressBar(
            ourSnapshot.numMessages === 0 ? "Initial Sync" : "Catchup Sync",
            missingMessages,
          );
        } else {
          this._currentSyncStatus.initialSync = false;
          finishAllProgressBars(true);
        }

        const divergencePrefix = this.getDivergencePrefix(ourSnapshot, otherSnapshot.excludedHashes);
        log.info(
          {
            divergencePrefix: Buffer.from(divergencePrefix).toString("ascii"),
            divergencePrefixBuffer: divergencePrefix,
            prefix: Buffer.from(ourSnapshot.prefix).toString("ascii"),
            prefixBuffer: ourSnapshot.prefix,
          },
          "Divergence prefix",
        );

        let auditPeerPromise: Promise<void>;
        if (doAudit) {
          auditPeerPromise = this.auditPeer(peerId, rpcClient);
        } else {
          auditPeerPromise = Promise.resolve();
        }

        await this.compareNodeAtPrefix(
          divergencePrefix,
          rpcClient,
          async (missingIds: Uint8Array[]) => {
            const missingSyncIds = missingIds.map((id) => SyncId.fromBytes(id));
            const missingMessageIds = missingSyncIds.filter((id) => id.type() === SyncIdType.Message);

            // Merge on chain events first
            const result = await this.validateAndMergeOnChainEvents(
              missingSyncIds.filter((id) => id.type() === SyncIdType.OnChainEvent),
            );

            // Then Fnames
            const fnameResult = await this.validateAndMergeFnames(
              missingSyncIds.filter((id) => id.type() === SyncIdType.FName),
            );
            result.addResult(fnameResult);

            // And finally messages
            const messagesResult = await this.fetchAndMergeMessages(missingMessageIds, rpcClient, quickSyncCutoff);
            result.addResult(messagesResult);

            fullSyncResult.addResult(result);
            progressBar?.increment(result.total);

            const avgPeerNumMessages = this.avgPeerNumMessages();
            statsd().gauge(
              "syncengine.sync_percent",
              avgPeerNumMessages > 0 ? Math.min(1, (await this.trie.items()) / avgPeerNumMessages) : 0,
            );

            statsd().increment("syncengine.sync_messages.success", result.successCount);
            statsd().increment("syncengine.sync_messages.error", result.errCount);
            statsd().increment("syncengine.sync_messages.deferred", result.deferredCount);
          },
          quickSyncCutoff,
        );

        await auditPeerPromise; // Wait for audit to complete

        log.info({ syncResult: fullSyncResult }, "Perform sync: Sync Complete");
        statsd().timing("syncengine.sync_time_ms", Date.now() - start);
      }
    } catch (e) {
      log.warn(e, "Perform sync: Error");
    } finally {
      this._currentSyncStatus.isSyncing = false;
      this._currentSyncStatus.interruptSync = false;

      clearTimeout(syncTimeout);

      this._peerScorer.updateLastSync(peerId, fullSyncResult);

      if (this._currentSyncStatus.initialSync) {
        finishAllProgressBars(true);
      }
    }

    return fullSyncResult;
  }

  // We will get a few messages that we already have from this peer, to make sure that the peer is being honest
  // and is returning the correct messages. If the peer is not being honest, we will score them down.
  async auditPeer(peerId: string, rpcClient: HubRpcClient) {
    // Start at the root node, and go down a random path
    let node = await this._trie.getTrieNodeMetadata(new Uint8Array());
    while (node && node.numMessages > 5) {
      // Pick a random child from the Map of children
      const children = Array.from(node.children?.entries() ?? []);
      const [, randomChild] = children[Math.floor(Math.random() * children.length)] ?? [];
      if (!randomChild) {
        break;
      }
      node = await this._trie.getTrieNodeMetadata(randomChild.prefix);
    }

    if (!node) {
      return;
    }

    // If we found a node, we'll audit it. Fetch upto 5 of the messages of this node
    // from the peer and make sure they match what we have.
    const syncIdBytes = (await this._trie.getAllValues(node.prefix)).slice(0, 5);
    const syncIds = syncIdBytes.map((id) => SyncId.fromBytes(id));
    const messagesResult = await rpcClient.getAllMessagesBySyncIds(
      SyncIds.create({ syncIds: syncIdBytes }),
      new Metadata(),
      rpcDeadline(),
    );

    if (messagesResult.isErr()) {
      log.warn(err, "PeerError: Error fetching messages for audit");
      this._peerScorer.decrementScore(peerId);
      return;
    }

    const mismatched = !this.validateFetchedMessagesAgainstSyncIds(syncIds, messagesResult.value.messages);
    if (mismatched) {
      log.warn(
        { syncIds, messages: messagesResult.value, peerId },
        "PeerError: Fetched Messages do not match SyncIDs requested during audit",
      );
      this._peerScorer.decrementScore(this._currentSyncStatus.peerId?.toString());
      return;
    }

    // Get our own messages for the same syncIDs
    const ourMessagesResult = await this.getAllMessagesBySyncIds(syncIds);
    if (ourMessagesResult.isErr()) {
      log.warn(err, "PeerError: Error fetching our messages for audit");
      return;
    }

    // And make sure that for each message in our Messages, the peer has the same message
    const anyFailed =
      (
        await Promise.all(
          ourMessagesResult.value.map(async (message) => {
            const peerMessage = messagesResult.value.messages.find((m) => bytesCompare(m.hash, message.hash) === 0);
            if (!peerMessage) {
              log.warn({ message: messageToLog(message), peerId }, "PeerError: Peer is missing message during audit");
              return "failed";
            } else {
              const validateResult = await this._hub.engine.validateMessage(peerMessage);
              if (validateResult.isErr()) {
                log.warn(
                  { err: validateResult.error, peerMessage: Message.toJSON(peerMessage), peerId },
                  "PeerError: Peer has message validation failure during audit",
                );
                return "failed";
              }
              if (bytesCompare(message.hash, peerMessage.hash) !== 0) {
                log.warn(
                  { ourJSON: Message.toJSON(message), peerJSON: Message.toJSON(peerMessage), peerId },
                  "PeerError: Peer has different message hash during audit",
                );
                return "failed";
              }
            }
            return "passed";
          }),
        )
      ).find((result) => result === "failed") ?? false;

    // If peer passed the audit, score them up
    if (!anyFailed) {
      this._peerScorer.incrementScore(peerId);
      const peerScore = this._peerScorer.getScore(peerId)?.score ?? 0;
      log.info({ peerId, numMessages: syncIds.length, scoreAfter: peerScore }, "Peer passed audit");
    } else {
      this._peerScorer.decrementScore(peerId, 10);
      log.warn({ peerId, numMessages: syncIds.length }, "Peer failed audit");
    }
  }

  async getAllMessagesBySyncIds(syncIds: SyncId[]): HubAsyncResult<Message[]> {
    const msgPKs: Buffer[] = [];
    for (const syncId of syncIds) {
      const unpacked = syncId.unpack();
      if (unpacked.type === SyncIdType.Message) {
        msgPKs.push(Buffer.from(unpacked.primaryKey));
      }
    }
    return ResultAsync.fromPromise(getManyMessages(this._db, msgPKs), (e) => e as HubError);
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

  public async validateAndMergeFnames(syncIds: SyncId[]): Promise<MergeResult> {
    if (syncIds.length === 0) {
      return new MergeResult();
    }
    const promises: Promise<void>[] = [];
    for (const syncId of syncIds) {
      const unpacked = syncId.unpack();
      if (unpacked.type === SyncIdType.FName && this._fnameEventsProvider) {
        log.info(`Retrying missing fname ${Buffer.from(unpacked.name).toString("utf-8")} during sync`, {
          fid: unpacked.fid,
        });
        promises.push(this._fnameEventsProvider.retryTransferByName(unpacked.name));
      }
    }
    await Promise.all(promises);
    return new MergeResult(syncIds.length, promises.length, 0, syncIds.length - promises.length);
  }

  public async validateAndMergeOnChainEvents(syncIds: SyncId[]): Promise<MergeResult> {
    if (syncIds.length === 0) {
      return new MergeResult();
    }
    const promises: Promise<void>[] = [];
    for (const syncId of syncIds) {
      const unpacked = syncId.unpack();
      if (unpacked.type === SyncIdType.OnChainEvent && this._l2EventsProvider) {
        log.info(`Retrying missing block ${unpacked.blockNumber} during sync`, { fid: unpacked.fid });
        promises.push(this._l2EventsProvider.retryEventsFromBlock(unpacked.blockNumber));
      }
    }
    await Promise.all(promises);
    return new MergeResult(syncIds.length, promises.length, 0, syncIds.length - promises.length);
  }

  public async fetchAndMergeMessages(
    syncIds: SyncId[],
    rpcClient: HubRpcClient,
    quickSyncCutoff: number,
  ): Promise<MergeResult> {
    if (syncIds.length === 0) {
      return new MergeResult(); // empty merge result
    }

    let filteredSyncIds = syncIds;
    if (quickSyncCutoff > 0) {
      const startSyncIDs = syncIds.length;
      const exists = await Promise.all(syncIds.map((s) => this.trie.exists(s)));
      filteredSyncIds = syncIds.filter((_, i) => !exists[i]);
      log.info(
        { startSyncIDs, filteredSyncIds: filteredSyncIds.length, peer: this._currentSyncStatus.peerId },
        "Fetching messages for sync",
      );
    }

    let result = new MergeResult();
    const start = Date.now();

    const messagesResult = await rpcClient.getAllMessagesBySyncIds(
      SyncIds.create({ syncIds: filteredSyncIds.map((s) => s.syncId()) }),
      new Metadata(),
      rpcDeadline(),
    );

    statsd().timing("syncengine.peer.get_all_messages_by_syncids_ms", Date.now() - start);

    await messagesResult.match(
      async (msgs) => {
        // Make sure that the messages are actually for the SyncIDs
        const mismatched = !this.validateFetchedMessagesAgainstSyncIds(syncIds, msgs.messages);

        if (mismatched) {
          log.warn(
            { syncIds, messages: msgs.messages, peer: this._currentSyncStatus.peerId },
            "PeerError: Fetched Messages do not match SyncIDs requested",
          );
          this._peerScorer.decrementScore(this._currentSyncStatus.peerId?.toString());
        } else {
          statsd().increment("syncengine.peer_counts.get_all_messages_by_syncids", msgs.messages.length);
          result = await this.mergeMessages(msgs.messages, rpcClient);
        }
      },
      async (err) => {
        // e.g. Node goes down while we're performing the sync. No need to handle it, the next round of sync will retry.
        log.warn(err, "PeerError: Error fetching messages for sync");
      },
    );
    return result;
  }

  private validateFetchedMessagesAgainstSyncIds(syncIds: SyncId[], messages: Message[]): boolean {
    // Make sure that the messages are actually for the SyncIDs
    const syncIdHashes = new Set(
      syncIds
        .map((syncId) => syncId.unpack())
        .map((syncId) => (syncId.type === SyncIdType.Message ? bytesToHexString(syncId.hash).unwrapOr("") : ""))
        .filter((str) => str !== ""),
    );

    // Go over the SyncID hashes and the messages and make sure that the messages are for the SyncIDs
    return messages.every((msg) => syncIdHashes.has(bytesToHexString(msg.hash).unwrapOr("0xUnknown")));
  }

  public async mergeMessages(messages: Message[], rpcClient: HubRpcClient): Promise<MergeResult> {
    const mergeResults: HubResult<number>[] = [];
    let deferredCount = 0;
    let errCount = 0;
    // First, sort the messages by timestamp to reduce thrashing and refetching
    messages.sort((a, b) => (a.data?.timestamp || 0) - (b.data?.timestamp || 0));

    // Merge messages sequentially, so we can handle missing users.
    this._syncMergeQ += messages.length;
    statsd().gauge("syncengine.merge_q", this._syncMergeQ);

    const startTime = Date.now();
    for (const msg of messages) {
      const result = await this._hub.submitMessage(msg, "sync");

      if (result.isErr()) {
        if (result.error.errCode === "bad_request.validation_failure") {
          if (result.error.message.startsWith("invalid signer")) {
            // The user's signer was not found. So fetch all signers from the peer and retry.
            const retryResult = await this.syncSignersAndRetryMessage(msg, rpcClient);
            const retryResultErrorMessage = retryResult.isErr() ? retryResult.error.message : "";
            log.warn(
              {
                fid: msg.data?.fid,
                err: result.error.message,
                signer: bytesToHexString(msg.signer)._unsafeUnwrap(),
                retryResult: { ...retryResult, retryResultErrorMessage },
                peerId: this._currentSyncStatus.peerId,
              },
              "Unknown signer, fetched all signers from peer",
            );

            mergeResults.push(retryResult);
          } else if (result.error.message.startsWith("unknown fid")) {
            // We've missed this user's ID registry event? This is somewhat unlikely, but possible
            // if we don't get all the events from the Ethereum RPC provider.
            // We'll do it in the background, since this will not block the sync.
            setTimeout(async () => {
              log.warn(
                { fid: msg.data?.fid, err: result.error.message, peerId: this._currentSyncStatus.peerId },
                `Unknown fid ${msg.data?.fid}, reprocessing ID registry event`,
              );
              await this.retryIdRegistryEvent(msg, rpcClient);
            }, 0);

            // We'll push this message as a failure, and we'll retry it on the next sync.
            mergeResults.push(result);
            deferredCount += 1;
          } else {
            // These are very serious validation errors, caused only by
            // 1. A malfunctioning or malicious peer
            // 2. A bug in the Hub
            // So log the errors as "warn"
            log.warn(
              { fid: msg.data?.fid, err: result.error.message, peerId: this._currentSyncStatus.peerId },
              "PeerError: Unexpected validation error",
            );
            this._peerScorer.decrementScore(this._currentSyncStatus.peerId?.toString());
            this._currentSyncStatus.seriousValidationFailures += 1;
            errCount += 1;
          }
        } else if (result.error.errCode === "bad_request.duplicate") {
          // This message has been merged into the DB, but for some reason is not in the Trie.
          // Just update the trie.
          await this.trie.insert(SyncId.fromMessage(msg));
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
    statsd().gauge("syncengine.merge_q", this._syncMergeQ);

    if (this._syncProfiler) {
      this._syncProfiler.getMethodProfile("mergeMessages").addCall(Date.now() - startTime, 0, messages.length);
    }

    const successCount = mergeResults.filter((r) => r.isOk()).length;
    const result = new MergeResult(mergeResults.length, successCount, deferredCount, errCount);

    if (mergeResults.length > 0) {
      log.info(result, "Merged messages during sync");
    }

    return result;
  }

  async compareNodeAtPrefix(
    prefix: Uint8Array,
    rpcClient: HubRpcClient,
    onMissingHashes: (missingHashes: Uint8Array[]) => Promise<void>,
    quickSyncTsCutoff = -1,
  ): Promise<number> {
    // Check if we should interrupt the sync
    if (this._currentSyncStatus.interruptSync) {
      log.info("Interrupting sync");
      return -1;
    }

    // If the prefix is before the cutoff, then we won't recurse into this node.
    if (quickSyncTsCutoff >= 0) {
      // We won't recurse into nodes if they are older than the cutoff. To do this, we'll compare the prefix
      // with a max timestamp prefix. If the prefix is older than the cutoff, we'll skip it.
      const tsPrefix = Buffer.from(prefix.slice(0, 10)).toString("ascii");
      const maxTs = parseInt(tsPrefix.padEnd(TIMESTAMP_LENGTH, "9"), 10); // pad with 9s to get the max timestamp
      if (maxTs < quickSyncTsCutoff) {
        log.debug({ prefix, maxTs, tsCutoff: quickSyncTsCutoff }, "Skipping prefix before cutoff");
        return 0;
      }
    }

    const ourNode = await this._trie.getTrieNodeMetadata(prefix);
    const start = Date.now();
    const theirNodeResult = await rpcClient.getSyncMetadataByPrefix(
      TrieNodePrefix.create({ prefix }),
      new Metadata(),
      rpcDeadline(),
    );
    statsd().timing("syncengine.peer.get_syncmetadata_by_prefix_ms", Date.now() - start);

    if (theirNodeResult.isErr()) {
      log.warn(theirNodeResult.error, `Error fetching metadata for prefix ${prefix}`);
      return -2;
    } else if (theirNodeResult.value.numMessages === 0) {
      // If there are no messages, we're done, but something is probably wrong, since we should never have
      // a node with no messages.
      await this.revokeCorruptedSyncIds(ourNode);
      log.warn({ prefix, peerId: this._currentSyncStatus.peerId }, "No messages for prefix, skipping");
      return -3;
    } else if (ourNode?.hash === theirNodeResult.value.hash) {
      // Hashes match, we're done.
      return 0;
    } else {
      await this.fetchMissingHashesByNode(
        fromNodeMetadataResponse(theirNodeResult.value),
        ourNode,
        rpcClient,
        onMissingHashes,
        quickSyncTsCutoff,
      );
      return 1;
    }
  }

  async fetchMissingHashesByNode(
    theirNode: NodeMetadata,
    ourNode: NodeMetadata | undefined,
    rpcClient: HubRpcClient,
    onMissingHashes: (missingHashes: Uint8Array[]) => Promise<void>,
    quickSyncTsCutoff: number,
  ): Promise<void> {
    if (this._currentSyncStatus.interruptSync) {
      log.info("Interrupting sync");
      return;
    }

    const start = Date.now();
    let fetchedMessages = 0;
    let revokedSyncIds = 0;
    let numChildrenFetched = 0;
    let numChildrenSkipped = 0;

    let fetchMessagesThreshold = HASHES_PER_FETCH;
    // If we have more messages but the hashes still mismatch, we need to find the exact message that's missing.
    if (ourNode && ourNode.numMessages >= 1) {
      fetchMessagesThreshold = HASHES_PER_FETCH / 2;
    }

    // If the other hub's node has fewer than the fetchMessagesThreshold, just fetch them all in go, otherwise, iterate through
    // the node's children and fetch them in batches.
    if (theirNode.numMessages <= fetchMessagesThreshold) {
      const start = Date.now();
      const result = await rpcClient.getAllSyncIdsByPrefix(
        TrieNodePrefix.create({ prefix: theirNode.prefix }),
        new Metadata(),
        rpcDeadline(),
      );
      statsd().timing("syncengine.peer.get_all_syncids_by_prefix_ms", Date.now() - start);

      if (result.isErr()) {
        log.warn(result.error, `Error fetching ids for prefix ${theirNode.prefix}`);
        this._peerScorer.decrementScore(this._currentSyncStatus.peerId?.toString());
      } else {
        // Verify that the returned syncIDs actually have the prefix we requested.
        if (!this.verifySyncIdForPrefix(theirNode.prefix, result.value.syncIds)) {
          log.warn(
            { prefix: theirNode.prefix, syncIds: result.value.syncIds, peerId: this._currentSyncStatus.peerId },
            "PeerError: Received syncIds that don't match prefix, aborting trie branch",
          );
          this._peerScorer.decrementScore(this._currentSyncStatus.peerId?.toString());
          return;
        }
        statsd().increment("syncengine.peer_counts.get_all_syncids_by_prefix", result.value.syncIds.length);

        // Strip out all syncIds that we already have. This can happen if our node has more messages than the other
        // hub at this node.
        // Note that we can optimize this check for the common case of a single missing syncId, since the diff
        // algorithm will drill down right to the missing syncId.
        let missingHashes = result.value.syncIds;
        if (result.value.syncIds.length === 1) {
          if (await this._trie.existsByBytes(missingHashes[0] as Uint8Array)) {
            missingHashes = [];
            statsd().increment("syncengine.peer_counts.get_all_syncids_by_prefix_already_exists", 1);

            revokedSyncIds += await this.revokeCorruptedSyncIds(ourNode);
          }
        }
        fetchedMessages = missingHashes.length;
        await onMissingHashes(missingHashes);
      }
    } else if (theirNode.children) {
      const promises = [];

      const entriesArray = [...theirNode.children.entries()]; // Convert entries to an array
      const reversedEntries = entriesArray.reverse(); // Reverse the array

      for (const [theirChildChar, theirChild] of reversedEntries) {
        // recursively fetch hashes for every node where the hashes don't match
        if (ourNode?.children?.get(theirChildChar)?.hash !== theirChild.hash) {
          const r = this.compareNodeAtPrefix(theirChild.prefix, rpcClient, onMissingHashes, quickSyncTsCutoff);
          numChildrenFetched += 1;

          // If we're fetching more than HASHES_PER_FETCH, we'll wait for the first batch to finish before starting
          // the next.
          if (this._currentSyncStatus.numParallelFetches < SYNC_PARALLELISM) {
            promises.push(r);

            this._currentSyncStatus.numParallelFetches += 1;
          } else {
            await r;
          }
        } else {
          // Hashes match, not recursively fetching
          numChildrenSkipped += 1;
        }
      }

      const theirKeys = new Set(theirNode.children.keys());
      const theirMissingKeys = [...(ourNode?.children?.keys() || [])].filter((x) => !theirKeys.has(x));
      for (const theirMissingKey of theirMissingKeys) {
        const ourPrefixMissingInTheirs = ourNode?.children?.get(theirMissingKey);
        await this.revokeCorruptedSyncIds(ourPrefixMissingInTheirs);
      }

      const r = await Promise.all(promises);
      this._currentSyncStatus.numParallelFetches -= r.length;
    } else {
      log.error(
        { theirNode, ourNode },
        `Their node has no children, but has more than ${fetchMessagesThreshold} messages`,
      );
    }

    const end = Date.now();
    if (this._syncProfiler) {
      this._syncProfiler.writeNodeProfile(
        `${formatPrefix(theirNode.prefix)}, ${end - start}, ${ourNode?.numMessages ?? 0}, ${
          theirNode.numMessages
        }, ${fetchedMessages}, ${revokedSyncIds}, ${numChildrenFetched}, ${numChildrenSkipped}, ${
          this._currentSyncStatus.numParallelFetches
        }`,
      );
    }
  }

  public findCorruptedSyncIDs(messages: Message[], syncIds: SyncId[]): SyncId[] {
    return messages
      .map((message, i) => (message.data === undefined || message.hash.length === 0 ? syncIds[i] : undefined))
      .filter((i) => i !== undefined) as SyncId[];
  }

  /** ---------------------------------------------------------------------------------- */
  /**                                      Trie Methods                                  */
  /** ---------------------------------------------------------------------------------- */
  public async addMessage(message: Message): Promise<void> {
    await this._trie.insert(SyncId.fromMessage(message));
  }

  public async addOnChainEvent(event: OnChainEvent): Promise<void> {
    await this._trie.insert(SyncId.fromOnChainEvent(event));
  }

  public async addFname(usernameProof: UserNameProof): Promise<void> {
    await this._trie.insert(SyncId.fromFName(usernameProof));
  }

  public async removeFname(usernameProof: UserNameProof): Promise<void> {
    await this._trie.deleteBySyncId(SyncId.fromFName(usernameProof));
  }

  public async removeMessage(message: Message): Promise<void> {
    await this._trie.deleteBySyncId(SyncId.fromMessage(message));
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

  public async getDbStats(): Promise<DbStats> {
    return { ...this._dbStats, numItems: await this._trie.items() };
  }

  private async readDbStatsFromDb(): Promise<DbStats> {
    let numFids = 0;
    let numFnames = 0;

    await this._db.forEachIteratorByPrefix(
      Buffer.from([RootPrefix.OnChainEvent, OnChainEventPostfix.IdRegisterByFid]),
      () => {
        numFids += 1;
      },
    );

    await this._db.forEachIteratorByPrefix(Buffer.from([RootPrefix.FNameUserNameProof]), () => {
      numFnames += 1;
    });

    return {
      numItems: await this._trie.items(),
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

    const closeResult = Result.fromThrowable(
      () => rpcClient?.close(),
      (e) => e as Error,
    )();
    if (closeResult.isErr()) {
      log.warn({ err: closeResult.error }, "Failed to close RPC client after getSyncStatusForPeer");
    }

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

    const l2CustodyEventResult = await rpcClient.getOnChainEvents(
      OnChainEventRequest.create({ fid, eventType: OnChainEventType.EVENT_TYPE_ID_REGISTER }),
      new Metadata(),
      rpcDeadline(),
    );
    if (l2CustodyEventResult.isOk() && l2CustodyEventResult.value.events[0]) {
      const custodyEventBlockNumber = l2CustodyEventResult.value.events[0].blockNumber;
      log.info({ fid }, `Retrying events from l2 block ${custodyEventBlockNumber}`);
      await this._l2EventsProvider?.retryEventsFromBlock(custodyEventBlockNumber);
    } else {
      log.warn({ fid }, "Failed to fetch custody event from peer");
      return;
    }
  }

  /**
   * Verify the peer is being honest by checking to make sure the syncIds actually have the
   * prefix
   */
  private verifySyncIdForPrefix(prefix: Uint8Array, syncIds: Uint8Array[]): boolean {
    for (const syncId of syncIds) {
      // Make sure SyncId has the prefix
      if (!bytesStartsWith(syncId, prefix)) {
        log.warn(
          { syncId, prefix, peerId: this._currentSyncStatus.peerId },
          "PeerError: SyncId does not have the expected prefix",
        );
        return false;
      }
    }

    return true;
  }

  private async syncSignersAndRetryMessage(message: Message, rpcClient: HubRpcClient): Promise<HubResult<number>> {
    const fidRetryMessageQ = this._currentSyncStatus.fidRetryMessageQ;

    const fid = message.data?.fid;
    if (!fid) {
      return err(new HubError("bad_request.invalid_param", "Invalid fid while retrying message"));
    }

    if (fidRetryMessageQ.has(fid)) {
      // If the queue is empty, this fid has already been retried, so we can skip
      if (fidRetryMessageQ.get(fid)?.length === 0) {
        return err(new HubError("bad_request.invalid_param", "Fid already retried"));
      }

      // Add the message to the queue
      fidRetryMessageQ.get(fid)?.push(message);
      return ok(fidRetryMessageQ.get(fid)?.length ?? 0);
    } else {
      // Create a new queue for this fid
      fidRetryMessageQ.set(fid, [message]);
    }

    // Probably not required to fetch the signer messages, but doing it here means
    // sync will complete in one round (prevents messages failing to merge due to missed or out of
    // order signer message)
    const signerEvents = await rpcClient.getOnChainSignersByFid(
      FidRequest.create({ fid }),
      new Metadata(),
      rpcDeadline(),
    );
    if (signerEvents.isErr()) {
      return err(new HubError("unavailable.network_failure", "Failed to fetch signer events"));
    }
    const retryPromises = signerEvents.value.events.map((event) =>
      this._l2EventsProvider?.retryEventsFromBlock(event.blockNumber),
    );
    await Promise.all(retryPromises);

    const messages = fidRetryMessageQ.get(fid) ?? [];
    fidRetryMessageQ.set(fid, []);

    const results = await Promise.all(messages.map(async (message) => this._hub.submitMessage(message, "sync")));

    // If any of the messages failed, return a hub error
    const firstFailed = results.find((r) => r.isErr());
    if (firstFailed) {
      return firstFailed;
    } else {
      return ok(0);
    }
  }

  // We have a prefix that's not present in the other peer, validate our trie is correct, and remove any syncIds that are not in our db
  private async revokeCorruptedSyncIds(ourNode: NodeMetadata | undefined) {
    if (!ourNode) {
      return 0;
    }

    if (ourNode.numMessages > 500) {
      log.warn(`Our node has more than 500 messages, but the other peer does not have this prefix: ${ourNode.prefix}`);
      return 0;
    }

    let revokedSyncIds = 0;
    const suspectSyncIDs = (await this.trie.getAllValues(ourNode.prefix)).map((s) => SyncId.fromBytes(s));
    const messageSyncIds = suspectSyncIDs.filter((syncId) => syncId.unpack().type === SyncIdType.Message);
    const messagesResult = await this.getAllMessagesBySyncIds(messageSyncIds);
    if (messagesResult.isOk()) {
      const corruptedSyncIds = this.findCorruptedSyncIDs(messagesResult.value, messageSyncIds);
      if (corruptedSyncIds.length > 0) {
        log.warn({ num: corruptedSyncIds.length }, "Found corrupted messages during sync, rebuilding some syncIDs");

        // Don't wait for this to finish, just return the messages we have.
        await this.revokeSyncIds(corruptedSyncIds);
        revokedSyncIds += corruptedSyncIds.length;
      }
    }

    for (const syncId of suspectSyncIDs) {
      const unpacked = syncId.unpack();
      if (unpacked.type === SyncIdType.OnChainEvent) {
        const result = await ResultAsync.fromPromise(
          getOnChainEvent(this._db, unpacked.eventType, unpacked.fid, unpacked.blockNumber, unpacked.logIndex),
          (e) => e as HubError,
        );
        if (result.isErr()) {
          log.warn(
            `Found corrupted on chain event during sync, revoking syncId for blockNumber: ${unpacked.blockNumber} and logIndex: ${unpacked.logIndex}`,
          );
          await this.revokeSyncIds([syncId]);
          revokedSyncIds += 1;
        }
      } else if (unpacked.type === SyncIdType.FName) {
        const result = await ResultAsync.fromPromise(getUserNameProof(this._db, unpacked.name), (e) => e as HubError);
        let validSyncId = result.isOk();
        if (result.isOk()) {
          validSyncId = result.value.fid === unpacked.fid;
        }
        if (!validSyncId) {
          log.warn(
            `Found corrupted fname during sync, revoking syncId for name: ${Buffer.from(unpacked.name).toString(
              "utf-8",
            )} and fid: ${unpacked.fid}`,
          );
          await this.revokeSyncIds([syncId]);
          revokedSyncIds += 1;
        }
      }
    }
    return revokedSyncIds;
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
