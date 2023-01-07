import { bytesToHexString, Factories } from '@hub/utils';
import {
  ed25519PublicKeyFromJson,
  ed25519PublicKeyToJson,
  ethAddressFromJson,
  ethAddressToJson,
  fidFromJson,
  fidToJson,
  tsHashFromJson,
  tsHashToJson,
} from './json';

const fidPassingCases: [Uint8Array, number][] = [
  [new Uint8Array([1]), 1],
  [new Uint8Array([64, 66, 15]), 1_000_000],
];

describe('fidToJson', () => {
  for (const [input, output] of fidPassingCases) {
    test(`succeeds: ${input}`, () => {
      expect(fidToJson(input)._unsafeUnwrap()).toEqual(output);
    });
  }
});

describe('fidFromJson', () => {
  for (const [output, input] of fidPassingCases) {
    test(`succeeds: ${input}`, () => {
      expect(fidFromJson(input)._unsafeUnwrap()).toEqual(output);
    });
  }
});

const ethWallet = Factories.Eip712Signer.build();

describe('ethAddressToJson', () => {
  test('succeeds', () => {
    expect(ethAddressToJson(ethWallet.signerKey)._unsafeUnwrap()).toEqual(ethWallet.signerKeyHex);
  });
});

describe('ethAddressFromJson', () => {
  test('succeeds', () => {
    expect(ethAddressFromJson(ethWallet.signerKeyHex)._unsafeUnwrap()).toEqual(ethWallet.signerKey);
  });
});

const ed25519Signer = Factories.Ed25519Signer.build();

describe('ed25519PublicKeyToJson', () => {
  test('succeeds', () => {
    expect(ed25519PublicKeyToJson(ed25519Signer.signerKey)._unsafeUnwrap()).toEqual(ed25519Signer.signerKeyHex);
  });
});

describe('ed25519PublicKeyFromJson', () => {
  test('succeeds', () => {
    expect(ed25519PublicKeyFromJson(ed25519Signer.signerKeyHex)._unsafeUnwrap()).toEqual(ed25519Signer.signerKey);
  });
});

const tsHash = Factories.TsHash.build();
const tsHashHex = bytesToHexString(tsHash, { size: 40 })._unsafeUnwrap();

describe('tsHashToJson', () => {
  test('succeeds', () => {
    expect(tsHashToJson(tsHash)._unsafeUnwrap()).toEqual(tsHashHex);
  });
});

describe('tsHashFromJson', () => {
  test('succeeds', () => {
    expect(tsHashFromJson(tsHashHex)._unsafeUnwrap()).toEqual(tsHash);
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
