import { faker } from '@faker-js/faker';
import {
  bytesToHexString,
  bytesToUtf8String,
  Factories,
  hexStringToBytes,
  HubResult,
  utf8StringToBytes,
} from '@farcaster/utils';
import { ok } from 'neverthrow';
import { makeCastAdd } from './builders';
import * as types from './types';
import * as utils from './utils';

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
  const signature = bytesToHexString(signatureBytes)._unsafeUnwrap();

  test(`succeeds`, () => {
    expect(utils.serializeEip712Signature(signature)).toEqual(ok(signatureBytes));
  });
});

describe('deserializeEip712Signature', () => {
  const signatureBytes = Factories.Eip712Signature.build();
  const signature = bytesToHexString(signatureBytes)._unsafeUnwrap();

  test(`succeeds`, () => {
    expect(utils.deserializeEip712Signature(signatureBytes)).toEqual(ok(signature));
  });
});

describe('deserializeEd25519Signature', () => {
  const signatureBytes = Factories.Ed25519Signature.build();
  const signature = bytesToHexString(signatureBytes)._unsafeUnwrap();

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

describe('deserializeCastId', () => {
  test('succeeds', () => {
    const castId = Factories.CastId.build();
    const deserialized = utils.deserializeCastId(castId)._unsafeUnwrap();
    expect(hexStringToBytes(deserialized.hash)).toEqual(ok(castId.hash));
  });
});

describe('serializeCastId', () => {
  test('succeeds', () => {
    const hashHex = Factories.MessageHashHex.build();
    const serialized = utils.serializeCastId({ fid: Factories.Fid.build(), hash: hashHex })._unsafeUnwrap();
    expect(hexStringToBytes(hashHex)).toEqual(ok(serialized.hash));
  });
});

describe('CastAddBody', () => {
  test('suceeds when deserialized and serialized', () => {
    const body = Factories.CastAddBody.build();
    const deserialized = utils.deserializeCastAddBody(body);
    expect(deserialized.isOk()).toBeTruthy();
    const serialized = utils.serializeCastAddBody(deserialized._unsafeUnwrap());
    expect(serialized).toEqual(ok(body));
  });
});

describe('CastRemoveBody', () => {
  test('suceeds when deserialized and serialized', () => {
    const body = Factories.CastRemoveBody.build();
    const deserialized = utils.deserializeCastRemoveBody(body);
    expect(deserialized.isOk()).toBeTruthy();
    const serialized = utils.serializeCastRemoveBody(deserialized._unsafeUnwrap());
    expect(serialized).toEqual(ok(body));
  });
});

describe('VerificationAddEthAddressBody', () => {
  test('suceeds when deserialized and serialized', async () => {
    const body = await Factories.VerificationAddEthAddressBody.create();
    const deserialized = utils.deserializeVerificationAddEthAddressBody(body);
    expect(deserialized.isOk()).toBeTruthy();
    const serialized = utils.serializeVerificationAddEthAddressBody(deserialized._unsafeUnwrap());
    expect(serialized).toEqual(ok(body));
  });
});

describe('VerificationRemoveBody', () => {
  test('suceeds when deserialized and serialized', () => {
    const body = Factories.VerificationRemoveBody.build();
    const deserialized = utils.deserializeVerificationRemoveBody(body);
    expect(deserialized.isOk()).toBeTruthy();
    const serialized = utils.serializeVerificationRemoveBody(deserialized._unsafeUnwrap());
    expect(serialized).toEqual(ok(body));
  });
});

describe('SignerBody', () => {
  test('suceeds when deserialized and serialized', () => {
    const body = Factories.SignerBody.build();
    const deserialized = utils.deserializeSignerBody(body);
    expect(deserialized.isOk()).toBeTruthy();
    const serialized = utils.serializeSignerBody(deserialized._unsafeUnwrap());
    expect(serialized).toEqual(ok(body));
  });
});

describe('UserDataBody', () => {
  test('suceeds when deserialized and serialized', () => {
    const body = Factories.UserDataBody.build();
    const deserialized = utils.deserializeUserDataBody(body);
    expect(deserialized.isOk()).toBeTruthy();
    const serialized = utils.serializeUserDataBody(deserialized._unsafeUnwrap());
    expect(serialized).toEqual(ok(body));
  });
});

describe('ReactionBody', () => {
  test('suceeds when deserialized and serialized', () => {
    const body = Factories.ReactionBody.build();
    const deserialized = utils.deserializeReactionBody(body);
    expect(deserialized.isOk()).toBeTruthy();
    const serialized = utils.serializeReactionBody(deserialized._unsafeUnwrap());
    expect(serialized).toEqual(ok(body));
  });
});

describe('Message', () => {
  test('suceeds when deserialized and serialized via builder', async () => {
    const signer = Factories.Ed25519Signer.build();
    const message = await Factories.CastAddMessage.create({}, { transient: { signer } });
    const deserialized = utils.deserializeMessage(message) as HubResult<types.CastAddMessage>;
    expect(deserialized.isOk()).toBeTruthy();
    const serialized = await makeCastAdd(
      deserialized._unsafeUnwrap().data.body,
      deserialized._unsafeUnwrap().data,
      signer
    );
    expect(serialized._unsafeUnwrap()._protobuf).toEqual(message);
  });
});

describe('NameRegistryEvent', () => {
  test('suceeds when deserialized', () => {
    const event = Factories.NameRegistryEvent.build();
    const deserialized = utils.deserializeNameRegistryEvent(event);
    expect(deserialized.isOk()).toBeTruthy();
  });

  test('succeeds when expiry is missing', () => {
    const event = Factories.NameRegistryEvent.build({ expiry: undefined });
    const deserialized = utils.deserializeNameRegistryEvent(event);
    expect(deserialized.isOk()).toBeTruthy();
    expect(deserialized._unsafeUnwrap().expiry).toEqual(undefined);
  });
});

describe('IdRegistryEvent', () => {
  test('suceeds when deserialized', () => {
    const event = Factories.IdRegistryEvent.build();
    const deserialized = utils.deserializeIdRegistryEvent(event);
    expect(deserialized.isOk()).toBeTruthy();
  });
});
