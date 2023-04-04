import { faker } from '@faker-js/faker';
import {
  ContactInfoContent,
  Factories,
  GossipAddressInfo,
  GossipMessage,
  GossipVersion,
  hexStringToBytes,
} from '@farcaster/hub-nodejs';
import { PeerId } from '@libp2p/interface-peer-id';
import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { Factory } from 'fishery';
import { NETWORK_TOPIC_PRIMARY } from '~/network/p2p/protocol';
import { HASH_LENGTH, SyncId } from '~/network/sync/syncId';

const GossipAddressInfoFactory = Factory.define<GossipAddressInfo>(() => {
  return GossipAddressInfo.create({
    address: '0.0.0.0',
    port: faker.datatype.number({ min: 1, max: 65535 }),
    family: 4,
  });
});

const ContactInfoContentFactory = Factory.define<ContactInfoContent>(() => {
  return ContactInfoContent.create({
    gossipAddress: GossipAddressInfoFactory.build(),
    rpcAddress: GossipAddressInfoFactory.build(),
    excludedHashes: [],
    count: 0,
  });
});

const GossipMessageFactory = Factory.define<GossipMessage, { peerId?: PeerId }, GossipMessage>(
  ({ onCreate, transientParams }) => {
    onCreate(async (gossipMessage) => {
      if (gossipMessage.peerId.length === 0) {
        gossipMessage.peerId = (await createEd25519PeerId()).toBytes();
      }
      return gossipMessage;
    });

    return GossipMessage.create({
      peerId: transientParams.peerId ? transientParams.peerId.toBytes() : new Uint8Array(),
      message: Factories.Message.build(),
      topics: [NETWORK_TOPIC_PRIMARY],
      version: GossipVersion.V1,
    });
  }
);

const SyncIdFactory = Factory.define<undefined, { date: Date; hash: string; fid: number }, SyncId>(
  ({ onCreate, transientParams }) => {
    onCreate(async () => {
      const { date, hash, fid } = transientParams;
      const hashBytes = hexStringToBytes(
        hash || faker.datatype.hexadecimal({ length: HASH_LENGTH * 2 })
      )._unsafeUnwrap();

      const signerMessage = await Factories.SignerAddMessage.create({
        hash: hashBytes,
        data: { fid: fid || Factories.Fid.build(), timestamp: (date || faker.date.recent()).getTime() / 1000 },
      });

      return new SyncId(signerMessage);
    });

    return undefined;
  }
);

export const NetworkFactories = {
  GossipMessage: GossipMessageFactory,
  GossipContactInfoContent: ContactInfoContentFactory,
  GossipAddressInfo: GossipAddressInfoFactory,
  SyncId: SyncIdFactory,
};
