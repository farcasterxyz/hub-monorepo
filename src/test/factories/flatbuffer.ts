import { Factory } from 'fishery';
import Faker from 'faker';
import { KeyPair } from '~/types';
import {
  CastAddBody,
  CastAddBodyT,
  CastID,
  CastIDT,
  CastRemoveBody,
  CastRemoveBodyT,
  FarcasterNetwork,
  FollowBody,
  FollowBodyT,
  HashScheme,
  Message,
  MessageBody,
  MessageData,
  MessageDataT,
  MessageT,
  MessageType,
  ReactionBody,
  ReactionBodyT,
  ReactionType,
  SignatureScheme,
  UserID,
  UserIDT,
} from '~/utils/generated/message_generated';
import { Builder, ByteBuffer } from 'flatbuffers';
import { blake2b } from 'ethereum-cryptography/blake2b';
import { generateEd25519KeyPair } from '~/utils/crypto';
import * as ed from '@noble/ed25519';
import { arrayify } from 'ethers/lib/utils';

const FIDFactory = Factory.define<Uint8Array>(() => {
  // TODO: generate larger random fid
  return new Uint8Array([Faker.datatype.number(255)]);
});

const TimestampHashFactory = Factory.define<Uint8Array>(() => {
  const builder = new Builder();
  builder.addInt32(Faker.time.recent());
  const hash = arrayify(Faker.datatype.hexaDecimal(4).toLowerCase());
  return new Uint8Array([...builder.asUint8Array(), ...hash]);
});

const UserIDFactory = Factory.define<UserIDT, any, UserID>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder();
    builder.finish(params.pack(builder));
    return UserID.getRootAsUserID(new ByteBuffer(builder.asUint8Array()));
  });

  return new UserIDT(Array.from(FIDFactory.build()));
});

const CastIDFactory = Factory.define<CastIDT, any, CastID>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder();
    builder.finish(params.pack(builder));
    return CastID.getRootAsCastID(new ByteBuffer(builder.asUint8Array()));
  });

  return new CastIDT(Array.from(FIDFactory.build()), Array.from(TimestampHashFactory.build()));
});

const MessageDataFactory = Factory.define<MessageDataT, any, MessageData>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder();
    builder.finish(params.pack(builder));
    return MessageData.getRootAsMessageData(new ByteBuffer(builder.asUint8Array()));
  });

  return new MessageDataT(
    MessageBody.CastAddBody,
    CastAddBodyFactory.build(),
    MessageType.CastAdd,
    Faker.time.recent(),
    Array.from(FIDFactory.build()),
    FarcasterNetwork.Testnet
  );
});

const CastAddBodyFactory = Factory.define<CastAddBodyT, any, CastAddBody>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder();
    builder.finish(params.pack(builder));
    return CastAddBody.getRootAsCastAddBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new CastAddBodyT(
    [Faker.internet.url(), Faker.internet.url()],
    [UserIDFactory.build(), UserIDFactory.build(), UserIDFactory.build()],
    CastIDFactory.build(),
    Faker.lorem.sentence(4)
  );
});

const CastAddDataFactory = Factory.define<MessageDataT, any, MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: MessageBody.CastAddBody,
    body: CastAddBodyFactory.build(),
    type: MessageType.CastAdd,
  });
});

const CastRemoveBodyFactory = Factory.define<CastRemoveBodyT, any, CastRemoveBody>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder();
    builder.finish(params.pack(builder));
    return CastRemoveBody.getRootAsCastRemoveBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new CastRemoveBodyT(Array.from(TimestampHashFactory.build()));
});

const CastRemoveDataFactory = Factory.define<MessageDataT, any, MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: MessageBody.CastRemoveBody,
    body: CastRemoveBodyFactory.build(),
    type: MessageType.CastRemove,
  });
});

const FollowBodyFactory = Factory.define<FollowBodyT, any, FollowBody>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder();
    builder.finish(params.pack(builder));
    return FollowBody.getRootAsFollowBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new FollowBodyT(UserIDFactory.build());
});

const FollowAddDataFactory = Factory.define<MessageDataT, any, MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: MessageBody.FollowBody,
    body: FollowBodyFactory.build(),
    type: MessageType.FollowAdd,
  });
});

const FollowRemoveDataFactory = Factory.define<MessageDataT, any, MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: MessageBody.FollowBody,
    body: FollowBodyFactory.build(),
    type: MessageType.FollowRemove,
  });
});

const ReactionBodyFactory = Factory.define<ReactionBodyT, any, ReactionBody>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder();
    builder.finish(params.pack(builder));
    return ReactionBody.getRootAsReactionBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new ReactionBodyT(CastIDFactory.build(), ReactionType.Like);
});

const ReactionAddDataFactory = Factory.define<MessageDataT, any, MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: MessageBody.ReactionBody,
    body: ReactionBodyFactory.build(),
    type: MessageType.ReactionAdd,
  });
});

const ReactionRemoveDataFactory = Factory.define<MessageDataT, any, MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: MessageBody.ReactionBody,
    body: ReactionBodyFactory.build(),
    type: MessageType.ReactionRemove,
  });
});

const MessageFactory = Factory.define<MessageT, { signer?: KeyPair }, Message>(({ onCreate, transientParams }) => {
  onCreate(async (params) => {
    // Generate hash
    params.hash = Array.from(blake2b(new Uint8Array(params.data), 4));

    // Generate signature
    const signer: KeyPair = transientParams.signer ?? (await generateEd25519KeyPair());
    params.signature = Array.from(await ed.sign(new Uint8Array(params.data), signer.privateKey));
    params.signer = Array.from(signer.publicKey);

    const builder = new Builder();
    builder.finish(params.pack(builder));
    return Message.getRootAsMessage(new ByteBuffer(builder.asUint8Array()));
  });

  const data = MessageDataFactory.build();
  const builder = new Builder();
  builder.finish(data.pack(builder));

  return new MessageT(Array.from(builder.asUint8Array()), [], HashScheme.Blake2b, [], SignatureScheme.Ed25519, []);
});

const Factories = {
  FID: FIDFactory,
  TimestampHash: TimestampHashFactory,
  UserID: UserIDFactory,
  CastID: CastIDFactory,
  ReactionBody: ReactionBodyFactory,
  ReactionAddData: ReactionAddDataFactory,
  ReactionRemoveData: ReactionRemoveDataFactory,
  CastAddBody: CastAddBodyFactory,
  CastRemoveBody: CastRemoveBodyFactory,
  MessageData: MessageDataFactory,
  CastAddData: CastAddDataFactory,
  CastRemoveData: CastRemoveDataFactory,
  FollowBody: FollowBodyFactory,
  FollowAddData: FollowAddDataFactory,
  FollowRemoveData: FollowRemoveDataFactory,
  Message: MessageFactory,
};

export default Factories;
