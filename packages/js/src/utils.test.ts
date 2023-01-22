import { faker } from '@faker-js/faker';
import * as flatbuffers from '@farcaster/flatbuffers';
import {
  CastAddBody,
  ReactionBody,
  SignerBody,
  VerificationAddEthAddressBody,
  VerificationRemoveBody,
} from '@farcaster/flatbuffers';
import {
  bytesToHexString,
  bytesToNumber,
  bytesToUtf8String,
  Factories,
  hexStringToBytes,
  utf8StringToBytes,
} from '@farcaster/utils';
import { ok } from 'neverthrow';
import * as types from './types';
import * as utils from './utils';

const fidPassingCases: [Uint8Array, number][] = [
  [new Uint8Array([1]), 1],
  [new Uint8Array([64, 66, 15]), 1_000_000],
];

describe('deserializeFid', () => {
  for (const [input, output] of fidPassingCases) {
    test(`succeeds: ${input}`, () => {
      expect(utils.deserializeFid(input)._unsafeUnwrap()).toEqual(output);
    });
  }
});

describe('serializeFid', () => {
  for (const [output, input] of fidPassingCases) {
    test(`succeeds: ${input}`, () => {
      expect(utils.serializeFid(input)._unsafeUnwrap()).toEqual(output);
    });
  }
});

describe('deserializeBlockHash', () => {
  const blockHash = Factories.BlockHashHex.build();
  const blockHashBytes = hexStringToBytes(blockHash)._unsafeUnwrap();

  test(`succeeds`, () => {
    expect(utils.deserializeBlockHash(blockHashBytes)).toEqual(ok(blockHash));
  });
});

describe('serializeBlockHash', () => {
  test(`succeeds`, () => {
    const blockHash = Factories.BlockHashHex.build();
    const blockHashBytes = hexStringToBytes(blockHash)._unsafeUnwrap();

    expect(utils.serializeBlockHash(blockHash)).toEqual(ok(blockHashBytes));
  });
});

describe('deserializeTransactionHash', () => {
  const transactionHash = Factories.TransactionHashHex.build();
  const transactionHashBytes = hexStringToBytes(transactionHash)._unsafeUnwrap();

  test(`succeeds`, () => {
    expect(utils.deserializeTransactionHash(transactionHashBytes)).toEqual(ok(transactionHash));
  });
});

describe('serializeEip712Signature', () => {
  const signatureBytes = Factories.Eip712Signature.build();
  const signature = bytesToHexString(signatureBytes, { size: 130 })._unsafeUnwrap();

  test(`succeeds`, () => {
    expect(utils.serializeEip712Signature(signature)).toEqual(ok(signatureBytes));
  });
});

describe('deserializeEip712Signature', () => {
  const signatureBytes = Factories.Eip712Signature.build();
  const signature = bytesToHexString(signatureBytes, { size: 130 })._unsafeUnwrap();

  test(`succeeds`, () => {
    expect(utils.deserializeEip712Signature(signatureBytes)).toEqual(ok(signature));
  });
});

describe('deserializeEd25519Signature', () => {
  const signatureBytes = Factories.Ed25519Signature.build();
  const signature = bytesToHexString(signatureBytes, { size: 128 })._unsafeUnwrap();

  test(`succeeds`, () => {
    expect(utils.deserializeEd25519Signature(signatureBytes)).toEqual(ok(signature));
  });
});

describe('deserializeFname', () => {
  const fname = Factories.Fname.build();
  test(`succeeds`, () => {
    expect(utils.deserializeFname(fname)).toEqual(ok(bytesToUtf8String(fname)._unsafeUnwrap()));
  });
});

describe('serializeFname', () => {
  const fname = faker.random.alpha(5);
  test(`succeeds`, () => {
    expect(utils.serializeFname(fname)).toEqual(ok(utf8StringToBytes(fname)._unsafeUnwrap()));
  });
});

const ethWallet = Factories.Eip712Signer.build();

describe('deserializeEthAddress', () => {
  test('succeeds', () => {
    expect(utils.deserializeEthAddress(ethWallet.signerKey)._unsafeUnwrap()).toEqual(ethWallet.signerKeyHex);
  });
});

describe('serializeEthAddress', () => {
  test('succeeds', () => {
    expect(utils.serializeEthAddress(ethWallet.signerKeyHex)._unsafeUnwrap()).toEqual(ethWallet.signerKey);
  });
});

const ed25519Signer = Factories.Ed25519Signer.build();

describe('deserializeEd25519PublicKey', () => {
  test('succeeds', () => {
    expect(utils.deserializeEd25519PublicKey(ed25519Signer.signerKey)._unsafeUnwrap()).toEqual(
      ed25519Signer.signerKeyHex
    );
  });
});

describe('serializeEd25519PublicKey', () => {
  test('succeeds', () => {
    expect(utils.serializeEd25519PublicKey(ed25519Signer.signerKeyHex)._unsafeUnwrap()).toEqual(
      ed25519Signer.signerKey
    );
  });
});

const tsHash = Factories.TsHash.build();
const tsHashHex = utils.deserializeTsHash(tsHash)._unsafeUnwrap();

describe('deserializeTsHash', () => {
  test('succeeds', () => {
    expect(utils.deserializeTsHash(tsHash)._unsafeUnwrap()).toEqual(tsHashHex);
  });
});

describe('serializeTsHash', () => {
  test('succeeds', () => {
    expect(utils.serializeTsHash(tsHashHex)._unsafeUnwrap()).toEqual(tsHash);
  });
});

const fidNumber = 1;
const fid = Factories.FID.build(undefined, { transient: { fid: fidNumber } });

describe('deserializeCastId', () => {
  let castId: flatbuffers.CastId;

  beforeAll(async () => {
    castId = await Factories.CastId.create({
      fid: Array.from(fid),
      tsHash: Array.from(tsHash),
    });
  });

  test('succeeds', () => {
    const deserialized = utils.deserializeCastId(castId)._unsafeUnwrap();
    expect(deserialized.fid).toEqual(fidNumber);
    expect(deserialized.tsHash).toEqual(tsHashHex);
  });
});

describe('serializeCastId', () => {
  test('succeeds', () => {
    const serialized = utils
      .serializeCastId({
        fid: fidNumber,
        tsHash: tsHashHex,
      })
      ._unsafeUnwrap();
    expect(serialized.fid).toEqual(Array.from(fid));
    expect(serialized.tsHash).toEqual(Array.from(tsHash));
  });
});

// TODO: messageDataToJson
// TODO: messageDataFromJson

describe('deserializeCastAddBody', () => {
  let serializedCastAddBody: CastAddBody;
  let castAddBody: types.CastAddBody;
  const text = faker.lorem.words();
  const embed1 = faker.internet.url();
  const embed2 = faker.internet.url();
  const mentionfid1 = Factories.FID.build();
  const mentionFid2 = Factories.FID.build();
  const mentionFid1Number = utils.deserializeFid(mentionfid1)._unsafeUnwrap();
  const mentionFid2Number = utils.deserializeFid(mentionFid2)._unsafeUnwrap();
  const parentFid = Factories.FID.build();
  const parentFidNumber = utils.deserializeFid(parentFid)._unsafeUnwrap();
  const tsHash = Factories.TsHash.build();
  const tsHashHex = utils.deserializeTsHash(tsHash)._unsafeUnwrap();

  beforeAll(async () => {
    serializedCastAddBody = await Factories.CastAddBody.create({
      text,
      embeds: [embed1, embed2],
      mentions: [
        Factories.UserId.build({ fid: Array.from(mentionfid1) }),
        Factories.UserId.build({ fid: Array.from(mentionFid2) }),
      ],
      parent: new flatbuffers.CastIdT(Array.from(parentFid), Array.from(tsHash)),
    });
    castAddBody = utils.deserializeCastAddBody(serializedCastAddBody)._unsafeUnwrap();
  });

  test('text', () => {
    expect(castAddBody.text).toBe(text);
  });

  test('embeds', () => {
    expect(castAddBody.embeds?.length).toBe(2);
    expect(castAddBody.embeds?.at(0)).toBe(embed1);
    expect(castAddBody.embeds?.at(1)).toBe(embed2);
  });

  test('mentions', () => {
    expect(castAddBody.mentions?.length).toBe(2);
    expect(castAddBody.mentions?.at(0)).toBe(mentionFid1Number);
    expect(castAddBody.mentions?.at(1)).toBe(mentionFid2Number);
  });

  test('parent', () => {
    expect(castAddBody.parent?.fid).toBe(parentFidNumber);
    expect(castAddBody.parent?.tsHash).toBe(tsHashHex);
  });
});

describe('deserializeEmbeds', () => {
  let castAddBody: CastAddBody;
  const embed1 = faker.internet.url();
  const embed2 = faker.internet.url();

  beforeAll(async () => {
    castAddBody = await Factories.CastAddBody.create({
      embeds: [embed1, embed2],
    });
  });

  test('succeeds with embeds', () => {
    const deserialized = utils
      .deserializeEmbeds(castAddBody.embedsLength(), castAddBody.embeds.bind(castAddBody))
      ._unsafeUnwrap();
    expect(deserialized?.length).toBe(2);
    expect(deserialized?.at(0)).toBe(embed1);
    expect(deserialized?.at(1)).toBe(embed2);
  });
});

describe('deserializeMentions', () => {
  let castAddBody: CastAddBody;
  const fid1 = Factories.FID.build();
  const fid2 = Factories.FID.build();
  const fid1Number = utils.deserializeFid(fid1)._unsafeUnwrap();
  const fid2Number = utils.deserializeFid(fid2)._unsafeUnwrap();

  beforeAll(async () => {
    castAddBody = await Factories.CastAddBody.create({
      mentions: [Factories.UserId.build({ fid: Array.from(fid1) }), Factories.UserId.build({ fid: Array.from(fid2) })],
    });
  });

  test('succeeds with mentions', () => {
    const deserialized = utils
      .deserializeMentions(castAddBody.mentionsLength(), castAddBody.mentions.bind(castAddBody))
      ._unsafeUnwrap();
    expect(deserialized?.length).toBe(2);
    expect(deserialized?.at(0)).toBe(fid1Number);
    expect(deserialized?.at(1)).toBe(fid2Number);
  });
});

describe('deserializeTarget', () => {
  let castAddBody: CastAddBody;
  const fid = Factories.FID.build();
  const fidNumber = utils.deserializeFid(fid)._unsafeUnwrap();
  const tsHash = Factories.TsHash.build();
  const tsHashHex = utils.deserializeTsHash(tsHash)._unsafeUnwrap();

  beforeAll(async () => {
    castAddBody = await Factories.CastAddBody.create({
      parentType: flatbuffers.TargetId.CastId,
      parent: new flatbuffers.CastIdT(Array.from(fid), Array.from(tsHash)),
    });
  });

  test('succeeds when target is CastId', () => {
    const deserialized = utils
      .deserializeTarget(castAddBody.parentType(), castAddBody.parent.bind(castAddBody))
      ._unsafeUnwrap();
    expect(deserialized?.fid).toBe(fidNumber);
    expect(deserialized?.tsHash).toBe(tsHashHex);
  });
});

describe('serializeCastBodyAdd', () => {
  const text = faker.lorem.words();
  const embed1 = faker.internet.url();
  const embed2 = faker.internet.url();
  const mentionFid1 = Factories.FID.build();
  const mentionFid2 = Factories.FID.build();
  const mentionFid1Number = utils.deserializeFid(mentionFid1)._unsafeUnwrap();
  const mentionFid2Number = utils.deserializeFid(mentionFid2)._unsafeUnwrap();
  const parentFid = Factories.FID.build();
  const parentFidNumber = utils.deserializeFid(parentFid)._unsafeUnwrap();
  const tsHash = Factories.TsHash.build();
  const tsHashHex = utils.deserializeTsHash(tsHash)._unsafeUnwrap();
  const castAddBody = utils
    .serializeCastAddBody({
      text,
      embeds: [embed1, embed2],
      mentions: [mentionFid1Number, mentionFid2Number],
      parent: {
        fid: parentFidNumber,
        tsHash: tsHashHex,
      },
    })
    ._unsafeUnwrap();

  test('text', () => {
    expect(castAddBody.text).toEqual(text);
  });

  test('embeds', () => {
    expect(castAddBody.embeds.length).toEqual(2);
    expect(castAddBody.embeds.at(0)).toEqual(embed1);
    expect(castAddBody.embeds.at(1)).toEqual(embed2);
  });

  test('mentions', () => {
    expect(castAddBody.mentions.length).toEqual(2);
    expect(castAddBody.mentions.at(0)?.fid).toEqual(Array.from(mentionFid1));
    expect(castAddBody.mentions.at(1)?.fid).toEqual(Array.from(mentionFid2));
  });

  test('parent', () => {
    expect(castAddBody.parent?.fid).toEqual(Array.from(parentFid));
    expect(castAddBody.parent?.tsHash).toEqual(Array.from(tsHash));
  });
});

describe('deserializeCastRemoveBody', () => {
  let castRemoveBody: flatbuffers.CastRemoveBody;
  const tsHash = Factories.TsHash.build();
  const tsHashHex = utils.deserializeTsHash(tsHash)._unsafeUnwrap();

  beforeAll(async () => {
    castRemoveBody = await Factories.CastRemoveBody.create({ targetTsHash: Array.from(tsHash) });
  });

  test('succeeds', () => {
    expect(utils.deserializeCastRemoveBody(castRemoveBody)._unsafeUnwrap()).toEqual({ targetTsHash: tsHashHex });
  });
});

describe('serializeAmpBody', () => {
  const fid = Factories.FID.build();
  const fidNumber = utils.deserializeFid(fid)._unsafeUnwrap();
  const body = utils
    .serializeAmpBody({
      user: fidNumber,
    })
    ._unsafeUnwrap();

  test('user', () => {
    expect(body.user?.fid).toEqual(Array.from(fid));
  });
});

describe('deserializeAmpBody', () => {
  let serializedBody: flatbuffers.AmpBody;
  let body: types.AmpBody;
  const fid = Factories.FID.build();
  const fidNumber = utils.deserializeFid(fid)._unsafeUnwrap();
  const user = Factories.UserId.build({ fid: Array.from(fid) });

  beforeAll(async () => {
    serializedBody = await Factories.AmpBody.create({ user });
    body = utils.deserializeAmpBody(serializedBody)._unsafeUnwrap();
  });

  test('user', () => {
    expect(body.user).toBe(fidNumber);
  });
});

describe('serializeCastRemoveBody', () => {
  test('succeeds', () => {
    const castRemoveBodyT = utils.serializeCastRemoveBody({ targetTsHash: tsHashHex })._unsafeUnwrap();
    expect(castRemoveBodyT.targetTsHash).toEqual(Array.from(tsHash));
  });
});

describe('deserializeVerificationAddEthAddressBody', () => {
  let serializedBody: VerificationAddEthAddressBody;
  let body: types.VerificationAddEthAddressBody;
  const signer = Factories.Eip712Signer.build();
  const blockHash = Factories.BlockHashHex.build();
  const blockHashBytes = utils.serializeBlockHash(blockHash)._unsafeUnwrap();

  beforeAll(async () => {
    serializedBody = await Factories.VerificationAddEthAddressBody.create(
      {
        blockHash: Array.from(blockHashBytes),
      },
      { transient: { signer } }
    );
    body = utils.deserializeVerificationAddEthAddressBody(serializedBody)._unsafeUnwrap();
  });

  test('address', () => {
    expect(body.address).toEqual(signer.signerKeyHex);
  });

  test('ethSignature', () => {
    expect(body.ethSignature).toEqual(
      utils.deserializeEip712Signature(serializedBody.ethSignatureArray() ?? new Uint8Array())._unsafeUnwrap()
    );
  });

  test('blockHash', () => {
    expect(body.blockHash).toEqual(blockHash);
  });
});

describe('serializeVerificationAddEthAddressBody', () => {
  let ethSignature: Uint8Array;
  let body: flatbuffers.VerificationAddEthAddressBodyT;
  const signer = Factories.Eip712Signer.build();
  const blockHash = Factories.BlockHashHex.build();
  const blockHashBytes = hexStringToBytes(blockHash)._unsafeUnwrap();
  const claim = Factories.VerificationEthAddressClaim.build(undefined, { transient: { signer } });

  beforeAll(async () => {
    ethSignature = (await signer.signVerificationEthAddressClaim(claim))._unsafeUnwrap();
    body = utils
      .serializeVerificationAddEthAddressBody({
        address: signer.signerKeyHex,
        blockHash,
        ethSignature: utils.deserializeEip712Signature(ethSignature)._unsafeUnwrap(),
      })
      ._unsafeUnwrap();
  });

  test('address', () => {
    expect(body.address).toEqual(Array.from(signer.signerKey));
  });

  test('ethSignature', () => {
    expect(body.ethSignature).toEqual(Array.from(ethSignature));
  });

  test('blockHash', () => {
    expect(body.blockHash).toEqual(Array.from(blockHashBytes));
  });
});

describe('serializeVerificationRemoveBody', () => {
  const signer = Factories.Eip712Signer.build();
  const body = utils
    .serializeVerificationRemoveBody({
      address: signer.signerKeyHex,
    })
    ._unsafeUnwrap();

  test('signer', () => {
    expect(body.address).toEqual(Array.from(signer.signerKey));
  });
});

describe('deserializeVerificationRemoveBody', () => {
  let serializedBody: VerificationRemoveBody;
  let body: types.VerificationRemoveBody;
  const signer = Factories.Eip712Signer.build();

  beforeAll(async () => {
    serializedBody = await Factories.VerificationRemoveBody.create({
      address: Array.from(signer.signerKey),
    });
    body = utils.deserializeVerificationRemoveBody(serializedBody)._unsafeUnwrap();
  });

  test('address', () => {
    expect(body.address).toEqual(signer.signerKeyHex);
  });
});

describe('serializeVerificationRemoveBody', () => {
  const signer = Factories.Eip712Signer.build();
  const body = utils
    .serializeVerificationRemoveBody({
      address: signer.signerKeyHex,
    })
    ._unsafeUnwrap();

  test('signer', () => {
    expect(body.address).toEqual(Array.from(signer.signerKey));
  });
});

describe('deserializeSignerBody', () => {
  let serializedSignerBody: SignerBody;
  let signerBody: types.SignerBody;
  const signer = Factories.Ed25519Signer.build();

  beforeAll(async () => {
    serializedSignerBody = await Factories.SignerBody.create({
      signer: Array.from(signer.signerKey),
    });
    signerBody = utils.deserializeSignerBody(serializedSignerBody)._unsafeUnwrap();
  });

  test('signer', () => {
    expect(signerBody.signer).toEqual(signer.signerKeyHex);
  });
});

describe('serializeSignerBody', () => {
  const signer = Factories.Ed25519Signer.build();
  const signerBody = utils
    .serializeSignerBody({
      signer: signer.signerKeyHex,
    })
    ._unsafeUnwrap();

  test('signer', () => {
    expect(signerBody.signer).toEqual(Array.from(signer.signerKey));
  });
});

describe('deserializeUserDataBody', () => {
  let serializedBody: flatbuffers.UserDataBody;
  let body: types.UserDataBody;
  const bodyF = Factories.UserDataBody.build();
  const type = bodyF.type;
  const value = bodyF.value;

  beforeAll(async () => {
    serializedBody = await Factories.UserDataBody.create({
      type,
      value,
    });
    body = utils.deserializeUserDataBody(serializedBody)._unsafeUnwrap();
  });

  test('type', () => {
    expect(body.type).toEqual(type);
  });

  test('value', () => {
    expect(body.value).toEqual(value);
  });
});

describe('serializeUserDataBody', () => {
  // TOOD introduce factory for creating user body type?
  const bodyF = Factories.UserDataBody.build();
  const type = bodyF.type;
  const value = faker.lorem.word();
  const body = utils
    .serializeUserDataBody({
      type,
      value,
    })
    ._unsafeUnwrap();

  test('type', () => {
    expect(body.type).toEqual(type);
  });

  test('value', () => {
    expect(body.value).toEqual(value);
  });
});

describe('deserializeReactionBody', () => {
  let serializedReactionBody: ReactionBody;
  let reactionBody: types.ReactionBody;
  const reactionType = Factories.ReactionType.build();
  const targetFid = Factories.FID.build();
  const targetFidNumber = utils.deserializeFid(targetFid)._unsafeUnwrap();
  const tsHash = Factories.TsHash.build();
  const tsHashHex = utils.deserializeTsHash(tsHash)._unsafeUnwrap();

  beforeAll(async () => {
    serializedReactionBody = await Factories.ReactionBody.create({
      target: new flatbuffers.CastIdT(Array.from(targetFid), Array.from(tsHash)),
      type: reactionType,
    });
    reactionBody = utils.deserializeReactionBody(serializedReactionBody)._unsafeUnwrap();
  });

  test('type', () => {
    expect(reactionBody.type).toEqual(reactionType);
  });

  test('target', () => {
    expect(reactionBody.target?.fid).toEqual(targetFidNumber);
    expect(reactionBody.target?.tsHash).toEqual(tsHashHex);
  });
});

describe('serializeReactionBody', () => {
  const reactionType = Factories.ReactionType.build();
  const targetFid = Factories.FID.build();
  const targetFidNumber = utils.deserializeFid(targetFid)._unsafeUnwrap();
  const tsHash = Factories.TsHash.build();
  const tsHashHex = utils.deserializeTsHash(tsHash)._unsafeUnwrap();
  const reactionBody = utils
    .serializeReactionBody({
      target: {
        fid: targetFidNumber,
        tsHash: tsHashHex,
      },
      type: reactionType,
    })
    ._unsafeUnwrap();

  test('type', () => {
    expect(reactionBody.type).toEqual(reactionType);
  });

  test('target', () => {
    expect(reactionBody.target?.fid).toEqual(Array.from(targetFid));
    expect(reactionBody.target?.tsHash).toEqual(Array.from(tsHash));
  });
});

describe('deserializeMessage', () => {
  const ed25519Signer = Factories.Ed25519Signer.build();
  let messageFb: flatbuffers.Message;
  let message: types.Message;
  let messageData: flatbuffers.MessageData;

  beforeAll(async () => {
    messageData = await Factories.MessageData.create();
    messageFb = await Factories.Message.create(
      { data: Array.from(messageData.bb?.bytes() ?? new Uint8Array()) },
      { transient: { signer: ed25519Signer } }
    );
    message = utils.deserializeMessage(messageFb)._unsafeUnwrap();
  });

  test('flatbuffer', () => {
    expect(message.flatbuffer).toEqual(messageFb);
  });

  test('hash', () => {
    expect(message.hash).toEqual(
      utils.deserializeMessageHash(messageFb.hashArray() ?? new Uint8Array())._unsafeUnwrap()
    );
  });

  test('hashScheme', () => {
    expect(message.hashScheme).toEqual(messageFb.hashScheme());
  });

  test('data', () => {
    expect(message.data).toEqual(utils.deserializeMessageData(messageData)._unsafeUnwrap());
  });

  test('signature', () => {
    expect(message.signature).toEqual(
      utils.deserializeEd25519Signature(messageFb.signatureArray() ?? new Uint8Array())._unsafeUnwrap()
    );
  });

  test('signatureScheme', () => {
    expect(message.signatureScheme).toEqual(messageFb.signatureScheme());
  });

  test('signer', () => {
    expect(message.signer).toEqual(ed25519Signer.signerKeyHex);
  });
});

describe('deserializeNameRegistryEvent', () => {
  let nameRegistryEventFbb: flatbuffers.NameRegistryEvent;
  let nameRegistryEvent: types.NameRegistryEvent;

  beforeAll(async () => {
    nameRegistryEventFbb = await Factories.NameRegistryEvent.create();
    nameRegistryEvent = utils.deserializeNameRegistryEvent(nameRegistryEventFbb)._unsafeUnwrap();
  });

  test('flatbuffer', () => {
    expect(nameRegistryEvent.flatbuffer).toEqual(nameRegistryEventFbb);
  });

  test('blockNumber', () => {
    expect(nameRegistryEvent.blockNumber).toEqual(nameRegistryEventFbb.blockNumber());
  });

  test('blockHash', () => {
    expect(nameRegistryEvent.blockHash).toEqual(
      utils.deserializeBlockHash(nameRegistryEventFbb.blockHashArray() ?? new Uint8Array())._unsafeUnwrap()
    );
  });

  test('transactionHash', () => {
    expect(nameRegistryEvent.transactionHash).toEqual(
      utils.deserializeTransactionHash(nameRegistryEventFbb.transactionHashArray() ?? new Uint8Array())._unsafeUnwrap()
    );
  });

  test('logIndex', () => {
    expect(nameRegistryEvent.logIndex).toEqual(nameRegistryEventFbb.logIndex());
  });

  test('fname', () => {
    expect(nameRegistryEvent.fname).toEqual(
      utils.deserializeFname(nameRegistryEventFbb.fnameArray() ?? new Uint8Array())._unsafeUnwrap()
    );
  });

  test('to', () => {
    expect(nameRegistryEvent.to).toEqual(
      utils.deserializeEthAddress(nameRegistryEventFbb.toArray() ?? new Uint8Array())._unsafeUnwrap()
    );
  });

  test('from', () => {
    expect(nameRegistryEvent.from).toEqual(
      utils.deserializeEthAddress(nameRegistryEventFbb.fromArray() ?? new Uint8Array())._unsafeUnwrap()
    );
  });

  test('type', () => {
    expect(nameRegistryEvent.type).toEqual(nameRegistryEventFbb.type());
  });

  test('expiry', () => {
    expect(nameRegistryEvent.expiry).toEqual(
      bytesToNumber(nameRegistryEventFbb.expiryArray() ?? new Uint8Array())._unsafeUnwrap()
    );
  });
});

describe('deserializeIdRegistryEvent', () => {
  let idRegistryEventFbb: flatbuffers.IdRegistryEvent;
  let idRegistryEvent: types.IdRegistryEvent;

  beforeAll(async () => {
    idRegistryEventFbb = await Factories.IdRegistryEvent.create();
    idRegistryEvent = utils.deserializeIdRegistryEvent(idRegistryEventFbb)._unsafeUnwrap();
  });

  test('flatbuffer', () => {
    expect(idRegistryEvent.flatbuffer).toEqual(idRegistryEventFbb);
  });

  test('blockNumber', () => {
    expect(idRegistryEvent.blockNumber).toEqual(idRegistryEventFbb.blockNumber());
  });

  test('blockHash', () => {
    expect(idRegistryEvent.blockHash).toEqual(
      utils.deserializeBlockHash(idRegistryEventFbb.blockHashArray() ?? new Uint8Array())._unsafeUnwrap()
    );
  });

  test('transactionHash', () => {
    expect(idRegistryEvent.transactionHash).toEqual(
      utils.deserializeTransactionHash(idRegistryEventFbb.transactionHashArray() ?? new Uint8Array())._unsafeUnwrap()
    );
  });

  test('logIndex', () => {
    expect(idRegistryEvent.logIndex).toEqual(idRegistryEventFbb.logIndex());
  });

  test('fid', () => {
    expect(idRegistryEvent.fid).toEqual(
      utils.deserializeFid(idRegistryEventFbb.fidArray() ?? new Uint8Array())._unsafeUnwrap()
    );
  });

  test('to', () => {
    expect(idRegistryEvent.to).toEqual(
      utils.deserializeEthAddress(idRegistryEventFbb.toArray() ?? new Uint8Array())._unsafeUnwrap()
    );
  });

  test('from', () => {
    expect(idRegistryEvent.from).toEqual(
      utils.deserializeEthAddress(idRegistryEventFbb.fromArray() ?? new Uint8Array())._unsafeUnwrap()
    );
  });

  test('type', () => {
    expect(idRegistryEvent.type).toEqual(idRegistryEventFbb.type());
  });
});

describe('deserializeEventResponse', () => {
  let eventResponseFbb: flatbuffers.EventResponse;

  describe('MergeIdRegistryEvent event', () => {
    const type = flatbuffers.EventType.MergeIdRegistryEvent;
    let idRegistryEventFbb: flatbuffers.IdRegistryEvent;
    let idRegistryEvent: types.IdRegistryEvent;
    let eventResponse: types.IdRegistryEventResponse;

    beforeAll(async () => {
      idRegistryEventFbb = await Factories.IdRegistryEvent.create();
      idRegistryEvent = await utils.deserializeIdRegistryEvent(idRegistryEventFbb)._unsafeUnwrap();
      eventResponseFbb = await Factories.EventResponse.create({
        type,
        bytes: Array.from(idRegistryEventFbb.bb?.bytes() ?? new Uint8Array()),
      });
      eventResponse = utils.deserializeEventResponse(eventResponseFbb)._unsafeUnwrap() as types.IdRegistryEventResponse;
    });

    test('flatbuffer', () => {
      expect(eventResponse.flatbuffer).toBe(eventResponseFbb);
    });

    test('type', () => {
      expect(eventResponse.type).toBe(type);
    });

    test('idRegistryEvent', () => {
      expect(eventResponse.idRegistryEvent).toMatchObject(idRegistryEvent);
    });
  });

  describe('MergeNameRegistryEvent event', () => {
    const type = flatbuffers.EventType.MergeNameRegistryEvent;
    let nameRegistryEventFbb: flatbuffers.NameRegistryEvent;
    let nameRegistryEvent: types.NameRegistryEvent;
    let eventResponse: types.NameRegistryEventResponse;

    beforeAll(async () => {
      nameRegistryEventFbb = await Factories.NameRegistryEvent.create();
      nameRegistryEvent = await utils.deserializeNameRegistryEvent(nameRegistryEventFbb)._unsafeUnwrap();
      eventResponseFbb = await Factories.EventResponse.create({
        type,
        bytes: Array.from(nameRegistryEventFbb.bb?.bytes() ?? new Uint8Array()),
      });
      eventResponse = utils
        .deserializeEventResponse(eventResponseFbb)
        ._unsafeUnwrap() as types.NameRegistryEventResponse;
    });

    test('flatbuffer', () => {
      expect(eventResponse.flatbuffer).toBe(eventResponseFbb);
    });

    test('type', () => {
      expect(eventResponse.type).toBe(type);
    });

    test('nameRegistryEvent', () => {
      expect(eventResponse.nameRegistryEvent).toMatchObject(nameRegistryEvent);
    });
  });

  describe('MergeMessage event', () => {
    const type = flatbuffers.EventType.MergeMessage;
    let messageFbb: flatbuffers.Message;
    let message: types.Message;
    let eventResponse: types.MessageEventResponse;

    beforeAll(async () => {
      messageFbb = await Factories.Message.create();
      message = await utils.deserializeMessage(messageFbb)._unsafeUnwrap();
      eventResponseFbb = await Factories.EventResponse.create({
        type,
        bytes: Array.from(messageFbb.bb?.bytes() ?? new Uint8Array()),
      });
      eventResponse = utils.deserializeEventResponse(eventResponseFbb)._unsafeUnwrap() as types.MessageEventResponse;
    });

    test('flatbuffer', () => {
      expect(eventResponse.flatbuffer).toBe(eventResponseFbb);
    });

    test('type', () => {
      expect(eventResponse.type).toBe(type);
    });

    test('message', () => {
      expect(eventResponse.message).toMatchObject(message);
    });
  });

  describe('PruneMessage event', () => {
    const type = flatbuffers.EventType.PruneMessage;
    let messageFbb: flatbuffers.Message;
    let message: types.Message;
    let eventResponse: types.MessageEventResponse;

    beforeAll(async () => {
      messageFbb = await Factories.Message.create();
      message = await utils.deserializeMessage(messageFbb)._unsafeUnwrap();
      eventResponseFbb = await Factories.EventResponse.create({
        type,
        bytes: Array.from(messageFbb.bb?.bytes() ?? new Uint8Array()),
      });
      eventResponse = utils.deserializeEventResponse(eventResponseFbb)._unsafeUnwrap() as types.MessageEventResponse;
    });

    test('flatbuffer', () => {
      expect(eventResponse.flatbuffer).toBe(eventResponseFbb);
    });

    test('type', () => {
      expect(eventResponse.type).toBe(type);
    });

    test('message', () => {
      expect(eventResponse.message).toMatchObject(message);
    });
  });

  describe('RevokeMessage event', () => {
    const type = flatbuffers.EventType.RevokeMessage;
    let messageFbb: flatbuffers.Message;
    let message: types.Message;
    let eventResponse: types.MessageEventResponse;

    beforeAll(async () => {
      messageFbb = await Factories.Message.create();
      message = await utils.deserializeMessage(messageFbb)._unsafeUnwrap();
      eventResponseFbb = await Factories.EventResponse.create({
        type,
        bytes: Array.from(messageFbb.bb?.bytes() ?? new Uint8Array()),
      });
      eventResponse = utils.deserializeEventResponse(eventResponseFbb)._unsafeUnwrap() as types.MessageEventResponse;
    });

    test('flatbuffer', () => {
      expect(eventResponse.flatbuffer).toBe(eventResponseFbb);
    });

    test('type', () => {
      expect(eventResponse.type).toBe(type);
    });

    test('message', () => {
      expect(eventResponse.message).toMatchObject(message);
    });
  });
});
