import * as flatbuffers from '@hub/flatbuffers';
import { MessageBytesT } from '@hub/flatbuffers';
import { Factories } from '@hub/utils';
import { isPeerId } from '@libp2p/interface-peer-id';
import { peerIdFromBytes } from '@libp2p/peer-id';
import MessageModel from '~/flatbuffers/models/messageModel';
import { GOSSIP_PROTOCOL_VERSION } from '~/network/p2p/protocol';
import { NetworkFactories } from '~/network/utils/factories';

describe('GossipMessageFactory', () => {
  let content: flatbuffers.Message;
  let message: flatbuffers.GossipMessage;

  beforeAll(async () => {
    content = await Factories.Message.create();
    message = await NetworkFactories.GossipMessage.create({
      contentType: flatbuffers.GossipContent.MessageBytes,
      content: new MessageBytesT(Array.from(new MessageModel(content).toBytes())),
    });
  });

  test('creates with arguments', () => {
    expect(message.unpack().content).toEqual(new MessageBytesT(Array.from(new MessageModel(content).toBytes())));
  });

  test('creates a FC Message by default', async () => {
    const other = await NetworkFactories.GossipMessage.create();
    expect(other).toBeDefined();
    expect(other.contentType()).toEqual(flatbuffers.GossipContent.MessageBytes);
    expect(other.unpack().content).not.toEqual(content.unpack());
  });

  test('defaults to the right version', async () => {
    expect(message.version()).toEqual(GOSSIP_PROTOCOL_VERSION);
  });

  test('generates a valid peerId', async () => {
    const gossipMsg = await NetworkFactories.GossipMessage.create();
    const peerId = peerIdFromBytes(gossipMsg.peerIdArray() || new Uint8Array());
    expect(peerId).toBeDefined();
    expect(isPeerId(peerId)).toBeTruthy();
  });
});

describe('AddressInfoFactory', () => {
  test('creates with arguments', async () => {
    const gossipAddress = await NetworkFactories.GossipAddressInfo.create({
      address: '127.0.0.1',
      port: 1234,
      family: 4,
    });
    expect(gossipAddress.address()).toEqual('127.0.0.1');
    expect(gossipAddress.port()).toEqual(1234);
    expect(gossipAddress.family()).toEqual(4);
  });
});

describe('ContactInfoFactory', () => {
  let gossipAddress: flatbuffers.GossipAddressInfoT;
  let rpcAddress: flatbuffers.GossipAddressInfoT;

  beforeAll(() => {
    gossipAddress = NetworkFactories.GossipAddressInfo.build();
    rpcAddress = NetworkFactories.GossipAddressInfo.build();
  });

  test('creates with arguments', async () => {
    const contactInfo = await NetworkFactories.GossipContactInfoContent.create({ gossipAddress, rpcAddress });
    expect(contactInfo.rpcAddress()?.unpack()).toEqual(rpcAddress);
    expect(contactInfo.gossipAddress()?.unpack()).toEqual(gossipAddress);
  });
});
