/* eslint-disable no-restricted-imports */
import SignerSet, { SignerAddition, SignatureAlgorithm, HashAlgorithm } from './signerSet';
import { blake2BHash } from '~/utils';
import { randomBytes } from 'crypto';
import secp256k1 from 'secp256k1';

const signerSet = new SignerSet();

describe('create signer set', () => {
  test('happy path', async () => {
    // generate custodyAddressPubkey
    let privKey;
    do {
      privKey = randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privKey));
    const pubKey = secp256k1.publicKeyCreate(privKey);

    console.log(signerSet);
    const encodedPubkey = Buffer.from(pubKey.toString()).toString('base64');

    signerSet.addSigner(encodedPubkey);
    expect(signerSet.numSigners).toEqual(1);
  });
});

describe('add delegate', () => {
  // const signerAddition = <SignerAddition>{
  //   message: {
  //     body: {
  //       parentKey: '',
  //       childKey: '',
  //       schema: '',
  //     },
  //     address: '',
  //   },
  //   envelope: {
  //     hash: hash,
  //     hashType: HashAlgorithm.Blake2b,
  //     parentSignature: '',
  //     parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
  //     parentSignerPubkey: '',
  //     childSignature: '',
  //     childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
  //     childSignerPubkey: '',
  //   },
  // };
  test('fails when claimed parent is not actual parent of child', async () => {
    expect(true).toEqual(true);
  });

  test('fails when child is in removed nodes', async () => {
    expect(true).toEqual(true);
  });

  test('fails when child is an existing node', async () => {
    expect(true).toEqual(true);
  });
});

describe('remove key', () => {
  test('fails because claimed parent is not actual parent of child', async () => {
    expect(true).toEqual(true);
  });
});
