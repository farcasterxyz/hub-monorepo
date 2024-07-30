import { Factories, GossipMessage, Message, GossipAddressInfo } from "@farcaster/hub-nodejs";
import { isPeerId } from "@libp2p/interface";
import { peerIdFromBytes } from "@libp2p/peer-id";
import { GOSSIP_PROTOCOL_VERSION } from "../p2p/protocol.js";
import { NetworkFactories } from "./factories.js";

describe("GossipMessageFactory", () => {
  let message: Message;
  let gossipMessage: GossipMessage;

  beforeAll(async () => {
    message = await Factories.Message.create();
    gossipMessage = await NetworkFactories.GossipMessage.create({ message });
  });

  test("creates with arguments", () => {
    expect(gossipMessage.message?.hash).toEqual(Array.from(message.hash));
  });

  test("defaults to the right version", async () => {
    expect(gossipMessage.version).toEqual(GOSSIP_PROTOCOL_VERSION);
  });

  test("generates a valid peerId", async () => {
    const gossipMsg = await NetworkFactories.GossipMessage.create();
    const peerId = peerIdFromBytes(gossipMsg.peerId || new Uint8Array());
    expect(peerId).toBeDefined();
    expect(isPeerId(peerId)).toBeTruthy();
  });
});

describe("AddressInfoFactory", () => {
  test("creates with arguments", async () => {
    const gossipAddress = NetworkFactories.GossipAddressInfo.build({
      address: "127.0.0.1",
      port: 1234,
      family: 4,
    });
    expect(gossipAddress.address).toEqual("127.0.0.1");
    expect(gossipAddress.port).toEqual(1234);
    expect(gossipAddress.family).toEqual(4);
  });
});

describe("ContactInfoFactory", () => {
  let gossipAddress: GossipAddressInfo;
  let rpcAddress: GossipAddressInfo;

  beforeAll(() => {
    gossipAddress = NetworkFactories.GossipAddressInfo.build();
    rpcAddress = NetworkFactories.GossipAddressInfo.build();
  });

  test("creates with arguments", async () => {
    const contactInfo = NetworkFactories.GossipContactInfoContent.build({ gossipAddress, rpcAddress });
    expect(contactInfo.rpcAddress).toEqual(rpcAddress);
    expect(contactInfo.gossipAddress).toEqual(gossipAddress);
  });
});
