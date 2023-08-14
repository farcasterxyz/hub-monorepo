import { gossipsub, GossipSub } from "@chainsafe/libp2p-gossipsub";
import { Message as GossipSubMessage, PublishResult } from "@libp2p/interface-pubsub";
import { noise } from "@chainsafe/libp2p-noise";
import {
  AckMessageBody,
  ContactInfoContent,
  FarcasterNetwork,
  GossipMessage,
  GossipVersion,
  HubAsyncResult,
  HubError,
  HubResult,
  Message,
} from "@farcaster/hub-nodejs";
import { Connection } from "@libp2p/interface-connection";
import { PeerId } from "@libp2p/interface-peer-id";
import { peerIdFromBytes } from "@libp2p/peer-id";
import { mplex } from "@libp2p/mplex";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";
import { tcp } from "@libp2p/tcp";
import { Multiaddr } from "@multiformats/multiaddr";
import { createLibp2p, Libp2p } from "libp2p";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { TypedEmitter } from "tiny-typed-emitter";
import { ConnectionFilter } from "./connectionFilter.js";
import { logger } from "../../utils/logger.js";
import { addressInfoFromParts, checkNodeAddrs, ipMultiAddrStrFromAddressInfo } from "../../utils/p2p.js";
import { PeriodicPeerCheckScheduler } from "./periodicPeerCheck.js";
import { GOSSIP_PROTOCOL_VERSION, msgIdFnStrictSign } from "./protocol.js";
import { GossipMetricsRecorder } from "./gossipMetricsRecorder.js";
import RocksDB from "storage/db/rocksdb.js";
import { AddrInfo } from "@chainsafe/libp2p-gossipsub/types";
import { PeerScoreThresholds } from "@chainsafe/libp2p-gossipsub/score";
import { statsd } from "../../utils/statsd.js";

const MultiaddrLocalHost = "/ip4/127.0.0.1";

/** The maximum number of pending merge messages before we drop new incoming gossip or sync messages. */
export const MAX_MESSAGE_QUEUE_SIZE = 100_000;

const log = logger.child({ component: "GossipNode" });

/** Events emitted by a Farcaster Gossip Node */
interface NodeEvents {
  /** Triggers on receipt of a new message and includes the topic and message contents */
  message: (topic: string, message: HubResult<GossipMessage>) => void;
  /** Triggers when a peer connects and includes the libp2p Connection object*/
  peerConnect: (connection: Connection) => void;
  /** Triggers when a peer disconnects and includes the libp2p Connection object */
  peerDisconnect: (connection: Connection) => void;
}

/** Optional arguments provided when creating a Farcaster Gossip Node */
interface NodeOptions {
  /** A libp2p PeerId to use as the node's identity. A random key pair is generated if undefined */
  peerId?: PeerId | undefined;
  /** A IP address that the node binds to, provided in MultiAddr format */
  ipMultiAddr?: string | undefined;
  /** An external IP address that is announced to peers */
  announceIp?: string | undefined;
  /** A port used to listen for gossip messages. A random value is selected if not specified */
  gossipPort?: number | undefined;
  /** A list of PeerIds that are allowed to connect to this node */
  allowedPeerIdStrs?: string[] | undefined;
  /** A list of peerIds that are not allowed to connect to this node */
  deniedPeerIdStrs?: string[] | undefined;
  /** A list of addresses the node directly peers with, provided in MultiAddr format */
  directPeers?: AddrInfo[] | undefined;
  /** Override peer scoring. Useful for tests */
  scoreThresholds?: Partial<PeerScoreThresholds>;
}

/**
 * A GossipNode allows a Hubble instance to connect and gossip messages to its peers.
 *
 * Hubble instances communicate using the gossipsub protocol implemented by libp2p. Each GossipNode
 * wraps around a libp2p node which manages the gossip network and provides convenience methods to
 * interact with the network.
 */
export class GossipNode extends TypedEmitter<NodeEvents> {
  private _node?: Libp2p;
  private _periodicPeerCheckJob?: PeriodicPeerCheckScheduler;
  private _network: FarcasterNetwork;
  private _metricsRecorder?: GossipMetricsRecorder;

  private _connectionGater?: ConnectionFilter;

  constructor(db: RocksDB, network?: FarcasterNetwork, networkLatencyMessagesEnabled?: boolean) {
    super();
    this._network = network ?? FarcasterNetwork.NONE;
    if (networkLatencyMessagesEnabled) {
      this._metricsRecorder = new GossipMetricsRecorder(this, db);
    }
  }

  /** Returns the PeerId (public key) of this node */
  get peerId() {
    return this._node?.peerId;
  }

  /** Returns the node's addresses in MultiAddr form, including unreachable local addresses */
  get multiaddrs() {
    return this._node?.getMultiaddrs();
  }

  /** Returns the node's libp2p AddressBook */
  get addressBook() {
    return this._node?.peerStore.addressBook;
  }

  /** Returns the node's metrics recorder object */
  get metricsRecorder() {
    return this._metricsRecorder;
  }

  /** Returs the node's network */
  get network() {
    return this._network;
  }

  async addPeerToAddressBook(peerId: PeerId, multiaddr: Multiaddr) {
    if (!this.addressBook) {
      log.error({}, "address book missing for gossipNode");
    } else {
      const addResult = await ResultAsync.fromPromise(
        this.addressBook.add(peerId, [multiaddr]),
        (error) => new HubError("unavailable", error as Error),
      );
      if (addResult.isErr()) {
        log.error({ error: addResult.error, peerId }, "failed to add contact info to address book");
      }
    }
  }

  /** Removes the peer from the address book and hangs up on them */
  async removePeerFromAddressBook(peerId: PeerId) {
    if (this._node) {
      const hangupResult = await ResultAsync.fromPromise(
        this._node.hangUp(peerId),
        (error) => new HubError("unavailable", error as Error),
      );
      if (hangupResult.isErr()) {
        log.error({ error: hangupResult.error, peerId }, "failed to hang up peer");
      }
    }

    if (!this.addressBook) {
      log.error({}, "address book missing for gossipNode");
    } else {
      return this.addressBook.delete(peerId);
    }
  }

  /** Returns the libp2p Peer instance after updating the connections in the AddressBook */
  async getPeerInfo(peerId: PeerId) {
    const existingConnections = this._node?.getConnections(peerId);
    for (const conn of existingConnections ?? []) {
      const knownAddrs = await this._node?.peerStore.addressBook.get(peerId);
      if (knownAddrs && !knownAddrs.find((addr) => addr.multiaddr.equals(conn.remoteAddr))) {
        await this._node?.peerStore.addressBook.add(peerId, [conn.remoteAddr]);
      }
    }
    return this._node?.peerStore.get(peerId);
  }

  async isPeerAllowed(peerId: PeerId) {
    if (this._connectionGater) {
      return await this._connectionGater.filterMultiaddrForPeer(peerId);
    } else {
      return true;
    }
  }

  /** Returns the GossipSub instance used by the Node */
  get gossip() {
    const pubsub = this._node?.pubsub;
    return pubsub ? (pubsub as GossipSub) : undefined;
  }

  /**
   * Initializes the libp2p node, which must be done before any configuration or communication.
   *
   * @param bootstrapAddrs  A list of bootstrap addresses which the node will attempt to connect to
   * @param options         Options to configure node
   */
  async start(bootstrapAddrs: Multiaddr[], options?: NodeOptions): HubAsyncResult<void> {
    const createResult = await this.createNode(options ?? {});
    if (createResult.isErr()) return err(createResult.error);

    this._node = createResult.value;

    this.registerListeners();
    // this.registerDebugListeners();

    await this._node.start();
    log.info(
      { identity: this.identity, addresses: this._node.getMultiaddrs().map((a) => a.toString()) },
      "Starting libp2p",
    );

    // Wait for a few seconds for everything to initialize before connecting to bootstrap nodes
    setTimeout(() => this.bootstrap(bootstrapAddrs), 1 * 1000);

    // Also start the periodic job to make sure we have peers
    this._periodicPeerCheckJob = new PeriodicPeerCheckScheduler(this, bootstrapAddrs);

    // Start sending network latency pings if enabled
    await this._metricsRecorder?.start();

    return ok(undefined);
  }

  isStarted() {
    return this._node?.isStarted();
  }

  /** Removes the node from the libp2p network and tears down pubsub */
  async stop() {
    await this._node?.stop();
    this._periodicPeerCheckJob?.stop();
    await this._metricsRecorder?.stop();

    log.info({ identity: this.identity }, "Stopped libp2p...");
  }

  get identity() {
    return this.peerId?.toString();
  }

  /** Serializes and publishes a Farcaster Message to the network */
  async gossipMessage(message: Message): Promise<HubResult<PublishResult>[]> {
    const gossipMessage = GossipMessage.create({
      message,
      topics: [this.primaryTopic()],
      peerId: this.peerId?.toBytes() ?? new Uint8Array(),
      version: GOSSIP_PROTOCOL_VERSION,
    });
    return this.publish(gossipMessage);
  }

  /** Serializes and publishes this node's ContactInfo to the network */
  async gossipContactInfo(contactInfo: ContactInfoContent): Promise<HubResult<PublishResult>[]> {
    const gossipMessage = GossipMessage.create({
      contactInfoContent: contactInfo,
      topics: [this.contactInfoTopic()],
      peerId: this.peerId?.toBytes() ?? new Uint8Array(),
      version: GOSSIP_PROTOCOL_VERSION,
    });
    return this.publish(gossipMessage);
  }

  async recordMessageReceipt(gossipMessage: GossipMessage) {
    this._metricsRecorder?.recordMessageReceipt(gossipMessage);
  }

  async recordMessageMerge(mergeTime: number) {
    this._metricsRecorder?.recordMessageMerge(mergeTime);
  }

  async recordLatencyAckMessageReceipt(ackMessage: AckMessageBody) {
    this._metricsRecorder?.recordLatencyAckMessageReceipt(ackMessage);
  }

  /** Publishes a Gossip Message to the network */
  async publish(message: GossipMessage): Promise<HubResult<PublishResult>[]> {
    const topics = message.topics;
    const encodedMessage = GossipNode.encodeMessage(message);

    log.debug({ identity: this.identity }, `Publishing message to topics: ${topics}`);
    if (this.gossip === undefined) {
      return [err(new HubError("unavailable", new Error("GossipSub not initialized")))];
    }
    const gossip = this.gossip;

    if (encodedMessage.isErr()) {
      log.error(encodedMessage.error, "Failed to publish message.");
      return [err(encodedMessage.error)];
    } else {
      const results = await Promise.all(
        topics.map(async (topic) => {
          try {
            const publishResult = await gossip.publish(topic, encodedMessage.value);
            return ok(publishResult);
            // rome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
          } catch (error: any) {
            log.error(error, "Failed to publish message");
            return err(new HubError("bad_request.duplicate", error));
          }
        }),
      );

      log.debug({ identity: this.identity, results }, "Published to gossip peers");
      return results;
    }
  }

  /** Connects to a peer GossipNode */
  async connect(peerNode: GossipNode): Promise<HubResult<void>> {
    const multiaddrs = peerNode.multiaddrs;
    if (!multiaddrs) {
      return err(new HubError("unavailable", { message: "no peer id" }));
    }

    for (const addr of multiaddrs) {
      const result = await this.connectAddress(addr);
      // Short-circuit and return if we connect to at least one address
      if (result.isOk()) return ok(undefined);
      log.error(result.error, "Failed to connect to addr");
    }

    return err(new HubError("unavailable", { message: "cannot connect to any peer" }));
  }

  /** Connect to a peer Gossip Node using a specific address */
  async connectAddress(address: Multiaddr): Promise<HubResult<void>> {
    log.debug({ identity: this.identity, address }, `Attempting to connect to address ${address}`);
    try {
      const conn = await this._node?.dial(address);

      if (conn) {
        log.info({ identity: this.identity, address }, `Connected to peer at address: ${address}`);
        return ok(undefined);
      }
      // rome-ignore lint/suspicious/noExplicitAny: error catching
    } catch (error: any) {
      log.error(error, `Failed to connect to peer at address: ${address}`);
      return err(new HubError("unavailable", error));
    }
    return err(new HubError("unavailable", { message: `cannot connect to peer: ${address}` }));
  }

  /** Return if we have any inbound P2P connections */
  hasInboundConnections(): boolean {
    return this._node?.getConnections().some((conn) => conn.stat.direction === "inbound") ?? false;
  }

  updateStatsdPeerGauges() {
    const [inbound, outbound] = this._node?.getConnections()?.reduce(
      (acc, conn) => {
        acc[conn.stat.direction === "inbound" ? 0 : 1]++;
        return acc;
      },
      [0, 0],
    ) || [0, 0];

    statsd().gauge("gossip.peers.inbound", inbound);
    statsd().gauge("gossip.peers.outbound", outbound);
  }

  registerListeners() {
    this._node?.addEventListener("peer:connect", (event) => {
      log.info(
        { peer: event.detail.remotePeer, addrs: event.detail.remoteAddr, type: event.detail.stat.direction },
        "P2P Connection established",
      );
      this.emit("peerConnect", event.detail);
      this.updateStatsdPeerGauges();
    });
    this._node?.addEventListener("peer:disconnect", (event) => {
      log.info({ peer: event.detail.remotePeer }, "P2P Connection disconnected");
      this.emit("peerDisconnect", event.detail);
      this.updateStatsdPeerGauges();
    });
    this.gossip?.addEventListener("gossipsub:message", (event) => {
      log.debug({
        identity: this.identity,
        gossipMessageId: event.detail.msgId,
        from: event.detail.propagationSource,
        topic: event.detail.msg.topic,
      });

      // ignore messages not in our topic lists (e.g. GossipSub peer discovery messages)
      if (this.gossipTopics().includes(event.detail.msg.topic)) {
        this.emit("message", event.detail.msg.topic, GossipNode.decodeMessage(event.detail.msg.data));
        statsd().increment("gossip.messages");
      }
    });
  }

  registerDebugListeners() {
    this._node?.addEventListener("peer:discovery", (event) => {
      log.info({ identity: this.identity }, `Found peer: ${event.detail.multiaddrs}  }`);
    });
    this._node?.addEventListener("peer:connect", (event) => {
      log.info({ identity: this.identity }, `Connection established to: ${event.detail.remotePeer.toString()}`);
    });
    this._node?.addEventListener("peer:disconnect", (event) => {
      log.info({ identity: this.identity }, `Disconnected from: ${event.detail.remotePeer.toString()} `);
    });
    this.gossip?.addEventListener("message", (event) => {
      log.info(
        // rome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
        { identity: this.identity, from: (event.detail as any)["from"] },
        `Received message for topic: ${event.detail.topic}`,
      );
    });
    this.gossip?.addEventListener("subscription-change", (event) => {
      log.info(
        { identity: this.identity },
        `Subscription change: ${event.detail.subscriptions.map((value) => {
          value.topic;
        })}`,
      );
    });
  }

  primaryTopic() {
    return `f_network_${this._network}_primary`;
  }
  contactInfoTopic() {
    return `f_network_${this._network}_contact_info`;
  }

  gossipTopics() {
    return [this.primaryTopic(), this.contactInfoTopic()];
  }

  allPeerIds(): string[] {
    return this._node?.getPeers()?.map((peer) => peer.toString()) ?? [];
  }

  updateAllowedPeerIds(peerIds: string[] | undefined) {
    this._connectionGater?.updateAllowedPeers(peerIds);
  }

  updateDeniedPeerIds(peerIds: string[]) {
    statsd().gauge("gossip.denied_peers", peerIds.length);
    this._connectionGater?.updateDeniedPeers(peerIds);
  }

  //TODO: Needs better typesafety
  static encodeMessage(message: GossipMessage): HubResult<Uint8Array> {
    return ok(GossipMessage.encode(message).finish());
  }

  static decodeMessage(message: Uint8Array): HubResult<GossipMessage> {
    // Convert GossipMessage to Uint8Array or decode will return nested Uint8Arrays as Buffers
    try {
      const gossipMessage = GossipMessage.decode(Uint8Array.from(message));
      const supportedVersions = [GOSSIP_PROTOCOL_VERSION, GossipVersion.V1];
      if (gossipMessage.topics.length === 0 || supportedVersions.findIndex((v) => v === gossipMessage.version) === -1) {
        return err(new HubError("bad_request.parse_failure", "invalid message"));
      }
      peerIdFromBytes(gossipMessage.peerId);
      return ok(GossipMessage.decode(Uint8Array.from(message)));
      // rome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
    } catch (error: any) {
      return err(new HubError("bad_request.parse_failure", error));
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  /* Attempts to dial all the addresses in the bootstrap list */
  public async bootstrap(bootstrapAddrs: Multiaddr[]): Promise<HubResult<void>> {
    log.info({ bootstrapAddrs }, "Bootstrapping Gossip Node");

    if (bootstrapAddrs.length === 0) return ok(undefined);
    const results = await Promise.all(bootstrapAddrs.map((addr) => this.connectAddress(addr)));

    const finalResults = Result.combineWithAllErrors(results) as Result<void[], HubError[]>;
    if (finalResults.isErr() && finalResults.error.length === bootstrapAddrs.length) {
      // only fail if all connections failed
      return err(new HubError("unavailable", "could not connect to any bootstrap nodes"));
    }

    return ok(undefined);
  }

  /* Generates a message ID for gossip messages
   *
   * Specifically overrides the default behavior for Farcaster Protocol Messages that are created by user interactions
   *
   * @param message - The message to generate an ID for
   * @returns The message ID as an Uint8Array
   */
  public getMessageId(message: GossipSubMessage): Uint8Array {
    if (message.topic.includes(this.primaryTopic())) {
      // check if message is a Farcaster Protocol Message
      const protocolMessage = GossipNode.decodeMessage(message.data);
      if (protocolMessage.isOk() && protocolMessage.value.version === GossipVersion.V1_1) {
        if (protocolMessage.value.message !== undefined)
          return protocolMessage.unwrapOr(undefined)?.message?.hash ?? new Uint8Array();
        if (protocolMessage.value.idRegistryEvent !== undefined)
          return protocolMessage.value.idRegistryEvent?.transactionHash ?? new Uint8Array();
      }
    }
    return msgIdFnStrictSign(message);
  }

  /** Creates a Libp2p node with GossipSub */
  private async createNode(options: NodeOptions): Promise<HubResult<Libp2p>> {
    const listenIPMultiAddr = options.ipMultiAddr ?? MultiaddrLocalHost;
    const listenPort = options.gossipPort ?? 0;
    const listenMultiAddrStr = `${listenIPMultiAddr}/tcp/${listenPort}`;
    const peerDiscoveryTopic = `_farcaster.${this._network}.peer_discovery`;

    let announceMultiAddrStrList: string[] = [];
    if (options.announceIp && options.gossipPort) {
      const announceMultiAddr = addressInfoFromParts(options.announceIp, options.gossipPort).map((addressInfo) =>
        ipMultiAddrStrFromAddressInfo(addressInfo),
      );
      if (announceMultiAddr.isOk() && announceMultiAddr.value.isOk()) {
        // If we have a valid announce IP, use it
        const announceIpMultiaddr = announceMultiAddr.value.value;
        announceMultiAddrStrList = [`${announceIpMultiaddr}/tcp/${options.gossipPort}`];
      }
    }

    const checkResult = checkNodeAddrs(listenIPMultiAddr, listenMultiAddrStr);
    if (checkResult.isErr()) return err(new HubError("unavailable", checkResult.error));

    const gossip = gossipsub({
      emitSelf: false,
      allowPublishToZeroPeers: true,
      globalSignaturePolicy: "StrictSign",
      msgIdFn: this.getMessageId.bind(this),
      directPeers: options.directPeers || [],
      canRelayMessage: true,
      scoreThresholds: { ...options.scoreThresholds },
    });

    if (options.allowedPeerIdStrs) {
      log.info(
        {
          identity: this.identity,
          function: "createNode",
          allowedPeerIds: options.allowedPeerIdStrs,
          deniedPeerIds: options.deniedPeerIdStrs,
        },
        "!!! PEER-ID RESTRICTIONS ENABLED !!!",
      );
    } else {
      log.warn(
        { identity: this.identity, deniedPeerIds: options.deniedPeerIdStrs, function: "createNode" },
        "No PEER-ID RESTRICTIONS ENABLED. This node will accept connections from any peer",
      );
    }
    this._connectionGater = new ConnectionFilter(options.allowedPeerIdStrs, options.deniedPeerIdStrs);

    return ResultAsync.fromPromise(
      createLibp2p({
        // Only set optional fields if defined to avoid errors
        ...(options.peerId && { peerId: options.peerId }),
        connectionGater: this._connectionGater,
        addresses: {
          listen: [listenMultiAddrStr],
          announce: announceMultiAddrStrList,
        },
        transports: [tcp()],
        streamMuxers: [mplex()],
        connectionEncryption: [noise()],
        pubsub: gossip,
        peerDiscovery: [pubsubPeerDiscovery({ topics: [peerDiscoveryTopic] })],
      }),
      (e) => new HubError("unavailable", { message: "failed to create libp2p node", cause: e as Error }),
    );
  }
}
