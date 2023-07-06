import {
  Factories,
  getInsecureHubRpcClient,
  HubRpcClient,
  FarcasterNetwork,
  IdRegistryEvent,
  SignerAddMessage,
  Message,
  GossipMessage,
  ContactInfoContent,
  GossipVersion,
} from "@farcaster/hub-nodejs";
import { multiaddr } from "@multiformats/multiaddr/";
import { GossipNode } from "./gossipNode.js";
import Server from "../../rpc/server.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import { MockHub } from "../../test/mocks.js";
import SyncEngine from "../sync/syncEngine.js";
import { PeerId } from "@libp2p/interface-peer-id";
import { sleep } from "../../utils/crypto.js";
import { createEd25519PeerId } from "@libp2p/peer-id-factory";

const TEST_TIMEOUT_SHORT = 10 * 1000;
const db = jestRocksDB("network.p2p.gossipNode.test");

describe("GossipNode", () => {
  test("start fails if IpMultiAddr has port or transport addrs", async () => {
    const node = new GossipNode(db);
    const options = { ipMultiAddr: "/ip4/127.0.0.1/tcp/8080" };
    const error = (await node.start([], options))._unsafeUnwrapErr();

    expect(error.errCode).toEqual("unavailable");
    expect(error.message).toMatch("unexpected multiaddr transport/port information");
    expect(node.isStarted()).toBeFalsy();
    await node.stop();
  });

  test("start fails if multiaddr format is invalid", async () => {
    const node = new GossipNode(db);
    // an IPv6 being supplied as an IPv4
    const options = { ipMultiAddr: "/ip4/2600:1700:6cf0:990:2052:a166:fb35:830a" };
    expect((await node.start([], options))._unsafeUnwrapErr().errCode).toEqual("unavailable");
    const error = (await node.start([], options))._unsafeUnwrapErr();

    expect(error.errCode).toEqual("unavailable");
    expect(error.message).toMatch("invalid multiaddr");
    expect(node.isStarted()).toBeFalsy();
    await node.stop();
  });

  test("connect fails with a node that has not started", async () => {
    const node = new GossipNode(db);
    await node.start([]);

    let result = await node.connectAddress(multiaddr());
    expect(result.isErr()).toBeTruthy();

    const offlineNode = new GossipNode(db);
    result = await node.connect(offlineNode);
    expect(result.isErr()).toBeTruthy();

    await node.stop();
  });

  test(
    "connect fails with a node that is not in the allow list",
    async () => {
      const node1 = new GossipNode(db);
      await node1.start([]);

      const node2 = new GossipNode(db);
      await node2.start([]);

      // node 3 has node 1 in its allow list, but not node 2
      const node3 = new GossipNode(db);

      if (node1.peerId) {
        await node3.start([], { allowedPeerIdStrs: [node1.peerId.toString()] });
      } else {
        throw Error("Node1 not started, no peerId found");
      }

      try {
        let dialResult = await node1.connect(node3);
        expect(dialResult.isOk()).toBeTruthy();

        dialResult = await node2.connect(node3);
        expect(dialResult.isErr()).toBeTruthy();

        dialResult = await node3.connect(node2);
        expect(dialResult.isErr()).toBeTruthy();
      } finally {
        await node1.stop();
        await node2.stop();
        await node3.stop();
      }
    },
    TEST_TIMEOUT_SHORT,
  );

  test("removing from addressbook hangs up connection", async () => {
    const node1 = new GossipNode(db);
    await node1.start([]);

    const node2 = new GossipNode(db);
    await node2.start([]);

    try {
      const dialResult = await node1.connect(node2);
      expect(dialResult.isOk()).toBeTruthy();

      let other = await node1.addressBook?.get(node2.peerId as PeerId);
      expect(other?.length).toEqual(1);

      await node1.removePeerFromAddressBook(node2.peerId as PeerId);

      // Sleep to allow the connection to be closed
      await sleep(1000);

      // Make sure the connection is closed
      other = await node1.addressBook?.get(node2.peerId as PeerId);
      expect(other).toEqual([]);

      other = await node2.addressBook?.get(node1.peerId as PeerId);
      expect(other).toEqual([]);
    } finally {
      await node1.stop();
      await node2.stop();
    }
  });

  describe("gossip messages", () => {
    const network = FarcasterNetwork.TESTNET;
    const fid = Factories.Fid.build();
    const signer = Factories.Ed25519Signer.build();
    const custodySigner = Factories.Eip712Signer.build();

    let server: Server;
    let client: HubRpcClient;
    let custodyEvent: IdRegistryEvent;
    let signerAdd: SignerAddMessage;
    let castAdd: Message;
    let peerId: PeerId;

    beforeAll(async () => {
      peerId = await createEd25519PeerId();
      const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
      const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
      custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

      signerAdd = await Factories.SignerAddMessage.create(
        { data: { fid, network, signerAddBody: { signer: signerKey } } },
        { transient: { signer: custodySigner } },
      );

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
      server = new Server(hub, hub.engine, syncEngine, mockGossipNode);
      const port = await server.start();
      client = getInsecureHubRpcClient(`127.0.0.1:${port}`);

      await hub.submitIdRegistryEvent(custodyEvent);

      // Messages from rpc are gossiped
      await client.submitMessage(signerAdd);
      await client.submitMessage(castAdd);

      expect(numMessagesGossiped).toEqual(2);

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
      const node = new GossipNode(db);
      await node.start([]);
      await node.gossipMessage(castAdd);
      // should be detected as a duplicate
      let result = await node.gossipMessage(castAdd);
      result.forEach((res) => {
        expect(res.isErr()).toBeTruthy();
        expect(res._unsafeUnwrapErr().errCode).toEqual("bad_request.duplicate");
      });

      const gossipMessage = GossipMessage.create({
        idRegistryEvent: custodyEvent,
        topics: [node.primaryTopic()],
        peerId: node.peerId?.toBytes() ?? new Uint8Array(),
        version: GossipVersion.V1_1,
      });

      await node.publish(gossipMessage);
      result = await node.publish(gossipMessage);
      result.forEach((res) => {
        expect(res.isErr()).toBeTruthy();
        expect(res._unsafeUnwrapErr().errCode).toEqual("bad_request.duplicate");
      });

      await node.stop();
    });

    test("Gossip Ids do not match for gossip internal messages", async () => {
      const node = new GossipNode(db);
      await node.start([]);

      const contactInfo = ContactInfoContent.create();
      await node.gossipContactInfo(contactInfo);
      const result = await node.gossipContactInfo(contactInfo);
      result.forEach((res) => expect(res.isOk()).toBeTruthy());

      await node.stop();
    });

    test("Gossip Ids do not match for gossip V1 messages", async () => {
      const node = new GossipNode(db);
      await node.start([]);
      const v1Message = GossipMessage.create({
        message: castAdd,
        topics: [node.primaryTopic()],
        peerId: node.peerId?.toBytes() ?? new Uint8Array(),
        version: GossipVersion.V1,
      });

      await node.publish(v1Message);
      // won't be detected as a duplicate
      const result = await node.publish(v1Message);
      result.forEach((res) => {
        expect(res.isOk()).toBeTruthy();
      });
      await node.stop();
    });

    test("Gossip Message decode works for valid messages", async () => {
      const contactInfo = ContactInfoContent.create();
      let gossipMessage = GossipMessage.create({
        contactInfoContent: contactInfo,
        topics: ["foobar"],
        peerId: peerId.toBytes(),
      });
      expect(GossipNode.decodeMessage(GossipNode.encodeMessage(gossipMessage)._unsafeUnwrap()).isOk()).toBeTruthy();

      gossipMessage = GossipMessage.create({
        message: castAdd,
        topics: ["foobar"],
        peerId: peerId.toBytes(),
      });
      expect(GossipNode.decodeMessage(GossipNode.encodeMessage(gossipMessage)._unsafeUnwrap()).isOk()).toBeTruthy();

      gossipMessage = GossipMessage.create({
        idRegistryEvent: custodyEvent,
        topics: ["foobar"],
        peerId: peerId.toBytes(),
      });
      expect(GossipNode.decodeMessage(GossipNode.encodeMessage(gossipMessage)._unsafeUnwrap()).isOk()).toBeTruthy();
    });

    test("Gossip Message decode fails for invalid buffers", async () => {
      expect(GossipNode.decodeMessage(new Uint8Array()).isErr()).toBeTruthy();
      expect(GossipNode.decodeMessage(Message.encode(castAdd).finish()).isErr()).toBeTruthy();

      let gossipMessage = GossipMessage.create({
        message: castAdd,
        // empty topics are not allowed
        topics: [],
        peerId: peerId.toBytes(),
      });
      expect(GossipNode.decodeMessage(GossipNode.encodeMessage(gossipMessage)._unsafeUnwrap()).isErr()).toBeTruthy();

      gossipMessage = GossipMessage.create({
        message: castAdd,
        topics: ["foobar"],
        // invalid peerIds are not allowed
        peerId: new Uint8Array(),
      });
      expect(GossipNode.decodeMessage(GossipNode.encodeMessage(gossipMessage)._unsafeUnwrap()).isErr()).toBeTruthy();

      gossipMessage = GossipMessage.create({
        message: castAdd,
        topics: ["foobar"],
        peerId: peerId.toBytes(),
        // invalid versions are not allowed
        version: 12345 as GossipVersion,
      });
      expect(GossipNode.decodeMessage(GossipNode.encodeMessage(gossipMessage)._unsafeUnwrap()).isErr()).toBeTruthy();
    });
  });
});
