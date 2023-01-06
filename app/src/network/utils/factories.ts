import { faker } from '@faker-js/faker';
import * as flatbuffers from '@hub/flatbuffers';
import { Factories, hexStringToBytes } from '@hub/utils';
import { PeerId } from '@libp2p/interface-peer-id';
import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { Factory } from 'fishery';
import { Builder, ByteBuffer } from 'flatbuffers';
import MessageModel from '~/flatbuffers/models/messageModel';
import { SignerAddModel } from '~/flatbuffers/models/types';
import { NETWORK_TOPIC_PRIMARY } from '~/network/p2p/protocol';
import { HASH_LENGTH, SyncId } from '~/network/sync/syncId';

const GossipAddressInfoFactory = Factory.define<flatbuffers.GossipAddressInfoT, any, flatbuffers.GossipAddressInfo>(
  ({ onCreate }) => {
    onCreate((params) => {
      const builder = new Builder(1);
      builder.finish(params.pack(builder));
      return flatbuffers.GossipAddressInfo.getRootAsGossipAddressInfo(new ByteBuffer(builder.asUint8Array()));
    });

    return new flatbuffers.GossipAddressInfoT('0.0.0.0', 4, 0);
  }
);

const ContactInfoContentFactory = Factory.define<
  flatbuffers.ContactInfoContentT,
  { peerId?: PeerId },
  flatbuffers.ContactInfoContent
>(({ onCreate, transientParams }) => {
  onCreate(async (params) => {
    if (params.peerId.length == 0) {
      params.peerId = transientParams.peerId
        ? Array.from(transientParams.peerId.toBytes())
        : Array.from((await createEd25519PeerId()).toBytes());
    }

    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return flatbuffers.ContactInfoContent.getRootAsContactInfoContent(new ByteBuffer(builder.asUint8Array()));
  });

  return new flatbuffers.ContactInfoContentT();
});

const GossipMessageFactory = Factory.define<flatbuffers.GossipMessageT, any, flatbuffers.GossipMessage>(
  ({ onCreate }) => {
    onCreate((params) => {
      const builder = new Builder(1);
      builder.finish(params.pack(builder));
      return flatbuffers.GossipMessage.getRootAsGossipMessage(new ByteBuffer(builder.asUint8Array()));
    });

    return new flatbuffers.GossipMessageT(flatbuffers.GossipContent.Message, Factories.Message.build(), [
      NETWORK_TOPIC_PRIMARY,
    ]);
  }
);

const SyncIdFactory = Factory.define<undefined, { date: Date; hash: string; fid: Uint8Array }, SyncId>(
  ({ onCreate, transientParams }) => {
    onCreate(async () => {
      const { date, hash, fid } = transientParams;

      const ethSigner = Factories.Eip712Signer.build();
      const signer = Factories.Ed25519Signer.build();
      const signerAddData = await Factories.SignerAddData.create({
        body: Factories.SignerBody.build({ signer: Array.from(signer.signerKey) }),
        fid: Array.from(fid || Factories.FID.build()),
        timestamp: (date || faker.date.recent()).getTime() / 1000,
      });

      const hashBytes = Array.from(
        hexStringToBytes(hash || faker.datatype.hexadecimal({ length: HASH_LENGTH }))._unsafeUnwrap()
      );
      const signerAdd = new MessageModel(
        await Factories.Message.create(
          {
            hash: hashBytes,
            data: Array.from(signerAddData.bb?.bytes() ?? []),
          },
          { transient: { ethSigner } }
        )
      ) as SignerAddModel;

      return new SyncId(signerAdd);
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
