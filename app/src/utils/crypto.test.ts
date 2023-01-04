import { faker } from '@faker-js/faker';
import * as ed from '@noble/ed25519';
import { ethers } from 'ethers';
import { bytesToHexString, hexStringToBytes, utf8StringToBytes } from '~/flatbuffers/utils/bytes';
import { Ed25519Signer, EthereumSigner, generateEd25519Signer, generateEthereumSigner } from '~/utils/crypto';

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
    pubKey = bytesToHexString(await ed.getPublicKey(signer.privateKey))._unsafeUnwrap();
  });

  test('signerKey is public key', () => {
    expect(signer.signerKey).toEqual(pubKey);
  });

  test('text can be signed and verified', async () => {
    const text = faker.lorem.sentence(2);
    const signature = await ed.sign(utf8StringToBytes(text)._unsafeUnwrap(), signer.privateKey);
    const isValid = await ed.verify(
      signature,
      utf8StringToBytes(text)._unsafeUnwrap(),
      hexStringToBytes(signer.signerKey)._unsafeUnwrap()
    );
    expect(isValid).toBe(true);
  });

  test('hex can be signed and verified', async () => {
    const hex = faker.datatype.hexadecimal({ length: 40 });
    const signature = await ed.sign(hexStringToBytes(hex)._unsafeUnwrap(), signer.privateKey);
    const isValid = await ed.verify(
      signature,
      hexStringToBytes(hex)._unsafeUnwrap(),
      hexStringToBytes(signer.signerKey)._unsafeUnwrap()
    );
    expect(isValid).toBe(true);
  });
});
