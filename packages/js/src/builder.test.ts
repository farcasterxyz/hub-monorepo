import { faker } from '@faker-js/faker';
import * as flatbuffers from '@hub/flatbuffers';
import { bytesToHexString, bytesToNumber, Factories } from '@hub/utils';
import { validateMessage } from '@hub/utils/src/validations';
import * as builders from './builders';

const fid = faker.datatype.number({ min: 1 });
const timestamp = Date.now();
const network = flatbuffers.FarcasterNetwork.Testnet;
const ed25519Signer = Factories.Ed25519Signer.build();
const eip712Signer = Factories.Eip712Signer.build();

describe('makeCastAdd', () => {
  test('succeeds', async () => {
    const message = await builders.makeCastAdd(
      { text: faker.random.alphaNumeric(200) },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeCastRemove', () => {
  const tsHash = Factories.TsHash.build();
  const tsHashHex = bytesToHexString(tsHash)._unsafeUnwrap();

  test('succeeds', async () => {
    const message = await builders.makeCastRemove(
      { targetTsHash: tsHashHex },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeReactionAdd', () => {
  const tsHash = Factories.TsHash.build();
  const tsHashHex = bytesToHexString(tsHash)._unsafeUnwrap();
  const reactionType = Factories.ReactionType.build();

  test('succeeds', async () => {
    const message = await builders.makeReactionAdd(
      { type: reactionType, target: { fid, tsHash: tsHashHex } },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeReactionRemove', () => {
  const tsHash = Factories.TsHash.build();
  const tsHashHex = bytesToHexString(tsHash)._unsafeUnwrap();
  const reactionType = Factories.ReactionType.build();

  test('succeeds', async () => {
    const message = await builders.makeReactionRemove(
      { type: reactionType, target: { fid, tsHash: tsHashHex } },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeAmpAdd', () => {
  const user = Factories.FID.build();
  const userNumber = bytesToNumber(user)._unsafeUnwrap();

  test('succeeds', async () => {
    const message = await builders.makeAmpAdd({ user: userNumber }, { fid, timestamp, network }, ed25519Signer);
    const isValid = await validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeAmpRemove', () => {
  const user = Factories.FID.build();
  const userNumber = bytesToNumber(user)._unsafeUnwrap();

  test('succeeds', async () => {
    const message = await builders.makeAmpRemove({ user: userNumber }, { fid, timestamp, network }, ed25519Signer);
    const isValid = await validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationAddEthAddress', () => {
  let ethSignature: Uint8Array;
  const signer = Factories.Eip712Signer.build();
  const address = signer.signerKeyHex;
  const blockHash = Factories.BlockHash.build();
  const claim = Factories.VerificationEthAddressClaim.build({ blockHash, fid }, { transient: { signer } });

  beforeAll(async () => {
    ethSignature = (await signer.signVerificationEthAddressClaim(claim))._unsafeUnwrap();
  });

  test('succeeds', async () => {
    const message = await builders.makeVerificationAddEthAddress(
      { address, blockHash, ethSignature: bytesToHexString(ethSignature)._unsafeUnwrap() },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationRemove', () => {
  const signer = Factories.Eip712Signer.build();

  test('succeeds', async () => {
    const message = await builders.makeVerificationRemove(
      { address: signer.signerKeyHex },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerRemove', () => {
  test('succeeds', async () => {
    const message = await builders.makeSignerRemove(
      { signer: ed25519Signer.signerKeyHex },
      { fid, timestamp, network },
      eip712Signer
    );
    const isValid = await validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerAdd', () => {
  test('succeeds', async () => {
    const message = await builders.makeSignerAdd(
      { signer: ed25519Signer.signerKeyHex },
      { fid, timestamp, network },
      eip712Signer
    );
    const isValid = await validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeUserDataAdd', () => {
  test('succeeds', async () => {
    const message = await builders.makeUserDataAdd(
      { type: flatbuffers.UserDataType.Bio, value: faker.lorem.word() },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});
