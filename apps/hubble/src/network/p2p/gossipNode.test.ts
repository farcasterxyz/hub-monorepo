import {
  Factories,
  getInsecureHubRpcClient,
  HubRpcClient,
  FarcasterNetwork,
  Message,
  GossipMessage,
  ContactInfoContent,
  GossipVersion,
  OnChainEvent,
} from "@farcaster/hub-nodejs";
import { multiaddr } from "@multiformats/multiaddr/";
import { GossipNode } from "./gossipNode.js";
import Server from "../../rpc/server.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import { MockHub } from "../../test/mocks.js";
import SyncEngine from "../sync/syncEngine.js";
import { PeerId } from "@libp2p/interface-peer-id";
import { sleepWhile } from "../../utils/crypto.js";
import { createEd25519PeerId } from "@libp2p/peer-id-factory";
import { LibP2PNode } from "./gossipNodeWorker.js";
import { ResultAsync } from "neverthrow";

const TEST_TIMEOUT_SHORT = 10 * 1000;
const TEST_TIMEOUT_LONG = 30 * 1000;
const db = jestRocksDB("network.p2p.gossipNode.test");

describe("GossipNode", () => {
  let node: GossipNode;

  beforeEach(() => {
    node = new GossipNode();
  });

  afterEach(async () => {
    await node.stop();
  });

  test("start fails if IpMultiAddr has port or transport addrs", async () => {
    const options = { ipMultiAddr: "/ip4/127.0.0.1/tcp/8080" };
    const error = (await node.start([], options))._unsafeUnwrapErr();

    expect(error.errCode).toEqual("unavailable");
    expect(error.message).toMatch("unexpected multiaddr transport/port information");
    expect(node.isStarted()).toBeFalsy();
  });

  test("start fails if multiaddr format is invalid", async () => {
    // an IPv6 being supplied as an IPv4
    const options = { ipMultiAddr: "/ip4/2600:1700:6cf0:990:2052:a166:fb35:830a" };
    expect((await node.start([], options))._unsafeUnwrapErr().errCode).toEqual("unavailable");
    const error = (await node.start([], options))._unsafeUnwrapErr();

    expect(error.errCode).toEqual("unavailable");
    expect(error.message).toMatch("invalid multiaddr");
    expect(node.isStarted()).toBeFalsy();
  });

  test("connect fails with a node that has not started", async () => {
    await node.start([]);

    let result = await node.connectAddress(multiaddr());
    expect(result.isErr()).toBeTruthy();

    const offlineNode = new GossipNode();
    result = await node.connect(offlineNode);
    expect(result.isErr()).toBeTruthy();
  });

  test(
    "connect fails with a node that is not in the allow list",
    async () => {
      expect((await node.start([])).isOk()).toBeTruthy();

      const node2 = new GossipNode();
      expect((await node2.start([])).isOk()).toBeTruthy();

      // node 3 has node 1 in its allow list, but not node 2
      const node3 = new GossipNode();

      if (node.peerId()) {
        expect((await node3.start([], { allowedPeerIdStrs: [node.peerId()?.toString() ?? ""] })).isOk()).toBeTruthy();
      } else {
        throw Error("Node1 not started, no peerId found");
      }

      try {
        let dialResult = await node.connect(node3);
        expect(dialResult.isOk()).toBeTruthy();

        dialResult = await node2.connect(node3);
        expect(dialResult.isErr()).toBeTruthy();

        dialResult = await node3.connect(node2);
        expect(dialResult.isErr()).toBeTruthy();
      } finally {
        await node2.stop();
        await node3.stop();
      }
    },
    TEST_TIMEOUT_LONG,
  );

  test(
    "removing from addressbook hangs up connection",
    async () => {
      await node.start([]);

      const node2 = new GossipNode();
      await node2.start([]);

      try {
        const dialResult = await node.connect(node2);
        expect(dialResult.isOk()).toBeTruthy();

        let other = await node.getPeerAddresses(node2.peerId() as PeerId);
        expect(other?.length).toEqual(1);

        // We have at least 1 address for node1
        other = await node2.getPeerAddresses(node.peerId() as PeerId);
        expect(other?.length).toBeGreaterThanOrEqual(1);
        expect(await node2.allPeerIds()).toContain(node.peerId()?.toString());

        await node.removePeerFromAddressBook(node2.peerId() as PeerId);

        // Sleep to allow the connection to be closed
        await sleepWhile(async () => (await node.getPeerAddresses(node2.peerId() as PeerId)).length > 0, 10 * 1000);

        // Make sure the connection is closed
        other = await node.getPeerAddresses(node2.peerId() as PeerId);
        expect(other).toEqual([]);

        expect(await node2.allPeerIds()).toEqual([]);
      } finally {
        await node2.stop();
      }
    },
    TEST_TIMEOUT_SHORT,
  );

  describe("gossip messages", () => {
    const network = FarcasterNetwork.TESTNET;
    const fid = Factories.Fid.build();
    const signer = Factories.Ed25519Signer.build();
    const custodySigner = Factories.Eip712Signer.build();

    let server: Server;
    let client: HubRpcClient;
    let custodyEvent: OnChainEvent;
    let signerEvent: OnChainEvent;
    let storageEvent: OnChainEvent;
    let castAdd: Message;
    let peerId: PeerId;

    beforeAll(async () => {
      peerId = await createEd25519PeerId();
      const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
      const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
      custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
      signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signerKey } });
      storageEvent = Factories.StorageRentOnChainEvent.build({ fid });

      castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
    });

    test("gossip messages only from rpc", async () => {
      let numMessagesGossiped = 0;
      const mockGossipNode = {
        gossipMessage: (_msg: Message) => {
          numMessagesGossiped += 1;
        },
      } as unknown as GossipNode;
      const hub = new MockHub(db, undefined, mockGossipNode);

      const syncEngine = new SyncEngine(hub, db);
      await syncEngine.start();
      server = new Server(hub, hub.engine, syncEngine, mockGossipNode);
      const port = await server.start();
      client = getInsecureHubRpcClient(`127.0.0.1:${port}`);

      await hub.submitOnChainEvent(custodyEvent);
      await hub.submitOnChainEvent(signerEvent);
      await hub.submitOnChainEvent(storageEvent);

      // Messages from rpc are gossiped
      await client.submitMessage(castAdd);

      expect(numMessagesGossiped).toEqual(1);

      // Directly merged messages don't gossip
      numMessagesGossiped = 0;
      const castAdd2 = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
      await hub.submitMessage(castAdd2);
      expect(numMessagesGossiped).toEqual(0);

      client.close();
      await server.stop(true); // force
      await syncEngine.stop();
    });

    test("Gossip Ids match for farcaster protocol messages", async () => {
      await node.start([]);
      await node.gossipMessage(castAdd);
      // should be detected as a duplicate
      const res = await node.gossipMessage(castAdd);

      expect(res.isErr()).toBeTruthy();
      expect(res._unsafeUnwrapErr().errCode).toEqual("bad_request.duplicate");
    });

    test("Gossip Ids do match for gossip internal messages", async () => {
      await node.start([]);

      const contactInfo = ContactInfoContent.create();
      await node.gossipContactInfo(contactInfo);
      const res2 = await node.gossipContactInfo(contactInfo);
      expect(res2.isErr()).toBeTruthy();
    });

    test("Gossip Ids do match for gossip V1 messages", async () => {
      const node = new LibP2PNode(FarcasterNetwork.DEVNET);
      await node.makeNode({});

      const v1Message = GossipMessage.create({
        message: castAdd,
        topics: [node.gossipTopics()[0] as string],
        peerId: node.peerId?.toBytes() ?? new Uint8Array(),
        version: GossipVersion.V1,
      });

      await node.publish(v1Message);
      // should be detected as a duplicate
      const result = await node.publish(v1Message);
      result.forEach((res) => {
        expect(res.isErr()).toBeTruthy();
      });
    });

    test("Gossip Message decode works for valid messages", async () => {
      const contactInfo = ContactInfoContent.create();
      let gossipMessage = GossipMessage.create({
        contactInfoContent: contactInfo,
        topics: ["foobar"],
        peerId: peerId.toBytes(),
      });
      expect(LibP2PNode.decodeMessage(LibP2PNode.encodeMessage(gossipMessage)._unsafeUnwrap()).isOk()).toBeTruthy();

      gossipMessage = GossipMessage.create({
        message: castAdd,
        topics: ["foobar"],
        peerId: peerId.toBytes(),
      });
      expect(LibP2PNode.decodeMessage(LibP2PNode.encodeMessage(gossipMessage)._unsafeUnwrap()).isOk()).toBeTruthy();
    });

    test("Gossip Message decode fails for invalid buffers", async () => {
      expect(LibP2PNode.decodeMessage(new Uint8Array()).isErr()).toBeTruthy();
      expect(LibP2PNode.decodeMessage(Message.encode(castAdd).finish()).isErr()).toBeTruthy();

      let gossipMessage = GossipMessage.create({
        message: castAdd,
        // empty topics are not allowed
        topics: [],
        peerId: peerId.toBytes(),
      });
      expect(LibP2PNode.decodeMessage(LibP2PNode.encodeMessage(gossipMessage)._unsafeUnwrap()).isErr()).toBeTruthy();

      gossipMessage = GossipMessage.create({
        message: castAdd,
        topics: ["foobar"],
        // invalid peerIds are not allowed
        peerId: new Uint8Array(),
      });
      expect(LibP2PNode.decodeMessage(LibP2PNode.encodeMessage(gossipMessage)._unsafeUnwrap()).isErr()).toBeTruthy();

      gossipMessage = GossipMessage.create({
        message: castAdd,
        topics: ["foobar"],
        // invalid peerIds are not allowed
        peerId: undefined as unknown as Uint8Array,
      });
      expect(LibP2PNode.decodeMessage(LibP2PNode.encodeMessage(gossipMessage)._unsafeUnwrap()).isErr()).toBeTruthy();

      gossipMessage = GossipMessage.create({
        message: castAdd,
        topics: ["foobar"],
        peerId: peerId.toBytes(),
        // invalid versions are not allowed
        version: 12345 as GossipVersion,
      });
      expect(LibP2PNode.decodeMessage(LibP2PNode.encodeMessage(gossipMessage)._unsafeUnwrap()).isErr()).toBeTruthy();

      // Invalid encoding
      expect(LibP2PNode.decodeMessage(new Uint8Array([1, 2, 3, 4, 5])).isErr()).toBeTruthy();
      expect(LibP2PNode.decodeMessage(new Uint8Array([])).isErr()).toBeTruthy();
      expect(LibP2PNode.decodeMessage(undefined as unknown as Uint8Array).isErr()).toBeTruthy();
    });
  });
});
