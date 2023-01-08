import { faker } from '@faker-js/faker';
import * as flatbuffers from '@hub/flatbuffers';
import { Factories } from '@hub/utils';
import { validateMessage } from '@hub/utils/src/validations';
import { makeCastAdd, makeSignerAdd, makeSignerRemove } from './builders';

const fid = faker.datatype.number({ min: 1 });
const timestamp = Date.now();
const network = flatbuffers.FarcasterNetwork.Testnet;
const ed25519Signer = Factories.Ed25519Signer.build();
const eip712Signer = Factories.Eip712Signer.build();

describe('makeCastAdd', () => {
  test('succeeds', async () => {
    const castAdd = await makeCastAdd(
      { text: faker.random.alphaNumeric(200) },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validateMessage(castAdd._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerRemove', () => {
  test('succeeds', async () => {
    const signerRemove = await makeSignerRemove(
      { signer: ed25519Signer.signerKeyHex },
      { fid, timestamp, network },
      eip712Signer
    );
    const isValid = await validateMessage(signerRemove._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerAdd', () => {
  test('succeeds', async () => {
    const signerAdd = await makeSignerAdd(
      { signer: ed25519Signer.signerKeyHex },
      { fid, timestamp, network },
      eip712Signer
    );
    const isValid = await validateMessage(signerAdd._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerRemove', () => {
  test('succeeds', async () => {
    const signerRemove = await makeSignerRemove(
      { signer: ed25519Signer.signerKeyHex },
      { fid, timestamp, network },
      eip712Signer
    );
    const isValid = await validateMessage(signerRemove._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});
