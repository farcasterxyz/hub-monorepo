/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-restricted-imports */
import { SignerAdd, SignatureAlgorithm, HashAlgorithm, SignerRemove, KeyPair } from '~/types';
import SignerSet from './signerSet';
import { blake2b } from 'ethereum-cryptography/blake2b';
import { randomBytes } from 'crypto';
import { Factories } from '~/factories';
const secp = require('ethereum-cryptography/secp256k1');
import * as ed from '@noble/ed25519';
import { convertToHex, generateEd25519KeyPair } from '~/utils';

const FarcasterSchemaUrl = 'farcaster.xyz/schemas/v1/signer-authorize';

const newSecp256k1Key = () => {
  return randomBytes(32);
};

const base64EncodeUInt8Arr = (arr: Uint8Array) => {
  return Buffer.from(arr).toString('base64');
};

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

describe('merge', () => {
  const set = new SignerSet();
  const adds = () => set._getAdds();
  const removes = () => set._getRemoves();
  const edges = () => set._getEdges();
  const edgeHashes = () => set._getEdges().map((edge) => edge.hash);

  let custodyKeyPair: KeyPair;
  let custodyPubKey: string;

  let a: KeyPair;
  let addA: SignerAdd;
  let remA: SignerRemove;
  let b: KeyPair;
  let addB: SignerAdd;
  let c: KeyPair;
  let addCToA: SignerAdd;
  let addCToB: SignerAdd;
  let remCFromA: SignerRemove;

  beforeAll(async () => {
    custodyKeyPair = await generateEd25519KeyPair();
    custodyPubKey = await convertToHex(custodyKeyPair.publicKey);
    a = await generateEd25519KeyPair();
    addA = await Factories.SignerAdd.create(
      {},
      { transient: { privateKey: custodyKeyPair.privateKey, childPrivateKey: a.privateKey } }
    );
    remA = await Factories.SignerRemove.create(
      { data: { body: { childKey: addA.data.body.childKey } } },
      { transient: { privateKey: custodyKeyPair.privateKey } }
    );
    b = await generateEd25519KeyPair();
    addB = await Factories.SignerAdd.create(
      {},
      { transient: { privateKey: custodyKeyPair.privateKey, childPrivateKey: b.privateKey } }
    );
    c = await generateEd25519KeyPair();
    addCToA = await Factories.SignerAdd.create(
      {},
      { transient: { privateKey: a.privateKey, childPrivateKey: c.privateKey } }
    );
    addCToB = await Factories.SignerAdd.create(
      {},
      { transient: { privateKey: b.privateKey, childPrivateKey: c.privateKey } }
    );
    remCFromA = await Factories.SignerRemove.create(
      { data: { body: { childKey: addCToA.data.body.childKey } } },
      { transient: { privateKey: a.privateKey } }
    );
  });

  beforeEach(() => {
    set._reset();
    set.addCustody(custodyPubKey); // TODO: validation?
  });

  describe('addDelegate', () => {
    test('succeeds with a valid SignerAdd message', async () => {
      const res = set.merge(addA);
      console.log(res);
      expect(res.isOk()).toEqual(true);
      expect(adds()).toEqual([addA.data.body.childKey]);
      expect(edgeHashes().includes(addA.hash)).toBe(true);
    });

    test('succeeds with a duplicate valid SignerAdd message', async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(addA).isOk()).toBe(true);
      expect(adds()).toEqual([addA.data.body.childKey]);
      expect(edgeHashes().includes(addA.hash)).toBe(true);
    });

    test('succeeds when adding a child to another delegate', async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(addCToA).isOk()).toBe(true);
      expect(adds().length).toEqual(2);
      expect(edgeHashes()).toEqual([addA.hash, addCToA.hash]);
    });

    describe('when delegate already exists', () => {
      describe('with different parent', () => {
        test('fails with a lower message hash', async () => {
          expect(set.merge(addA).isOk()).toBe(true);
          expect(set.merge(addB).isOk()).toBe(true);
          expect(set.merge(addCToA).isOk()).toBe(true);
          expect(adds().length).toEqual(3);
          const addCToBFail: SignerAdd = { ...addCToB, hash: addCToA.hash.slice(0, -1) };
          expect(set.merge(Object.assign(addCToBFail)).isOk()).toBe(false);
          expect(adds().length).toEqual(3);
          console.log(adds(), removes(), edges());
        });

        test('succeeds with a higher message hash', async () => {
          expect(set.merge(addA).isOk()).toBe(true);
          expect(set.merge(addB).isOk()).toBe(true);
          expect(set.merge(addCToA).isOk()).toBe(true);
          expect(adds().length).toEqual(3);
          const addCToBSuccess: SignerAdd = { ...addCToB, hash: addCToA.hash + 'a' };
          expect(set.merge(addCToBSuccess).isOk()).toBe(true);
          expect(adds().length).toEqual(3);
          console.log(adds(), removes(), edges());
        });
      });

      describe('with same parent', () => {
        let addCToADuplicate: SignerAdd;

        beforeAll(async () => {
          addCToADuplicate = await Factories.SignerAdd.create(
            {},
            { transient: { privateKey: a.privateKey, childPrivateKey: c.privateKey } }
          );
        });

        test('fails with a lower message hash', async () => {
          expect(set.merge(addA).isOk()).toBe(true);
          expect(set.merge(addCToA).isOk()).toBe(true);
          const addCToADuplicateFail: SignerAdd = { ...addCToADuplicate, hash: addCToA.hash.slice(0, -1) };
          expect(set.merge(Object.assign(addCToADuplicateFail)).isOk()).toBe(false);
          expect(edgeHashes().includes(addCToADuplicateFail.hash)).toBe(false);
          expect(edgeHashes().includes(addCToA.hash)).toBe(true);
        });

        test('succeeds with a higher message hash', async () => {
          expect(set.merge(addA).isOk()).toBe(true);
          expect(set.merge(addCToA).isOk()).toBe(true);
          const addCToADuplicateSuccess: SignerAdd = { ...addCToADuplicate, hash: addCToA.hash + 'z' };
          expect(set.merge(Object.assign(addCToADuplicateSuccess)).isOk()).toBe(true);
          expect(edgeHashes().includes(addCToADuplicateSuccess.hash)).toBe(true);
          expect(edgeHashes().includes(addCToA.hash)).toBe(false);
        });
      });
    });

    test('fails when parent does not exist', async () => {
      expect(adds()).toEqual([]);
      expect(set.merge(addCToA).isOk()).toBe(false);
      expect(adds()).toEqual([]);
      expect(edgeHashes()).toEqual([]);
    });

    test('fails when delegate has already been removed', async () => {
      const remC = await Factories.SignerRemove.create(
        { data: { body: { childKey: addCToA.data.body.childKey } } },
        { transient: { privateKey: a.privateKey } }
      );
      expect(set.merge(addA).isOk()).toBe(true);
      console.log('remC', remC, adds(), removes(), edges());
      const res = set.merge(remC);
      console.log(res);
      expect(res.isOk()).toBe(true);
      expect(set.merge(addCToA).isOk()).toBe(false);
    });
  });

  describe('removeDelegate', () => {
    test('succeeds with a valid SignerRemove message', async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(remA).isOk()).toBe(true);
      expect(adds()).toEqual([]);
      expect(removes()).toEqual([remA.data.body.childKey]);
      expect(edges()).toEqual([]);
    });

    test("succeeds when child hasn't been added yet", () => {
      expect(set.merge(remA).isOk()).toBe(true);
      expect(adds()).toEqual([]);
      expect(removes()).toEqual([remA.data.body.childKey]);
      expect(edgeHashes().includes(addA.hash)).toBe(false);
    });

    test('succeeds and removes subtree', () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(addCToA).isOk()).toBe(true);
      expect(set.merge(remA).isOk()).toBe(true);
      expect(adds()).toEqual([]);
      expect(removes().length).toEqual(2); // TODO: is that true?
      expect(edges()).toEqual([]);
    });

    test("fails when child doesn't belong to parent", async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(addCToA).isOk()).toBe(true);
      const remC = await Factories.SignerRemove.create(
        { data: { body: { childKey: addCToA.data.body.childKey } } },
        { transient: { privateKey: custodyKeyPair.privateKey } }
      );
      expect(set.merge(remC).isOk()).toBe(false);
      expect(removes()).toEqual([]);
    });

    test('succeeds when child belongs to parent', async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(addCToA).isOk()).toBe(true);
      expect(set.merge(remCFromA).isOk()).toBe(true);
      expect(removes()).toEqual([remCFromA.data.body.childKey]);
    });

    test('succeeds with duplicate signer remove message', () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(remA).isOk()).toBe(true);
      expect(set.merge(remA).isOk()).toBe(true);
    });
  });
});

// describe('remove delegate', () => {

// describe('concurrent edge case', () => {
//   // TODO: move concurrent edge case of other conflicting-parent case from above in 'add delegate' describe
//   test('"rem" happens on parent of delegate before "add" that moves delegate and subtree to new parent because it has a higher lexicographical hash', async () => {
//     const signerSet = new SignerSet();

//     const custodySigner = newSecp256k1Key();
//     const custodySignerPubkey = secp.getPublicKey(custodySigner);
//     const custodySignerEncodedPubkey = Buffer.from(custodySignerPubkey.toString()).toString('base64');

//     signerSet.addCustody(custodySignerEncodedPubkey);
//     expect(signerSet._numSigners()).toEqual(1);

//     const childKey = newSecp256k1Key();
//     const childPubkey = secp.getPublicKey(childKey);
//     const childEncodedPubkey = Buffer.from(childPubkey.toString()).toString('base64');

//     const hashDelegateBytes1 = randomBytes(32);
//     let hash = blake2b(hashDelegateBytes1, 32);
//     const custodySignerSig = secp.signSync(hash, custodySigner);
//     const childKeySig = secp.signSync(hash, childKey);

//     // Add Delegate 1 to root
//     const signerAddition = <SignerAdd>{
//       message: {
//         body: {
//           parentKey: custodySignerEncodedPubkey,
//           childKey: childEncodedPubkey,
//           schema: FarcasterSchemaUrl,
//         },
//         account: 1,
//       },
//       envelope: {
//         hash: base64EncodeUInt8Arr(hash),
//         hashType: HashAlgorithm.Blake2b,
//         parentSignature: base64EncodeUInt8Arr(custodySignerSig),
//         parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
//         parentSignerPubkey: custodySignerEncodedPubkey,
//         childSignature: base64EncodeUInt8Arr(childKeySig),
//         childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
//         childSignerPubkey: childEncodedPubkey,
//       },
//     };

//     const addWorked = signerSet.addDelegate(signerAddition);
//     expect(addWorked.isOk()).toEqual(true);

//     // Add Delegate 2 to root
//     hash = blake2b(randomBytes(32), 32);
//     const childKey2 = newSecp256k1Key();
//     const childPubkey2 = secp.getPublicKey(childKey2);
//     const childEncodedPubkey2 = Buffer.from(childPubkey2.toString()).toString('base64');
//     const childKey2Sig = secp.signSync(hash, childKey2);

//     const signerAddition2 = <SignerAdd>{
//       message: {
//         body: {
//           parentKey: custodySignerEncodedPubkey,
//           childKey: childEncodedPubkey2,
//           schema: FarcasterSchemaUrl,
//         },
//         account: 1,
//       },
//       envelope: {
//         hash: base64EncodeUInt8Arr(hash),
//         hashType: HashAlgorithm.Blake2b,
//         parentSignature: base64EncodeUInt8Arr(custodySignerSig),
//         parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
//         parentSignerPubkey: custodySignerEncodedPubkey,
//         childSignature: base64EncodeUInt8Arr(childKeySig),
//         childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
//         childSignerPubkey: childEncodedPubkey2,
//       },
//     };

//     const addWorked2 = signerSet.addDelegate(signerAddition2);
//     expect(addWorked2.isOk()).toEqual(true);

//     // Add Delegate 1_1 to Delegate 1
//     hash = blake2b(randomBytes(32), 32);
//     const childKey1_1 = newSecp256k1Key();
//     const childPubkey1_1 = secp.getPublicKey(childKey1_1);
//     const childEncodedPubkey1_1 = Buffer.from(childPubkey1_1.toString()).toString('base64');
//     const childKey1_1Sig = secp.signSync(hash, childKey1_1);

//     const signerAddition1_1 = <SignerAdd>{
//       message: {
//         body: {
//           parentKey: childEncodedPubkey,
//           childKey: childEncodedPubkey1_1,
//           schema: FarcasterSchemaUrl,
//         },
//         account: 1,
//       },
//       envelope: {
//         hash: base64EncodeUInt8Arr(hash),
//         hashType: HashAlgorithm.Blake2b,
//         parentSignature: base64EncodeUInt8Arr(childKeySig),
//         parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
//         parentSignerPubkey: childEncodedPubkey,
//         childSignature: base64EncodeUInt8Arr(childKey1_1Sig),
//         childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
//         childSignerPubkey: childEncodedPubkey1_1,
//       },
//     };

//     const addWorked1_1 = signerSet.addDelegate(signerAddition1_1);
//     expect(addWorked1_1.isOk()).toEqual(true);

//     // Remove delegate 1 (and 1_1) success
//     hash = blake2b(randomBytes(32), 32);
//     const signerRemove = <SignerRemove>{
//       message: {
//         body: {
//           childKey: childEncodedPubkey,
//           schema: FarcasterSchemaUrl,
//         },
//         account: 1,
//       },
//       envelope: {
//         hash: base64EncodeUInt8Arr(hash),
//         hashType: HashAlgorithm.Blake2b,
//         parentSignature: base64EncodeUInt8Arr(custodySignerSig),
//         parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
//         parentSignerPubkey: custodySignerEncodedPubkey,
//       },
//     };

//     const removeWorked = signerSet.removeDelegate(signerRemove);
//     expect(removeWorked.isOk()).toBe(true);

//     // Add delegate 1_1 to delegate 2
//     const signerAddition1_1To2_1 = <SignerAdd>{
//       message: {
//         body: {
//           parentKey: childEncodedPubkey2,
//           childKey: childEncodedPubkey1_1,
//           schema: FarcasterSchemaUrl,
//         },
//         account: 1,
//       },
//       envelope: {
//         hash: 'zzzzzzzzzzzzzz',
//         hashType: HashAlgorithm.Blake2b,
//         parentSignature: base64EncodeUInt8Arr(childKey2Sig),
//         parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
//         parentSignerPubkey: childEncodedPubkey2,
//         childSignature: base64EncodeUInt8Arr(childKeySig),
//         childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
//         childSignerPubkey: childEncodedPubkey1_1,
//       },
//     };

//     const addWorked1_1To2_1 = signerSet.addDelegate(signerAddition1_1To2_1);
//     expect(addWorked1_1To2_1.isOk()).toEqual(true);
//   });
// });
