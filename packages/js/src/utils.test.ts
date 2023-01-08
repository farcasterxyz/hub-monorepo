import { bytesToHexString, Factories } from '@hub/utils';
import {
  deserializeEd25519PublicKey,
  deserializeEthAddress,
  deserializeFid,
  deserializeTsHash,
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

// TODO: castIdToJson
// TODO: castIdFromJson

// TODO: messageDataToJson
// TODO: messageDataFromJson

// TODO: castAddBodyToJson
// TODO: castAddBodyFromJson

// TODO: castRemoveBodyToJson
// TODO: castRemoveBodyFromJson

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
