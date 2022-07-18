/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-restricted-imports */
import SignerSet, { SignerAdd, SignatureAlgorithm, HashAlgorithm, SignerRemove } from './signerSet';
import { blake2b } from 'ethereum-cryptography/blake2b';
import { randomBytes } from 'crypto';
const secp = require('ethereum-cryptography/secp256k1');

const FarcasterSchemaUrl = 'farcaster.xyz/schemas/v1/signer-authorize';

describe('create signer set', () => {
  test('successfully creates a signer set', async () => {
    const signerSet = new SignerSet();
    const custodySigner = newSecp256k1Key();
    const custodySignerPubkey = secp.getPublicKey(custodySigner);
    const custodySignerEncodedPubkey = Buffer.from(custodySignerPubkey.toString()).toString('base64');

    expect(signerSet.addCustody(custodySignerEncodedPubkey).isOk()).toEqual(true);
    expect(signerSet._numSigners()).toEqual(1);

    const custodySigner2 = newSecp256k1Key();
    const custodySignerPubkey2 = secp.getPublicKey(custodySigner2);
    const custodySignerEncodedPubkey2 = Buffer.from(custodySignerPubkey2.toString()).toString('base64');

    expect(signerSet.addCustody(custodySignerEncodedPubkey2).isOk()).toEqual(true);
    expect(signerSet._numSigners()).toEqual(2);
  });

  test('successfully idempotent when same root is tried to be added twice', async () => {
    const signerSet = new SignerSet();
    const custodySigner = newSecp256k1Key();
    const custodySignerPubkey = secp.getPublicKey(custodySigner);
    const custodySignerEncodedPubkey = Buffer.from(custodySignerPubkey.toString()).toString('base64');

    expect(signerSet.addCustody(custodySignerEncodedPubkey).isOk()).toEqual(true);
    expect(signerSet._numSigners()).toEqual(1);

    expect(signerSet.addCustody(custodySignerEncodedPubkey).isOk()).toEqual(true);
    expect(signerSet._numSigners()).toEqual(1);
  });
});

describe('add delegate', () => {
  test('successfully adds a delegate to a signer set', async () => {
    const signerSet = new SignerSet();

    const custodySigner = newSecp256k1Key();
    const custodySignerPubkey = secp.getPublicKey(custodySigner);
    const custodySignerEncodedPubkey = Buffer.from(custodySignerPubkey.toString()).toString('base64');

    signerSet.addCustody(custodySignerEncodedPubkey);
    expect(signerSet._numSigners()).toEqual(1);

    const childKey = newSecp256k1Key();
    const childPubkey = secp.getPublicKey(childKey);
    const childEncodedPubkey = Buffer.from(childPubkey.toString()).toString('base64');

    const hash = blake2b(randomBytes(32), 32);
    const custodySignerSig = secp.signSync(hash, custodySigner);
    const childKeySig = secp.signSync(hash, childKey);

    const signerAddition = <SignerAdd>{
      message: {
        body: {
          parentKey: custodySignerEncodedPubkey,
          childKey: childEncodedPubkey,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(custodySignerSig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey,
        childSignature: base64EncodeUInt8Arr(childKeySig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey,
      },
    };

    const addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked.isOk()).toEqual(true);
  });

  test('fails when delegate already exists with a higher edge hash with parent', async () => {
    const signerSet = new SignerSet();

    const custodySigner = newSecp256k1Key();
    const custodySignerPubkey = secp.getPublicKey(custodySigner);
    const custodySignerEncodedPubkey = Buffer.from(custodySignerPubkey.toString()).toString('base64');

    signerSet.addCustody(custodySignerEncodedPubkey);
    expect(signerSet._numSigners()).toEqual(1);

    const childKey = newSecp256k1Key();
    const childPubkey = secp.getPublicKey(childKey);
    const childEncodedPubkey = Buffer.from(childPubkey.toString()).toString('base64');

    const hashBytes = randomBytes(32);
    const hash = blake2b(hashBytes, 32);

    hashBytes[0] += 1;
    const higherHash = blake2b(hashBytes);

    const custodySignerSig = secp.signSync(hash, custodySigner);
    const childKeySig = secp.signSync(hash, childKey);

    const custodySigner2 = newSecp256k1Key();
    const custodySignerPubkey2 = secp.getPublicKey(custodySigner2);
    const custodySignerEncodedPubkey2 = Buffer.from(custodySignerPubkey2.toString()).toString('base64');
    const custodySignerSig2 = secp.signSync(hash, custodySigner2);

    expect(signerSet.addCustody(custodySignerEncodedPubkey2).isOk()).toBe(true);
    expect(signerSet._numSigners()).toEqual(2);

    let signerAddition = <SignerAdd>{
      message: {
        body: {
          parentKey: custodySignerEncodedPubkey,
          childKey: childEncodedPubkey,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(higherHash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(custodySignerSig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey,
        childSignature: base64EncodeUInt8Arr(childKeySig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey,
      },
    };

    let addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked.isOk()).toEqual(true);

    signerAddition = <SignerAdd>{
      message: {
        body: {
          // parent is a root to a different Signer
          parentKey: custodySignerEncodedPubkey2,
          childKey: childEncodedPubkey,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(custodySignerSig2),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey2,
        childSignature: base64EncodeUInt8Arr(childKeySig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey,
      },
    };

    addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked.isOk()).toEqual(false);
  });

  test('fails when claimed parent does not exist', async () => {
    const signerSet = new SignerSet();

    const custodySigner = newSecp256k1Key();
    const custodySignerPubkey = secp.getPublicKey(custodySigner);
    const custodySignerEncodedPubkey = Buffer.from(custodySignerPubkey.toString()).toString('base64');

    signerSet.addCustody(custodySignerEncodedPubkey);
    expect(signerSet._numSigners()).toEqual(1);

    const childKey = newSecp256k1Key();
    const childPubkey = secp.getPublicKey(childKey);
    const childEncodedPubkey = Buffer.from(childPubkey.toString()).toString('base64');

    const hash = blake2b(randomBytes(32), 32);
    const custodySignerSig = secp.signSync(hash, custodySigner);
    const childKeySig = secp.signSync(hash, childKey);

    const signerAddition = <SignerAdd>{
      message: {
        body: {
          parentKey: 'foobar',
          childKey: childEncodedPubkey,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(custodySignerSig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: 'foobar',
        childSignature: base64EncodeUInt8Arr(childKeySig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey,
      },
    };

    const addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked.isOk()).toEqual(false);
  });

  test('fails when child is in removed nodes', async () => {
    const signerSet = new SignerSet();

    const custodySigner = newSecp256k1Key();
    const custodySignerPubkey = secp.getPublicKey(custodySigner);
    const custodySignerEncodedPubkey = Buffer.from(custodySignerPubkey.toString()).toString('base64');

    signerSet.addCustody(custodySignerEncodedPubkey);
    expect(signerSet._numSigners()).toEqual(1);

    const childKey = newSecp256k1Key();
    const childPubkey = secp.getPublicKey(childKey);
    const childEncodedPubkey = Buffer.from(childPubkey.toString()).toString('base64');

    const hash = blake2b(randomBytes(32), 32);
    const custodySignerSig = secp.signSync(hash, custodySigner);
    const childKeySig = secp.signSync(hash, childKey);

    const signerAddition = <SignerAdd>{
      message: {
        body: {
          parentKey: custodySignerEncodedPubkey,
          childKey: childEncodedPubkey,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(custodySignerSig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey,
        childSignature: base64EncodeUInt8Arr(childKeySig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey,
      },
    };

    let addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked.isOk()).toEqual(true);

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
        parentSignature: base64EncodeUInt8Arr(childKeySig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey,
      },
    };

    const removeWorked = signerSet.removeDelegate(signerRemove);
    expect(removeWorked.isOk()).toEqual(true);

    // This will fail since delegate has been revoked
    addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked.isOk()).toEqual(false);
  });

  test('no-ops when child is in adds set with same parent edge', async () => {
    const signerSet = new SignerSet();

    const custodySigner = newSecp256k1Key();
    const custodySignerPubkey = secp.getPublicKey(custodySigner);
    const custodySignerEncodedPubkey = Buffer.from(custodySignerPubkey.toString()).toString('base64');

    signerSet.addCustody(custodySignerEncodedPubkey);
    expect(signerSet._numSigners()).toEqual(1);

    const childKey = newSecp256k1Key();
    const childPubkey = secp.getPublicKey(childKey);
    const childEncodedPubkey = Buffer.from(childPubkey.toString()).toString('base64');

    const hash = blake2b(randomBytes(32), 32);
    const custodySignerSig = secp.signSync(hash, custodySigner);
    const childKeySig = secp.signSync(hash, childKey);

    const signerAddition = <SignerAdd>{
      message: {
        body: {
          parentKey: custodySignerEncodedPubkey,
          childKey: childEncodedPubkey,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(custodySignerSig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey,
        childSignature: base64EncodeUInt8Arr(childKeySig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey,
      },
    };

    let addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked.isOk()).toEqual(true);

    addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked.isOk()).toEqual(true);
  });
});

describe('remove delegate', () => {
  test('successfully deletes delegates and child delegate', async () => {
    const signerSet = new SignerSet();

    const custodySigner = newSecp256k1Key();
    const custodySignerPubkey = secp.getPublicKey(custodySigner);
    const custodySignerEncodedPubkey = Buffer.from(custodySignerPubkey.toString()).toString('base64');

    signerSet.addCustody(custodySignerEncodedPubkey);
    expect(signerSet._numSigners()).toEqual(1);

    const childKey = newSecp256k1Key();
    const childPubkey = secp.getPublicKey(childKey);
    const childEncodedPubkey = Buffer.from(childPubkey.toString()).toString('base64');

    const hash = blake2b(randomBytes(32), 32);
    const custodySignerSig = secp.signSync(hash, custodySigner);
    const childKeySig = secp.signSync(hash, childKey);

    // Add Delegate to root
    const signerAddition = <SignerAdd>{
      message: {
        body: {
          parentKey: custodySignerEncodedPubkey,
          childKey: childEncodedPubkey,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(custodySignerSig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey,
        childSignature: base64EncodeUInt8Arr(childKeySig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey,
      },
    };

    const addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked.isOk()).toEqual(true);

    // Add Delegate 1_1 to Delegate 1

    const childKey1_1 = newSecp256k1Key();
    const childPubkey1_1 = secp.getPublicKey(childKey1_1);
    const childEncodedPubkey1_1 = Buffer.from(childPubkey1_1.toString()).toString('base64');
    const childKey1_1Sig = secp.signSync(hash, childKey1_1);

    const signerAddition2_1 = <SignerAdd>{
      message: {
        body: {
          parentKey: childEncodedPubkey,
          childKey: childEncodedPubkey1_1,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(childKeySig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: childEncodedPubkey,
        childSignature: base64EncodeUInt8Arr(childKey1_1Sig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey1_1,
      },
    };

    const addWorked2_1 = signerSet.addDelegate(signerAddition2_1);
    expect(addWorked2_1.isOk()).toEqual(true);

    // Remove delegate 1 (and 1_1) success

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
        parentSignature: base64EncodeUInt8Arr(custodySignerSig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey,
      },
    };

    const removeWorked = signerSet.removeDelegate(signerRemove);
    expect(removeWorked.isOk()).toEqual(true);
  });

  test('fails because claimed parent is not actual parent of child', async () => {
    const signerSet = new SignerSet();

    const custodySigner = newSecp256k1Key();
    const custodySignerPubkey = secp.getPublicKey(custodySigner);
    const custodySignerEncodedPubkey = Buffer.from(custodySignerPubkey.toString()).toString('base64');

    signerSet.addCustody(custodySignerEncodedPubkey);
    expect(signerSet._numSigners()).toEqual(1);

    const childKey = newSecp256k1Key();
    const childPubkey = secp.getPublicKey(childKey);
    const childEncodedPubkey = Buffer.from(childPubkey.toString()).toString('base64');

    const hash = blake2b(randomBytes(32), 32);
    const custodySignerSig = secp.signSync(hash, custodySigner);
    const childKeySig = secp.signSync(hash, childKey);

    // Add Delegate to root
    const signerAddition = <SignerAdd>{
      message: {
        body: {
          parentKey: custodySignerEncodedPubkey,
          childKey: childEncodedPubkey,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(custodySignerSig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey,
        childSignature: base64EncodeUInt8Arr(childKeySig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey,
      },
    };

    const addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked.isOk()).toEqual(true);

    // Add Delegate 1_1 to Delegate 1

    const childKey1_1 = newSecp256k1Key();
    const childPubkey1_1 = secp.getPublicKey(childKey1_1);
    const childEncodedPubkey1_1 = Buffer.from(childPubkey1_1.toString()).toString('base64');
    const childKey1_1Sig = secp.signSync(hash, childKey1_1);

    const signerAddition2_1 = <SignerAdd>{
      message: {
        body: {
          parentKey: childEncodedPubkey,
          childKey: childEncodedPubkey1_1,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(childKeySig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: childEncodedPubkey,
        childSignature: base64EncodeUInt8Arr(childKey1_1Sig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey1_1,
      },
    };

    const addWorked2_1 = signerSet.addDelegate(signerAddition2_1);
    expect(addWorked2_1.isOk()).toEqual(true);

    // Remove delegate 2_1 fail

    const signerRemove2_1 = <SignerRemove>{
      message: {
        body: {
          childKey: childEncodedPubkey1_1,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(custodySignerSig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey,
      },
    };

    const removeWorked = signerSet.removeDelegate(signerRemove2_1);
    expect(removeWorked.isOk()).toEqual(false);
  });

  test('no-ops because delegate has already been revoked', async () => {
    const signerSet = new SignerSet();

    const custodySigner = newSecp256k1Key();
    const custodySignerPubkey = secp.getPublicKey(custodySigner);
    const custodySignerEncodedPubkey = Buffer.from(custodySignerPubkey.toString()).toString('base64');

    signerSet.addCustody(custodySignerEncodedPubkey);
    expect(signerSet._numSigners()).toEqual(1);

    const childKey = newSecp256k1Key();
    const childPubkey = secp.getPublicKey(childKey);
    const childEncodedPubkey = Buffer.from(childPubkey.toString()).toString('base64');

    const hash = blake2b(randomBytes(32), 32);
    const custodySignerSig = secp.signSync(hash, custodySigner);
    const childKeySig = secp.signSync(hash, childKey);

    // Add Delegate to root
    const signerAddition = <SignerAdd>{
      message: {
        body: {
          parentKey: custodySignerEncodedPubkey,
          childKey: childEncodedPubkey,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(custodySignerSig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey,
        childSignature: base64EncodeUInt8Arr(childKeySig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey,
      },
    };

    const addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked.isOk()).toEqual(true);

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
        parentSignature: base64EncodeUInt8Arr(childKeySig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey,
      },
    };

    let removeWorked = signerSet.removeDelegate(signerRemove);
    expect(removeWorked.isOk()).toEqual(true);

    // Fails since Delegate has already been revoked
    removeWorked = signerSet.removeDelegate(signerRemove);
    expect(removeWorked.isOk()).toEqual(true);
  });
});

describe('concurrent edge case', () => {
  // TODO: move concurrent edge case of other conflicting-parent case from above in 'add delegate' describe
  test('"rem" happens on parent of delegate before "add" that moves delegate and subtree to new parent', async () => {
    const signerSet = new SignerSet();

    const custodySigner = newSecp256k1Key();
    const custodySignerPubkey = secp.getPublicKey(custodySigner);
    const custodySignerEncodedPubkey = Buffer.from(custodySignerPubkey.toString()).toString('base64');

    signerSet.addCustody(custodySignerEncodedPubkey);
    expect(signerSet._numSigners()).toEqual(1);

    const childKey = newSecp256k1Key();
    const childPubkey = secp.getPublicKey(childKey);
    const childEncodedPubkey = Buffer.from(childPubkey.toString()).toString('base64');

    const hashDelegateBytes1 = randomBytes(32);
    let hash = blake2b(hashDelegateBytes1, 32);
    const custodySignerSig = secp.signSync(hash, custodySigner);
    const childKeySig = secp.signSync(hash, childKey);

    // Add Delegate 1 to root
    const signerAddition = <SignerAdd>{
      message: {
        body: {
          parentKey: custodySignerEncodedPubkey,
          childKey: childEncodedPubkey,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(custodySignerSig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey,
        childSignature: base64EncodeUInt8Arr(childKeySig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey,
      },
    };

    const addWorked = signerSet.addDelegate(signerAddition);
    expect(addWorked.isOk()).toEqual(true);

    // Add Delegate 2 to root
    hash = blake2b(randomBytes(32), 32);
    const childKey2 = newSecp256k1Key();
    const childPubkey2 = secp.getPublicKey(childKey2);
    const childEncodedPubkey2 = Buffer.from(childPubkey2.toString()).toString('base64');
    const childKey2Sig = secp.signSync(hash, childKey2);

    const signerAddition2 = <SignerAdd>{
      message: {
        body: {
          parentKey: custodySignerEncodedPubkey,
          childKey: childEncodedPubkey2,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(custodySignerSig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey,
        childSignature: base64EncodeUInt8Arr(childKeySig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey2,
      },
    };

    const addWorked2 = signerSet.addDelegate(signerAddition2);
    expect(addWorked2.isOk()).toEqual(true);

    // Add Delegate 1_1 to Delegate 1
    hash = blake2b(randomBytes(32), 32);
    const childKey1_1 = newSecp256k1Key();
    const childPubkey1_1 = secp.getPublicKey(childKey1_1);
    const childEncodedPubkey1_1 = Buffer.from(childPubkey1_1.toString()).toString('base64');
    const childKey1_1Sig = secp.signSync(hash, childKey1_1);

    const signerAddition1_1 = <SignerAdd>{
      message: {
        body: {
          parentKey: childEncodedPubkey,
          childKey: childEncodedPubkey1_1,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(childKeySig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: childEncodedPubkey,
        childSignature: base64EncodeUInt8Arr(childKey1_1Sig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey1_1,
      },
    };

    const addWorked1_1 = signerSet.addDelegate(signerAddition1_1);
    expect(addWorked1_1.isOk()).toEqual(true);

    // Remove delegate 1 (and 1_1) success
    hash = blake2b(randomBytes(32), 32);
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
        parentSignature: base64EncodeUInt8Arr(custodySignerSig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: custodySignerEncodedPubkey,
      },
    };

    const removeWorked = signerSet.removeDelegate(signerRemove);
    expect(removeWorked.isOk()).toBe(true);

    // Add delegate 1_1 to delegate 2
    hashDelegateBytes1[0] += 1;
    hash = blake2b(hashDelegateBytes1);
    const signerAddition1_1To2_1 = <SignerAdd>{
      message: {
        body: {
          parentKey: childEncodedPubkey2,
          childKey: childEncodedPubkey1_1,
          schema: FarcasterSchemaUrl,
        },
        account: 1,
      },
      envelope: {
        hash: base64EncodeUInt8Arr(hash),
        hashType: HashAlgorithm.Blake2b,
        parentSignature: base64EncodeUInt8Arr(childKey2Sig),
        parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        parentSignerPubkey: childEncodedPubkey2,
        childSignature: base64EncodeUInt8Arr(childKeySig),
        childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
        childSignerPubkey: childEncodedPubkey1_1,
      },
    };

    const addWorked1_1To2_1 = signerSet.addDelegate(signerAddition1_1To2_1);
    expect(addWorked1_1To2_1.isOk()).toEqual(true);
  });
});

function newSecp256k1Key() {
  return randomBytes(32);
}

function base64EncodeUInt8Arr(arr: Uint8Array) {
  return Buffer.from(arr).toString('base64');
}
