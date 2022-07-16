/* eslint-disable no-restricted-imports */
import SignerSet, { SignerAddition, SignatureAlgorithm, HashAlgorithm, SignerRemove } from './signerSet';
import { blake2b } from 'ethereum-cryptography/blake2b';
import { randomBytes } from 'crypto';
import secp256k1 from 'secp256k1';

const FarcasterSchemaUrl = 'farcaster.xyz/schemas/v1/signer-authorize';

describe('create signer set', () => {
  const signerSet = new SignerSet();

  test('happy path', async () => {
    // generate custodyAddressPubkey
    const rootKey = newSecp256k1Key();
    const signerRootPubkey = secp256k1.publicKeyCreate(rootKey);
    const signerRootEncodedPubkey = Buffer.from(signerRootPubkey.toString()).toString('base64');

    expect(signerSet.addSigner(signerRootEncodedPubkey)).toEqual(true);
    expect(signerSet.numSigners()).toEqual(1);

    // generate custodyAddressPubkey
    const rootKey2 = newSecp256k1Key();
    const signerRootPubkey2 = secp256k1.publicKeyCreate(rootKey2);
    const signerRootEncodedPubkey2 = Buffer.from(signerRootPubkey2.toString()).toString('base64');

    expect(signerSet.addSigner(signerRootEncodedPubkey2)).toEqual(true);
    expect(signerSet.numSigners()).toEqual(2);
  });

  test('fails when same root is tried to be added twice', async () => {
    // generate custodyAddressPubkey
    const rootKey = newSecp256k1Key();
    const signerRootPubkey = secp256k1.publicKeyCreate(rootKey);
    const signerRootEncodedPubkey = Buffer.from(signerRootPubkey.toString()).toString('base64');

    expect(signerSet.addSigner(signerRootEncodedPubkey)).toEqual(true);
    expect(signerSet.numSigners()).toEqual(1);

    expect(signerSet.addSigner(signerRootEncodedPubkey)).toEqual(false);
    expect(signerSet.numSigners()).toEqual(1);
  });
});

describe('add delegate', () => {
  const signerSet = new SignerSet();

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
  const rootKeySig = secp256k1.ecdsaSign(hash, rootKey);
  const childKeySig = secp256k1.ecdsaSign(hash, childKey);

  test('happy path', async () => {
    const signerAddition = <SignerAddition>{
      message: {
        body: {
          parentKey: signerRootEncodedPubkey,
          childKey: childEncodedPubkey,
          schema: FarcasterSchemaUrl,
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
  });

  test('fails when claimed parent does not exist', async () => {
    const signerAddition = <SignerAddition>{
      message: {
        body: {
          parentKey: 'foobar',
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
        parentSignerPubkey: 'foobar',
        childSignature: base64EncodeUInt8Arr(childKeySig.signature),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey,
      },
    };

    const addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked).toEqual(false);
  });

  test('fails when child is in removed nodes', async () => {
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

    let addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked).toEqual(true);

    const signerRemove = <SignerRemove>{
      message: {
        body: {
          childKey: childEncodedPubkey,
          schema: 'farcaster.xyz/schemas/v1/signer-authorize',
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(childKeySig.signature),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: signerRootEncodedPubkey,
      },
    };

    const removeWorked = signerSet.removeDelegate(signerRemove);
    expect(removeWorked).toEqual(true);

    // This will fail since delegate has been revoked
    addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked).toEqual(false);
  });

  test('fails when child is an existing node', async () => {
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

    let addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked).toEqual(true);

    addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked).toEqual(false);
  });
});

describe('remove delegate', () => {
  const signerSet = new SignerSet();

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
  const rootKeySig = secp256k1.ecdsaSign(hash, rootKey);
  const childKeySig = secp256k1.ecdsaSign(hash, childKey);
  test('fails because claimed parent is not actual parent of child', async () => {
    // Add Delegate to root
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

    // Add Delegate 1_1 to Delegate 1

    const childKey1_1 = newSecp256k1Key();
    const childPubkey1_1 = secp256k1.publicKeyCreate(childKey1_1);
    const childEncodedPubkey1_1 = Buffer.from(childPubkey1_1.toString()).toString('base64');
    const childKey1_1Sig = secp256k1.ecdsaSign(hash, childKey1_1);

    const signerAddition2_1 = <SignerAddition>{
      message: {
        body: {
          parentKey: childEncodedPubkey,
          childKey: childEncodedPubkey1_1,
          schema: 'farcaster.xyz/schemas/v1/signer-authorize',
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(childKeySig.signature),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: childEncodedPubkey,
        childSignature: base64EncodeUInt8Arr(childKey1_1Sig.signature),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey1_1,
      },
    };

    const addWorked2_1 = signerSet.addDelegate(signerAddition2_1);
    expect(addWorked2_1).toEqual(true);

    // Remove delegate 2_1 fail

    const signerRemove2_1 = <SignerRemove>{
      message: {
        body: {
          childKey: childEncodedPubkey1_1,
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
      },
    };

    const removeWorked = signerSet.removeDelegate(signerRemove2_1);
    expect(removeWorked).toEqual(false);
  });

  test('fails because delegate has been revoked', async () => {
    // Add Delegate to root
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

    // Remove delegate
    const signerRemove = <SignerRemove>{
      message: {
        body: {
          childKey: childEncodedPubkey,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(childKeySig.signature),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: signerRootEncodedPubkey,
      },
    };

    let removeWorked = signerSet.removeDelegate(signerRemove);
    expect(removeWorked).toEqual(true);

    // Fails since Delegate has already been revoked
    removeWorked = signerSet.removeDelegate(signerRemove);
    expect(removeWorked).toEqual(false);
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
