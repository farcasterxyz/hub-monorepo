import { faker } from '@faker-js/faker';
import * as ed from '@noble/ed25519';
import { hexToBytes, utf8ToBytes } from 'ethereum-cryptography/utils';
import { ethers, utils } from 'ethers';
import { Ed25519Signer, EthereumSigner } from '~/flatbuffers/models/types';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils/crypto';

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
    const text = faker.lorem.sentence(2);
    const signature = await signer.wallet.signMessage(text);
    const recoveredAddress = await ethers.utils.verifyMessage(text, signature);
    expect(recoveredAddress.toLowerCase()).toEqual(signer.signerKey);
  });

  test('hex can be signed and verified', async () => {
    const hex = faker.datatype.hexadecimal({ length: 40 });
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
    pubKey = await utils.hexlify(await ed.getPublicKey(signer.privateKey));
  });

  test('signerKey is public key', () => {
    expect(signer.signerKey).toEqual(pubKey);
  });

  test('text can be signed and verified', async () => {
    const text = faker.lorem.sentence(2);
    const signature = await ed.sign(utf8ToBytes(text), signer.privateKey);
    const isValid = await ed.verify(signature, utf8ToBytes(text), hexToBytes(signer.signerKey));
    expect(isValid).toBe(true);
  });

  test('hex can be signed and verified', async () => {
    const hex = faker.datatype.hexadecimal({ length: 40 });
    const signature = await ed.sign(hexToBytes(hex), signer.privateKey);
    const isValid = await ed.verify(signature, hexToBytes(hex), hexToBytes(signer.signerKey));
    expect(isValid).toBe(true);
  });
});
