import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
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
  SignerBody,
  SignerBodyT,
  UserID,
  UserIDT,
} from '~/utils/generated/message_generated';
import { Builder, ByteBuffer } from 'flatbuffers';
import { blake2b } from 'ethereum-cryptography/blake2b';
import { generateEd25519KeyPair, generateEthereumSigner } from '~/utils/crypto';
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

const FIDFactory = Factory.define<Uint8Array>(() => {
  // TODO: generate larger random fid
  return new Uint8Array([faker.datatype.number(255)]);
});

const TimestampHashFactory = Factory.define<Uint8Array>(() => {
  const builder = new Builder();
  builder.addInt32(faker.date.recent().getTime());
  const hash = arrayify(faker.datatype.hexadecimal({ length: 4 }).toLowerCase());
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
    faker.date.recent().getTime(),
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
    [faker.internet.url(), faker.internet.url()],
    [UserIDFactory.build(), UserIDFactory.build(), UserIDFactory.build()],
    CastIDFactory.build(),
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

const VerificationAddEthAddressBodyFactory = Factory.define<
  VerificationAddEthAddressBodyT,
  { wallet?: ethers.Wallet; fid?: Uint8Array; network?: FarcasterNetwork },
  VerificationAddEthAddressBody
>(({ onCreate, transientParams }) => {
  onCreate(async (params) => {
    // Generate address and signature
    const wallet = transientParams.wallet ?? (await generateEthereumSigner()).wallet;
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

    const builder = new Builder();
    builder.finish(params.pack(builder));
    return VerificationAddEthAddressBody.getRootAsVerificationAddEthAddressBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new VerificationAddEthAddressBodyT(
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 40 }))),
    Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 }))),
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
      const builder = new Builder();
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
    const builder = new Builder();
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

const MessageFactory = Factory.define<MessageT, { signer?: KeyPair; wallet?: Wallet }, Message>(
  ({ onCreate, transientParams }) => {
    onCreate(async (params) => {
      // Generate hash
      params.hash = Array.from(blake2b(new Uint8Array(params.data), 4));

      // Generate signature
      if (transientParams.signer) {
        const signer = transientParams.signer;
        params.signature = Array.from(await ed.sign(new Uint8Array(params.data), signer.privateKey));
        params.signer = Array.from(signer.publicKey);
      } else if (transientParams.wallet) {
        params.signature = Array.from(await signMessageData(new Uint8Array(params.data), transientParams.wallet));
        params.signatureScheme = SignatureScheme.EthSignTypedData;
        params.signer = Array.from(arrayify(transientParams.wallet.address));
      } else {
        const signer = await generateEd25519KeyPair();
        params.signature = Array.from(await ed.sign(new Uint8Array(params.data), signer.privateKey));
        params.signer = Array.from(signer.publicKey);
      }

      const builder = new Builder();
      builder.finish(params.pack(builder));
      return Message.getRootAsMessage(new ByteBuffer(builder.asUint8Array()));
    });

    const data = MessageDataFactory.build();
    const builder = new Builder();
    builder.finish(data.pack(builder));

    return new MessageT(Array.from(builder.asUint8Array()), [], HashScheme.Blake2b, [], SignatureScheme.Ed25519, []);
  }
);

const IDRegistryEventFactory = Factory.define<ContractEventT, any, ContractEvent>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder();
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
  VerificationAddEthAddressBody: VerificationAddEthAddressBodyFactory,
  VerificationAddEthAddressData: VerificationAddEthAddressDataFactory,
  VerificationRemoveBody: VerificationRemoveBodyFactory,
  VerificationRemoveData: VerificationRemoveDataFactory,
  SignerBody: SignerBodyFactory,
  SignerAddData: SignerAddDataFactory,
  SignerRemoveData: SignerRemoveDataFactory,
  Message: MessageFactory,
  IDRegistryEvent: IDRegistryEventFactory,
};

export default Factories;
