import { faker } from '@faker-js/faker';
import { PeerId } from '@libp2p/interface-peer-id';
import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import * as ed from '@noble/ed25519';
import { blake3 } from '@noble/hashes/blake3';
import { ethers, utils, Wallet } from 'ethers';
import { arrayify } from 'ethers/lib/utils';
import { Factory } from 'fishery';
import { Builder, ByteBuffer } from 'flatbuffers';
import * as gossip_generated from '~/flatbuffers/generated/gossip_generated';
import * as id_registry_event_generated from '~/flatbuffers/generated/id_registry_event_generated';
import * as message_generated from '~/flatbuffers/generated/message_generated';
import * as name_registry_event_generated from '~/flatbuffers/generated/name_registry_event_generated';
import MessageModel from '~/flatbuffers/models/messageModel';
import { KeyPair, VerificationEthAddressClaim } from '~/flatbuffers/models/types';
import { numberToBytes } from '~/flatbuffers/utils/bytes';
import { signMessageHash, signVerificationEthAddressClaim } from '~/flatbuffers/utils/eip712';
import { toFarcasterTime } from '~/flatbuffers/utils/time';
import { NETWORK_TOPIC_PRIMARY } from '~/network/p2p/protocol';
import { generateEd25519KeyPair } from '~/utils/crypto';

/* eslint-disable security/detect-object-injection */
const BytesFactory = Factory.define<Uint8Array, { length?: number }>(({ transientParams }) => {
  const length = transientParams.length ?? 8;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < bytes.byteLength; i++) {
    bytes[i] = faker.datatype.number({ max: 255, min: 0 });
  }
  return bytes;
});

const FIDFactory = Factory.define<Uint8Array, { fid?: number }>(({ transientParams }) => {
  return numberToBytes(transientParams.fid ?? faker.datatype.number({ min: 1 }));
});

const FnameFactory = Factory.define<Uint8Array>(() => {
  const builder = new Builder(8);
  // Add 8 random alphabets as the fname
  for (let i = 0; i < 8; i++) {
    builder.addInt8(faker.datatype.number({ min: 65, max: 90 }));
  }
  return builder.asUint8Array();
});

const TsHashFactory = Factory.define<Uint8Array, { timestamp?: number; hash?: Uint8Array }>(({ transientParams }) => {
  return MessageModel.tsHash(
    transientParams.timestamp ?? faker.date.recent().getTime(),
    transientParams.hash ?? blake3(faker.random.alphaNumeric(256), { dkLen: 16 })
  );
});

const UserIdFactory = Factory.define<message_generated.UserIdT, any, message_generated.UserId>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return message_generated.UserId.getRootAsUserId(new ByteBuffer(builder.asUint8Array()));
  });

  return new message_generated.UserIdT(Array.from(FIDFactory.build()));
});

const CastIdFactory = Factory.define<message_generated.CastIdT, any, message_generated.CastId>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return message_generated.CastId.getRootAsCastId(new ByteBuffer(builder.asUint8Array()));
  });

  return new message_generated.CastIdT(Array.from(FIDFactory.build()), Array.from(TsHashFactory.build()));
});

const MessageDataFactory = Factory.define<message_generated.MessageDataT, any, message_generated.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      const builder = new Builder(1);
      builder.finish(params.pack(builder));
      return message_generated.MessageData.getRootAsMessageData(new ByteBuffer(builder.asUint8Array()));
    });

    return new message_generated.MessageDataT(
      message_generated.MessageBody.CastAddBody,
      CastAddBodyFactory.build(),
      message_generated.MessageType.CastAdd,
      toFarcasterTime(faker.date.recent().getTime()),
      Array.from(FIDFactory.build()),
      message_generated.FarcasterNetwork.Testnet
    );
  }
);

const CastAddBodyFactory = Factory.define<message_generated.CastAddBodyT, any, message_generated.CastAddBody>(
  ({ onCreate }) => {
    onCreate((params) => {
      const builder = new Builder(1);
      builder.finish(params.pack(builder));
      return message_generated.CastAddBody.getRootAsCastAddBody(new ByteBuffer(builder.asUint8Array()));
    });

    return new message_generated.CastAddBodyT(
      [faker.internet.url(), faker.internet.url()],
      [UserIdFactory.build(), UserIdFactory.build(), UserIdFactory.build()],
      CastIdFactory.build(),
      faker.lorem.sentence(4)
    );
  }
);

const CastAddDataFactory = Factory.define<message_generated.MessageDataT, any, message_generated.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: message_generated.MessageBody.CastAddBody,
      body: CastAddBodyFactory.build(),
      type: message_generated.MessageType.CastAdd,
    });
  }
);

const CastRemoveBodyFactory = Factory.define<message_generated.CastRemoveBodyT, any, message_generated.CastRemoveBody>(
  ({ onCreate }) => {
    onCreate((params) => {
      const builder = new Builder(1);
      builder.finish(params.pack(builder));
      return message_generated.CastRemoveBody.getRootAsCastRemoveBody(new ByteBuffer(builder.asUint8Array()));
    });

    return new message_generated.CastRemoveBodyT(Array.from(TsHashFactory.build()));
  }
);

const CastRemoveDataFactory = Factory.define<message_generated.MessageDataT, any, message_generated.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: message_generated.MessageBody.CastRemoveBody,
      body: CastRemoveBodyFactory.build(),
      type: message_generated.MessageType.CastRemove,
    });
  }
);

const AmpBodyFactory = Factory.define<message_generated.AmpBodyT, any, message_generated.AmpBody>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return message_generated.AmpBody.getRootAsAmpBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new message_generated.AmpBodyT(UserIdFactory.build());
});

const AmpAddDataFactory = Factory.define<message_generated.MessageDataT, any, message_generated.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: message_generated.MessageBody.AmpBody,
      body: AmpBodyFactory.build(),
      type: message_generated.MessageType.AmpAdd,
    });
  }
);

const AmpRemoveDataFactory = Factory.define<message_generated.MessageDataT, any, message_generated.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: message_generated.MessageBody.AmpBody,
      body: AmpBodyFactory.build(),
      type: message_generated.MessageType.AmpRemove,
    });
  }
);

const ReactionBodyFactory = Factory.define<message_generated.ReactionBodyT, any, message_generated.ReactionBody>(
  ({ onCreate }) => {
    onCreate((params) => {
      const builder = new Builder(1);
      builder.finish(params.pack(builder));
      return message_generated.ReactionBody.getRootAsReactionBody(new ByteBuffer(builder.asUint8Array()));
    });

    return new message_generated.ReactionBodyT(CastIdFactory.build(), message_generated.ReactionType.Like);
  }
);

const ReactionAddDataFactory = Factory.define<message_generated.MessageDataT, any, message_generated.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: message_generated.MessageBody.ReactionBody,
      body: ReactionBodyFactory.build(),
      type: message_generated.MessageType.ReactionAdd,
    });
  }
);

const ReactionRemoveDataFactory = Factory.define<message_generated.MessageDataT, any, message_generated.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: message_generated.MessageBody.ReactionBody,
      body: ReactionBodyFactory.build(),
      type: message_generated.MessageType.ReactionRemove,
    });
  }
);

const VerificationAddEthAddressBodyFactory = Factory.define<
  message_generated.VerificationAddEthAddressBodyT,
  { wallet?: ethers.Wallet; fid?: Uint8Array; network?: message_generated.FarcasterNetwork },
  message_generated.VerificationAddEthAddressBody
>(({ onCreate, transientParams }) => {
  onCreate(async (params) => {
    // Generate address and signature
    const wallet = transientParams.wallet ?? new Wallet(utils.randomBytes(32));
    params.address = Array.from(arrayify(wallet.address));

    const fid = transientParams.fid ?? FIDFactory.build();
    const claim: VerificationEthAddressClaim = {
      fid,
      address: wallet.address,
      network: transientParams.network ?? message_generated.FarcasterNetwork.Testnet,
      blockHash: Uint8Array.from(params.blockHash),
    };
    const signature = await signVerificationEthAddressClaim(claim, wallet);
    params.ethSignature = Array.from(arrayify(signature));

    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return message_generated.VerificationAddEthAddressBody.getRootAsVerificationAddEthAddressBody(
      new ByteBuffer(builder.asUint8Array())
    );
  });

  return new message_generated.VerificationAddEthAddressBodyT(
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 40 }))),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 130 }))),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 })))
  );
});

const VerificationAddEthAddressDataFactory = Factory.define<
  message_generated.MessageDataT,
  any,
  message_generated.MessageData
>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: message_generated.MessageBody.VerificationAddEthAddressBody,
    body: VerificationAddEthAddressBodyFactory.build(),
    type: message_generated.MessageType.VerificationAddEthAddress,
  });
});

const VerificationRemoveBodyFactory = Factory.define<
  message_generated.VerificationRemoveBodyT,
  any,
  message_generated.VerificationRemoveBody
>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return message_generated.VerificationRemoveBody.getRootAsVerificationRemoveBody(
      new ByteBuffer(builder.asUint8Array())
    );
  });

  return new message_generated.VerificationRemoveBodyT(
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 40 })))
  );
});

const VerificationRemoveDataFactory = Factory.define<
  message_generated.MessageDataT,
  any,
  message_generated.MessageData
>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: message_generated.MessageBody.VerificationRemoveBody,
    body: VerificationRemoveBodyFactory.build(),
    type: message_generated.MessageType.VerificationRemove,
  });
});

const SignerBodyFactory = Factory.define<message_generated.SignerBodyT, any, message_generated.SignerBody>(
  ({ onCreate }) => {
    onCreate((params) => {
      const builder = new Builder(1);
      builder.finish(params.pack(builder));
      return message_generated.SignerBody.getRootAsSignerBody(new ByteBuffer(builder.asUint8Array()));
    });

    return new message_generated.SignerBodyT(Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 }))));
  }
);

const SignerAddDataFactory = Factory.define<message_generated.MessageDataT, any, message_generated.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: message_generated.MessageBody.SignerBody,
      body: SignerBodyFactory.build(),
      type: message_generated.MessageType.SignerAdd,
    });
  }
);

const SignerRemoveDataFactory = Factory.define<message_generated.MessageDataT, any, message_generated.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: message_generated.MessageBody.SignerBody,
      body: SignerBodyFactory.build(),
      type: message_generated.MessageType.SignerRemove,
    });
  }
);

const UserDataBodyFactory = Factory.define<message_generated.UserDataBodyT, any, message_generated.UserDataBody>(
  ({ onCreate }) => {
    onCreate((params) => {
      const builder = new Builder(1);
      builder.finish(params.pack(builder));
      return message_generated.UserDataBody.getRootAsUserDataBody(new ByteBuffer(builder.asUint8Array()));
    });

    return new message_generated.UserDataBodyT(message_generated.UserDataType.Pfp, faker.random.alphaNumeric(32));
  }
);

const UserDataAddDataFactory = Factory.define<message_generated.MessageDataT, any, message_generated.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: message_generated.MessageBody.UserDataBody,
      body: UserDataBodyFactory.build(),
      type: message_generated.MessageType.UserDataAdd,
    });
  }
);

const MessageFactory = Factory.define<
  message_generated.MessageT,
  { signer?: KeyPair; wallet?: Wallet },
  message_generated.Message
>(({ onCreate, transientParams }) => {
  onCreate(async (params) => {
    // Generate hash
    if (params.hash.length === 0) {
      params.hash = Array.from(blake3(new Uint8Array(params.data), { dkLen: 16 }));
    }

    // Generate signature
    if (params.signature.length === 0) {
      if (transientParams.signer) {
        const signer = transientParams.signer;
        params.signature = Array.from(await ed.sign(new Uint8Array(params.hash), signer.privateKey));
        params.signer = Array.from(signer.publicKey);
      } else if (transientParams.wallet) {
        params.signature = Array.from(await signMessageHash(new Uint8Array(params.hash), transientParams.wallet));
        params.signatureScheme = message_generated.SignatureScheme.Eip712;
        params.signer = Array.from(arrayify(transientParams.wallet.address));
      } else {
        const signer = await generateEd25519KeyPair();
        params.signature = Array.from(await ed.sign(new Uint8Array(params.hash), signer.privateKey));
        params.signer = Array.from(signer.publicKey);
      }
    }

    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return message_generated.Message.getRootAsMessage(new ByteBuffer(builder.asUint8Array()));
  });

  const data = MessageDataFactory.build();
  const builder = new Builder(1);
  builder.finish(data.pack(builder));

  return new message_generated.MessageT(
    Array.from(builder.asUint8Array()),
    [],
    message_generated.HashScheme.Blake3,
    [],
    message_generated.SignatureScheme.Ed25519,
    []
  );
});

const IdRegistryEventFactory = Factory.define<
  id_registry_event_generated.IdRegistryEventT,
  any,
  id_registry_event_generated.IdRegistryEvent
>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return id_registry_event_generated.IdRegistryEvent.getRootAsIdRegistryEvent(new ByteBuffer(builder.asUint8Array()));
  });

  return new id_registry_event_generated.IdRegistryEventT(
    faker.datatype.number({ max: 100000 }),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 }))),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 }))),
    faker.datatype.number({ max: 1000 }),
    Array.from(FIDFactory.build()),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 40 }))),
    id_registry_event_generated.IdRegistryEventType.IdRegistryRegister,
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 40 })))
  );
});

const NameRegistryEventFactory = Factory.define<
  name_registry_event_generated.NameRegistryEventT,
  any,
  name_registry_event_generated.NameRegistryEvent
>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return name_registry_event_generated.NameRegistryEvent.getRootAsNameRegistryEvent(
      new ByteBuffer(builder.asUint8Array())
    );
  });

  return new name_registry_event_generated.NameRegistryEventT(
    faker.datatype.number({ max: 100000 }),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 }))),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 }))),
    faker.datatype.number({ max: 1000 }),
    Array.from(FnameFactory.build()),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 40 }))),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 40 }))),
    name_registry_event_generated.NameRegistryEventType.NameRegistryTransfer
  );
});

const GossipAddressInfoFactory = Factory.define<
  gossip_generated.GossipAddressInfoT,
  any,
  gossip_generated.GossipAddressInfo
>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return gossip_generated.GossipAddressInfo.getRootAsGossipAddressInfo(new ByteBuffer(builder.asUint8Array()));
  });

  return new gossip_generated.GossipAddressInfoT('0.0.0.0', 4, 0);
});

const ContactInfoContentFactory = Factory.define<
  gossip_generated.ContactInfoContentT,
  { peerId?: PeerId },
  gossip_generated.ContactInfoContent
>(({ onCreate, transientParams }) => {
  onCreate(async (params) => {
    if (params.peerId.length == 0) {
      params.peerId = transientParams.peerId
        ? Array.from(transientParams.peerId.toBytes())
        : Array.from((await createEd25519PeerId()).toBytes());
    }

    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return gossip_generated.ContactInfoContent.getRootAsContactInfoContent(new ByteBuffer(builder.asUint8Array()));
  });

  return new gossip_generated.ContactInfoContentT();
});

const GossipMessageFactory = Factory.define<gossip_generated.GossipMessageT, any, gossip_generated.GossipMessage>(
  ({ onCreate }) => {
    onCreate((params) => {
      const builder = new Builder(1);
      builder.finish(params.pack(builder));
      return gossip_generated.GossipMessage.getRootAsGossipMessage(new ByteBuffer(builder.asUint8Array()));
    });

    return new gossip_generated.GossipMessageT(gossip_generated.GossipContent.Message, MessageFactory.build(), [
      NETWORK_TOPIC_PRIMARY,
    ]);
  }
);

const Factories = {
  Bytes: BytesFactory,
  FID: FIDFactory,
  Fname: FnameFactory,
  TsHash: TsHashFactory,
  UserId: UserIdFactory,
  CastId: CastIdFactory,
  ReactionBody: ReactionBodyFactory,
  ReactionAddData: ReactionAddDataFactory,
  ReactionRemoveData: ReactionRemoveDataFactory,
  CastAddBody: CastAddBodyFactory,
  CastRemoveBody: CastRemoveBodyFactory,
  MessageData: MessageDataFactory,
  CastAddData: CastAddDataFactory,
  CastRemoveData: CastRemoveDataFactory,
  AmpBody: AmpBodyFactory,
  AmpAddData: AmpAddDataFactory,
  AmpRemoveData: AmpRemoveDataFactory,
  VerificationAddEthAddressBody: VerificationAddEthAddressBodyFactory,
  VerificationAddEthAddressData: VerificationAddEthAddressDataFactory,
  VerificationRemoveBody: VerificationRemoveBodyFactory,
  VerificationRemoveData: VerificationRemoveDataFactory,
  SignerBody: SignerBodyFactory,
  SignerAddData: SignerAddDataFactory,
  SignerRemoveData: SignerRemoveDataFactory,
  UserDataBody: UserDataBodyFactory,
  UserDataAddData: UserDataAddDataFactory,
  Message: MessageFactory,
  IdRegistryEvent: IdRegistryEventFactory,
  NameRegistryEvent: NameRegistryEventFactory,
  GossipMessage: GossipMessageFactory,
  GossipContactInfoContent: ContactInfoContentFactory,
  GossipAddressInfo: GossipAddressInfoFactory,
};

export default Factories;
