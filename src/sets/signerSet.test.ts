import { SignerAdd, SignerRemove, EthereumSigner, Ed25519Signer, CustodyAddEvent, CustodyRemoveAll } from '~/types';
import SignerSet from '~/sets/signerSet';
import { Factories } from '~/factories';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';

const set = new SignerSet();
const custodyAdds = () => set._getCustodyAdds();
const custodyAddsKeys = () => new Set([...set._getCustodyAdds().keys()]);
const custodyRems = () => set._getCustodyRemoves();
const signerAdds = () => set._getSignerAdds();
const signerRems = () => set._getSignerRemoves();

let custody1: EthereumSigner;
let addCustody1: CustodyAddEvent;
let removeAllCustody1: CustodyRemoveAll;
let custody2: EthereumSigner;
let addCustody2: CustodyAddEvent;
let removeAllCustody2: CustodyRemoveAll;
let a: Ed25519Signer;
let addA: SignerAdd;
let remA: SignerRemove;
let addA2: SignerAdd;
let remA2: SignerRemove;
let b: Ed25519Signer;
let addB: SignerAdd;
let c: Ed25519Signer;
let addCToA: SignerAdd;
let remAFromA: SignerRemove;
let remBFromA: SignerRemove;

beforeAll(async () => {
  custody1 = await generateEthereumSigner();
  addCustody1 = await Factories.CustodyAddEvent.create({}, { transient: { signer: custody1 } });
  removeAllCustody1 = await Factories.CustodyRemoveAll.create({}, { transient: { signer: custody1 } });
  custody2 = await generateEthereumSigner();
  addCustody2 = await Factories.CustodyAddEvent.create(
    { blockNumber: addCustody1.blockNumber + 1 },
    { transient: { signer: custody2 } }
  );
  removeAllCustody2 = await Factories.CustodyRemoveAll.create({}, { transient: { signer: custody2 } });
  a = await generateEd25519Signer();
  addA = await Factories.SignerAdd.create({}, { transient: { signer: custody1, childSigner: a } });
  remA = await Factories.SignerRemove.create(
    { data: { body: { childKey: a.signerKey } } },
    { transient: { signer: custody1 } }
  );
  addA2 = await Factories.SignerAdd.create({}, { transient: { signer: custody2, childSigner: a } });
  remA2 = await Factories.SignerRemove.create(
    { data: { body: { childKey: a.signerKey } } },
    { transient: { signer: custody2 } }
  );
  b = await generateEd25519Signer();
  addB = await Factories.SignerAdd.create({}, { transient: { signer: custody1, childSigner: b } });
  c = await generateEd25519Signer();
  addCToA = await Factories.SignerAdd.create({}, { transient: { signer: a, childSigner: c } });
  remAFromA = await Factories.SignerRemove.create(
    { data: { body: { childKey: a.signerKey } } },
    { transient: { signer: a } }
  );
  remBFromA = await Factories.SignerRemove.create(
    { data: { body: { childKey: b.signerKey } } },
    { transient: { signer: a } }
  );
});

beforeEach(() => {
  set._reset();
});

describe('addCustody', () => {
  test('succeeds with new custody address', () => {
    expect(set.addCustody(addCustody1).isOk()).toBe(true);
    expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, addCustody1]]));
    expect(custodyRems()).toEqual(new Map());
    expect(signerAdds()).toEqual(new Map());
    expect(signerRems()).toEqual(new Map());
  });

  test('succeeds with multiple new custody addresses', () => {
    expect(set.addCustody(addCustody1).isOk()).toBe(true);
    expect(set.addCustody(addCustody2).isOk()).toBe(true);
    expect(custodyAdds()).toEqual(
      new Map([
        [custody1.signerKey, addCustody1],
        [custody2.signerKey, addCustody2],
      ])
    );
    expect(custodyRems()).toEqual(new Map());
    expect(signerAdds()).toEqual(new Map());
    expect(signerRems()).toEqual(new Map());
  });

  test('succeeds with a duplicate custody address (idempotent)', () => {
    expect(set.addCustody(addCustody1).isOk()).toBe(true);
    expect(set.addCustody(addCustody1).isOk()).toBe(true);
    expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, addCustody1]]));
    expect(custodyRems()).toEqual(new Map());
    expect(signerAdds()).toEqual(new Map());
    expect(signerRems()).toEqual(new Map());
  });

  test('succeeds (no-op) when custody address has been removed', () => {
    expect(set.addCustody(addCustody1).isOk()).toBe(true);
    expect(set.addCustody(addCustody2).isOk()).toBe(true);
    expect(set.merge(removeAllCustody2).isOk()).toBe(true);
    expect(set.addCustody(addCustody1).isOk()).toBe(true);
  });
});

describe('merge', () => {
  test('fails without custody address', () => {
    const res = set.merge(addA);
    expect(res.isOk()).toBe(false);
    expect(res._unsafeUnwrapErr()).toBe('SignerSet.mergeSignerAdd: custodyAddress does not exist');
    expect(custodyAdds()).toEqual(new Map());
    expect(custodyRems()).toEqual(new Map());
    expect(signerAdds()).toEqual(new Map());
    expect(signerRems()).toEqual(new Map());
  });

  test('succeeds (no-ops) when custody address has been removed', () => {
    expect(set.addCustody(addCustody1).isOk()).toBe(true);
    expect(set.addCustody(addCustody2).isOk()).toBe(true);
    expect(set.merge(removeAllCustody2).isOk()).toBe(true);
    expect(set.merge(addA).isOk()).toBe(true);
    expect(custodyAdds()).toEqual(new Map([[custody2.signerKey, addCustody2]]));
    expect(custodyRems()).toEqual(new Map([[custody1.signerKey, removeAllCustody2]]));
    expect(signerAdds()).toEqual(new Map());
    expect(signerRems()).toEqual(new Map());
  });

  describe('with custody address', () => {
    beforeEach(() => {
      set.addCustody(addCustody1);
      expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, addCustody1]]));
    });

    describe('mergeCustodyRemoveAll', () => {
      test('succeeds when there are no previous custody addresses', () => {
        expect(set.merge(removeAllCustody1).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, addCustody1]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map());
      });

      test('succeeds and removes previous custody addresses', () => {
        expect(set.addCustody(addCustody2).isOk()).toBe(true);
        expect(set.merge(removeAllCustody2).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody2.signerKey, addCustody2]]));
        expect(custodyRems()).toEqual(new Map([[custody1.signerKey, removeAllCustody2]]));
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map());
      });

      test('succeeds and does not remove more recent custody addresses', () => {
        expect(set.addCustody(addCustody2).isOk()).toBe(true);
        expect(set.merge(removeAllCustody1).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(
          new Map([
            [custody2.signerKey, addCustody2],
            [custody1.signerKey, addCustody1],
          ])
        );
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map());
      });

      test('fails when custody address signer has not been added', () => {
        const res = set.merge(removeAllCustody2);
        expect(res.isOk()).toBe(false);
        expect(res._unsafeUnwrapErr()).toBe('SignerSet.mergeCustodyRemoveAll: custodyAddress does not exist');
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, addCustody1]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map());
      });
    });

    describe('mergeSignerAdd', () => {
      test('succeeds with a valid SignerAdd message', () => {
        expect(set.merge(addA).isOk()).toEqual(true);
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, addCustody1]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map([[a.signerKey, addA]]));
        expect(signerRems()).toEqual(new Map());
      });

      test('succeeds with a duplicate valid SignerAdd message', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        expect(set.merge(addA).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, addCustody1]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map([[a.signerKey, addA]]));
        expect(signerRems()).toEqual(new Map());
      });

      test('fails when trying to add a signer to another delegate', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        const res = set.merge(addCToA);
        expect(res.isOk()).toBe(false);
        expect(res._unsafeUnwrapErr()).toBe('SignerSet.mergeSignerAdd: custodyAddress does not exist');
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, addCustody1]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map([[a.signerKey, addA]]));
        expect(signerRems()).toEqual(new Map());
      });

      describe('when signer already exists from different custody address', () => {
        beforeEach(() => {
          expect(set.addCustody(addCustody2).isOk()).toBe(true);
        });

        test('succeeds with later custody address', () => {
          expect(set.merge(addA).isOk()).toBe(true);
          expect(set.merge(addA2).isOk()).toBe(true);
          expect(custodyAdds()).toEqual(
            new Map([
              [custody1.signerKey, addCustody1],
              [custody2.signerKey, addCustody2],
            ])
          );
          expect(custodyRems()).toEqual(new Map());
          expect(signerAdds()).toEqual(new Map([[a.signerKey, addA2]]));
          expect(signerRems()).toEqual(new Map());
        });

        test('succeeds (no-op) with earlier custody address', () => {
          expect(set.merge(addA2).isOk()).toBe(true);
          expect(set.merge(addA).isOk()).toBe(true);
          expect(custodyAdds()).toEqual(
            new Map([
              [custody1.signerKey, addCustody1],
              [custody2.signerKey, addCustody2],
            ])
          );
          expect(custodyRems()).toEqual(new Map());
          expect(signerAdds()).toEqual(new Map([[a.signerKey, addA2]]));
          expect(signerRems()).toEqual(new Map());
        });

        test('succeeds with custody addresses from same block', () => {
          // TODO
        });
      });

      describe('when signer already exists from the same custody address', () => {
        beforeEach(() => {
          expect(set.merge(addA).isOk()).toBe(true);
        });

        test('succeeds with higher message hash', () => {
          const addAHigherHash: SignerAdd = { ...addA, hash: addA.hash + 'a' };
          expect(set.merge(addAHigherHash).isOk()).toBe(true);
          expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, addCustody1]]));
          expect(custodyRems()).toEqual(new Map());
          expect(signerAdds()).toEqual(new Map([[a.signerKey, addAHigherHash]]));
          expect(signerRems()).toEqual(new Map());
        });

        test('succeeds (no-ops) with lower message hash', () => {
          const addALowerHash: SignerAdd = { ...addA, hash: addA.hash.slice(0, -1) };
          expect(set.merge(addALowerHash).isOk()).toBe(true);
          expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, addCustody1]]));
          expect(custodyRems()).toEqual(new Map());
          expect(signerAdds()).toEqual(new Map([[a.signerKey, addA]]));
          expect(signerRems()).toEqual(new Map());
        });
      });

      describe('when signer has been removed', () => {
        beforeEach(() => {
          expect(set.addCustody(addCustody2).isOk()).toBe(true);
        });

        test('succeeds with later custody address', () => {
          expect(set.merge(remA).isOk()).toBe(true);
          expect(set.merge(addA2).isOk()).toBe(true);
          expect(custodyAdds()).toEqual(
            new Map([
              [custody1.signerKey, addCustody1],
              [custody2.signerKey, addCustody2],
            ])
          );
          expect(custodyRems()).toEqual(new Map());
          expect(signerAdds()).toEqual(new Map([[a.signerKey, addA2]]));
          expect(signerRems()).toEqual(new Map());
        });

        test('succeeds (no-ops) with earlier custody address', () => {
          expect(set.merge(remA2).isOk()).toBe(true);
          expect(set.merge(addA).isOk()).toBe(true);
          expect(custodyAdds()).toEqual(
            new Map([
              [custody1.signerKey, addCustody1],
              [custody2.signerKey, addCustody2],
            ])
          );
          expect(custodyRems()).toEqual(new Map());
          expect(signerAdds()).toEqual(new Map());
          expect(signerRems()).toEqual(new Map([[a.signerKey, remA2]]));
        });
      });

      describe('when signer is added and removed by two custody addresses', () => {
        beforeEach(() => {
          expect(set.addCustody(addCustody2).isOk()).toBe(true);
        });

        afterEach(() => {
          expect(custodyAdds()).toEqual(
            new Map([
              [custody1.signerKey, addCustody1],
              [custody2.signerKey, addCustody2],
            ])
          );
          expect(custodyRems()).toEqual(new Map());
          expect(signerAdds()).toEqual(new Map());
          expect(signerRems()).toEqual(new Map([[a.signerKey, remA2]]));
        });

        test('succeeds when adds are received first', () => {
          for (const msg of [addA, addA2, remA, remA2]) {
            expect(set.merge(msg).isOk()).toBe(true);
          }
        });

        test('succeeds when removes are received first', () => {
          for (const msg of [remA, remA2, addA, addA2]) {
            expect(set.merge(msg).isOk()).toBe(true);
          }
        });

        test('succeeds when messages are ordered by custody address', () => {
          for (const msg of [addA, remA, addA2, remA2]) {
            expect(set.merge(msg).isOk()).toBe(true);
          }
        });
      });
    });

    describe('mergeSignerRemove', () => {
      test('succeeds with a valid SignerRemove message', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        expect(set.merge(remA).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, addCustody1]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map([[a.signerKey, remA]]));
      });

      test('succeeds when signer has not been added', () => {
        expect(set.merge(remA).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, addCustody1]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map([[a.signerKey, remA]]));
      });

      test('succeeds with duplicate signer remove message', () => {
        expect(set.merge(remA).isOk()).toBe(true);
        expect(set.merge(remA).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, addCustody1]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map([[a.signerKey, remA]]));
      });

      test('fails when signer is the delegate', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        const res = set.merge(remAFromA);
        expect(res.isOk()).toBe(false);
        expect(res._unsafeUnwrapErr()).toBe('SignerSet.mergeSignerRemove: custodyAddress does not exist');
      });

      test('fails when signer is another delegate', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        expect(set.merge(addB).isOk()).toBe(true);
        const res = set.merge(remBFromA);
        expect(res.isOk()).toBe(false);
        expect(res._unsafeUnwrapErr()).toBe('SignerSet.mergeSignerRemove: custodyAddress does not exist');
      });
    });
  });
});
