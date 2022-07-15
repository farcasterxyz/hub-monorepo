/* eslint-disable no-restricted-imports */
import SignerSet, { SignerAddition, SignatureAlgorithm, HashAlgorithm } from './signerSet';
import { blake2b } from 'ethereum-cryptography/blake2b';
import { randomBytes } from 'crypto';
import secp256k1 from 'secp256k1';

const signerSet = new SignerSet();

describe('create signer set', () => {
  test('happy path', async () => {
    // generate custodyAddressPubkey
    const rootKey = newSecp256k1Key();
    const signerRootPubkey = secp256k1.publicKeyCreate(rootKey);
    const signerRootEncodedPubkey = Buffer.from(signerRootPubkey.toString()).toString('base64');

    signerSet.addSigner(signerRootEncodedPubkey);
    expect(signerSet.numSigners()).toEqual(1);

    const childKey = newSecp256k1Key();
    const childPubkey = secp256k1.publicKeyCreate(childKey);
    const childEncodedPubkey = Buffer.from(childPubkey.toString()).toString('base64');

    const hash = blake2b(randomBytes(32), 32);
    // sign with rootPubkey aka parentSignature
    const rootKeySig = secp256k1.ecdsaSign(hash, rootKey);
    // sign with childPubkey aka childSignature
    const childKeySig = secp256k1.ecdsaSign(hash, childKey);

    const signerAddition = <SignerAddition>{
      message: {
        body: {
          parentKey: signerRootEncodedPubkey,
          childKey: childEncodedPubkey,
          schema: 'farcaster.xyz/schemas/v1/signer-authorize',
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(rootKeySig.signature),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: signerRootEncodedPubkey,
        childSignature: base64EncodeUInt8Arr(childKeySig.signature),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey,
      },
    };

    const addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked).toEqual(true);

    // const removeWorked = signerSet.removeDelegate(childEncodedPubkey);
  });
});

describe('add delegate', () => {
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

function newSecp256k1Key() {
  let privKey;
  do {
    privKey = randomBytes(32);
  } while (!secp256k1.privateKeyVerify(privKey));
  return privKey;
}

function base64EncodeUInt8Arr(arr: Uint8Array) {
  return Buffer.from(arr).toString('base64');
}
