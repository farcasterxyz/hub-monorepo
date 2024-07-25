import { parentPort, workerData } from "worker_threads";
import { peerIdFromBytes } from "@libp2p/peer-id";
import * as MultiAddr from "@multiformats/multiaddr";
import { Message as GossipSubMessage, PublishResult, TopicValidatorResult, PubSub } from "@libp2p/interface-pubsub";
import {
  GossipNode,
  LibP2PNodeInterface,
  LibP2PNodeMessage,
  LibP2PNodeMethodGenericMessage,
  LibP2PNodeMethodReturnType,
  NodeOptions,
  GOSSIP_SEEN_TTL,
  LIBP2P_CONNECT_TIMEOUT_MS,
  ENV_LIBP2P_CONNECT_TIMEOUT_MS,
} from "./gossipNode.js";
import {
  ContactInfoContent,
  FarcasterNetwork,
  GossipMessage,
  GossipVersion,
  HubAsyncResult,
  HubError,
  HubResult,
  Message,
  toFarcasterTime,
} from "@farcaster/hub-nodejs";
import { addressInfoFromParts, checkNodeAddrs, ipMultiAddrStrFromAddressInfo } from "../../utils/p2p.js";
import { createLibp2p, Libp2p } from "libp2p";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { GossipSub, gossipsub, GossipsubEvents } from "@chainsafe/libp2p-gossipsub";
import { ConnectionFilter } from "./connectionFilter.js";
import { tcp } from "@libp2p/tcp";
import { mplex } from "@libp2p/mplex";
import { noise } from "@chainsafe/libp2p-noise";
import { GOSSIP_PROTOCOL_VERSION, msgIdFnStrictNoSign } from "./protocol.js";
import { PeerId } from "@libp2p/interface-peer-id";
import { createFromProtobuf, exportToProtobuf } from "@libp2p/peer-id-factory";
import { logger } from "../../utils/logger.js";
import { initializeStatsd, statsd } from "../../utils/statsd.js";
import v8 from "v8";
import { MessageBundle } from "@farcaster/hub-nodejs";
import { BundleCreator } from "./bundleCreator.js";

const MultiaddrLocalHost = "/ip4/127.0.0.1";
const APPLICATION_SCORE_CAP_DEFAULT = 10;

export type GossipPublishResult = {
  bundled: boolean | undefined;
  publishResults: HubResult<PublishResult>[] | undefined;
};

const log = logger.child({ component: "GossipNodeWorker" });
/**
 * A wrapper around a libp2p node that is designed to run in a worker thread.
 */
export class LibP2PNode {
  _node?: Libp2p;
  private _connectionGater?: ConnectionFilter;
  private _network: FarcasterNetwork;
  private _peerScores: Map<string, number>;
  private _p2pConnectTimeoutMs: number;
  private _bundleCreator: BundleCreator;

  constructor(network: FarcasterNetwork) {
    this._network = network;
    this._peerScores = new Map<string, number>();
    this._p2pConnectTimeoutMs = LIBP2P_CONNECT_TIMEOUT_MS;

    this._bundleCreator = new BundleCreator(this);
  }

  get identity() {
    return this.peerId?.toString();
  }

  /** Returns the PeerId (public key) of this node */
  get peerId() {
    return this._node?.peerId;
  }

  gossipTopics() {
    return [GossipNode.primaryTopicForNetwork(this._network), GossipNode.contactInfoTopicForNetwork(this._network)];
  }

  /** Returns the GossipSub instance used by the Node */
  get gossip() {
    const pubsub = this._node?.services["pubsub"];
    return pubsub ? (pubsub as GossipSub) : undefined;
  }

  subscribe(topic: string) {
    this.gossip?.subscribe(topic);
  }

  async makeNode(options: NodeOptions): HubAsyncResult<boolean> {
    // since we are running in a worker thread, we need to initialize statsd
    if (options.statsdParams) {
      initializeStatsd(options.statsdParams.host ?? "", options.statsdParams.port ?? 0);
    }

    const listenIPMultiAddr = options.ipMultiAddr ?? MultiaddrLocalHost;
    const listenPort = options.gossipPort ?? 0;
    const listenMultiAddrStr = `${listenIPMultiAddr}/tcp/${listenPort}`;

    const peerId = options.peerId ? await createFromProtobuf(options.peerId) : undefined;

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
    if (checkResult.isErr()) {
      return err(new HubError("unavailable", checkResult.error));
    }

    // default in gossipsub of 3s is not enough since hubs may experience I/O lag
    const gossipsubIWantFollowupMs = process.env["GOSSIPSUB_IWANT_FOLLOWUP_MS"]
      ? parseInt(process.env["GOSSIPSUB_IWANT_FOLLOWUP_MS"])
      : 3 * 1000;

    if (options.p2pConnectTimeoutMs) {
      this._p2pConnectTimeoutMs = options.p2pConnectTimeoutMs;
    } else {
      this._p2pConnectTimeoutMs = process.env[ENV_LIBP2P_CONNECT_TIMEOUT_MS]
        ? parseInt(process.env[ENV_LIBP2P_CONNECT_TIMEOUT_MS])
        : LIBP2P_CONNECT_TIMEOUT_MS;
    }

    const fallbackToFloodsub = process.env["GOSSIPSUB_FALLBACK_TO_FLOODSUB"]
      ? process.env["GOSSIPSUB_FALLBACK_TO_FLOODSUB"] === "true"
      : false;

    const floodPublish = process.env["GOSSIPSUB_FLOOD_PUBLISH"]
      ? process.env["GOSSIPSUB_FLOOD_PUBLISH"] === "true"
      : false;

    // Default timeout is 5 mins, which is too long for us
    const socketTimeout = process.env["GOSSIPSUB_SOCKET_TIMEOUT"]
      ? parseInt(process.env["GOSSIPSUB_SOCKET_TIMEOUT"])
      : 30000;

    const gossip = gossipsub({
      allowPublishToZeroPeers: true,
      asyncValidation: true, // Do not forward messages until we've merged it (prevents forwarding known bad messages)
      canRelayMessage: true,
      directPeers: options.directPeers || [],
      emitSelf: false,
      fallbackToFloodsub: fallbackToFloodsub,
      floodPublish: floodPublish,
      gossipsubIWantFollowupMs: gossipsubIWantFollowupMs,
      globalSignaturePolicy: options.strictNoSign ? "StrictNoSign" : "StrictSign",
      msgIdFn: this.getMessageId.bind(this),
      seenTTL: GOSSIP_SEEN_TTL, // Bump up the default to handle large flood of messages. 2 mins was not sufficient to prevent a loop
      scoreThresholds: { ...options.scoreThresholds },
      scoreParams: {
        appSpecificScore: (peerId) => {
          const score = this._peerScores?.get(peerId) ?? 0;
          if (options.allowlistedImmunePeers?.includes(peerId)) {
            if (score < -100) {
              log.warn({ peerId, score }, "GossipSub: Allowlisted peer would have been kicked out.");
            }

            return options.applicationScoreCap ?? APPLICATION_SCORE_CAP_DEFAULT;
          }

          return Math.min(score, options.applicationScoreCap ?? APPLICATION_SCORE_CAP_DEFAULT);
        },
      },
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
        {
          identity: this.identity,
          deniedPeerIds: options.deniedPeerIdStrs,
          function: "createNode",
        },
        "No PEER-ID RESTRICTIONS ENABLED. This node will accept connections from any peer",
      );
    }
    this._connectionGater = new ConnectionFilter(options.allowedPeerIdStrs, options.deniedPeerIdStrs);

    const result = await ResultAsync.fromPromise(
      createLibp2p({
        // Only set optional fields if defined to avoid errors
        ...(peerId && { peerId }),
        connectionGater: this._connectionGater,
        connectionManager: {
          minConnections: 0,
        },
        addresses: {
          listen: [listenMultiAddrStr],
          announce: announceMultiAddrStrList,
        },
        transports: [
          tcp({ inboundSocketInactivityTimeout: socketTimeout, outboundSocketInactivityTimeout: socketTimeout }),
        ],
        streamMuxers: [mplex()],
        connectionEncryption: [noise()],
        services: {
          pubsub: gossip,
        },
      }),
      (e) => {
        log.error({ identity: this.identity, error: e }, "failed to create libp2p node");
        return new HubError("unavailable", {
          message: "failed to create libp2p node",
          cause: e as Error,
        });
      },
    );

    if (result.isErr()) {
      return err(result.error);
    }

    this._node = result.value;
    return ok(true);
  }

  async start() {
    await this._node?.start();
    this.registerEventListeners();

    // Set up a timer to log the memory usage every minute
    setInterval(() => {
      const memoryData = process.memoryUsage();

      statsd().gauge("memory.gossipworker.rss", memoryData.rss);
      statsd().gauge("memory.gossipworker.heap_total", memoryData.heapTotal);
      statsd().gauge("memory.gossipworker.heap_used", memoryData.heapUsed);
      statsd().gauge("memory.gossipworker.external", memoryData.external);

      // Uncomment this code to enable heap dumps
      // if (memoryData.heapUsed > 3 * 1024 * 1024 * 1024 && Date.now() - lastHeapDumpTime > 10 * 60 * 1000) {
      //   const fileName = `${DB_DIRECTORY}/process/HeapDump-${Date.now()}.heapsnapshot`;

      //   const writtenFileName = v8.writeHeapSnapshot(fileName);
      //   log.info({ writtenFileName }, "Wrote heap snapshot");
      //   lastHeapDumpTime = Date.now();
      // }
    }, 60 * 1000);
  }

  async isStarted(): Promise<boolean> {
    return this._node?.isStarted() ?? false;
  }

  async stop() {
    await this._node?.stop();
  }

  /** Return if we have any inbound P2P connections */
  hasInboundConnections(): boolean {
    return this._node?.getConnections().some((conn) => conn.stat.direction === "inbound") ?? false;
  }

  allPeerIds(): string[] {
    return this._node?.getPeers()?.map((peer) => peer.toString()) ?? [];
  }

  updateAllowedPeerIds(peerIds: string[] | undefined) {
    this._connectionGater?.updateAllowedPeers(peerIds);
  }

  updateDeniedPeerIds(peerIds: string[]) {
    this._connectionGater?.updateDeniedPeers(peerIds);
  }

  /* Generates a message ID for gossip messages
   *
   * Specifically overrides the default behavior for Farcaster Protocol Messages that are created by user interactions
   *
   * @param message - The message to generate an ID for
   * @returns The message ID as an Uint8Array
   */
  getMessageId(message: GossipSubMessage): Uint8Array | Promise<Uint8Array> {
    if (message.topic.includes(GossipNode.primaryTopicForNetwork(this._network))) {
      // check if message is a Farcaster Protocol Message
      const protocolMessage = LibP2PNode.decodeMessage(message.data);
      if (protocolMessage.isOk() && protocolMessage.value.version === GossipVersion.V1_1) {
        if (protocolMessage.value.message !== undefined) {
          return protocolMessage.unwrapOr(undefined)?.message?.hash ?? new Uint8Array();
        } else if (protocolMessage.value.messageBundle !== undefined) {
          return protocolMessage.unwrapOr(undefined)?.messageBundle?.hash ?? new Uint8Array();
        }
      }
    }
    return msgIdFnStrictNoSign(message);
  }

  static encodeMessage(message: GossipMessage): HubResult<Uint8Array> {
    return ok(GossipMessage.encode(message).finish());
  }

  static decodeMessage(msgBytes: Uint8Array): HubResult<GossipMessage> {
    // Convert GossipMessage to Uint8Array or decode will return nested Uint8Arrays as Buffers
    try {
      const gossipMessage = GossipMessage.decode(Uint8Array.from(msgBytes));
      const supportedVersions = [GOSSIP_PROTOCOL_VERSION, GossipVersion.V1];
      if (gossipMessage.topics.length === 0 || supportedVersions.findIndex((v) => v === gossipMessage.version) === -1) {
        return err(new HubError("bad_request.parse_failure", "invalid message"));
      }
      peerIdFromBytes(gossipMessage.peerId);
      return ok(GossipMessage.decode(Uint8Array.from(msgBytes)));
      // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
    } catch (error: any) {
      return err(new HubError("bad_request.parse_failure", error));
    }
  }

  async connectAddress(address: MultiAddr.Multiaddr): Promise<HubResult<void>> {
    log.debug({ identity: this.identity, address }, `Attempting to connect to address ${address}`);
    try {
      const controller = new AbortController();
      // Set timeout to abort the dial operation
      setTimeout(() => controller.abort(), this._p2pConnectTimeoutMs);

      const conn = await this._node?.dial(address, { signal: controller.signal });

      if (conn) {
        log.info({ identity: this.identity, address: address.toString() }, `Connected to peer at address: ${address}`);
        return ok(undefined);
      }
      // biome-ignore lint/suspicious/noExplicitAny: error catching
    } catch (error: any) {
      log.error(error, `Failed to connect to peer at address: ${address}`);
      return err(new HubError("unavailable", error));
    }
    return err(
      new HubError("unavailable", {
        message: `cannot connect to peer: ${address}`,
      }),
    );
  }

  async addPeerToAddressBook(peerId: PeerId, multiaddr: MultiAddr.Multiaddr) {
    const store = this._node?.peerStore;
    if (!store) {
      log.error({}, "peer store missing for gossipNode");
    } else {
      const addResult = await ResultAsync.fromPromise(
        store.merge(peerId, {
          multiaddrs: [multiaddr],
        }),
        (error) => new HubError("unavailable", error as Error),
      );
      if (addResult.isErr()) {
        log.error({ error: addResult.error, peerId }, "failed to add contact info to address book");
      }
    }
  }

  async peerStoreCount() {
    // Note this is performance intensive and blocks the event loop if there are many peers
    const peers = await this._node?.peerStore.all();
    return peers?.length ?? 0;
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

    const store = this._node?.peerStore;
    if (!store) {
      log.error({}, "peer store missing for gossipNode");
    } else {
      await store.delete(peerId);
    }
  }

  async connectionStats(): Promise<{ inbound: number; outbound: number }> {
    const [inbound, outbound] = this._node?.getConnections()?.reduce(
      (acc, conn) => {
        acc[conn.stat.direction === "inbound" ? 0 : 1]++;
        return acc;
      },
      [0, 0],
    ) || [0, 0];
    return { inbound, outbound };
  }

  async getPeerAddresses(peerId: PeerId): Promise<MultiAddr.Multiaddr[]> {
    const existingConnections = this._node?.getConnections(peerId);
    for (const conn of existingConnections ?? []) {
      const peer = await this._node?.peerStore.get(peerId);
      if (peer && !peer.addresses.find((addr) => addr.multiaddr.equals(conn.remoteAddr))) {
        await this._node?.peerStore.merge(peerId, {
          multiaddrs: [conn.remoteAddr],
        });
      }
    }

    const addresses = (await this._node?.peerStore.get(peerId))?.addresses.map((addr) => addr.multiaddr);
    return addresses ?? [];
  }

  async isPeerAllowed(peerId: PeerId) {
    if (this._connectionGater) {
      return await this._connectionGater.filterMultiaddrForPeer(peerId);
    } else {
      return true;
    }
  }

  async gossipMessage(message: Message): Promise<GossipPublishResult> {
    return this._bundleCreator.gossipMessage(message);
  }

  /** Serializes and publishes a Farcaster Bundle to the network */
  async broadcastBundle(messageBundle: MessageBundle): Promise<HubResult<PublishResult>[]> {
    const bundleMessage = GossipMessage.create({
      messageBundle,
      topics: [GossipNode.primaryTopicForNetwork(this._network)],
      peerId: this.peerId?.toBytes() ?? new Uint8Array(),
      version: GOSSIP_PROTOCOL_VERSION,
      timestamp: toFarcasterTime(Date.now()).unwrapOr(0),
    });

    return this.publish(bundleMessage);
  }

  /** Serializes and publishes a Farcaster Message to the network */
  async broadcastMessage(message: Message): Promise<HubResult<PublishResult>[]> {
    const gossipMessage = GossipMessage.create({
      message,
      topics: [GossipNode.primaryTopicForNetwork(this._network)],
      peerId: this.peerId?.toBytes() ?? new Uint8Array(),
      version: GOSSIP_PROTOCOL_VERSION,
      timestamp: toFarcasterTime(Date.now()).unwrapOr(0),
    });
    return this.publish(gossipMessage);
  }

  /** Serializes and publishes this node's ContactInfo to the network */
  async broadcastGossipContactInfo(contactInfo: ContactInfoContent): Promise<HubResult<PublishResult>[]> {
    const gossipMessage = GossipMessage.create({
      contactInfoContent: contactInfo,
      topics: [GossipNode.contactInfoTopicForNetwork(this._network)],
      peerId: this.peerId?.toBytes() ?? new Uint8Array(),
      version: GOSSIP_PROTOCOL_VERSION,
      timestamp: toFarcasterTime(Date.now()).unwrapOr(0),
    });
    return this.publish(gossipMessage);
  }

  /** Publishes a Gossip Message to the network */
  async publish(message: GossipMessage): Promise<HubResult<PublishResult>[]> {
    const topics = message.topics;
    const encodedMessage = LibP2PNode.encodeMessage(message);

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
            // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
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

  async reportValid(messageId: string, propagationSource: PeerId, isValid: boolean) {
    isValid
      ? statsd().increment("gossip.async_validation.accept")
      : statsd().increment("gossip.async_validation.reject");

    this.gossip?.reportMessageValidationResult(
      messageId,
      propagationSource,
      isValid ? TopicValidatorResult.Accept : TopicValidatorResult.Ignore,
    );
  }

  updateApplicationPeerScore(peerId: string, score: number) {
    this._peerScores.set(peerId, score);
  }

  registerEventListeners() {
    // When serializing data, we need to handle some data types specially.
    // 1, BigInts are not supported by JSON.stringify, so we convert them to strings
    const jsonSerializer = (_key: unknown, value: unknown) => {
      if (typeof value === "bigint") {
        return value.toString(10);
      }
      return value;
    };

    const eventHandler = (eventName: string) => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      return (event: any) => {
        // console.log("Worker: Rebroadcasting ", eventName, event.detail);
        // console.log(" with ", JSON.stringify(event.detail, bigIntSerializer, 2));
        parentPort?.postMessage({
          event: {
            eventName,
            detail: JSON.stringify(event.detail, jsonSerializer),
          },
        });
      };
    };

    this._node?.addEventListener("connection:open", eventHandler("connection:open"));
    this._node?.addEventListener("connection:close", eventHandler("connection:close"));
    this._node?.addEventListener("peer:discovery", eventHandler("peer:discovery"));

    this.gossip?.addEventListener("gossipsub:message", eventHandler("gossipsub:message"));
    this.gossip?.addEventListener("message", eventHandler("message"));
    this.gossip?.addEventListener("subscription-change", eventHandler("subscription-change"));
  }
}

const libp2pNode = new LibP2PNode(workerData?.network as FarcasterNetwork);

// This function is a no-op at runtime, but exists to typecheck the return values
// the worker thread sends back to the main thread. Getting this wrong will cause
// difficult bugs, so better to let the compiler check it for us.
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
function makeResult<MethodName extends keyof LibP2PNodeInterface>(
  result: UnwrapPromise<LibP2PNodeMethodReturnType<MethodName>>,
) {
  return result;
}

parentPort?.on("message", async (msg: LibP2PNodeMethodGenericMessage) => {
  // console.log("Received message from parent thread", msg);
  const { method, methodCallId } = msg;

  const start = Date.now();
  switch (method) {
    case "makeNode": {
      const specificMsg = msg as LibP2PNodeMessage<"makeNode">;
      const [options] = specificMsg.args;

      const node = await libp2pNode.makeNode(options);
      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"makeNode">({
          success: node.isOk(),
          errorMessage: node.isErr() ? node.error.message : undefined,
          errorType: node.isErr() ? node.error.errCode : undefined,
        }),
      });
      break;
    }
    case "start": {
      await libp2pNode.start();

      const peerId = libp2pNode.peerId ? exportToProtobuf(libp2pNode.peerId) : new Uint8Array();
      const multiaddrs = libp2pNode._node?.getMultiaddrs().map((m) => m.bytes) ?? [];

      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"start">({ peerId, multiaddrs }),
      });
      break;
    }
    case "stop": {
      await libp2pNode.stop();
      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"stop">(undefined),
      });

      // Exit the worker thread
      setTimeout(() => process.exit(0), 1000);
      break;
    }
    case "loggerFlush": {
      // Flush any buffered logs and start logging to STDOUT
      logger.flush();
      parentPort?.postMessage({ methodCallId, result: makeResult<"loggerFlush">(undefined) });
      break;
    }
    case "allPeerIds": {
      const peerIds = libp2pNode.allPeerIds();
      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"allPeerIds">(peerIds),
      });
      break;
    }
    case "addToAddressBook": {
      const specificMsg = msg as LibP2PNodeMessage<"addToAddressBook">;
      const [peerId, multiaddr] = specificMsg.args;

      await libp2pNode.addPeerToAddressBook(await createFromProtobuf(peerId), MultiAddr.multiaddr(multiaddr));
      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"addToAddressBook">(undefined),
      });
      break;
    }
    case "peerStoreCount": {
      const count = await libp2pNode.peerStoreCount();

      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"peerStoreCount">(count),
      });
      break;
    }
    case "removeFromAddressBook": {
      const specificMsg = msg as LibP2PNodeMessage<"removeFromAddressBook">;
      const [peerId] = specificMsg.args;

      await libp2pNode.removePeerFromAddressBook(await createFromProtobuf(peerId));
      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"removeFromAddressBook">(undefined),
      });
      break;
    }
    // NOTE: connectAddress attempts to dial a peer in the p2p network. A large influx of these requests can cause
    //   backlog congestion for the worker thread if the timeout value is too large. The default value is defined in
    //   gossipNode.ts [LIBP2P_CONNECT_TIMEOUT_MS] and can be overridden by the environment variable [ENV_LIBP2P_CONNECT_TIMEOUT_MS].
    case "connectAddress": {
      const specificMsg = msg as LibP2PNodeMessage<"connectAddress">;
      const [multiaddr] = specificMsg.args;

      const result = await libp2pNode.connectAddress(MultiAddr.multiaddr(multiaddr));
      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"connectAddress">({
          success: result?.isOk(),
          errorType: result?.isErr() ? result.error.errCode : undefined,
          errorMessage: result?.isErr() ? result.error.message : undefined,
        }),
      });
      break;
    }
    case "connectionStats": {
      const stats = await libp2pNode.connectionStats();
      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"connectionStats">(stats),
      });
      break;
    }
    case "getPeerAddresses": {
      const specificMsg = msg as LibP2PNodeMessage<"getPeerAddresses">;
      const [peerId] = specificMsg.args;

      const addresses = await libp2pNode.getPeerAddresses(await createFromProtobuf(peerId));
      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"getPeerAddresses">(addresses?.map((addr) => addr.bytes)),
      });
      break;
    }
    case "isPeerAllowed": {
      const specificMsg = msg as LibP2PNodeMessage<"isPeerAllowed">;
      const [peerId] = specificMsg.args;

      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"isPeerAllowed">(await libp2pNode.isPeerAllowed(await createFromProtobuf(peerId))),
      });
      break;
    }
    case "updateAllowedPeerIds": {
      const specificMsg = msg as LibP2PNodeMessage<"updateAllowedPeerIds">;
      const [peerIds] = specificMsg.args;

      libp2pNode.updateAllowedPeerIds(peerIds);
      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"updateAllowedPeerIds">(undefined),
      });
      break;
    }
    case "updateDeniedPeerIds": {
      const specificMsg = msg as LibP2PNodeMessage<"updateDeniedPeerIds">;
      const [peerIds] = specificMsg.args;

      libp2pNode.updateDeniedPeerIds(peerIds);
      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"updateDeniedPeerIds">(undefined),
      });
      break;
    }
    case "subscribe": {
      const specificMsg = msg as LibP2PNodeMessage<"subscribe">;
      const [topic] = specificMsg.args;

      libp2pNode.subscribe(topic);
      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"subscribe">(undefined),
      });
      break;
    }
    case "broadcastMessage": {
      const specificMsg = msg as LibP2PNodeMessage<"broadcastMessage">;
      const [message] = specificMsg.args;

      const publishResult = await libp2pNode.broadcastMessage(Message.decode(message));
      const combinedResult = Result.combine(publishResult ?? []);

      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"broadcastMessage">({
          success: combinedResult.isOk(),
          errorMessage: combinedResult.isErr() ? combinedResult.error.message : undefined,
          errorType: combinedResult.isErr() ? combinedResult.error.errCode : undefined,
          peerIds: combinedResult?.isOk()
            ? combinedResult.value.flatMap((r) => r.recipients).map((p) => exportToProtobuf(p))
            : [],
        }),
      });
      break;
    }
    case "gossipMessage": {
      const specificMsg = msg as LibP2PNodeMessage<"gossipMessage">;
      const [message] = specificMsg.args;

      statsd().gauge("gossip.worker.gossip_message_size_bytes", message.length, 1, { method: "gossipSubmitMessage" });

      const publishResult = await libp2pNode.gossipMessage(Message.decode(message));
      const combinedResult = Result.combine(publishResult.publishResults ?? []);

      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"gossipMessage">({
          success: combinedResult.isOk(),
          errorMessage: combinedResult.isErr() ? combinedResult.error.message : undefined,
          errorType: combinedResult.isErr() ? combinedResult.error.errCode : undefined,
          bundled: publishResult.bundled,
          peerIds: combinedResult?.isOk()
            ? combinedResult.value.flatMap((r) => r.recipients).map((p) => exportToProtobuf(p))
            : [],
        }),
      });
      break;
    }
    case "gossipBundle": {
      const specificMsg = msg as LibP2PNodeMessage<"gossipBundle">;
      const [messageBundle] = specificMsg.args;

      const combinedResult = Result.combine(await libp2pNode.broadcastBundle(MessageBundle.decode(messageBundle)));

      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"gossipBundle">({
          success: combinedResult.isOk(),
          errorMessage: combinedResult.isErr() ? combinedResult.error.message : undefined,
          errorType: combinedResult.isErr() ? combinedResult.error.errCode : undefined,
          peerIds: combinedResult?.isOk()
            ? combinedResult.value.flatMap((r) => r.recipients).map((p) => exportToProtobuf(p))
            : [],
        }),
      });
      break;
    }
    case "gossipContactInfo": {
      const specificMsg = msg as LibP2PNodeMessage<"gossipContactInfo">;
      const [contactInfo] = specificMsg.args;

      statsd().gauge("gossip.worker.gossip_message_size_bytes", contactInfo.length, 1, { method: "gossipContactInfo" });

      const publishResult = Result.combine(
        await libp2pNode.broadcastGossipContactInfo(ContactInfoContent.decode(contactInfo)),
      );
      const flattenedPeerIds = publishResult.isOk() ? publishResult.value.flatMap((r) => r.recipients) : [];

      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"gossipContactInfo">({
          success: publishResult.isOk(),
          errorMessage: publishResult.isErr() ? publishResult.error.message : undefined,
          errorType: publishResult.isErr() ? publishResult.error.errCode : undefined,
          peerIds: publishResult.isOk() ? flattenedPeerIds.map((p) => exportToProtobuf(p)) : [],
        }),
      });
      break;
    }
    case "reportValid": {
      const specificMsg = msg as LibP2PNodeMessage<"reportValid">;
      const [msgId, source, isValid] = specificMsg.args;
      const sourceId = peerIdFromBytes(source);
      await libp2pNode.reportValid(msgId, sourceId, isValid);
      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"reportValid">(undefined),
      });
      break;
    }
    case "updateApplicationPeerScore": {
      const specificMsg = msg as LibP2PNodeMessage<"updateApplicationPeerScore">;
      const [peerId, score] = specificMsg.args;
      await libp2pNode.updateApplicationPeerScore(peerId, score);
      parentPort?.postMessage({
        methodCallId,
        result: makeResult<"updateApplicationPeerScore">(undefined),
      });
      break;
    }
  }

  const tags: { [key: string]: string } = {
    method: method,
  };
  statsd().histogram("gossip.worker.latency_ms", Date.now() - start, 1, tags);
});
