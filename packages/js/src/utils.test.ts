import { faker } from '@faker-js/faker';
import * as flatbuffers from '@hub/flatbuffers';
import { CastAddBody } from '@hub/flatbuffers';
import { bytesToHexString, bytesToNumber, Factories } from '@hub/utils';
import * as types from './types';
import {
  deserializeCastAddBody,
  deserializeCastId,
  deserializeCastRemoveBody,
  deserializeEd25519PublicKey,
  deserializeEmbeds,
  deserializeEthAddress,
  deserializeFid,
  deserializeMentions,
  deserializeTarget,
  deserializeTsHash,
  serializeCastAddBody,
  serializeCastId,
  serializeCastRemoveBody,
  serializeEd25519PublicKey,
  serializeEthAddress,
  serializeFid,
  serializeTsHash,
} from './utils';

const fidPassingCases: [Uint8Array, number][] = [
  [new Uint8Array([1]), 1],
  [new Uint8Array([64, 66, 15]), 1_000_000],
];

describe('deserializeFid', () => {
  for (const [input, output] of fidPassingCases) {
    test(`succeeds: ${input}`, () => {
      expect(deserializeFid(input)._unsafeUnwrap()).toEqual(output);
    });
  }
});

describe('serializeFid', () => {
  for (const [output, input] of fidPassingCases) {
    test(`succeeds: ${input}`, () => {
      expect(serializeFid(input)._unsafeUnwrap()).toEqual(output);
    });
  }
});

const ethWallet = Factories.Eip712Signer.build();

describe('deserializeEthAddress', () => {
  test('succeeds', () => {
    expect(deserializeEthAddress(ethWallet.signerKey)._unsafeUnwrap()).toEqual(ethWallet.signerKeyHex);
  });
});

describe('serializeEthAddress', () => {
  test('succeeds', () => {
    expect(serializeEthAddress(ethWallet.signerKeyHex)._unsafeUnwrap()).toEqual(ethWallet.signerKey);
  });
});

const ed25519Signer = Factories.Ed25519Signer.build();

describe('deserializeEd25519PublicKey', () => {
  test('succeeds', () => {
    expect(deserializeEd25519PublicKey(ed25519Signer.signerKey)._unsafeUnwrap()).toEqual(ed25519Signer.signerKeyHex);
  });
});

describe('serializeEd25519PublicKey', () => {
  test('succeeds', () => {
    expect(serializeEd25519PublicKey(ed25519Signer.signerKeyHex)._unsafeUnwrap()).toEqual(ed25519Signer.signerKey);
  });
});

const tsHash = Factories.TsHash.build();
const tsHashHex = bytesToHexString(tsHash, { size: 40 })._unsafeUnwrap();

describe('deserializeTsHash', () => {
  test('succeeds', () => {
    expect(deserializeTsHash(tsHash)._unsafeUnwrap()).toEqual(tsHashHex);
  });
});

describe('serializeTsHash', () => {
  test('succeeds', () => {
    expect(serializeTsHash(tsHashHex)._unsafeUnwrap()).toEqual(tsHash);
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
    const deserialized = deserializeCastId(castId)._unsafeUnwrap();
    expect(deserialized.fid).toEqual(fidNumber);
    expect(deserialized.tsHash).toEqual(tsHashHex);
  });
});

describe('serializeCastId', () => {
  test('succeeds', () => {
    const serialized = serializeCastId({
      fid: fidNumber,
      tsHash: tsHashHex,
    })._unsafeUnwrap();
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
  const mentionFid1Number = bytesToNumber(mentionfid1)._unsafeUnwrap();
  const mentionFid2Number = bytesToNumber(mentionFid2)._unsafeUnwrap();
  const parentFid = Factories.FID.build();
  const parentFidNumber = bytesToNumber(parentFid)._unsafeUnwrap();
  const tsHash = Factories.TsHash.build();
  const tsHashHex = bytesToHexString(tsHash, { size: 40 })._unsafeUnwrap();

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
    castAddBody = deserializeCastAddBody(serializedCastAddBody)._unsafeUnwrap();
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
    const deserialized = deserializeEmbeds(
      castAddBody.embedsLength(),
      castAddBody.embeds.bind(castAddBody)
    )._unsafeUnwrap();
    expect(deserialized?.length).toBe(2);
    expect(deserialized?.at(0)).toBe(embed1);
    expect(deserialized?.at(1)).toBe(embed2);
  });
});

describe('deserializeMentions', () => {
  let castAddBody: CastAddBody;
  const fid1 = Factories.FID.build();
  const fid2 = Factories.FID.build();
  const fid1Number = bytesToNumber(fid1)._unsafeUnwrap();
  const fid2Number = bytesToNumber(fid2)._unsafeUnwrap();

  beforeAll(async () => {
    castAddBody = await Factories.CastAddBody.create({
      mentions: [Factories.UserId.build({ fid: Array.from(fid1) }), Factories.UserId.build({ fid: Array.from(fid2) })],
    });
  });

  test('succeeds with mentions', () => {
    const deserialized = deserializeMentions(
      castAddBody.mentionsLength(),
      castAddBody.mentions.bind(castAddBody)
    )._unsafeUnwrap();
    expect(deserialized?.length).toBe(2);
    expect(deserialized?.at(0)).toBe(fid1Number);
    expect(deserialized?.at(1)).toBe(fid2Number);
  });
});

describe('deserializeTarget', () => {
  let castAddBody: CastAddBody;
  const fid = Factories.FID.build();
  const fidNumber = bytesToNumber(fid)._unsafeUnwrap();
  const tsHash = Factories.TsHash.build();
  const tsHashHex = bytesToHexString(tsHash, { size: 40 })._unsafeUnwrap();

  beforeAll(async () => {
    castAddBody = await Factories.CastAddBody.create({
      parentType: flatbuffers.TargetId.CastId,
      parent: new flatbuffers.CastIdT(Array.from(fid), Array.from(tsHash)),
    });
  });

  test('succeeds when target is CastId', () => {
    const deserialized = deserializeTarget(
      castAddBody.parentType(),
      castAddBody.parent.bind(castAddBody)
    )._unsafeUnwrap();
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
  const mentionFid1Number = bytesToNumber(mentionFid1)._unsafeUnwrap();
  const mentionFid2Number = bytesToNumber(mentionFid2)._unsafeUnwrap();
  const parentFid = Factories.FID.build();
  const parentFidNumber = bytesToNumber(parentFid)._unsafeUnwrap();
  const tsHash = Factories.TsHash.build();
  const tsHashHex = bytesToHexString(tsHash, { size: 40 })._unsafeUnwrap();
  const castAddBody = serializeCastAddBody({
    text,
    embeds: [embed1, embed2],
    mentions: [mentionFid1Number, mentionFid2Number],
    parent: {
      fid: parentFidNumber,
      tsHash: tsHashHex,
    },
  })._unsafeUnwrap();

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
  const tsHashHex = bytesToHexString(tsHash, { size: 40 })._unsafeUnwrap();

  beforeAll(async () => {
    castRemoveBody = await Factories.CastRemoveBody.create({ targetTsHash: Array.from(tsHash) });
  });

  test('succeeds', () => {
    expect(deserializeCastRemoveBody(castRemoveBody)._unsafeUnwrap()).toEqual({ targetTsHash: tsHashHex });
  });
});

describe('serializeCastRemoveBody', () => {
  test('succeeds', () => {
    const castRemoveBodyT = serializeCastRemoveBody({ targetTsHash: tsHashHex })._unsafeUnwrap();
    expect(castRemoveBodyT.targetTsHash).toEqual(Array.from(tsHash));
  });
});

// TODO: ampBodyToJson
// TODO: ampBodyFromJson

// TODO: verificationAddEthAddressBodyToJson
// TODO: verificationAddEthAddressBodyFromJson

// TODO: verificationRemoveBodyToJson
// TODO: verificationRemoveBodyFromJson

// TODO: signerBodyToJson
// TODO: signerBodyFromJson

// TODO: userDataBodyToJson
// TODO: userDataBodyFromJson

// TODO: reactionBodyToJson
// TODO: reactionBodyFromJson
