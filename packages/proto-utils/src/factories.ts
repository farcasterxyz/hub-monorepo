import { faker } from '@faker-js/faker';
import * as protobufs from '@farcaster/protobufs';
import { utils } from '@noble/ed25519';
import { blake3 } from '@noble/hashes/blake3';
import { ethers } from 'ethers';
import { Factory } from 'fishery';
import { Ed25519Signer, Eip712Signer, Signer } from './signers';
import { getFarcasterTime, toFarcasterTime } from './time';
import { makeTsHash } from './tsHash';
import { makeVerificationEthAddressClaim, VerificationEthAddressClaim } from './verifications';

/** Scalars */

const FidFactory = Factory.define<number>(() => {
  return faker.datatype.number({ min: 1 });
});

const BytesFactory = Factory.define<Uint8Array, { length?: number }>(({ transientParams }) => {
  const length = transientParams.length ?? faker.datatype.number({ max: 64, min: 1 });
  return utils.randomBytes(length);
});

const MessageHashFactory = Factory.define<Uint8Array>(() => {
  return BytesFactory.build({}, { transient: { length: 20 } }); // 160 bits
});

const MessageHashHexFactory = Factory.define<string>(() => {
  return faker.datatype.hexadecimal({ length: 40, case: 'lower' });
});

const FnameFactory = Factory.define<Uint8Array>(() => {
  const length = faker.datatype.number({ min: 1, max: 16 });
  const bytes = new Uint8Array(length);

  //  The name begins with [a-z 0-9] or the ascii numbers [48-57, 97-122] inclusive
  bytes.set(
    [
      faker.helpers.arrayElement([
        faker.datatype.number({ min: 48, max: 57 }),
        faker.datatype.number({ min: 97, max: 122 }),
      ]),
    ],
    0
  );

  // The name can contain [a-z 0-9 -] or the ascii numbers [45, 48-57, 97-122] inclusive
  for (let i = 1; i < length; i++) {
    bytes.set(
      [
        faker.helpers.arrayElement([
          45,
          faker.datatype.number({ min: 48, max: 57 }),
          faker.datatype.number({ min: 97, max: 122 }),
        ]),
      ],
      i
    );
  }

  return bytes;
});

const TsHashFactory = Factory.define<Uint8Array, { timestamp?: number; hash?: Uint8Array }>(({ transientParams }) => {
  const timestamp = transientParams.timestamp ?? toFarcasterTime(faker.date.recent().getTime())._unsafeUnwrap();
  const hash = transientParams.hash ?? blake3(faker.random.alphaNumeric(256), { dkLen: 16 });
  return makeTsHash(timestamp, hash)._unsafeUnwrap();
});

const TsHashHexFactory = Factory.define<string>(() => {
  return faker.datatype.hexadecimal({ length: 40, case: 'lower' });
});

/** Eth */

const BlockHashFactory = Factory.define<Uint8Array>(() => {
  return BytesFactory.build({}, { transient: { length: 32 } });
});

const BlockHashHexFactory = Factory.define<string>(() => {
  return faker.datatype.hexadecimal({ length: 64, case: 'lower' });
});

const EthAddressFactory = Factory.define<Uint8Array>(() => {
  return BytesFactory.build({}, { transient: { length: 20 } });
});

const EthAddressHexFactory = Factory.define<string>(() => {
  return faker.datatype.hexadecimal({ length: 40, case: 'lower' });
});

const TransactionHashFactory = Factory.define<Uint8Array>(() => {
  return BytesFactory.build(undefined, { transient: { length: 32 } });
});

const TransactionHashHexFactory = Factory.define<string>(() => {
  return faker.datatype.hexadecimal({ length: 64, case: 'lower' });
});

/** Signers */

const Ed25519PrivateKeyFactory = Factory.define<Uint8Array>(() => {
  return utils.randomPrivateKey();
});

const Ed25519PublicKeyHexFactory = Factory.define<string>(() => {
  return faker.datatype.hexadecimal({ length: 64, case: 'lower' });
});

const Ed25519SignerFactory = Factory.define<Ed25519Signer>(() => {
  return Ed25519Signer.fromPrivateKey(Ed25519PrivateKeyFactory.build())._unsafeUnwrap();
});

const Ed25519SignatureFactory = Factory.define<Uint8Array>(() => {
  return BytesFactory.build({}, { transient: { length: 64 } });
});

const Ed25519SignatureHexFactory = Factory.define<string>(() => {
  return faker.datatype.hexadecimal({ length: 128, case: 'lower' });
});

const Eip712SignerFactory = Factory.define<Eip712Signer>(() => {
  const wallet = new ethers.Wallet(utils.randomBytes(32));
  return Eip712Signer.fromSigner(wallet, wallet.address)._unsafeUnwrap();
});

const Eip712SignatureFactory = Factory.define<Uint8Array>(() => {
  return BytesFactory.build(undefined, { transient: { length: 65 } });
});

const Eip712SignatureHexFactory = Factory.define<string>(() => {
  return faker.datatype.hexadecimal({ length: 130, case: 'lower' });
});

/** Protobufs */

const CastIdFactory = Factory.define<protobufs.CastId>(() => {
  return protobufs.CastId.create({
    fid: FidFactory.build(),
    hash: MessageHashFactory.build(),
  });
});

const FarcasterNetworkFactory = Factory.define<protobufs.FarcasterNetwork>(() => {
  return faker.helpers.arrayElement([
    protobufs.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
    protobufs.FarcasterNetwork.FARCASTER_NETWORK_MAINNET,
    protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET,
  ]);
});

const ReactionTypeFactory = Factory.define<protobufs.ReactionType>(() => {
  return faker.helpers.arrayElement([
    protobufs.ReactionType.REACTION_TYPE_LIKE,
    protobufs.ReactionType.REACTION_TYPE_RECAST,
  ]);
});

const UserDataTypeFactory = Factory.define<protobufs.UserDataType>(() => {
  return faker.helpers.arrayElement([
    protobufs.UserDataType.USER_DATA_TYPE_BIO,
    protobufs.UserDataType.USER_DATA_TYPE_DISPLAY,
    protobufs.UserDataType.USER_DATA_TYPE_FNAME,
    protobufs.UserDataType.USER_DATA_TYPE_LOCATION,
    protobufs.UserDataType.USER_DATA_TYPE_PFP,
    protobufs.UserDataType.USER_DATA_TYPE_URL,
  ]);
});

const MessageTypeFactory = Factory.define<protobufs.MessageType>(() => {
  return faker.helpers.arrayElement([
    protobufs.MessageType.MESSAGE_TYPE_AMP_ADD,
    protobufs.MessageType.MESSAGE_TYPE_AMP_REMOVE,
    protobufs.MessageType.MESSAGE_TYPE_CAST_ADD,
    protobufs.MessageType.MESSAGE_TYPE_CAST_REMOVE,
    protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD,
    protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE,
    protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD,
    protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE,
    protobufs.MessageType.MESSAGE_TYPE_USER_DATA_ADD,
    protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS,
    protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE,
  ]);
});

const MessageFactory = Factory.define<
  protobufs.Message,
  { signer?: Ed25519Signer | Eip712Signer; data?: protobufs.MessageData },
  protobufs.Message
>(({ onCreate, transientParams }) => {
  const data = transientParams.data ?? MessageDataFactory.build();
  const isEip712Signer =
    data.type === protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD ||
    data.type === protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE;
  const signer: Signer =
    transientParams.signer ?? (isEip712Signer ? Eip712SignerFactory.build() : Ed25519SignerFactory.build());

  onCreate(async (message: protobufs.Message) => {
    // Generate hash
    message.hash = blake3(message.data, { dkLen: 16 });

    // TODO: support EIP-712 signer

    // Generate signature
    const signature = await signer.signMessageHash(message.hash);
    message.signature = signature._unsafeUnwrap();

    return message;
  });

  return protobufs.Message.create({
    data: protobufs.MessageData.encode(data).finish(),
    hashScheme: protobufs.HashScheme.HASH_SCHEME_BLAKE3,
    signatureScheme: signer.scheme,
    signer: signer.signerKey,
  });
});

const MessageDataFactory = Factory.define<protobufs.MessageData>(() => {
  return protobufs.MessageData.create({
    type: protobufs.MessageType.MESSAGE_TYPE_CAST_ADD,
    fid: FidFactory.build(),
    timestamp: getFarcasterTime()._unsafeUnwrap(),
    network: protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET,
    castAddBody: CastAddBodyFactory.build(),
  });
});

const CastAddBodyFactory = Factory.define<protobufs.CastAddBody>(() => {
  return protobufs.CastAddBody.create({
    embeds: [faker.internet.url(), faker.internet.url()],
    mentions: [FidFactory.build(), FidFactory.build(), FidFactory.build()],
    parentCastId: CastIdFactory.build(),
    text: faker.lorem.sentence(4),
  });
});

const CastAddDataFactory = Factory.define<protobufs.CastAddData>(() => {
  return MessageDataFactory.build({
    castAddBody: CastAddBodyFactory.build(),
    type: protobufs.MessageType.MESSAGE_TYPE_CAST_ADD,
  }) as protobufs.CastAddData;
});

const CastRemoveBodyFactory = Factory.define<protobufs.CastRemoveBody>(() => {
  return protobufs.CastRemoveBody.create({
    targetHash: MessageHashFactory.build(),
  });
});

const CastRemoveDataFactory = Factory.define<protobufs.CastRemoveData>(() => {
  return MessageDataFactory.build({
    castRemoveBody: CastRemoveBodyFactory.build(),
    type: protobufs.MessageType.MESSAGE_TYPE_CAST_REMOVE,
  }) as protobufs.CastRemoveData;
});

const ReactionBodyFactory = Factory.define<protobufs.ReactionBody>(() => {
  return protobufs.ReactionBody.create({
    targetCastId: CastIdFactory.build(),
    type: ReactionTypeFactory.build(),
  });
});

const ReactionAddDataFactory = Factory.define<protobufs.ReactionAddData>(() => {
  return MessageDataFactory.build({
    reactionBody: ReactionBodyFactory.build(),
    type: protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD,
  }) as protobufs.ReactionAddData;
});

const ReactionRemoveDataFactory = Factory.define<protobufs.ReactionRemoveData>(() => {
  return MessageDataFactory.build({
    reactionBody: ReactionBodyFactory.build(),
    type: protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE,
  }) as protobufs.ReactionRemoveData;
});

const AmpBodyFactory = Factory.define<protobufs.AmpBody>(() => {
  return protobufs.AmpBody.create({
    targetFid: FidFactory.build(),
  });
});

const AmpAddDataFactory = Factory.define<protobufs.AmpAddData>(() => {
  return MessageDataFactory.build({
    ampBody: AmpBodyFactory.build(),
    type: protobufs.MessageType.MESSAGE_TYPE_AMP_ADD,
  }) as protobufs.AmpAddData;
});

const AmpRemoveDataFactory = Factory.define<protobufs.AmpRemoveData>(() => {
  return MessageDataFactory.build({
    ampBody: AmpBodyFactory.build(),
    type: protobufs.MessageType.MESSAGE_TYPE_AMP_REMOVE,
  }) as protobufs.AmpRemoveData;
});

const SignerBodyFactory = Factory.define<protobufs.SignerBody>(() => {
  return protobufs.SignerBody.create({
    signer: Ed25519SignerFactory.build().signerKey,
  });
});

const SignerAddDataFactory = Factory.define<protobufs.SignerAddData>(() => {
  return MessageDataFactory.build({
    signerBody: SignerBodyFactory.build(),
    type: protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD,
  }) as protobufs.SignerAddData;
});

const SignerRemoveDataFactory = Factory.define<protobufs.SignerRemoveData>(() => {
  return MessageDataFactory.build({
    signerBody: SignerBodyFactory.build(),
    type: protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE,
  }) as protobufs.SignerRemoveData;
});

const VerificationEthAddressClaimFactory = Factory.define<VerificationEthAddressClaim, { signer?: Eip712Signer }>(
  ({ transientParams }) => {
    const signer = transientParams.signer ?? Eip712SignerFactory.build();

    return makeVerificationEthAddressClaim(
      FidFactory.build(),
      signer.signerKey,
      FarcasterNetworkFactory.build(),
      BlockHashFactory.build()
    )._unsafeUnwrap();
  }
);

const VerificationAddEthAddressBodyFactory = Factory.define<
  protobufs.VerificationAddEthAddressBody,
  { signer?: Eip712Signer; fid?: number; network?: protobufs.FarcasterNetwork }
>(({ onCreate, transientParams }) => {
  const signer = transientParams.signer ?? Eip712SignerFactory.build();

  onCreate(async (body: protobufs.VerificationAddEthAddressBody) => {
    if (body.ethSignature.length === 0) {
      // Generate address and signature
      const fid = transientParams.fid ?? FidFactory.build();
      const network = transientParams.network ?? FarcasterNetworkFactory.build();
      const claim = makeVerificationEthAddressClaim(fid, signer.signerKey, network, body.blockHash)._unsafeUnwrap();
      const ethSignature = await signer.signVerificationEthAddressClaim(claim);
      body.ethSignature = ethSignature._unsafeUnwrap();
    }

    return body;
  });

  return protobufs.VerificationAddEthAddressBody.create({
    address: signer.signerKey,
    blockHash: BlockHashFactory.build(),
  });
});

const VerificationAddEthAddressDataFactory = Factory.define<protobufs.VerificationAddEthAddressData>(() => {
  return MessageDataFactory.build({
    verificationAddEthAddressBody: VerificationAddEthAddressBodyFactory.build(),
    type: protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS,
  }) as protobufs.VerificationAddEthAddressData;
});

const VerificationRemoveBodyFactory = Factory.define<protobufs.VerificationRemoveBody>(() => {
  return protobufs.VerificationRemoveBody.create({
    address: EthAddressFactory.build(),
  });
});

const VerificationRemoveDataFactory = Factory.define<protobufs.VerificationRemoveData>(() => {
  return MessageDataFactory.build({
    verificationRemoveBody: VerificationRemoveBodyFactory.build(),
    type: protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE,
  }) as protobufs.VerificationRemoveData;
});

const UserDataBodyFactory = Factory.define<protobufs.UserDataBody>(() => {
  return protobufs.UserDataBody.create({
    type: UserDataTypeFactory.build(),
    value: faker.random.alphaNumeric(32),
  });
});

const UserDataAddDataFactory = Factory.define<protobufs.UserDataAddData>(() => {
  return MessageDataFactory.build({
    userDataBody: UserDataBodyFactory.build(),
    type: protobufs.MessageType.MESSAGE_TYPE_USER_DATA_ADD,
  }) as protobufs.UserDataAddData;
});

export const Factories = {
  Fid: FidFactory,
  Fname: FnameFactory,
  Bytes: BytesFactory,
  MessageHash: MessageHashFactory,
  MessageHashHex: MessageHashHexFactory,
  TsHash: TsHashFactory,
  TsHashHex: TsHashHexFactory,
  BlockHash: BlockHashFactory,
  BlockHashHex: BlockHashHexFactory,
  EthAddress: EthAddressFactory,
  EthAddressHex: EthAddressHexFactory,
  TransactionHash: TransactionHashFactory,
  TransactionHashHex: TransactionHashHexFactory,
  Ed25519PrivateKey: Ed25519PrivateKeyFactory,
  Ed25519PublicKeyHex: Ed25519PublicKeyHexFactory,
  Ed25519Signer: Ed25519SignerFactory,
  Ed25519Signature: Ed25519SignatureFactory,
  Ed25519SignatureHex: Ed25519SignatureHexFactory,
  Eip712Signer: Eip712SignerFactory,
  Eip712Signature: Eip712SignatureFactory,
  Eip712SignatureHex: Eip712SignatureHexFactory,
  CastId: CastIdFactory,
  FarcasterNetwork: FarcasterNetworkFactory,
  ReactionType: ReactionTypeFactory,
  MessageType: MessageTypeFactory,
  MessageData: MessageDataFactory,
  Message: MessageFactory,
  CastAddBody: CastAddBodyFactory,
  CastAddData: CastAddDataFactory,
  CastRemoveBody: CastRemoveBodyFactory,
  CastRemoveData: CastRemoveDataFactory,
  ReactionBody: ReactionBodyFactory,
  ReactionAddData: ReactionAddDataFactory,
  ReactionRemoveData: ReactionRemoveDataFactory,
  AmpBody: AmpBodyFactory,
  AmpAddData: AmpAddDataFactory,
  AmpRemoveData: AmpRemoveDataFactory,
  SignerBody: SignerBodyFactory,
  SignerAddData: SignerAddDataFactory,
  SignerRemoveData: SignerRemoveDataFactory,
  VerificationEthAddressClaim: VerificationEthAddressClaimFactory,
  VerificationAddEthAddressBody: VerificationAddEthAddressBodyFactory,
  VerificationAddEthAddressData: VerificationAddEthAddressDataFactory,
  VerificationRemoveBody: VerificationRemoveBodyFactory,
  VerificationRemoveData: VerificationRemoveDataFactory,
  UserDataBody: UserDataBodyFactory,
  UserDataAddData: UserDataAddDataFactory,
};
