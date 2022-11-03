import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { KeyPair } from '~/types';
import {
  CastAddBody,
  CastAddBodyT,
  CastId,
  CastIdT,
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
  SignerBody,
  SignerBodyT,
  UserDataBody,
  UserDataBodyT,
  UserDataType,
  UserId,
  UserIdT,
} from '~/utils/generated/message_generated';
import { Builder, ByteBuffer } from 'flatbuffers';
import { blake2b } from 'ethereum-cryptography/blake2b';
import { generateEd25519KeyPair } from '~/utils/crypto';
import * as ed from '@noble/ed25519';
import { arrayify } from 'ethers/lib/utils';
import {
  VerificationAddEthAddressBody,
  VerificationAddEthAddressBodyT,
} from '~/utils/generated/farcaster/verification-add-eth-address-body';
import { ethers, Wallet } from 'ethers';
import { signMessageData, signVerificationEthAddressClaim } from '~/utils/eip712';
import { VerificationEthAddressClaim } from '~/storage/flatbuffers/types';
import { VerificationRemoveBody, VerificationRemoveBodyT } from '~/utils/generated/farcaster/verification-remove-body';
import { ContractEvent, ContractEventT, ContractEventType } from '~/utils/generated/contract_event_generated';
import { toFarcasterTime } from '~/storage/flatbuffers/utils';

/* eslint-disable security/detect-object-injection */
const BytesFactory = Factory.define<Uint8Array, { length?: number }>(({ transientParams }) => {
  const length = transientParams.length ?? 8;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < bytes.byteLength; i++) {
    bytes[i] = faker.datatype.number({ max: 255, min: 0 });
  }
  return bytes;
});

const FIDFactory = Factory.define<Uint8Array>(() => {
  const builder = new Builder(4);
  builder.addInt32(faker.datatype.number({ max: 2 ** 32 - 1 }));
  return builder.asUint8Array();
});

const TsHashFactory = Factory.define<Uint8Array>(() => {
  const builder = new Builder(8);
  builder.addInt32(faker.date.recent().getTime());
  builder.addInt32(faker.datatype.number({ max: 2 ** 32 - 1 }));
  return builder.asUint8Array();
});

const UserIdFactory = Factory.define<UserIdT, any, UserId>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return UserId.getRootAsUserId(new ByteBuffer(builder.asUint8Array()));
  });

  return new UserIdT(Array.from(FIDFactory.build()));
});

const CastIdFactory = Factory.define<CastIdT, any, CastId>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return CastId.getRootAsCastId(new ByteBuffer(builder.asUint8Array()));
  });

  return new CastIdT(Array.from(FIDFactory.build()), Array.from(TsHashFactory.build()));
});

const MessageDataFactory = Factory.define<MessageDataT, any, MessageData>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return MessageData.getRootAsMessageData(new ByteBuffer(builder.asUint8Array()));
  });

  return new MessageDataT(
    MessageBody.CastAddBody,
    CastAddBodyFactory.build(),
    MessageType.CastAdd,
    toFarcasterTime(faker.date.recent().getTime()),
    Array.from(FIDFactory.build()),
    FarcasterNetwork.Testnet
  );
});

const CastAddBodyFactory = Factory.define<CastAddBodyT, any, CastAddBody>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return CastAddBody.getRootAsCastAddBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new CastAddBodyT(
    [faker.internet.url(), faker.internet.url()],
    [UserIdFactory.build(), UserIdFactory.build(), UserIdFactory.build()],
    CastIdFactory.build(),
    faker.lorem.sentence(4)
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
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return CastRemoveBody.getRootAsCastRemoveBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new CastRemoveBodyT(Array.from(TsHashFactory.build()));
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
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return FollowBody.getRootAsFollowBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new FollowBodyT(UserIdFactory.build());
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
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return ReactionBody.getRootAsReactionBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new ReactionBodyT(CastIdFactory.build(), ReactionType.Like);
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

const VerificationAddEthAddressBodyFactory = Factory.define<
  VerificationAddEthAddressBodyT,
  { wallet?: ethers.Wallet; fid?: Uint8Array; network?: FarcasterNetwork },
  VerificationAddEthAddressBody
>(({ onCreate, transientParams }) => {
  onCreate(async (params) => {
    // Generate address and signature
    const wallet = transientParams.wallet ?? Wallet.createRandom();
    params.address = Array.from(arrayify(wallet.address));

    const fid = transientParams.fid ?? FIDFactory.build();
    const claim: VerificationEthAddressClaim = {
      fid,
      address: wallet.address,
      network: transientParams.network ?? FarcasterNetwork.Testnet,
      blockHash: Uint8Array.from(params.blockHash),
    };
    const signature = await signVerificationEthAddressClaim(claim, wallet);
    params.ethSignature = Array.from(arrayify(signature));

    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return VerificationAddEthAddressBody.getRootAsVerificationAddEthAddressBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new VerificationAddEthAddressBodyT(
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 40 }))),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 130 }))),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 })))
  );
});

const VerificationAddEthAddressDataFactory = Factory.define<MessageDataT, any, MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: MessageBody.VerificationAddEthAddressBody,
    body: VerificationAddEthAddressBodyFactory.build(),
    type: MessageType.VerificationAddEthAddress,
  });
});

const VerificationRemoveBodyFactory = Factory.define<VerificationRemoveBodyT, any, VerificationRemoveBody>(
  ({ onCreate }) => {
    onCreate((params) => {
      const builder = new Builder(1);
      builder.finish(params.pack(builder));
      return VerificationRemoveBody.getRootAsVerificationRemoveBody(new ByteBuffer(builder.asUint8Array()));
    });

    return new VerificationRemoveBodyT(Array.from(arrayify(faker.datatype.hexadecimal({ length: 40 }))));
  }
);

const VerificationRemoveDataFactory = Factory.define<MessageDataT, any, MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: MessageBody.VerificationRemoveBody,
    body: VerificationRemoveBodyFactory.build(),
    type: MessageType.VerificationRemove,
  });
});

const SignerBodyFactory = Factory.define<SignerBodyT, any, SignerBody>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return SignerBody.getRootAsSignerBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new SignerBodyT(Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 }))));
});

const SignerAddDataFactory = Factory.define<MessageDataT, any, MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: MessageBody.SignerBody,
    body: SignerBodyFactory.build(),
    type: MessageType.SignerAdd,
  });
});

const SignerRemoveDataFactory = Factory.define<MessageDataT, any, MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: MessageBody.SignerBody,
    body: SignerBodyFactory.build(),
    type: MessageType.SignerRemove,
  });
});

const UserDataBodyFactory = Factory.define<UserDataBodyT, any, UserDataBody>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return UserDataBody.getRootAsUserDataBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new UserDataBodyT(UserDataType.Pfp, faker.internet.url());
});

const UserDataAddDataFactory = Factory.define<MessageDataT, any, MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: MessageBody.UserDataBody,
    body: UserDataBodyFactory.build(),
    type: MessageType.UserDataAdd,
  });
});

const MessageFactory = Factory.define<MessageT, { signer?: KeyPair; wallet?: Wallet }, Message>(
  ({ onCreate, transientParams }) => {
    onCreate(async (params) => {
      // Generate hash
      if (params.hash.length === 0) {
        params.hash = Array.from(blake2b(new Uint8Array(params.data), 4));
      }

      // Generate signature
      if (params.signature.length === 0) {
        if (transientParams.signer) {
          const signer = transientParams.signer;
          params.signature = Array.from(await ed.sign(new Uint8Array(params.data), signer.privateKey));
          params.signer = Array.from(signer.publicKey);
        } else if (transientParams.wallet) {
          params.signature = Array.from(await signMessageData(new Uint8Array(params.data), transientParams.wallet));
          params.signatureScheme = SignatureScheme.Eip712;
          params.signer = Array.from(arrayify(transientParams.wallet.address));
        } else {
          const signer = await generateEd25519KeyPair();
          params.signature = Array.from(await ed.sign(new Uint8Array(params.data), signer.privateKey));
          params.signer = Array.from(signer.publicKey);
        }
      }

      const builder = new Builder(1);
      builder.finish(params.pack(builder));
      return Message.getRootAsMessage(new ByteBuffer(builder.asUint8Array()));
    });

    const data = MessageDataFactory.build();
    const builder = new Builder(1);
    builder.finish(data.pack(builder));

    return new MessageT(Array.from(builder.asUint8Array()), [], HashScheme.Blake2b, [], SignatureScheme.Ed25519, []);
  }
);

const IDRegistryEventFactory = Factory.define<ContractEventT, any, ContractEvent>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return ContractEvent.getRootAsContractEvent(new ByteBuffer(builder.asUint8Array()));
  });

  return new ContractEventT(
    faker.datatype.number({ max: 100000 }),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 }))),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 }))),
    faker.datatype.number({ max: 1000 }),
    Array.from(FIDFactory.build()),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 40 }))),
    ContractEventType.IDRegistryRegister
  );
});

const Factories = {
  Bytes: BytesFactory,
  FID: FIDFactory,
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
  FollowBody: FollowBodyFactory,
  FollowAddData: FollowAddDataFactory,
  FollowRemoveData: FollowRemoveDataFactory,
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
  IDRegistryEvent: IDRegistryEventFactory,
};

export default Factories;
