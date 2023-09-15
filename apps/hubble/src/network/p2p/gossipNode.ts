import { Message as GossipSubMessage, PublishResult } from "@libp2p/interface-pubsub";
import { Worker } from "worker_threads";
import {
  ContactInfoContent,
  FarcasterNetwork,
  GossipMessage,
  GossipVersion,
  HubAsyncResult,
  HubError,
  HubErrorCode,
  HubResult,
  Message,
} from "@farcaster/hub-nodejs";
import { Connection } from "@libp2p/interface-connection";
import { PeerId } from "@libp2p/interface-peer-id";
import { peerIdFromBytes } from "@libp2p/peer-id";
import { multiaddr, Multiaddr } from "@multiformats/multiaddr";
import { err, ok, Result } from "neverthrow";
import { TypedEmitter } from "tiny-typed-emitter";
import { logger } from "../../utils/logger.js";
import { PeriodicPeerCheckScheduler } from "./periodicPeerCheck.js";
import { GOSSIP_PROTOCOL_VERSION } from "./protocol.js";
import { AddrInfo } from "@chainsafe/libp2p-gossipsub/types";
import { PeerScoreThresholds } from "@chainsafe/libp2p-gossipsub/score";
import { statsd } from "../../utils/statsd.js";
import { createFromProtobuf, exportToProtobuf } from "@libp2p/peer-id-factory";
import EventEmitter from "events";
import fs from "fs";
import path from "path";

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
export interface NodeOptions {
  /** A libp2p PeerId to use as the node's identity. A random key pair is generated if undefined */
  peerId?: Uint8Array | undefined;
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

// A common return type for several methods on the libp2p node.
// Includes a success flag, an error message and an optional error type
type SuccessOrError = { success: boolean; errorMessage: string | undefined; errorType: string | undefined };

// An interface that defines the methods that can be called on the libp2p node
export interface LibP2PNodeInterface {
  addToAddressBook: (peerId: Uint8Array, multiaddr: Uint8Array) => Promise<void>;
  removeFromAddressBook: (peerId: Uint8Array) => Promise<void>;
  getFromAddressBook: (peerId: Uint8Array) => Promise<Uint8Array[]>;
  allPeerIds: () => Promise<string[]>;
  makeNode: (options: NodeOptions) => Promise<SuccessOrError>;
  start: () => Promise<{ peerId: Uint8Array; multiaddrs: Uint8Array[] }>;
  stop: () => Promise<void>;
  connectAddress: (multiaddr: Uint8Array) => Promise<SuccessOrError>;
  connectionStats: () => Promise<{ inbound: number; outbound: number }>;
  getPeerAddresses: (peerId: Uint8Array) => Promise<Uint8Array[]>;
  isPeerAllowed: (peerId: Uint8Array) => Promise<boolean>;
  updateAllowedPeerIds: (peerIds: string[] | undefined) => Promise<void>;
  updateDeniedPeerIds: (peerIds: string[]) => Promise<void>;
  subscribe: (topic: string) => Promise<void>;
  gossipMessage: (message: Uint8Array) => Promise<SuccessOrError & { peerIds: Uint8Array[] }>;
  gossipContactInfo: (contactInfo: Uint8Array) => Promise<SuccessOrError & { peerIds: Uint8Array[] }>;
}

// Extract the method names (as strings) from the LibP2PNodeInterface
export type LibP2PInterfaceMethodNames = keyof LibP2PNodeInterface;

// Extract the return type of a method from the LibP2PNodeInterface, keyed by method name (as string)
export type LibP2PNodeMethodReturnType<MethodName extends keyof LibP2PNodeInterface> = ReturnType<
  LibP2PNodeInterface[MethodName]
>;

// A message sent to the worker thread to call a method on the libp2p node. Includes the method names, the correctly typed params
// and a unique id to match the response to the correct method call
export type LibP2PNodeMessage<MethodName extends LibP2PInterfaceMethodNames> = {
  method: MethodName;
  args: Parameters<LibP2PNodeInterface[MethodName]>;
  methodCallId: number;
};

// A union of all the possible LibP2PNodeMessage types, keyed by method name. This is used to type the worker thread's
// message handler
export type LibP2PNodeMethodGenericMessage = {
  [K in LibP2PInterfaceMethodNames]: {
    method: K;
    args: Parameters<LibP2PNodeInterface[K]>;
    methodCallId: number;
  };
}[LibP2PInterfaceMethodNames];

/**
 * A GossipNode allows a Hubble instance to connect and gossip messages to its peers.
 *
 * Hubble instances communicate using the gossipsub protocol implemented by libp2p. Each GossipNode
 * wraps around a libp2p node which manages the gossip network and provides convenience methods to
 * interact with the network.
 *
 * NOTE:
 *
 * 1. The actual libp2p node is run in a worker thread, and method calls are sent to the worker
 * thread via messages.
 * 2. When sending data across to the worker thread, we use protobufs to serialize the data. This is
 * because the worker thread runs in a separate process and we cannot pass objects directly, but only send
 * primitive types like strings, byte arrays and numbers.
 */
export class GossipNode extends TypedEmitter<NodeEvents> {
  private _periodicPeerCheckJob?: PeriodicPeerCheckScheduler;
  private _network: FarcasterNetwork;

  private _nodeWorker?: Worker;
  private _nodeMethodCallId = 0;
  private _nodeMethodCallMap = new Map<number, { resolve: Function; reject: Function }>();

  private _nodeEvents = new EventEmitter();

  private _peerId?: PeerId;
  private _multiaddrs?: Multiaddr[];
  private _isStarted = false;

  constructor(network?: FarcasterNetwork) {
    super();
    this._network = network ?? FarcasterNetwork.NONE;

    // Create a worker thread to run the libp2p node. The path is relative to the current file
    // We use the "../../../" so that it works when running tests from the root directory
    // and also in prod
    const workerPath = new URL("../../../build/network/p2p/gossipNodeWorker.js", import.meta.url);
    this._nodeWorker = new Worker(workerPath, { workerData: { network: this._network } });

    this._nodeWorker?.addListener("message", (event) => {
      // Check if this is a libp2p node event. These are events generated by the libp2p node and are
      // rebroadcast to any listeners
      if (event.event) {
        const nodeEvent = event.event;
        this._nodeEvents.emit(nodeEvent.eventName, JSON.parse(nodeEvent.detail));
      } else {
        // Result of a method call. Pick the correct method call from the map and resolve/reject the promise
        const result = event;
        const methodCall = this._nodeMethodCallMap.get(result.methodCallId);
        if (methodCall) {
          this._nodeMethodCallMap.delete(result.methodCallId);
          if (result.error) {
            methodCall.reject(result.error);
          } else {
            methodCall.resolve(result.result);
          }
        }
      }
    });
  }

  // A typed wrapper around the worker.postMessage method, to make sure we don't make any type mistakes
  // when calling the method
  async callMethod<MethodName extends LibP2PInterfaceMethodNames>(
    method: MethodName,
    ...args: Parameters<LibP2PNodeInterface[MethodName]>
  ): Promise<LibP2PNodeMethodReturnType<MethodName>> {
    const methodCallId = this._nodeMethodCallId++;
    const methodCall = { method, args, methodCallId };

    const result = new Promise<LibP2PNodeMethodReturnType<MethodName>>((resolve, reject) => {
      this._nodeMethodCallMap.set(methodCallId, { resolve, reject });
      this._nodeWorker?.postMessage(methodCall);
    });

    return result;
  }

  /** Returns the PeerId (public key) of this node */
  peerId(): PeerId | undefined {
    return this._peerId;
  }

  /** Returns the node's addresses in MultiAddr form, including unreachable local addresses */
  multiaddrs(): Multiaddr[] {
    return this._multiaddrs ?? [];
  }

  /** Returs the node's network */
  get network() {
    return this._network;
  }

  async addPeerToAddressBook(peerId: PeerId, multiaddr: Multiaddr) {
    await this.callMethod("addToAddressBook", exportToProtobuf(peerId), multiaddr.bytes);
  }

  /** Removes the peer from the address book and hangs up on them */
  async removePeerFromAddressBook(peerId: PeerId) {
    await this.callMethod("removeFromAddressBook", exportToProtobuf(peerId));
  }

  /** Returns the libp2p Peer instance after updating the connections in the AddressBook */
  async getPeerAddresses(peerId: PeerId): Promise<Multiaddr[]> {
    return (await this.callMethod("getPeerAddresses", exportToProtobuf(peerId))).map((addr: Uint8Array) =>
      multiaddr(addr),
    );
  }

  async isPeerAllowed(peerId: PeerId) {
    return await this.callMethod("isPeerAllowed", exportToProtobuf(peerId));
  }

  /**
   * Initializes the libp2p node, which must be done before any configuration or communication.
   *
   * @param bootstrapAddrs  A list of bootstrap addresses which the node will attempt to connect to
   * @param options         Options to configure node
   */
  async start(bootstrapAddrs: Multiaddr[], options?: NodeOptions): HubAsyncResult<void> {
    const createResult = await this.callMethod("makeNode", options ?? {});
    if (!createResult.success) return err(new HubError("unavailable", createResult.errorMessage as string));

    await this.registerListeners();
    //await this.registerDebugListeners();

    const { peerId, multiaddrs } = await this.callMethod("start");

    this._peerId = await createFromProtobuf(peerId);
    this._multiaddrs = multiaddrs.map((m) => multiaddr(m));
    this._isStarted = true;

    log.info({ identity: this.identity, addresses: this.multiaddrs().map((m) => m.toString()) }, "Starting libp2p");

    // Wait for a few seconds for everything to initialize before connecting to bootstrap nodes
    setTimeout(() => this.bootstrap(bootstrapAddrs), 1 * 1000);

    // Also start the periodic job to make sure we have peers
    this._periodicPeerCheckJob = new PeriodicPeerCheckScheduler(this, bootstrapAddrs);

    return ok(undefined);
  }

  isStarted() {
    return this._isStarted;
  }

  /** Removes the node from the libp2p network and tears down pubsub */
  async stop() {
    await this.callMethod("stop");
    await this._nodeWorker?.terminate();
    this._periodicPeerCheckJob?.stop();

    log.info({ identity: this.identity }, "Stopped libp2p...");
  }

  get identity(): string | undefined {
    return this._peerId?.toString();
  }

  /** Serializes and publishes a Farcaster Message to the network */
  async gossipMessage(message: Message): Promise<HubResult<PublishResult>> {
    const result = await this.callMethod("gossipMessage", Message.encode(message).finish());
    if (result.success) {
      const peerIds = await Promise.all(
        result.peerIds.map(async (peerId: Uint8Array) => await createFromProtobuf(peerId)),
      );
      return ok({ recipients: peerIds });
    } else {
      return err(new HubError(result.errorType as HubErrorCode, result.errorMessage as string));
    }
  }

  /** Serializes and publishes this node's ContactInfo to the network */
  async gossipContactInfo(contactInfo: ContactInfoContent): Promise<HubResult<PublishResult>> {
    const result = await this.callMethod("gossipContactInfo", ContactInfoContent.encode(contactInfo).finish());
    if (result.success) {
      const peerIds = await Promise.all(
        result.peerIds.map(async (peerId: Uint8Array) => await createFromProtobuf(peerId)),
      );
      return ok({ recipients: peerIds });
    } else {
      return err(new HubError(result.errorType as HubErrorCode, result.errorMessage as string));
    }
  }

  /** Connects to a peer GossipNode */
  async connect(peerNode: GossipNode): Promise<HubResult<void>> {
    const multiaddrs = peerNode.multiaddrs();
    if (!multiaddrs || multiaddr.length === 0) {
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
    const result = await this.callMethod("connectAddress", address.bytes);
    if (result.success) {
      return ok(undefined);
    } else {
      return err(new HubError("unavailable", result.errorMessage as string));
    }
  }

  async updateStatsdPeerGauges() {
    const { inbound, outbound } = await this.callMethod("connectionStats");

    statsd().gauge("gossip.peers.inbound", inbound);
    statsd().gauge("gossip.peers.outbound", outbound);
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
      // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
    } catch (error: any) {
      return err(new HubError("bad_request.parse_failure", error));
    }
  }

  async subscribe(topic: string) {
    await this.callMethod("subscribe", topic);
  }

  async registerListeners() {
    this._nodeEvents?.addListener("peer:connect", (detail) => {
      // console.log("Peer Connected", JSON.stringify(detail, null, 2));
      log.info(
        { peer: detail.remotePeer, addrs: detail.remoteAddr, type: detail.stat.direction },
        "P2P Connection established",
      );
      this.emit("peerConnect", detail);
      this.updateStatsdPeerGauges();
    });
    this._nodeEvents?.addListener("peer:disconnect", (detail) => {
      log.info({ peer: detail.remotePeer }, "P2P Connection disconnected");
      this.emit("peerDisconnect", detail);
      this.updateStatsdPeerGauges();
    });
    this._nodeEvents?.addListener("gossipsub:message", (detail) => {
      log.debug({
        identity: this.identity,
        gossipMessageId: detail.msgId,
        from: detail.propagationSource,
        topic: detail.msg.topic,
      });

      // ignore messages not in our topic lists (e.g. GossipSub peer discovery messages)
      if (this.gossipTopics().includes(detail.msg.topic)) {
        try {
          let data: Buffer;
          if (detail.msg.data.type === "Buffer") {
            data = Buffer.from(detail.msg.data.data);
          } else {
            data = Buffer.from(Object.values(detail.msg.data as unknown as Record<string, number>));
          }
          this.emit("message", detail.msg.topic, GossipNode.decodeMessage(data));
        } catch (e) {
          logger.error({ e, data: detail.msg.data }, "Failed to decode message");
        }
        statsd().increment("gossip.messages");
      }
    });
  }

  registerDebugListeners() {
    this._nodeEvents?.addListener("peer:discovery", (detail) => {
      log.info({ identity: this.identity }, `Found peer: ${detail.multiaddrs}  }`);
    });
    this._nodeEvents?.addListener("peer:connect", (detail) => {
      log.info({ identity: this.identity }, `Connection established to: ${detail.remotePeer.toString()}`);
    });
    this._nodeEvents?.addListener("peer:disconnect", (detail) => {
      log.info({ identity: this.identity }, `Disconnected from: ${detail.remotePeer.toString()} `);
    });
    this._nodeEvents?.addListener("message", (detail) => {
      log.info(
        // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
        { identity: this.identity, from: (detail as any)["from"] },
        `Received message for topic: ${detail.topic}`,
      );
    });
    this._nodeEvents?.addListener("subscription-change", (detail) => {
      log.info(
        { identity: this.identity },
        `Subscription change: ${
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          detail.subscriptions.map((value: any) => {
            value.topic;
          })
        }`,
      );
    });
  }

  public static primaryTopicForNetwork(network: FarcasterNetwork) {
    return `f_network_${network}_primary`;
  }

  public static contactInfoTopicForNetwork(network: FarcasterNetwork) {
    return `f_network_${network}_contact_info`;
  }

  primaryTopic(): string {
    return GossipNode.primaryTopicForNetwork(this._network);
  }

  contactInfoTopic(): string {
    return GossipNode.contactInfoTopicForNetwork(this._network);
  }

  gossipTopics() {
    return [GossipNode.primaryTopicForNetwork(this._network), GossipNode.contactInfoTopicForNetwork(this._network)];
  }

  /** Return if we have any inbound P2P connections */
  async hasInboundConnections(): Promise<boolean> {
    const { inbound } = await this.callMethod("connectionStats");
    return inbound > 0;
  }

  async allPeerIds(): Promise<string[]> {
    return await this.callMethod("allPeerIds");
  }

  updateAllowedPeerIds(peerIds: string[] | undefined) {
    this.callMethod("updateAllowedPeerIds", peerIds);
  }

  updateDeniedPeerIds(peerIds: string[]) {
    statsd().gauge("gossip.denied_peers", peerIds.length);
    this.callMethod("updateDeniedPeerIds", peerIds);
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
}
