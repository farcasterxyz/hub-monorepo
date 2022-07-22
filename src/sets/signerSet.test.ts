import { SignerAdd, SignerRemove, KeyPair } from '~/types';
import SignerSet from '~/sets/signerSet';
import { Factories } from '~/factories';
import * as secp256k1 from 'ethereum-cryptography/secp256k1';
import { convertToHex, generateEd25519KeyPair } from '~/utils';

const set = new SignerSet();
const vAdds = () => set._getVertexAdds();
const vRems = () => set._getVertexRemoves();
const eAdds = () => set._getEdgeAdds();
const eRems = () => set._getEdgeRemoves();
const custodySigners = () => set._getCustodySigners();

describe('addCustody', () => {
  let custody1: string;
  let custody2: string;

  beforeAll(async () => {
    const custody1PrivateKey = secp256k1.utils.randomPrivateKey();
    custody1 = await convertToHex(secp256k1.getPublicKey(custody1PrivateKey));
    const custody2PrivateKey = secp256k1.utils.randomPrivateKey();
    custody2 = await convertToHex(secp256k1.getPublicKey(custody2PrivateKey));
  });

  beforeEach(() => {
    set._reset();
  });

  test('succeeds with new custody signer', () => {
    expect(set.addCustody(custody1).isOk()).toBe(true);
    expect(custodySigners()).toContain(custody1);
    expect(vAdds().size).toEqual(0);
  });

  test('succeeds with multiple new custody signers', () => {
    expect(set.addCustody(custody1).isOk()).toBe(true);
    expect(set.addCustody(custody2).isOk()).toBe(true);
    expect(custodySigners()).toContain(custody1);
    expect(custodySigners()).toContain(custody2);
    expect(vAdds().size).toEqual(0);
  });

  test('succeeds with a duplicate custody signer (idempotent)', () => {
    expect(set.addCustody(custody1).isOk()).toBe(true);
    expect(set.addCustody(custody1).isOk()).toBe(true);
    expect(custodySigners()).toEqual(new Set([custody1]));
  });
});

describe('merge', () => {
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
