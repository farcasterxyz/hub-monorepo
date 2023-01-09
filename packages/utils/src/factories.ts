import { faker } from '@faker-js/faker';
import * as flatbuffers from '@farcaster/flatbuffers';
import { blake3 } from '@noble/hashes/blake3';
import { ethers } from 'ethers';
import { Factory } from 'fishery';
import { Builder, ByteBuffer } from 'flatbuffers';
import { bytesToBigNumber, hexStringToBytes, numberToBytes } from './bytes';
import { Ed25519Signer, Eip712Signer } from './signers';
import { toFarcasterTime } from './time';
import { toTsHash } from './tsHash';
import { makeVerificationEthAddressClaim, VerificationEthAddressClaim } from './verifications';

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
  return numberToBytes(transientParams.fid ?? faker.datatype.number({ min: 1 }), {
    endianness: 'little',
  })._unsafeUnwrap();
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
  const timestamp = transientParams.timestamp ?? toFarcasterTime(faker.date.recent().getTime());
  const hash = transientParams.hash ?? blake3(faker.random.alphaNumeric(256), { dkLen: 16 });
  return toTsHash(timestamp, hash)._unsafeUnwrap();
});

const BlockHashFactory = Factory.define<string>(() => {
  return faker.datatype.hexadecimal({ length: 64, case: 'lower' });
});

const UserIdFactory = Factory.define<flatbuffers.UserIdT, any, flatbuffers.UserId>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return flatbuffers.UserId.getRootAsUserId(new ByteBuffer(builder.asUint8Array()));
  });

  return new flatbuffers.UserIdT(Array.from(FIDFactory.build()));
});

const CastIdFactory = Factory.define<flatbuffers.CastIdT, any, flatbuffers.CastId>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return flatbuffers.CastId.getRootAsCastId(new ByteBuffer(builder.asUint8Array()));
  });

  return new flatbuffers.CastIdT(Array.from(FIDFactory.build()), Array.from(TsHashFactory.build()));
});

const MessageDataFactory = Factory.define<flatbuffers.MessageDataT, any, flatbuffers.MessageData>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return flatbuffers.MessageData.getRootAsMessageData(new ByteBuffer(builder.asUint8Array()));
  });

  return new flatbuffers.MessageDataT(
    flatbuffers.MessageBody.CastAddBody,
    CastAddBodyFactory.build(),
    flatbuffers.MessageType.CastAdd,
    toFarcasterTime(faker.date.recent().getTime()),
    Array.from(FIDFactory.build()),
    flatbuffers.FarcasterNetwork.Testnet
  );
});

const CastAddBodyFactory = Factory.define<flatbuffers.CastAddBodyT, any, flatbuffers.CastAddBody>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return flatbuffers.CastAddBody.getRootAsCastAddBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new flatbuffers.CastAddBodyT(
    [faker.internet.url(), faker.internet.url()],
    [UserIdFactory.build(), UserIdFactory.build(), UserIdFactory.build()],
    flatbuffers.TargetId.CastId,
    CastIdFactory.build(),
    faker.lorem.sentence(4)
  );
});

const CastAddDataFactory = Factory.define<flatbuffers.MessageDataT, any, flatbuffers.MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: flatbuffers.MessageBody.CastAddBody,
    body: CastAddBodyFactory.build(),
    type: flatbuffers.MessageType.CastAdd,
  });
});

const CastRemoveBodyFactory = Factory.define<flatbuffers.CastRemoveBodyT, any, flatbuffers.CastRemoveBody>(
  ({ onCreate }) => {
    onCreate((params) => {
      const builder = new Builder(1);
      builder.finish(params.pack(builder));
      return flatbuffers.CastRemoveBody.getRootAsCastRemoveBody(new ByteBuffer(builder.asUint8Array()));
    });

    return new flatbuffers.CastRemoveBodyT(Array.from(TsHashFactory.build()));
  }
);

const CastRemoveDataFactory = Factory.define<flatbuffers.MessageDataT, any, flatbuffers.MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: flatbuffers.MessageBody.CastRemoveBody,
    body: CastRemoveBodyFactory.build(),
    type: flatbuffers.MessageType.CastRemove,
  });
});

const AmpBodyFactory = Factory.define<flatbuffers.AmpBodyT, any, flatbuffers.AmpBody>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return flatbuffers.AmpBody.getRootAsAmpBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new flatbuffers.AmpBodyT(UserIdFactory.build());
});

const AmpAddDataFactory = Factory.define<flatbuffers.MessageDataT, any, flatbuffers.MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: flatbuffers.MessageBody.AmpBody,
    body: AmpBodyFactory.build(),
    type: flatbuffers.MessageType.AmpAdd,
  });
});

const AmpRemoveDataFactory = Factory.define<flatbuffers.MessageDataT, any, flatbuffers.MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: flatbuffers.MessageBody.AmpBody,
    body: AmpBodyFactory.build(),
    type: flatbuffers.MessageType.AmpRemove,
  });
});

const ReactionBodyFactory = Factory.define<flatbuffers.ReactionBodyT, any, flatbuffers.ReactionBody>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return flatbuffers.ReactionBody.getRootAsReactionBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new flatbuffers.ReactionBodyT(
    flatbuffers.TargetId.CastId,
    CastIdFactory.build(),
    flatbuffers.ReactionType.Like
  );
});

const ReactionAddDataFactory = Factory.define<flatbuffers.MessageDataT, any, flatbuffers.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: flatbuffers.MessageBody.ReactionBody,
      body: ReactionBodyFactory.build(),
      type: flatbuffers.MessageType.ReactionAdd,
    });
  }
);

const ReactionRemoveDataFactory = Factory.define<flatbuffers.MessageDataT, any, flatbuffers.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: flatbuffers.MessageBody.ReactionBody,
      body: ReactionBodyFactory.build(),
      type: flatbuffers.MessageType.ReactionRemove,
    });
  }
);

const VerificationEthAddressClaimFactory = Factory.define<VerificationEthAddressClaim, { signer?: Eip712Signer }>(
  ({ transientParams }) => {
    const signer = transientParams.signer ?? Eip712SignerFactory.build();

    return {
      fid: bytesToBigNumber(FIDFactory.build())._unsafeUnwrap(),
      network: flatbuffers.FarcasterNetwork.Testnet,
      address: signer.signerKeyHex,
      blockHash: BlockHashFactory.build(),
    };
  }
);

const VerificationAddEthAddressBodyFactory = Factory.define<
  flatbuffers.VerificationAddEthAddressBodyT,
  { signer?: Eip712Signer; fid?: Uint8Array; network?: flatbuffers.FarcasterNetwork },
  flatbuffers.VerificationAddEthAddressBody
>(({ onCreate, transientParams }) => {
  onCreate(async (params) => {
    // Generate address and signature
    const signer = transientParams.signer ?? Factories.Eip712Signer.build();
    params.address = Array.from(signer.signerKey);

    const fid = transientParams.fid ?? FIDFactory.build();
    const claim = makeVerificationEthAddressClaim(
      fid,
      signer.signerKey,
      transientParams.network ?? flatbuffers.FarcasterNetwork.Testnet,
      Uint8Array.from(params.blockHash)
    )._unsafeUnwrap();
    const ethSignature = await signer.signVerificationEthAddressClaim(claim);
    params.ethSignature = Array.from(ethSignature._unsafeUnwrap());

    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return flatbuffers.VerificationAddEthAddressBody.getRootAsVerificationAddEthAddressBody(
      new ByteBuffer(builder.asUint8Array())
    );
  });

  return new flatbuffers.VerificationAddEthAddressBodyT(
    Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 40 }))._unsafeUnwrap()),
    Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 130 }))._unsafeUnwrap()),
    Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 64 }))._unsafeUnwrap())
  );
});

const VerificationAddEthAddressDataFactory = Factory.define<flatbuffers.MessageDataT, any, flatbuffers.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: flatbuffers.MessageBody.VerificationAddEthAddressBody,
      body: VerificationAddEthAddressBodyFactory.build(),
      type: flatbuffers.MessageType.VerificationAddEthAddress,
    });
  }
);

const VerificationRemoveBodyFactory = Factory.define<
  flatbuffers.VerificationRemoveBodyT,
  any,
  flatbuffers.VerificationRemoveBody
>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return flatbuffers.VerificationRemoveBody.getRootAsVerificationRemoveBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new flatbuffers.VerificationRemoveBodyT(
    Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 40 }))._unsafeUnwrap())
  );
});

const VerificationRemoveDataFactory = Factory.define<flatbuffers.MessageDataT, any, flatbuffers.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: flatbuffers.MessageBody.VerificationRemoveBody,
      body: VerificationRemoveBodyFactory.build(),
      type: flatbuffers.MessageType.VerificationRemove,
    });
  }
);

const SignerBodyFactory = Factory.define<flatbuffers.SignerBodyT, any, flatbuffers.SignerBody>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return flatbuffers.SignerBody.getRootAsSignerBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new flatbuffers.SignerBodyT(
    Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 64 }))._unsafeUnwrap())
  );
});

const SignerAddDataFactory = Factory.define<flatbuffers.MessageDataT, any, flatbuffers.MessageData>(({ onCreate }) => {
  onCreate((params) => {
    return MessageDataFactory.create(params);
  });

  return MessageDataFactory.build({
    bodyType: flatbuffers.MessageBody.SignerBody,
    body: SignerBodyFactory.build(),
    type: flatbuffers.MessageType.SignerAdd,
  });
});

const SignerRemoveDataFactory = Factory.define<flatbuffers.MessageDataT, any, flatbuffers.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: flatbuffers.MessageBody.SignerBody,
      body: SignerBodyFactory.build(),
      type: flatbuffers.MessageType.SignerRemove,
    });
  }
);

const UserDataBodyFactory = Factory.define<flatbuffers.UserDataBodyT, any, flatbuffers.UserDataBody>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return flatbuffers.UserDataBody.getRootAsUserDataBody(new ByteBuffer(builder.asUint8Array()));
  });

  return new flatbuffers.UserDataBodyT(flatbuffers.UserDataType.Pfp, faker.random.alphaNumeric(32));
});

const UserDataAddDataFactory = Factory.define<flatbuffers.MessageDataT, any, flatbuffers.MessageData>(
  ({ onCreate }) => {
    onCreate((params) => {
      return MessageDataFactory.create(params);
    });

    return MessageDataFactory.build({
      bodyType: flatbuffers.MessageBody.UserDataBody,
      body: UserDataBodyFactory.build(),
      type: flatbuffers.MessageType.UserDataAdd,
    });
  }
);

const MessageFactory = Factory.define<
  flatbuffers.MessageT,
  { signer?: Ed25519Signer; ethSigner?: Eip712Signer },
  flatbuffers.Message
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
        params.signature = Array.from((await signer.signMessageHash(new Uint8Array(params.hash)))._unsafeUnwrap());
        params.signer = Array.from(signer.signerKey);
      } else if (transientParams.ethSigner) {
        const eip712Signature = await transientParams.ethSigner.signMessageHash(new Uint8Array(params.hash));
        params.signature = Array.from(eip712Signature._unsafeUnwrap());
        params.signatureScheme = flatbuffers.SignatureScheme.Eip712;
        params.signer = Array.from(transientParams.ethSigner.signerKey);
      } else {
        const signer = Factories.Ed25519Signer.build();
        params.signature = Array.from((await signer.signMessageHash(new Uint8Array(params.hash)))._unsafeUnwrap());
        params.signer = Array.from(signer.signerKey);
      }
    }

    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return flatbuffers.Message.getRootAsMessage(new ByteBuffer(builder.asUint8Array()));
  });

  const data = MessageDataFactory.build();
  const builder = new Builder(1);
  builder.finish(data.pack(builder));

  return new flatbuffers.MessageT(
    Array.from(builder.asUint8Array()),
    [],
    flatbuffers.HashScheme.Blake3,
    [],
    flatbuffers.SignatureScheme.Ed25519,
    []
  );
});

const IdRegistryEventFactory = Factory.define<flatbuffers.IdRegistryEventT, any, flatbuffers.IdRegistryEvent>(
  ({ onCreate }) => {
    onCreate((params) => {
      const builder = new Builder(1);
      builder.finish(params.pack(builder));
      return flatbuffers.IdRegistryEvent.getRootAsIdRegistryEvent(new ByteBuffer(builder.asUint8Array()));
    });

    return new flatbuffers.IdRegistryEventT(
      faker.datatype.number({ max: 100000 }),
      Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 64 }))._unsafeUnwrap()),
      Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 64 }))._unsafeUnwrap()),
      faker.datatype.number({ max: 1000 }),
      Array.from(FIDFactory.build()),
      Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 40 }))._unsafeUnwrap()),
      flatbuffers.IdRegistryEventType.IdRegistryRegister,
      Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 40 }))._unsafeUnwrap())
    );
  }
);

const NameRegistryEventFactory = Factory.define<flatbuffers.NameRegistryEventT, any, flatbuffers.NameRegistryEvent>(
  ({ onCreate }) => {
    onCreate((params) => {
      const builder = new Builder(1);
      builder.finish(params.pack(builder));
      return flatbuffers.NameRegistryEvent.getRootAsNameRegistryEvent(new ByteBuffer(builder.asUint8Array()));
    });

    return new flatbuffers.NameRegistryEventT(
      faker.datatype.number({ max: 100000 }),
      Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 64 }))._unsafeUnwrap()),
      Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 64 }))._unsafeUnwrap()),
      faker.datatype.number({ max: 1000 }),
      Array.from(FnameFactory.build()),
      Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 40 }))._unsafeUnwrap()),
      Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 40 }))._unsafeUnwrap()),
      flatbuffers.NameRegistryEventType.NameRegistryTransfer
    );
  }
);

const Ed25519PrivateKeyFactory = Factory.define<Uint8Array>(() => {
  return BytesFactory.build({}, { transient: { length: 32 } });
});

const Ed25519SignerFactory = Factory.define<Ed25519Signer>(() => {
  return new Ed25519Signer(Ed25519PrivateKeyFactory.build());
});

const Eip712SignerFactory = Factory.define<Eip712Signer>(() => {
  const wallet = new ethers.Wallet(ethers.utils.randomBytes(32));
  return new Eip712Signer(wallet, wallet.address);
});

const ReactionTypeFactory = Factory.define<flatbuffers.ReactionType>(() => {
  return faker.helpers.arrayElement([flatbuffers.ReactionType.Like, flatbuffers.ReactionType.Recast]);
});

export const Factories = {
  Bytes: BytesFactory,
  FID: FIDFactory,
  Fname: FnameFactory,
  TsHash: TsHashFactory,
  BlockHash: BlockHashFactory,
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
  VerificationEthAddressClaim: VerificationEthAddressClaimFactory,
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
  Ed25519PrivateKey: Ed25519PrivateKeyFactory,
  Ed25519Signer: Ed25519SignerFactory,
  Eip712Signer: Eip712SignerFactory,
  ReactionType: ReactionTypeFactory,
};
