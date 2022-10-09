import { ethers } from 'ethers';
import Faker from 'faker';
import * as ed from '@noble/ed25519';
import { hashFCObject, hashCompare, generateEthereumSigner, generateEd25519Signer, convertToHex } from '~/utils/utils';
import { Ed25519Signer, EthereumSigner } from '~/types';
import { hexToBytes, utf8ToBytes } from 'ethereum-cryptography/utils';

describe('hashFCObject', () => {
  const blake2bEmptyObject =
    '0x9327a492264ecac0806b031b780241d86cabe38348fe49c4c5a610ee584cfbaaefd3fdffd1b1b54c9ee225820433a7f902c688b2e123181a56c73b9cbf9cd13f';

  const simpleObject = {
    cat: {
      name: 'Fluffy',
      age: 3,
    },
    dog: {
      name: 'Fido',
      age: 2,
    },
  };

  const blake2bSimpleObject =
    '0x664ea872832e83efb1a907a2d1d7e817cf181ff40084109c917e8199302b7d0612b278c5ff35b0c783f6f8c06b506a5c3edbae54a3f4dbc1b1218cf4a1a1c646';

  test('hashes empty object correctly', async () => {
    const hash = await hashFCObject({});

    expect(hash).toEqual(blake2bEmptyObject);
  });

  test('hashes ordered objects correctly', async () => {
    const hash = await hashFCObject(simpleObject);
    expect(hash).toEqual(blake2bSimpleObject);
  });

  test('re-orders objects before hashing them', async () => {
    const reorderedObject = {
      dog: {
        age: 2,
        name: 'Fido',
      },
      cat: {
        name: 'Fluffy',
        age: 3,
      },
    };

    const hash = await hashFCObject(reorderedObject);
    expect(hash).toEqual(blake2bSimpleObject);
  });

  test('removes underscore keys before hashing objects', async () => {
    const underscoredObject = {
      _mouse: {
        name: 'Mickey',
      },
      cat: {
        _color: 'black',
        name: 'Fluffy',
        age: 3,
      },
      dog: {
        age: 2,
        name: 'Fido',
      },
    };
    const hash = await hashFCObject(underscoredObject);
    expect(hash).toEqual(blake2bSimpleObject);
  });
});

describe('hashCompare', () => {
  test('compare strings of the same length, lower one first', async () => {
    const cmp = hashCompare('hello', 'world');
    expect(cmp).toBeLessThan(0);
  });

  test('compare strings of the same length, higher one first', async () => {
    const cmp = hashCompare('world', 'hello');
    expect(cmp).toBeGreaterThan(0);
  });

  test('compare strings of the same length, equal', async () => {
    const cmp = hashCompare('hello', 'hello');
    expect(cmp).toEqual(0);
  });

  test('compare strings first input is null', async () => {
    const cmp = hashCompare('', 'world');
    expect(cmp).toBeLessThan(0);
  });

  test('compare strings second input is null', async () => {
    const cmp = hashCompare('hello', '');
    expect(cmp).toBeGreaterThan(0);
  });

  test('compare strings first input has additional char', async () => {
    const cmp = hashCompare('helloa', 'hello');
    expect(cmp).toBeGreaterThan(0);
  });

  test('compare strings second input has additional char', async () => {
    const cmp = hashCompare('hello', 'helloa');
    expect(cmp).toBeLessThan(0);
  });

  test('compare strings second input has additional char', async () => {
    const cmp = hashCompare('a', 'A');
    expect(cmp).toBeGreaterThan(0);
  });

  test('compare strings first input is uppercase second input is lower case', async () => {
    const cmp = hashCompare('A', 'a');
    expect(cmp).toBeLessThan(0);
  });
});

describe('generateEthereumSigner', () => {
  let signer: EthereumSigner;

  beforeAll(async () => {
    signer = await generateEthereumSigner();
  });

  test('signerKey is lowercased address', async () => {
    const address = await signer.wallet.getAddress();
    expect(signer.signerKey).toEqual(address.toLowerCase());
  });

  test('lowercased address is still a valid address', () => {
    expect(ethers.utils.isAddress(signer.signerKey)).toBe(true);
  });

  test('text can be signed and verified', async () => {
    const text = Faker.lorem.sentence(2);
    const signature = await signer.wallet.signMessage(text);
    const recoveredAddress = await ethers.utils.verifyMessage(text, signature);
    expect(recoveredAddress.toLowerCase()).toEqual(signer.signerKey);
  });

  test('hex can be signed and verified', async () => {
    const hex = Faker.datatype.hexaDecimal(40);
    const signature = await signer.wallet.signMessage(hex);
    const recoveredAddress = await ethers.utils.verifyMessage(hex, signature);
    expect(recoveredAddress.toLowerCase()).toEqual(signer.signerKey);
  });
});

describe('generateEd25519Signer', () => {
  let signer: Ed25519Signer;
  let pubKey: string;

  beforeAll(async () => {
    signer = await generateEd25519Signer();
    pubKey = await convertToHex(await ed.getPublicKey(signer.privateKey));
  });

  test('signerKey is public key', () => {
    expect(signer.signerKey).toEqual(pubKey);
  });

  test('text can be signed and verified', async () => {
    const text = Faker.lorem.sentence(2);
    const signature = await ed.sign(utf8ToBytes(text), signer.privateKey);
    const isValid = await ed.verify(signature, utf8ToBytes(text), hexToBytes(signer.signerKey));
    expect(isValid).toBe(true);
  });

  test('hex can be signed and verified', async () => {
    const hex = Faker.datatype.hexaDecimal(40);
    const signature = await ed.sign(hexToBytes(hex), signer.privateKey);
    const isValid = await ed.verify(signature, hexToBytes(hex), hexToBytes(signer.signerKey));
    expect(isValid).toBe(true);
  });
});
