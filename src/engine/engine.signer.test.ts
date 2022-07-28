import Engine, { Signer } from '~/engine';
import Faker from 'faker';
import { Factories } from '~/factories';
import {
  CastShortBody,
  Data,
  KeyPair,
  Root,
  SignatureAlgorithm,
  SignerAdd,
  SignerAddFactoryTransientParams,
  SignerMessage,
  SignerRemove,
} from '~/types';
import { blake2BHash, convertToHex, generateEd25519KeyPair, hashFCObject } from '~/utils';
import { hexToBytes } from 'ethereum-cryptography/utils';
import * as secp256k1 from 'ethereum-cryptography/secp256k1';
import { isSignerAdd } from '~/types/typeguards';

const engine = new Engine();

describe('addSignerChange', () => {
  // Change @charlie's signer at block 100.
  const signerChange: Signer = {
    address: Faker.datatype.hexaDecimal(40).toLowerCase(),
    blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
    blockNumber: 100,
    logIndex: 12,
  };

  // Change charlie's signer at block 200.
  const signerChange200 = JSON.parse(JSON.stringify(signerChange)) as Signer;
  signerChange200.blockHash = Faker.datatype.hexaDecimal(64).toLowerCase();
  signerChange200.blockNumber = signerChange.blockNumber + 100;

  // Change charlie's signer at block 50.
  const signerChange50A = JSON.parse(JSON.stringify(signerChange)) as Signer;
  signerChange50A.blockHash = Faker.datatype.hexaDecimal(64).toLowerCase();
  signerChange50A.blockNumber = signerChange.blockNumber - 10;

  // Change charlie's signer at block 50, at a higher index.
  const signerChange50B = JSON.parse(JSON.stringify(signerChange50A)) as Signer;
  signerChange50B.logIndex = signerChange.logIndex + 1;

  const duplicateSignerChange50B = JSON.parse(JSON.stringify(signerChange50B)) as Signer;

  const username = 'charlie';
  const subject = () => engine.getSigners(username);

  test('signer changes are added correctly', async () => {
    const result = engine.addSignerChange(username, signerChange);
    expect(result.isOk()).toBe(true);
    expect(subject()).toEqual([signerChange]);
  });

  test('signer changes from later blocks are added after current blocks', async () => {
    const result = engine.addSignerChange(username, signerChange200);
    expect(result.isOk()).toBe(true);
    expect(subject()).toEqual([signerChange, signerChange200]);
  });

  test('signer changes from earlier blocks are before current blocks', async () => {
    const result = engine.addSignerChange(username, signerChange50A);
    expect(result.isOk()).toBe(true);
    expect(subject()).toEqual([signerChange50A, signerChange, signerChange200]);
  });

  test('signer changes in the same block are ordered by index', async () => {
    const result = engine.addSignerChange(username, signerChange50B);
    expect(result.isOk()).toBe(true);
    expect(subject()).toEqual([signerChange50A, signerChange50B, signerChange, signerChange200]);
  });

  test('adding a duplicate signer change fails', async () => {
    const result = engine.addSignerChange(username, duplicateSignerChange50B);
    expect(result.isOk()).toBe(false);
    expect(result._unsafeUnwrapErr()).toBe(
      `addSignerChange: duplicate signer change ${signerChange50B.blockHash}:${signerChange50B.logIndex}`
    );
    expect(subject()).toEqual([signerChange50A, signerChange50B, signerChange, signerChange200]);
  });
});

describe('mergeSignerMessage', () => {
  let aliceKeyPair: KeyPair;
  let alicePrivateKey: string;
  let alicePubKey: string;
  let aliceCustody: string;
  let aliceRoot: Root;
  let aliceSignerChange: Signer;
  let aliceTransientParams: { privateKey: Uint8Array };
  let genericMessageData: { rootBlock: number; username: string; signedAt: number };
  let aKeyPair: KeyPair;
  let aPubKey: string;
  let aliceSignerAddA: SignerAdd;
  let aliceSignerRemoveA: SignerRemove;

  // Generate key pair for alice and root message
  beforeAll(async () => {
    aliceKeyPair = await generateEd25519KeyPair();
    alicePrivateKey = await convertToHex(aliceKeyPair.privateKey);
    alicePubKey = await convertToHex(aliceKeyPair.publicKey);
    aliceTransientParams = { privateKey: aliceKeyPair.privateKey };
    aliceRoot = await Factories.Root.create(
      { data: { rootBlock: 100, username: 'alice' } },
      { transient: aliceTransientParams }
    );
    aliceSignerChange = {
      blockNumber: 99,
      blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
      logIndex: 0,
      address: alicePubKey,
    };
    genericMessageData = {
      rootBlock: aliceRoot.data.rootBlock,
      username: 'alice',
      signedAt: aliceRoot.data.signedAt + 1,
    };
    aKeyPair = await generateEd25519KeyPair();
    aPubKey = await convertToHex(aKeyPair.publicKey);
    aliceSignerAddA = await Factories.SignerAdd.create(
      { data: genericMessageData },
      { transient: { ...aliceTransientParams, childPrivateKey: aKeyPair.privateKey } }
    );
    aliceSignerRemoveA = await Factories.SignerRemove.create(
      { data: { ...genericMessageData, body: { childKey: aPubKey } } },
      { transient: aliceTransientParams }
    );
  });

  // Every test should start with a valid signer and root for alice
  beforeEach(() => {
    engine._reset();
    engine.addSignerChange('alice', aliceSignerChange);
    engine.mergeRoot(aliceRoot);
  });

  test('fails without a custody public key', async () => {
    expect(engine._getCustodySigners('alice')).toEqual([]);
    const res = await engine.mergeSignerMessage(aliceSignerAddA);
    expect(res.isOk()).toBe(false);
    expect(engine._getSigners('alice')).toEqual([]);
  });

  describe('with a custody public key', () => {
    beforeEach(() => {
      engine.addCustody('alice', alicePubKey);
    });

    test('fails with invalid message type', async () => {
      const cast = (await Factories.Cast.create(
        { data: genericMessageData },
        { transient: aliceTransientParams }
      )) as unknown as SignerMessage;
      expect((await engine.mergeSignerMessage(cast)).isOk()).toBe(false);
    });

    test('succeeds with a valid SignerAdd', async () => {
      const res = await engine.mergeSignerMessage(aliceSignerAddA);
      expect(res.isOk()).toBe(true);
      expect(engine._getSigners('alice')).toEqual([aPubKey]);
    });

    test('fails with malformed childSignature', async () => {
      const badSignerAdd = await Factories.SignerAdd.create(
        { data: { ...genericMessageData, body: { childSignature: 'foo' } } },
        { transient: aliceTransientParams }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateSignerAdd: invalid childSignature');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails when childSignature and childKey do not match', async () => {
      const childKeyPair = await generateEd25519KeyPair();
      const childPubKey = await convertToHex(childKeyPair.publicKey);
      const badSignerAdd = await Factories.SignerAdd.create(
        { data: { ...genericMessageData, body: { childKey: childPubKey } } },
        { transient: aliceTransientParams }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateSignerAdd: childSignature does not match childKey');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails with invalid edgeHash', async () => {
      const badEdgeHash = await blake2BHash('bar');
      const badSignerAdd = await Factories.SignerAdd.create(
        { data: { ...genericMessageData, body: { edgeHash: badEdgeHash } } },
        { transient: aliceTransientParams }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateSignerAdd: invalid edgeHash');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails with invalid childSignatureType', async () => {
      const badSignerAdd = await Factories.SignerAdd.create(
        {
          data: { ...genericMessageData, body: { childSignatureType: 'bar' as unknown as SignatureAlgorithm.Ed25519 } },
        },
        { transient: aliceTransientParams }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: unknown message');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails with invalid hash', async () => {
      const signerAddClone = { ...aliceSignerAddA };
      signerAddClone.hash = await hashFCObject({ foo: 'bar' });
      const res = await engine.mergeSignerMessage(signerAddClone);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails with invalid signature', async () => {
      const signerAddClone = { ...aliceSignerAddA };
      signerAddClone.signature =
        '0x5b699d494b515b22258c01ad19710d44c3f12235f0c01e91d09a1e4e2cd25d80c77026a7319906da3b8ce62abc18477c19e444a02949a0dde54f8cadef889502';
      const res = await engine.mergeSignerMessage(signerAddClone);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid signature');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails if signedAt is > current time + safety margin', async () => {
      const badSignerAdd = await Factories.SignerAdd.create(
        {
          data: { ...genericMessageData, signedAt: Date.now() + 11 * 60 * 1000 },
        },
        { transient: aliceTransientParams }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: signedAt more than 10 mins in the future');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails if there is no root', async () => {
      engine._resetRoots();
      const res = await engine.mergeSignerMessage(aliceSignerAddA);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: no root present');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('succeeds with a valid SignerRemove', async () => {
      expect((await engine.mergeSignerMessage(aliceSignerAddA)).isOk()).toBe(true);
      expect(engine._getSigners('alice')).toEqual([aPubKey]);
      const res = await engine.mergeSignerMessage(aliceSignerRemoveA);
      expect(res.isOk()).toBe(true);
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails with a valid SignerRemove when relevant SignerAdd has not been merged', async () => {
      const res = await engine.mergeSignerMessage(aliceSignerRemoveA);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('SignerSet.remove: edge does not exist');
      expect(engine._getSigners('alice')).toEqual([]);
    });
  });
});
