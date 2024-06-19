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
import {
  bytesCompare,
  bytesStartsWith,
  isIdRegisterOnChainEvent,
  MessageBundle,
  toFarcasterTime,
} from "@farcaster/core";
import { PeerId } from "@libp2p/interface-peer-id";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { TypedEmitter } from "tiny-typed-emitter";
import os from "os";
import { SemVer } from "semver";
import { APP_VERSION, FARCASTER_VERSION, Hub, HubInterface } from "../../hubble.js";
import { MerkleTrie, NodeMetadata, TrieSnapshot } from "./merkleTrie.js";
import { prefixToTimestamp, SyncId, SyncIdType, TIMESTAMP_LENGTH, timestampToPaddedTimestampPrefix } from "./syncId.js";
import { getManyMessages } from "../../storage/db/message.js";
import RocksDB from "../../storage/db/rocksdb.js";
import { sleepWhile } from "../../utils/crypto.js";
import { statsd } from "../../utils/statsd.js";
import { logger, messageToLog } from "../../utils/logger.js";
import { OnChainEventPostfix, RootPrefix } from "../../storage/db/types.js";
import { L2EventsProvider } from "../../eth/l2EventsProvider.js";
import { SyncEngineProfiler } from "./syncEngineProfiler.js";
import { finishAllProgressBars } from "../../utils/progressBars.js";
import { FNameRegistryEventsProvider } from "../../eth/fnameRegistryEventsProvider.js";
import { PeerScore, PeerScorer } from "./peerScore.js";
import { getOnChainEvent } from "../../storage/db/onChainEvent.js";
import { getUserNameProof } from "../../storage/db/nameRegistryEvent.js";
import { MaxPriorityQueue } from "@datastructures-js/priority-queue";

// Number of seconds to wait for the network to "settle" before syncing. We will only
// attempt to sync messages that are older than this time.
const SYNC_THRESHOLD_IN_SECONDS = 10;

// The maximum number of nodes to enqueue in the work queue
const MAX_WORK_QUEUE_SIZE = 100_000;

export const FIRST_SYNC_DELAY = 30 * 1000; // How long to wait after startup to start syncing
const SYNC_MAX_DURATION = 110 * 60 * 1000; // 110 minutes, just slightly less than the periodic sync job frequency

// The max number of parallel syncs to run
const MAX_SYNC_PARALLELISM = Math.min(os.cpus().length, 16);

const SYNC_INTERRUPT_TIMEOUT = 30 * 1000; // 30 seconds

// If a peer returns over 20 timeouts during sync, we abandon syncing with them
const MAX_PEER_TIMEOUT_ERRORS = 20;

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

  status() {
    return {
      total: this.total,
      successCount: this.successCount,
      deferredCount: this.deferredCount,
      errCount: this.errCount,
    };
  }
}

type DbStats = {
  approxSize: number;
  numItems: number;
  numFids: number;
  numFnames: number;
};

type SecondaryRpcClient = {
  peerId: string;
  rpcClient: HubRpcClient;
};

// The Status of the node's sync with the network.
type SyncStatus = {
  isSyncing: boolean;
  inSync: "true" | "false" | "unknown" | "blocked";
  shouldSync: boolean;
  theirSnapshot: TrieSnapshot;
  ourSnapshot: TrieSnapshot;
  lastBadSync: number;
  score: number;
};

// Status of the current (ongoing) sync.
export class CurrentSyncStatus {
  isSyncing = false;
  interruptSync = false;
  peerId: string | undefined;
  peerTimeoutErrors = 0;
  startTimestampMs: number;
  cutoffTimestampFs = 0;
  fidRetryMessageQ = new Map<number, Message[]>();
  seriousValidationFailures = 0;
  numParallelFetches = 0;

  rpcClient: HubRpcClient | undefined;
  secondaryRpcClients: SecondaryRpcClient[] = [];
  nextSecondaryRpcClient = 0;

  executingWorkCount = 0;
  completedWorkCount = 0;

  workQueue: MaxPriorityQueue<SyncEngineWorkItem> = new MaxPriorityQueue((workItem) => workItem.score);

  fullResult: MergeResult = new MergeResult();

  constructor(
    peerId?: string,
    rpcClient?: HubRpcClient,
    secondaryRpcClients: SecondaryRpcClient[] = [],
    startTimestamp = 0,
  ) {
    if (peerId) {
      this.peerId = peerId;
      this.isSyncing = true;
      this.startTimestampMs = startTimestamp;
      this.cutoffTimestampFs = toFarcasterTime(startTimestamp).unwrapOr(0);
    } else {
      this.peerId = undefined;
      this.isSyncing = false;
      this.startTimestampMs = 0;
      this.cutoffTimestampFs = 0;
    }

    this.rpcClient = rpcClient;
    this.secondaryRpcClients = secondaryRpcClients;

    this.interruptSync = false;
    this.fidRetryMessageQ = new Map();
  }

  status() {
    const fullResult = this.fullResult.status();
    const timeElapsedMs = Date.now() - this.startTimestampMs;
    const msgRate = Math.round(fullResult.successCount / (timeElapsedMs / 1000));
    return {
      isSyncing: this.isSyncing,
      executingCount: this.executingWorkCount,
      completedCount: this.completedWorkCount,
      peerId: this.peerId,
      peerTimeoutErrors: this.peerTimeoutErrors,
      workQueueLen: this.workQueue.size(),
      cutoffTimestamp: this.cutoffTimestampFs,
      msgRate,
      ...fullResult,
    };
  }
}

enum SyncEngineWorkItemStatus {
  Scheduled = 0,
  Executing = 1,
  Completed = 2,
}

export class SyncEngineWorkItem {
  status: SyncEngineWorkItemStatus = SyncEngineWorkItemStatus.Scheduled;

  prefix: Uint8Array;
  score: number;
  finishPromise: Promise<boolean> | undefined;

  constructor(ourNode: NodeMetadata | undefined, theirNode: NodeMetadata) {
    this.prefix = theirNode.prefix;

    // Score the work item
    const depth = TIMESTAMP_LENGTH - Math.min(TIMESTAMP_LENGTH, this.prefix.length);
    const messagesDiff = Math.max(0, theirNode.numMessages - (ourNode?.numMessages ?? 0));
    this.score = messagesDiff / TIMESTAMP_LENGTH ** depth;
  }
}

class SyncEngine extends TypedEmitter<SyncEvents> {
  private readonly _trie: MerkleTrie;
  private readonly _db: RocksDB;
  private readonly _hub: HubInterface;

  private readonly _l2EventsProvider: L2EventsProvider | undefined;
  private readonly _fnameEventsProvider: FNameRegistryEventsProvider | undefined;

  private curSync: CurrentSyncStatus;
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

  // Time of last successful sync
  private _lastSyncTimestamp?: number;

  private _dbStats: DbStats = {
    approxSize: 0,
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

    this.curSync = new CurrentSyncStatus();

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
    await this._trie.deleteByBytes(syncIds.map((syncId) => syncId.syncId()));
  }

  public async stop() {
    // Interrupt any ongoing sync
    this.curSync.interruptSync = true;

    // Wait for syncing to stop.
    try {
      await sleepWhile(() => this.curSync.isSyncing, SYNC_INTERRUPT_TIMEOUT);
      await sleepWhile(() => this.syncTrieQSize > 0, SYNC_INTERRUPT_TIMEOUT);
    } catch (e) {
      log.error({ err: e }, "Interrupting sync timed out");
    }

    await this._trie.stop();

    this._started = false;
    this.curSync.interruptSync = false;
    log.info("Sync engine stopped");
  }

  public getLastSyncTimestamp(): number | undefined {
    return this._lastSyncTimestamp;
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
    return this.curSync.isSyncing;
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
    if (existingPeerInfo && contactInfo.timestamp <= existingPeerInfo.contactInfo.timestamp) {
      return err(new HubError("bad_request.duplicate", "peer already exists"));
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
    this.currentHubPeerContacts.set(peerId.toString(), { peerId, contactInfo });
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

      if (!this.curSync.isSyncing) {
        finishAllProgressBars(true);
      }
      return;
    }

    let peerContact: PeerContact | undefined;
    const secondaryContacts: PeerContact[] = [];

    if (peerIdString) {
      const c = this.currentHubPeerContacts.get(peerIdString);
      if (c) {
        peerContact = { peerId: c?.peerId, contactInfo: c?.contactInfo };
      }
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

      // Pick a random peer
      peerContact = peers[Math.floor(Math.random() * peers.length)] as PeerContact;
      secondaryContacts.push(peerContact);

      // Pick random peers, one per sync thread.
      for (let i = 0; i < Math.min(MAX_SYNC_PARALLELISM, peers.length); i++) {
        const randomPeer = peers[Math.floor(Math.random() * peers.length)] as PeerContact;
        if (!secondaryContacts.find((c) => c.peerId.equals(randomPeer.peerId))) {
          secondaryContacts.push(randomPeer);
        }
      }
    }

    // If we still don't have a peer, skip the sync
    if (!peerContact) {
      log.warn({ peerContact }, "Diffsync: No contact info for peer, skipping sync");
      this.emit("syncComplete", false);

      if (!this.curSync.isSyncing) {
        finishAllProgressBars(true);
      }
      return;
    }

    const updatedPeerIdString = peerContact.peerId.toString();
    let rpcClient = await hub.getRPCClientForPeer(peerContact.peerId, peerContact.contactInfo);
    if (!rpcClient) {
      log.warn("Diffsync: Failed to get RPC client for peer, skipping sync");
      // If we're unable to reach the peer, remove it from our contact list. We'll retry when it's added back by
      // the periodic ContactInfo gossip job.
      this.removeContactInfoForPeerId(updatedPeerIdString);
      this.emit("syncComplete", false);

      if (!this.curSync.isSyncing) {
        finishAllProgressBars(true);
      }
      return;
    }

    // Fill in the rpcClients for the secondary contacts
    const secondaryRpcClients: SecondaryRpcClient[] = (
      await Promise.all(
        secondaryContacts.map(async (c) => {
          const rpcClient = await hub.getRPCClientForPeer(c.peerId, c.contactInfo);
          const info = await rpcClient?.getInfo({ dbStats: false }, new Metadata(), rpcDeadline());
          if (rpcClient && info && info.isOk()) {
            return { peerId: c.peerId.toString(), rpcClient };
          } else {
            return undefined;
          }
        }),
      )
    ).filter((c) => c !== undefined) as SecondaryRpcClient[];

    // If a sync profile is enabled, wrap the rpcClient in a profiler
    if (this._syncProfiler) {
      rpcClient = this._syncProfiler.profiledRpcClient(rpcClient);
    }

    try {
      const peerId = peerContact.peerId;
      // First, get the latest state and info from the peer
      const peerStateResult = await rpcClient.getSyncSnapshotByPrefix(
        TrieNodePrefix.create({ prefix: new Uint8Array() }),
        new Metadata(),
        rpcDeadline(),
      );
      const peerInfo = await rpcClient.getInfo({ dbStats: false }, new Metadata(), rpcDeadline());

      if (peerStateResult.isErr()) {
        log.warn(
          { error: peerStateResult.error, errMsg: peerStateResult.error.message, peerId },
          "Diffsync: Failed to get peer state, skipping sync",
        );
        this.emit("syncComplete", false);

        if (!this.curSync.isSyncing) {
          finishAllProgressBars(true);
        }
        return;
      }

      const peerState = peerStateResult.value;
      const syncStatusResult = await this.syncStatus(updatedPeerIdString, peerState);
      if (syncStatusResult.isErr()) {
        log.warn("Diffsync: Failed to get shouldSync");
        this.emit("syncComplete", false);

        if (!this.curSync.isSyncing) {
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
          peerNetwork: peerContact.contactInfo.network,
          peerVersion: peerContact.contactInfo.hubVersion,
          peerAppVersion: peerContact.contactInfo.appVersion,
          lastBadSync: syncStatus.lastBadSync,
        },
        "DiffSync: SyncStatus", // Search for this string in the logs to get summary of sync status
      );

      // Save the peer's sync snapshot
      this._peerSyncSnapshot.set(updatedPeerIdString, syncStatus.theirSnapshot);

      if (syncStatus.shouldSync === true) {
        const start = Date.now();

        log.info(
          { peerId: peerContact.peerId, secondaryRpcClients: secondaryContacts.map((s) => s.peerId) },
          "Diffsync: Starting Sync with peer",
        );
        const result = await this.performSync(updatedPeerIdString, rpcClient, true, secondaryRpcClients);

        log.info(
          {
            peerContact,
            result,
            timeTakenMs: Date.now() - start,
            status: this.curSync.status(),
            interrupted: this.curSync.interruptSync,
          },
          "Diffsync: complete",
        );

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

      // Close all the secondary RPC clients
      for (const secondaryRpcClient of secondaryRpcClients) {
        const closeResult = Result.fromThrowable(
          () => secondaryRpcClient?.rpcClient.close(),
          (e) => e as Error,
        )();
        if (closeResult.isErr()) {
          log.warn({ err: closeResult.error }, "Failed to close secondary RPC client after sync");
        }
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
    const isSyncing = this.curSync.isSyncing;

    if (lastBadSync && Date.now() < lastBadSync + BAD_PEER_BLOCK_TIMEOUT) {
      return ok({
        isSyncing: false,
        inSync: "blocked",
        shouldSync: false,
        theirSnapshot,
        ourSnapshot,
        divergenceSecondsAgo: -1,
        lastBadSync: lastBadSync,
        score: peerScore?.score ?? 0,
      });
    }

    const excludedHashesMatch =
      ourSnapshot.excludedHashes.length === theirSnapshot.excludedHashes.length &&
      // NOTE: `index` is controlled by `every` and so not at risk of object injection.
      ourSnapshot.excludedHashes.every((value, index) => value === theirSnapshot.excludedHashes[index]);

    return ok({
      isSyncing,
      inSync: excludedHashesMatch ? "true" : "false",
      shouldSync: !isSyncing && !excludedHashesMatch,
      ourSnapshot,
      theirSnapshot,
      lastBadSync: lastBadSync ?? -1,
      score: peerScore?.score ?? 0,
    });
  }

  async performSync(
    peerId: string,
    rpcClient: HubRpcClient,
    doAudit = false,
    secondaryRpcClients: SecondaryRpcClient[] = [],
  ): Promise<MergeResult> {
    // Make sure we have at least one
    if (secondaryRpcClients.length === 0) {
      secondaryRpcClients.push({ peerId, rpcClient });
    }

    const startTimestamp = Date.now();

    this.curSync = new CurrentSyncStatus(peerId, rpcClient, secondaryRpcClients, startTimestamp);
    const syncTimeout = setTimeout(() => {
      this.curSync.interruptSync = true;
      log.warn({ peerId, durationMs: Date.now() - startTimestamp }, "Perform sync: Sync timed out, interrupting sync");
    }, SYNC_MAX_DURATION);

    if (!this.curSync.rpcClient) {
      log.warn({ peerId }, "Perform sync: RPC client is not set");
      return this.curSync.fullResult;
    }

    const logInterval = setInterval(() => {
      const status = this.curSync.status();
      log.info({ ...status }, "Perform sync: Progress");
    }, 5 * 1000);

    try {
      finishAllProgressBars(true);

      let auditPeerPromise: Promise<void>;
      if (doAudit) {
        auditPeerPromise = this.auditPeer(peerId, rpcClient);
      } else {
        auditPeerPromise = Promise.resolve();
      }

      const ourNode = await this._trie.getTrieNodeMetadata(new Uint8Array());
      const theirNodeResult = await this.curSync.rpcClient.getSyncMetadataByPrefix(
        TrieNodePrefix.create({ prefix: new Uint8Array() }),
        new Metadata(),
        rpcDeadline(),
      );

      if (theirNodeResult.isErr()) {
        log.warn(theirNodeResult.error, "Error fetching metadata for prefix []");
        this._peerScorer.decrementScore(this.curSync.peerId?.toString());
        return this.curSync.fullResult;
      }

      // Schedule the root node
      this.scheduleWorkItem(ourNode, fromNodeMetadataResponse(theirNodeResult.value));
      const numMessages = Math.max(0, theirNodeResult.value.numMessages - (ourNode?.numMessages ?? 0));

      // If we have missing messages, we use the full parallelism, otherwise we use only half as many
      const desiredSyncParallelism = this.curSync.secondaryRpcClients.length * (numMessages > 1_000 ? 1 : 0.5);

      // Sync parallelism = number secondary rpc clients we could get (bounded between 2 and MAX_SYNC_PARALLELISM)
      const syncParallelism = Math.round(Math.max(2, Math.min(desiredSyncParallelism, MAX_SYNC_PARALLELISM)));

      log.info(
        { numMessages, syncParallelism, peerId, secondaryRpcPeers: secondaryRpcClients.length },
        "Perform sync: Starting sync",
      );

      await this.processSyncWorkQueue(syncParallelism);

      await auditPeerPromise; // Wait for audit to complete

      this._lastSyncTimestamp = Date.now();

      log.info({ syncResult: this.curSync.fullResult }, "Perform sync: Sync Complete");
      statsd().timing("syncengine.sync_time_ms", Date.now() - startTimestamp);
    } catch (e) {
      log.warn(e, "Perform sync: Error");
    } finally {
      this.curSync.isSyncing = false;

      clearTimeout(syncTimeout);
      clearInterval(logInterval);

      this._peerScorer.updateLastSync(peerId, this.curSync.fullResult);
    }

    return this.curSync.fullResult;
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
      this._peerScorer.decrementScore(this.curSync.peerId?.toString());
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

  public async fetchAndMergeMessages(syncIds: SyncId[], rpcClient: HubRpcClient): Promise<MergeResult> {
    if (syncIds.length === 0) {
      return new MergeResult(); // empty merge result
    }

    let result = new MergeResult();
    const start = Date.now();

    const messagesResult = await rpcClient.getAllMessagesBySyncIds(
      SyncIds.create({ syncIds: syncIds.map((s) => s.syncId()) }),
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
            { syncIds, messages: msgs.messages, peer: this.curSync.peerId },
            "PeerError: Fetched Messages do not match SyncIDs requested",
          );
          this._peerScorer.decrementScore(this.curSync.peerId?.toString());
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

    // Merge messages sequentially, so we can handle missing users.
    this._syncMergeQ += messages.length;
    statsd().gauge("syncengine.merge_q", this._syncMergeQ);

    const startTime = Date.now();
    const results = await this._hub.submitMessageBundle(MessageBundle.create({ messages }), "sync");

    for (let i = 0; i < results.length; i++) {
      const result = results[i] as HubResult<number>;
      if (result.isErr()) {
        if (result.error.errCode === "bad_request.validation_failure") {
          const msg = messages[i] as Message;

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
                peerId: this.curSync.peerId,
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
                { fid: msg.data?.fid, err: result.error.message, peerId: this.curSync.peerId },
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
              { fid: msg.data?.fid, err: result.error.message, peerId: this.curSync.peerId },
              "PeerError: Unexpected validation error",
            );
            this._peerScorer.decrementScore(this.curSync.peerId?.toString());
            this.curSync.seriousValidationFailures += 1;
            errCount += 1;
          }
        } else if (result.error.errCode === "bad_request.duplicate") {
          const msg = messages[i] as Message;

          // This message has already been merged into the DB, but for some reason is not in the Trie.
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

    return result;
  }

  scheduleWorkItem(ourNode: NodeMetadata | undefined, theirNode: NodeMetadata): void {
    // If we are interrupted, we will not schedule any more work
    if (this.curSync.interruptSync) return;

    // If the hashes match, we do not need to do any work
    if (ourNode && ourNode.hash === theirNode.hash) return;

    // If there are no messages to fetch, don't enque the work item
    if (theirNode.numMessages === 0) return;

    // Don't let the queue grow too large
    if (this.curSync.workQueue.size() > MAX_WORK_QUEUE_SIZE) return;

    // If the timestamp of the node is after the sync started, then gossip will take
    // care of it, so we don't need to do anything
    if (prefixToTimestamp(Buffer.from(theirNode.prefix.slice(0, 10)).toString()) > this.curSync.cutoffTimestampFs) {
      return;
    }

    // Otherwise, we will schedule the work item
    this.curSync.workQueue.enqueue(new SyncEngineWorkItem(ourNode, theirNode));
  }

  async processSyncWorkQueue(syncParallelism: number): Promise<void> {
    let runningWorkItems: SyncEngineWorkItem[] = [];

    while (this.curSync.workQueue.size() > 0 || runningWorkItems.length > 0) {
      // Go over the currently running work items and count how many are completed
      const newRunningWorkItems: SyncEngineWorkItem[] = [];

      // Clear any pending work if the sync was interrupted, so we'll only
      // wait for the existing running work items to finish
      if (this.curSync.interruptSync) {
        this.curSync.workQueue.clear();
      }

      for (const workItem of runningWorkItems) {
        switch (workItem.status) {
          case SyncEngineWorkItemStatus.Executing:
            newRunningWorkItems.push(workItem);
            break;
          case SyncEngineWorkItemStatus.Completed:
            this.curSync.completedWorkCount++;
            // Not copied over to the new work queue
            break;
        }
      }

      // Replace the work queue with only the items that are not completed
      runningWorkItems = newRunningWorkItems;

      // If there is an oppurtunity to do more work, we will do it
      if (this.curSync.executingWorkCount < syncParallelism) {
        const n = Math.max(0, syncParallelism - this.curSync.executingWorkCount);

        // Find the "n" best work items, and start them
        for (let i = 0; i < n; i++) {
          const bestWorkItem = this.curSync.workQueue.pop();

          if (bestWorkItem) {
            bestWorkItem.status = SyncEngineWorkItemStatus.Executing;
            bestWorkItem.finishPromise = this.executeWorkItem(bestWorkItem);
            runningWorkItems.push(bestWorkItem);
          }
        }
      }
      this.curSync.executingWorkCount = runningWorkItems.length;

      statsd().gauge("sync_engine.work.executing", this.curSync.executingWorkCount);
      statsd().gauge("sync_engine.work.completed", this.curSync.completedWorkCount);

      // Now the work queue is updated, and we can wait for at least one item to finish
      const pendingPromises = runningWorkItems.map((item) => item.finishPromise);
      if (pendingPromises.length > 0) {
        await Promise.race(pendingPromises);
      }

      // After the promise is resolved, we can continue with the next iteration
    }
  }

  executeWorkItem(workItem: SyncEngineWorkItem): Promise<boolean> {
    return new Promise((resolve) => {
      (async () => {
        if (!this.curSync.rpcClient) {
          log.warn("RPC client is not set");
          workItem.status = SyncEngineWorkItemStatus.Completed;
          resolve(false);
          return;
        }

        const ourNode = await this._trie.getTrieNodeMetadata(workItem.prefix);

        const start = Date.now();
        const theirNodeResult = await this.curSync.rpcClient.getSyncMetadataByPrefix(
          TrieNodePrefix.create({ prefix: workItem.prefix }),
          new Metadata(),
          rpcDeadline(),
        );
        statsd().timing("syncengine.peer.get_syncmetadata_by_prefix_ms", Date.now() - start);

        if (theirNodeResult.isErr()) {
          log.warn(theirNodeResult.error, `Error fetching metadata for prefix ${workItem.prefix}`);
          this._peerScorer.decrementScore(this.curSync.peerId?.toString());
          workItem.status = SyncEngineWorkItemStatus.Completed;
          resolve(false);

          //  If this peer has too many errors, we will stop syncing with them
          this.curSync.peerTimeoutErrors += 1;

          if (this.curSync.peerTimeoutErrors > MAX_PEER_TIMEOUT_ERRORS) {
            log.warn(
              { peerId: this.curSync.peerId, errors: this.curSync.peerTimeoutErrors },
              "PeerError: Too many errors, stopping sync",
            );
            this._peerScorer.decrementScore(this.curSync.peerId?.toString());

            // Remove this peer from the secondaryRpcClients
            this.curSync.secondaryRpcClients = this.curSync.secondaryRpcClients.filter(
              (c) => c.peerId !== this.curSync.peerId,
            );

            // If none left, then interrupt the sync
            if (this.curSync.secondaryRpcClients.length === 0) {
              this.curSync.interruptSync = true;
              log.warn("Perform Sync: PeerError: No more secondary peers, interrupting sync");
            } else {
              // Replace the primary rpcClient with the next one in the list
              this.curSync.rpcClient = this.curSync.secondaryRpcClients[0]?.rpcClient;
              this.curSync.peerId = this.curSync.secondaryRpcClients[0]?.peerId;
              this.curSync.peerTimeoutErrors = 0;
            }
          }

          return;
        }

        const theirNode = fromNodeMetadataResponse(theirNodeResult.value);

        // First, we'll check if our node is empty. If it is, then we can start importing all the messages from the other node
        // at this prefix
        if (!ourNode || ourNode.numMessages === 0 || theirNode.numMessages <= 1) {
          await this.getMessagesFromOtherNode(workItem, theirNode.numMessages);
        }

        // Recurse into the children to to schedule the next set of work. Note that we didn't after  the
        // `getMessagesFromOtherNode` above. This is because even after we get messages from the other node,
        // there still might be left over messages at this node (if, for eg., there are > 10k messages, and the
        // other node only sent 1k messages).
        for (const [theirChildChar, theirChild] of theirNode.children?.entries() ?? []) {
          // Get ourNode and theirNode at the childq
          this.scheduleWorkItem(ourNode?.children?.get(theirChildChar), theirChild);
        }

        // All done, we can now return
        workItem.status = SyncEngineWorkItemStatus.Completed;
        resolve(true);
        return;
      })();
    });
  }

  async getMessagesFromOtherNode(workItem: SyncEngineWorkItem, expectItems: number): Promise<void> {
    const secondaryRpcClient = this.curSync.secondaryRpcClients[this.curSync.nextSecondaryRpcClient];
    this.curSync.nextSecondaryRpcClient =
      (this.curSync.nextSecondaryRpcClient + 1) % this.curSync.secondaryRpcClients.length;

    if (!secondaryRpcClient || !this.curSync.rpcClient) {
      log.warn("RPC client is not set");
      return;
    }

    // Attempt to use the secondary RPC client to fetch the missing syncIds
    // first. If it doesn't work, we'll fall back to the primary RPC client.
    let rpcClient = secondaryRpcClient.rpcClient;
    const start = Date.now();

    // Fetch the missing syncIds from the rpcClient.
    const fetchMissingSyncIds = async (rpcClient: HubRpcClient) => {
      return await rpcClient?.getAllSyncIdsByPrefix(
        TrieNodePrefix.create({ prefix: workItem.prefix }),
        new Metadata(),
        rpcDeadline(),
      );
    };

    const result = await fetchMissingSyncIds(rpcClient);
    statsd().timing("syncengine.peer.get_all_syncids_by_prefix_ms", Date.now() - start);

    let missingHashes: Uint8Array[] = [];
    if (result.isErr()) {
      log.warn(result.error, `Error fetching ids for prefix ${workItem.prefix}`);
    } else {
      missingHashes = result.value.syncIds;
    }

    // If we got no missing hashes, then we'll retry with the primary RPC client
    if (missingHashes.length === 0) {
      // Replace the rpcClient with the primary one
      rpcClient = this.curSync.rpcClient;

      // Get it directly from the primary peerId
      const primaryResult = await fetchMissingSyncIds(rpcClient);

      log.debug(
        {
          prefix: Array.from(workItem.prefix),
          gotItems: missingHashes.length,
          expectItems,
          retriedItems: primaryResult.unwrapOr(undefined)?.syncIds.length,
          peerId: this.curSync.peerId,
        },
        "Perform Sync: Missing syncIds from secondary peer, fetched instead from primary peer",
      );

      if (primaryResult.isErr()) {
        log.warn(primaryResult?.error, `Perform Sync: PeerError: Error fetching ids for prefix ${workItem.prefix}`);
        return;
      }

      missingHashes = primaryResult.value.syncIds;
    }

    // Filter out any empty hashes
    missingHashes = missingHashes.filter((id) => id.length > 0);

    // Verify that the returned syncIDs actually have the prefix we requested.
    if (!this.verifySyncIdForPrefix(workItem.prefix, missingHashes)) {
      log.warn(
        { prefix: workItem.prefix, syncIds: missingHashes, peerId: this.curSync.peerId },
        "Perform Sync: PeerError: Received syncIds that don't match prefix, aborting trie branch",
      );
      this._peerScorer.decrementScore(this.curSync.peerId?.toString());
      return;
    }
    statsd().increment("syncengine.peer_counts.get_all_syncids_by_prefix", missingHashes.length);

    // Strip out all syncIds that we already have. This can happen if our node has more messages than the other
    // hub at this node.
    // Note that we can optimize this check for the common case of a single missing syncId, since the diff
    // algorithm will drill down right to the missing syncId.
    if (missingHashes.length === 1) {
      if (await this._trie.existsByBytes(missingHashes[0] as Uint8Array)) {
        missingHashes = [];
        statsd().increment("syncengine.peer_counts.get_all_syncids_by_prefix_already_exists", 1);

        await this.revokeCorruptedSyncIds(await this._trie.getTrieNodeMetadata(workItem.prefix));
      }
    }

    await this.fetchMissingSyncIds(missingHashes, rpcClient);
  }

  async fetchMissingSyncIds(missingIds: Uint8Array[], rpcClient: HubRpcClient) {
    if (!rpcClient) {
      log.warn("RPC client is not set");
      return;
    }

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
    const messagesResult = await this.fetchAndMergeMessages(missingMessageIds, rpcClient);
    result.addResult(messagesResult);

    this.curSync.fullResult.addResult(result);

    const avgPeerNumMessages = this.avgPeerNumMessages();
    statsd().gauge(
      "syncengine.sync_percent",
      avgPeerNumMessages > 0 ? Math.min(1, (await this.trie.items()) / avgPeerNumMessages) : 0,
    );

    statsd().increment("syncengine.sync_messages.success", result.successCount);
    statsd().increment("syncengine.sync_messages.error", result.errCount);
    statsd().increment("syncengine.sync_messages.deferred", result.deferredCount);
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
    await this._trie.delete(SyncId.fromFName(usernameProof));
  }

  public async removeMessage(message: Message): Promise<void> {
    await this._trie.delete(SyncId.fromMessage(message));
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
    return { ...this._dbStats, numItems: await this._trie.items(), approxSize: await this._db.approximateSize() };
  }

  private async readDbStatsFromDb(): Promise<DbStats> {
    const numFids = await this._db.countKeysAtPrefix(
      Buffer.from([RootPrefix.OnChainEvent, OnChainEventPostfix.IdRegisterByFid]),
    );

    const numFnames = await this._db.countKeysAtPrefix(Buffer.from([RootPrefix.FNameUserNameProof]));

    return {
      approxSize: await this._db.approximateSize(),
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
          { syncId, prefix, peerId: this.curSync.peerId },
          "PeerError: SyncId does not have the expected prefix",
        );
        return false;
      }
    }

    return true;
  }

  private async syncSignersAndRetryMessage(message: Message, rpcClient: HubRpcClient): Promise<HubResult<number>> {
    const fidRetryMessageQ = this.curSync.fidRetryMessageQ;

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

// RPC Deadline is 15 seconds by default
const rpcDeadline = () => {
  return { deadline: Date.now() + 1000 * 15 };
};

export const fromNodeMetadataResponse = (response: TrieNodeMetadataResponse): NodeMetadata => {
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
