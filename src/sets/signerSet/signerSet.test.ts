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
  const vAdds = () => set._getVertexAdds();
  const vRems = () => set._getVertexRemoves();
  const eAdds = () => set._getEdgeAdds();
  const eRems = () => set._getEdgeRemoves();

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

  describe('add', () => {
    test('succeeds with a valid SignerAdd message', async () => {
      const res = set.merge(addA);
      expect(res.isOk()).toEqual(true);
      expect(vAdds()).toEqual(new Set([addA.data.body.childKey]));
      expect(vRems()).toEqual(new Set());
      expect(eAdds().values()).toContain(addA.hash);
      expect(eRems()).toEqual(new Map());
    });

    test('succeeds with a duplicate valid SignerAdd message', async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(addA).isOk()).toBe(true);
      expect(vAdds()).toEqual(new Set([addA.data.body.childKey]));
      expect(vRems()).toEqual(new Set());
      expect(eAdds().values()).toContain(addA.hash);
      expect(eRems()).toEqual(new Map());
    });

    test('succeeds when adding a child to a parent', async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(addCToA).isOk()).toBe(true);
      expect(vAdds().size).toEqual(2);
      expect(eAdds().size).toEqual(2);
    });

    describe('when child already exists', () => {
      describe('with different parent', () => {
        // TODO: improve wording here
        test('succeeds with a lower message hash but does not add edge to tree', async () => {
          expect(set.merge(addA).isOk()).toBe(true);
          expect(set.merge(addB).isOk()).toBe(true);
          expect(set.merge(addCToA).isOk()).toBe(true);
          expect(vAdds().size).toEqual(3);
          const addCToBFail: SignerAdd = { ...addCToB, hash: addCToA.hash.slice(0, -1) };
          const res = set.merge(addCToBFail);
          expect(res.isOk()).toBe(true);

          expect(vAdds().size).toEqual(3);
          expect(eRems().values()).toContain(addCToBFail.hash);
        });

        test('succeeds with a higher message hash', async () => {
          expect(set.merge(addA).isOk()).toBe(true);
          expect(set.merge(addB).isOk()).toBe(true);
          expect(set.merge(addCToA).isOk()).toBe(true);
          expect(vAdds().size).toEqual(3);
          const addCToBSuccess: SignerAdd = { ...addCToB, hash: addCToA.hash + 'a' };
          expect(set.merge(addCToBSuccess).isOk()).toBe(true);
          expect(vAdds().size).toEqual(3);
          expect(eAdds().values()).toContain(addCToBSuccess.hash);
          expect(eRems().values()).toContain(addCToA.hash);
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

        // TODO: should this "succeed" or give some other response?
        test('succeeds with a lower message hash but does not update edgeAdds set', async () => {
          expect(set.merge(addA).isOk()).toBe(true);
          expect(set.merge(addCToA).isOk()).toBe(true);
          const addCToADuplicateFail: SignerAdd = { ...addCToADuplicate, hash: addCToA.hash.slice(0, -1) };
          expect(set.merge(addCToADuplicateFail).isOk()).toBe(true);
          const edgeKey = set.getEdgeKey(addCToA.signer, addCToA.data.body.childKey);
          expect(eAdds().get(edgeKey)).toEqual(addCToA.hash);
          expect(eRems().size).toEqual(0);
        });

        test('succeeds with a higher message hash', async () => {
          expect(set.merge(addA).isOk()).toBe(true);
          expect(set.merge(addCToA).isOk()).toBe(true);
          const addCToADuplicateSuccess: SignerAdd = { ...addCToADuplicate, hash: addCToA.hash + 'z' };
          expect(set.merge(addCToADuplicateSuccess).isOk()).toBe(true);
          const edgeKey = set.getEdgeKey(addCToA.signer, addCToA.data.body.childKey);
          expect(eAdds().get(edgeKey)).toEqual(addCToADuplicateSuccess.hash);
          expect(eRems().size).toEqual(0);
        });
      });
    });

    test('fails when parent does not exist', async () => {
      expect(vAdds().size).toEqual(0);
      expect(set.merge(addCToA).isOk()).toBe(false);
      expect(vAdds().size).toEqual(0);
      expect(eAdds().size).toEqual(0);
    });

    test('succeeds and removes new edge when child has already been deleted by another parent', async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(addCToA).isOk()).toBe(true);
      expect(set.merge(addB).isOk()).toBe(true);
      expect(set.merge(remCFromA).isOk()).toBe(true);
      const res = set.merge(addCToB);
      expect(res.isOk()).toBe(true);
      expect(vRems()).toContain(addCToB.data.body.childKey);
      expect(eRems().values()).toContain(addCToB.hash);
    });
  });

  describe('removeDelegate', () => {
    test('succeeds with a valid SignerRemove message', async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(remA).isOk()).toBe(true);
      expect(vAdds()).toEqual(new Set());
      expect(vRems()).toEqual(new Set([remA.data.body.childKey]));
      expect(eAdds()).toEqual(new Map());
      expect(eRems().values()).toContain(addA.hash);
    });

    test("fails when child hasn't been added yet", () => {
      expect(vAdds()).toEqual(new Set());
      expect(set.merge(remA).isOk()).toBe(false);
      expect(vAdds()).toEqual(new Set());
      expect(vRems()).toEqual(new Set());
    });

    test('succeeds and removes subtree', () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(addCToA).isOk()).toBe(true);
      expect(vAdds().size).toEqual(2);
      expect(set.merge(remA).isOk()).toBe(true);
      expect(vAdds().size).toEqual(0);
      expect(vRems().size).toEqual(2);
      expect(eAdds().size).toEqual(0);
      expect(eRems().size).toEqual(2);
    });

    test("fails when child doesn't belong to parent", async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(addCToA).isOk()).toBe(true);
      const remC = await Factories.SignerRemove.create(
        { data: { body: { childKey: addCToA.data.body.childKey } } },
        { transient: { privateKey: custodyKeyPair.privateKey } }
      );
      expect(set.merge(remC).isOk()).toBe(false);
      expect(vRems()).toEqual(new Set());
    });

    test('succeeds when child belongs to parent', async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(addCToA).isOk()).toBe(true);
      expect(set.merge(remCFromA).isOk()).toBe(true);
      expect(vRems()).toEqual(new Set([remCFromA.data.body.childKey]));
      expect(eRems().size).toEqual(1);
    });

    test('succeeds with duplicate signer remove message', () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(remA).isOk()).toBe(true);
      expect(set.merge(remA).isOk()).toBe(true);
    });
  });
});
