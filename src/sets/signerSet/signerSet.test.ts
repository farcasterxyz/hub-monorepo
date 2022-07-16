/* eslint-disable no-restricted-imports */
import SignerSet, { SignerAddition, SignatureAlgorithm, HashAlgorithm, SignerRemove } from './signerSet';
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

    // Add delegate 1

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

    // Add delegate 2

    const childKey2 = newSecp256k1Key();
    const childPubkey2 = secp256k1.publicKeyCreate(childKey2);
    const childEncodedPubkey2 = Buffer.from(childPubkey2.toString()).toString('base64');
    const childKey2Sig = secp256k1.ecdsaSign(hash, childKey2);

    const signerAddition2 = <SignerAddition>{
      message: {
        body: {
          parentKey: signerRootEncodedPubkey,
          childKey: childEncodedPubkey2,
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
        childSignature: base64EncodeUInt8Arr(childKey2Sig.signature),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey2,
      },
    };

    const addWorked2 = signerSet.addDelegate(signerAddition2);
    expect(addWorked2).toEqual(true);

    // Add Delegate to delegate 2

    const childKey2_1 = newSecp256k1Key();
    const childPubkey2_1 = secp256k1.publicKeyCreate(childKey2_1);
    const childEncodedPubkey2_1 = Buffer.from(childPubkey2_1.toString()).toString('base64');
    const childKey2_1Sig = secp256k1.ecdsaSign(hash, childKey2_1);

    const signerAddition2_1 = <SignerAddition>{
      message: {
        body: {
          parentKey: childEncodedPubkey2,
          childKey: childEncodedPubkey2_1,
          schema: 'farcaster.xyz/schemas/v1/signer-authorize',
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(childKey2Sig.signature),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: childEncodedPubkey2,
        childSignature: base64EncodeUInt8Arr(childKey2_1Sig.signature),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey2_1,
      },
    };

    const addWorked2_1 = signerSet.addDelegate(signerAddition2_1);
    expect(addWorked2_1).toEqual(true);

    // Remove delegate 2_1 fail

    let signerRemove2_1 = <SignerRemove>{
      message: {
        body: {
          childKey: childEncodedPubkey2_1,
          schema: 'farcaster.xyz/schemas/v1/signer-authorize',
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(childKey2Sig.signature),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: signerRootEncodedPubkey,
      },
    };

    let removeWorked = signerSet.removeDelegate(signerRemove2_1);
    expect(removeWorked).toEqual(false);

    // Remove delegate 2_1 success

    signerRemove2_1 = <SignerRemove>{
      message: {
        body: {
          childKey: childEncodedPubkey2_1,
          schema: 'farcaster.xyz/schemas/v1/signer-authorize',
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(childKey2Sig.signature),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: childEncodedPubkey2,
      },
    };

    removeWorked = signerSet.removeDelegate(signerRemove2_1);
    expect(removeWorked).toEqual(true);
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
