import * as protobufs from '@farcaster/grpc';
import { Factories } from '@farcaster/utils';
import { isPeerId } from '@libp2p/interface-peer-id';
import { peerIdFromBytes } from '@libp2p/peer-id';
import { GOSSIP_PROTOCOL_VERSION } from '~/network/p2p/protocol';
import { NetworkFactories } from '~/network/utils/factories';

describe('GossipMessageFactory', () => {
  let message: protobufs.Message;
  let gossipMessage: protobufs.GossipMessage;

  beforeAll(async () => {
    message = await Factories.Message.create();
    gossipMessage = await NetworkFactories.GossipMessage.create({ message });
  });

  test('creates with arguments', () => {
    expect(gossipMessage.message?.hash).toEqual(Array.from(message.hash));
  });

  test('defaults to the right version', async () => {
    expect(gossipMessage.version).toEqual(GOSSIP_PROTOCOL_VERSION);
  });

  test('generates a valid peerId', async () => {
    const gossipMsg = await NetworkFactories.GossipMessage.create();
    const peerId = peerIdFromBytes(gossipMsg.peerId || new Uint8Array());
    expect(peerId).toBeDefined();
    expect(isPeerId(peerId)).toBeTruthy();
  });
});

describe('AddressInfoFactory', () => {
  test('creates with arguments', async () => {
    const gossipAddress = NetworkFactories.GossipAddressInfo.build({
      address: '127.0.0.1',
      port: 1234,
      family: 4,
    });
    expect(gossipAddress.address).toEqual('127.0.0.1');
    expect(gossipAddress.port).toEqual(1234);
    expect(gossipAddress.family).toEqual(4);
  });
});

describe('ContactInfoFactory', () => {
  let gossipAddress: protobufs.GossipAddressInfo;
  let rpcAddress: protobufs.GossipAddressInfo;

  beforeAll(() => {
    gossipAddress = NetworkFactories.GossipAddressInfo.build();
    rpcAddress = NetworkFactories.GossipAddressInfo.build();
  });

  test('creates with arguments', async () => {
    const contactInfo = NetworkFactories.GossipContactInfoContent.build({ gossipAddress, rpcAddress });
    expect(contactInfo.rpcAddress).toEqual(rpcAddress);
    expect(contactInfo.gossipAddress).toEqual(gossipAddress);
  });
});
