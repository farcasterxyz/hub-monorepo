import { SignerAdd, SignerRemove, EthereumSigner, Ed25519Signer, CustodyRemoveAll, IDRegistryEvent } from '~/types';
import SignerSet, { SignerSetEvents } from '~/sets/signerSet';
import { Factories } from '~/factories';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';

const set = new SignerSet();
const custodyAdds = () => set._getCustodyAdds();
const custodyRems = () => set._getCustodyRemoves();
const signerAdds = () => set._getSignerAdds();
const signerRems = () => set._getSignerRemoves();

let events: any[] = [];
const eventNames: (keyof SignerSetEvents)[] = ['addCustody', 'removeCustody', 'addSigner', 'removeSigner'];
for (const eventName of eventNames) {
  set.addListener(eventName, (...args: any[]) => events.push([eventName, ...args]));
}

let custody1: EthereumSigner;
let custody1Register: IDRegistryEvent;
let removeAllCustody1: CustodyRemoveAll;
let custody2: EthereumSigner;
let custody2Transfer: IDRegistryEvent;
let removeAllCustody2: CustodyRemoveAll;
let custody3: EthereumSigner;
let custody3Transfer: IDRegistryEvent;
let removeAllCustody3: CustodyRemoveAll;
let a: Ed25519Signer;
let addA: SignerAdd;
let remA: SignerRemove;
let addA2: SignerAdd;
let remA2: SignerRemove;
let addA3: SignerAdd;
let b: Ed25519Signer;
let addB: SignerAdd;
let c: Ed25519Signer;
let addCToA: SignerAdd;
let remAFromA: SignerRemove;
let remBFromA: SignerRemove;

beforeAll(async () => {
  custody1 = await generateEthereumSigner();
  custody1Register = await Factories.IDRegistryEvent.create({ args: { to: custody1.signerKey } }, {});
  removeAllCustody1 = await Factories.CustodyRemoveAll.create({}, { transient: { signer: custody1 } });
  custody2 = await generateEthereumSigner();
  custody2Transfer = await Factories.IDRegistryEvent.create({
    args: { to: custody2.signerKey },
    blockNumber: custody1Register.blockNumber + 1,
  });
  removeAllCustody2 = await Factories.CustodyRemoveAll.create({}, { transient: { signer: custody2 } });
  custody3 = await generateEthereumSigner();
  custody3Transfer = await Factories.IDRegistryEvent.create({
    args: { to: custody3.signerKey },
    blockNumber: custody2Transfer.blockNumber,
    logIndex: custody2Transfer.logIndex + 1,
  });
  removeAllCustody3 = await Factories.CustodyRemoveAll.create({}, { transient: { signer: custody3 } });
  a = await generateEd25519Signer();
  addA = await Factories.SignerAdd.create({}, { transient: { signer: custody1, delegateSigner: a } });
  remA = await Factories.SignerRemove.create(
    { data: { body: { delegate: a.signerKey } } },
    { transient: { signer: custody1 } }
  );
  addA2 = await Factories.SignerAdd.create({}, { transient: { signer: custody2, delegateSigner: a } });
  remA2 = await Factories.SignerRemove.create(
    { data: { body: { delegate: a.signerKey } } },
    { transient: { signer: custody2 } }
  );
  addA3 = await Factories.SignerAdd.create({}, { transient: { signer: custody3, delegateSigner: a } });
  b = await generateEd25519Signer();
  addB = await Factories.SignerAdd.create({}, { transient: { signer: custody1, delegateSigner: b } });
  c = await generateEd25519Signer();
  addCToA = await Factories.SignerAdd.create({}, { transient: { signer: a, delegateSigner: c } });
  remAFromA = await Factories.SignerRemove.create(
    { data: { body: { delegate: a.signerKey } } },
    { transient: { signer: a } }
  );
  remBFromA = await Factories.SignerRemove.create(
    { data: { body: { delegate: b.signerKey } } },
    { transient: { signer: a } }
  );
});

afterAll(() => {
  set.removeAllListeners();
});

beforeEach(() => {
  events = [];
  set._reset();
});

describe('lookup', () => {
  test('fails when custody address does not exist', () => {
    expect(set.lookup(custody1.signerKey)).toBeFalsy();
  });

  test('returns CustodyAddEvent when custody address has been added', () => {
    set.mergeIDRegistryEvent(custody1Register);
    expect(set.lookup(custody1.signerKey)).toEqual(custody1Register);
  });

  test('fails when custody address has been removed', () => {
    set.mergeIDRegistryEvent(custody1Register);
    set.mergeIDRegistryEvent(custody2Transfer);
    set.merge(removeAllCustody2);
    expect(set.lookup(custody1.signerKey)).toBeFalsy();
  });

  test('fails when delegate signer does not exist', () => {
    expect(set.lookup(a.signerKey)).toBeFalsy();
  });

  test('returns SignerAdd when delegate signer has been added', () => {
    set.mergeIDRegistryEvent(custody1Register);
    set.merge(addA);
    expect(set.lookup(a.signerKey)).toEqual(addA);
  });

  test('fails when delegate signer has been removed', () => {
    set.mergeIDRegistryEvent(custody1Register);
    set.merge(addA);
    set.merge(remA);
    expect(set.lookup(a.signerKey)).toBeFalsy();
  });
});

describe('mergeIDRegistryEvent', () => {
  test('succeeds with new custody address', () => {
    expect(set.mergeIDRegistryEvent(custody1Register).isOk()).toBe(true);
    expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
    expect(custodyRems()).toEqual(new Map());
    expect(signerAdds()).toEqual(new Map());
    expect(signerRems()).toEqual(new Map());
    expect(events).toEqual([['addCustody', custody1.signerKey, custody1Register]]);
  });

  test('succeeds with multiple new custody addresses', () => {
    expect(set.mergeIDRegistryEvent(custody1Register).isOk()).toBe(true);
    expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
    expect(custodyAdds()).toEqual(
      new Map([
        [custody1.signerKey, custody1Register],
        [custody2.signerKey, custody2Transfer],
      ])
    );
    expect(custodyRems()).toEqual(new Map());
    expect(signerAdds()).toEqual(new Map());
    expect(signerRems()).toEqual(new Map());
    expect(events).toEqual([
      ['addCustody', custody1.signerKey, custody1Register],
      ['addCustody', custody2.signerKey, custody2Transfer],
    ]);
  });

  test('succeeds with multiple new custody addresses in the same block', () => {
    const addSameBlock: IDRegistryEvent = { ...custody2Transfer, blockNumber: custody1Register.blockNumber };
    expect(set.mergeIDRegistryEvent(custody1Register).isOk()).toBe(true);
    expect(set.mergeIDRegistryEvent(addSameBlock).isOk()).toBe(true);
    expect(custodyAdds()).toEqual(
      new Map([
        [custody1.signerKey, custody1Register],
        [custody2.signerKey, addSameBlock],
      ])
    );
    expect(custodyRems()).toEqual(new Map());
    expect(signerAdds()).toEqual(new Map());
    expect(signerRems()).toEqual(new Map());
    expect(events).toEqual([
      ['addCustody', custody1.signerKey, custody1Register],
      ['addCustody', custody2.signerKey, addSameBlock],
    ]);
  });

  test('succeeds (no-ops) with a duplicate custody address', () => {
    expect(set.mergeIDRegistryEvent(custody1Register).isOk()).toBe(true);
    expect(set.mergeIDRegistryEvent(custody1Register).isOk()).toBe(true);
    expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
    expect(custodyRems()).toEqual(new Map());
    expect(signerAdds()).toEqual(new Map());
    expect(signerRems()).toEqual(new Map());
    expect(events).toEqual([['addCustody', custody1.signerKey, custody1Register]]);
  });

  test('succeeds (no-ops) when custody address has been removed', () => {
    expect(set.mergeIDRegistryEvent(custody1Register).isOk()).toBe(true);
    expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
    expect(set.merge(removeAllCustody2).isOk()).toBe(true);
    expect(set.mergeIDRegistryEvent(custody1Register).isOk()).toBe(true);
    expect(custodyAdds()).toEqual(new Map([[custody2.signerKey, custody2Transfer]]));
    expect(custodyRems()).toEqual(new Map([[custody1.signerKey, removeAllCustody2]]));
    expect(signerAdds()).toEqual(new Map());
    expect(signerRems()).toEqual(new Map());
    expect(events).toEqual([
      ['addCustody', custody1.signerKey, custody1Register],
      ['addCustody', custody2.signerKey, custody2Transfer],
      ['removeCustody', custody1.signerKey, removeAllCustody2],
    ]);
  });

  test('succeeds when custody address is re-added with higher block number', () => {
    expect(set.mergeIDRegistryEvent(custody1Register).isOk()).toBe(true);
    expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
    expect(set.merge(removeAllCustody2).isOk()).toBe(true);
    const custody1Transfer: IDRegistryEvent = {
      ...custody1Register,
      name: 'Transfer',
      blockNumber: custody2Transfer.blockNumber + 1,
    };
    expect(set.mergeIDRegistryEvent(custody1Transfer).isOk()).toBe(true);
    expect(custodyAdds()).toEqual(
      new Map([
        [custody2.signerKey, custody2Transfer],
        [custody1.signerKey, custody1Transfer],
      ])
    );
    expect(custodyRems()).toEqual(new Map());
    expect(signerAdds()).toEqual(new Map());
    expect(signerRems()).toEqual(new Map());
    expect(events).toEqual([
      ['addCustody', custody1.signerKey, custody1Register],
      ['addCustody', custody2.signerKey, custody2Transfer],
      ['removeCustody', custody1.signerKey, removeAllCustody2],
      ['addCustody', custody1.signerKey, custody1Transfer],
    ]);
  });
});

describe('merge', () => {
  test('fails with invalid message type', async () => {
    const invalidMessage = (await Factories.Cast.create()) as any as SignerAdd;
    const res = set.merge(invalidMessage);
    expect(res.isOk()).toBe(false);
    expect(res._unsafeUnwrapErr()).toBe('SignerSet.merge: invalid message format');
  });

  test('fails without custody address', () => {
    const res = set.merge(addA);
    expect(res.isOk()).toBe(false);
    expect(res._unsafeUnwrapErr()).toBe('SignerSet.mergeSignerAdd: custodyAddress does not exist');
    expect(custodyAdds()).toEqual(new Map());
    expect(custodyRems()).toEqual(new Map());
    expect(signerAdds()).toEqual(new Map());
    expect(signerRems()).toEqual(new Map());
    expect(events).toEqual([]);
  });

  test('succeeds (no-ops) when custody address has been removed', () => {
    expect(set.mergeIDRegistryEvent(custody1Register).isOk()).toBe(true);
    expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
    expect(set.merge(removeAllCustody2).isOk()).toBe(true);
    expect(set.merge(addA).isOk()).toBe(true);
    expect(custodyAdds()).toEqual(new Map([[custody2.signerKey, custody2Transfer]]));
    expect(custodyRems()).toEqual(new Map([[custody1.signerKey, removeAllCustody2]]));
    expect(signerAdds()).toEqual(new Map());
    expect(signerRems()).toEqual(new Map());
    expect(events).toEqual([
      ['addCustody', custody1.signerKey, custody1Register],
      ['addCustody', custody2.signerKey, custody2Transfer],
      ['removeCustody', custody1.signerKey, removeAllCustody2],
    ]);
  });

  describe('with custody address', () => {
    beforeEach(() => {
      set.mergeIDRegistryEvent(custody1Register);
      expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
    });

    describe('mergeCustodyRemoveAll', () => {
      test('succeeds when there are no previous custody addresses', () => {
        expect(set.merge(removeAllCustody1).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map());
        expect(events).toEqual([['addCustody', custody1.signerKey, custody1Register]]);
      });

      test('succeeds and removes previous custody addresses', () => {
        expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        expect(set.merge(removeAllCustody2).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody2.signerKey, custody2Transfer]]));
        expect(custodyRems()).toEqual(new Map([[custody1.signerKey, removeAllCustody2]]));
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map());
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['addCustody', custody2.signerKey, custody2Transfer],
          ['removeCustody', custody1.signerKey, removeAllCustody2],
        ]);
      });

      test('succeeds and does not remove more recent custody addresses', () => {
        expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        expect(set.merge(removeAllCustody1).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(
          new Map([
            [custody2.signerKey, custody2Transfer],
            [custody1.signerKey, custody1Register],
          ])
        );
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map());
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['addCustody', custody2.signerKey, custody2Transfer],
        ]);
      });

      test('fails when custody address signer has not been added', () => {
        const res = set.merge(removeAllCustody2);
        expect(res.isOk()).toBe(false);
        expect(res._unsafeUnwrapErr()).toBe('SignerSet.mergeCustodyRemoveAll: custodyAddress does not exist');
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map());
        expect(events).toEqual([['addCustody', custody1.signerKey, custody1Register]]);
      });

      test('succeeds and drops signers', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        expect(set.merge(removeAllCustody2).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody2.signerKey, custody2Transfer]]));
        expect(custodyRems()).toEqual(new Map([[custody1.signerKey, removeAllCustody2]]));
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map());
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
          ['addCustody', custody2.signerKey, custody2Transfer],
          ['removeSigner', a.signerKey], // Revoke signer
          ['removeCustody', custody1.signerKey, removeAllCustody2],
        ]);
      });

      test('succeeds and drops removed signers', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        expect(set.merge(remA).isOk()).toBe(true);
        expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        expect(set.merge(removeAllCustody2).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody2.signerKey, custody2Transfer]]));
        expect(custodyRems()).toEqual(new Map([[custody1.signerKey, removeAllCustody2]]));
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map());
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
          ['removeSigner', a.signerKey, remA],
          ['addCustody', custody2.signerKey, custody2Transfer],
          ['removeCustody', custody1.signerKey, removeAllCustody2],
        ]);
      });

      test('succeeds and over-writes custody remove messages', () => {
        expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        expect(set.merge(removeAllCustody2).isOk()).toBe(true);
        const custody3TransferLater: IDRegistryEvent = {
          ...custody3Transfer,
          blockNumber: custody2Transfer.blockNumber + 1,
        };
        expect(set.mergeIDRegistryEvent(custody3TransferLater).isOk()).toBe(true);
        expect(set.merge(removeAllCustody3).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody3.signerKey, custody3TransferLater]]));
        expect(custodyRems()).toEqual(
          new Map([
            [custody1.signerKey, removeAllCustody3],
            [custody2.signerKey, removeAllCustody3],
          ])
        );
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map());
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['addCustody', custody2.signerKey, custody2Transfer],
          ['removeCustody', custody1.signerKey, removeAllCustody2],
          ['addCustody', custody3.signerKey, custody3TransferLater],
          ['removeCustody', custody1.signerKey, removeAllCustody3],
          ['removeCustody', custody2.signerKey, removeAllCustody3],
        ]);
      });

      test('succeeds and removes custody addresses from the same block with a lower logIndex', () => {
        const custody2Register: IDRegistryEvent = {
          ...custody2Transfer,
          blockNumber: custody1Register.blockNumber,
          logIndex: custody1Register.logIndex + 1,
        };
        expect(set.merge(addA).isOk()).toBe(true);
        expect(set.mergeIDRegistryEvent(custody2Register).isOk()).toBe(true);
        expect(set.merge(removeAllCustody2).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody2.signerKey, custody2Register]]));
        expect(custodyRems()).toEqual(new Map([[custody1.signerKey, removeAllCustody2]]));
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map());
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
          ['addCustody', custody2.signerKey, custody2Register],
          ['removeSigner', a.signerKey], // Revoke signer
          ['removeCustody', custody1.signerKey, removeAllCustody2],
        ]);
      });

      test('succeeds and keeps custody addresses from the same block with a higher logIndex', () => {
        const custody2Register: IDRegistryEvent = {
          ...custody2Transfer,
          blockNumber: custody1Register.blockNumber,
          logIndex: custody1Register.logIndex - 1,
        };
        expect(set.merge(addA).isOk()).toBe(true);
        expect(set.mergeIDRegistryEvent(custody2Register).isOk()).toBe(true);
        expect(set.merge(removeAllCustody2).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(
          new Map([
            [custody1.signerKey, custody1Register],
            [custody2.signerKey, custody2Register],
          ])
        );
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map([[a.signerKey, addA]]));
        expect(signerRems()).toEqual(new Map());
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
          ['addCustody', custody2.signerKey, custody2Register],
        ]);
      });
    });

    describe('mergeSignerAdd', () => {
      test('succeeds with a valid SignerAdd message', () => {
        expect(set.merge(addA).isOk()).toEqual(true);
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map([[a.signerKey, addA]]));
        expect(signerRems()).toEqual(new Map());
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
        ]);
      });

      test('succeeds with a duplicate valid SignerAdd message', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        expect(set.merge(addA).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map([[a.signerKey, addA]]));
        expect(signerRems()).toEqual(new Map());
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
        ]);
      });

      test('fails when trying to add a signer to another delegate', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        const res = set.merge(addCToA);
        expect(res.isOk()).toBe(false);
        expect(res._unsafeUnwrapErr()).toBe('SignerSet.mergeSignerAdd: custodyAddress does not exist');
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map([[a.signerKey, addA]]));
        expect(signerRems()).toEqual(new Map());
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
        ]);
      });

      describe('when signer already exists from different custody address', () => {
        beforeEach(() => {
          expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        });

        test('succeeds with later custody address', () => {
          expect(set.merge(addA).isOk()).toBe(true);
          expect(set.merge(addA2).isOk()).toBe(true);
          expect(custodyAdds()).toEqual(
            new Map([
              [custody1.signerKey, custody1Register],
              [custody2.signerKey, custody2Transfer],
            ])
          );
          expect(custodyRems()).toEqual(new Map());
          expect(signerAdds()).toEqual(new Map([[a.signerKey, addA2]]));
          expect(signerRems()).toEqual(new Map());
          expect(events).toEqual([
            ['addCustody', custody1.signerKey, custody1Register],
            ['addCustody', custody2.signerKey, custody2Transfer],
            ['addSigner', a.signerKey, addA],
            ['addSigner', a.signerKey, addA2],
          ]);
        });

        test('succeeds (no-op) with earlier custody address', () => {
          expect(set.merge(addA2).isOk()).toBe(true);
          expect(set.merge(addA).isOk()).toBe(true);
          expect(custodyAdds()).toEqual(
            new Map([
              [custody1.signerKey, custody1Register],
              [custody2.signerKey, custody2Transfer],
            ])
          );
          expect(custodyRems()).toEqual(new Map());
          expect(signerAdds()).toEqual(new Map([[a.signerKey, addA2]]));
          expect(signerRems()).toEqual(new Map());
          expect(events).toEqual([
            ['addCustody', custody1.signerKey, custody1Register],
            ['addCustody', custody2.signerKey, custody2Transfer],
            ['addSigner', a.signerKey, addA2],
          ]);
        });

        describe('with same block number', () => {
          beforeEach(() => {
            expect(set.mergeIDRegistryEvent(custody3Transfer).isOk()).toBe(true);
          });

          test('succeeds with higher logIndex', () => {
            expect(set.merge(addA2).isOk()).toBe(true);
            expect(set.merge(addA3).isOk()).toBe(true);
            expect(custodyAdds()).toEqual(
              new Map([
                [custody1.signerKey, custody1Register],
                [custody2.signerKey, custody2Transfer],
                [custody3.signerKey, custody3Transfer],
              ])
            );
            expect(custodyRems()).toEqual(new Map());
            expect(signerAdds()).toEqual(new Map([[a.signerKey, addA3]]));
            expect(signerRems()).toEqual(new Map());
            expect(events).toEqual([
              ['addCustody', custody1.signerKey, custody1Register],
              ['addCustody', custody2.signerKey, custody2Transfer],
              ['addCustody', custody3.signerKey, custody3Transfer],
              ['addSigner', a.signerKey, addA2],
              ['addSigner', a.signerKey, addA3],
            ]);
          });

          test('succeeds (no-ops) with lower logIndex', () => {
            expect(set.merge(addA3).isOk()).toBe(true);
            expect(set.merge(addA2).isOk()).toBe(true);
            expect(custodyAdds()).toEqual(
              new Map([
                [custody1.signerKey, custody1Register],
                [custody2.signerKey, custody2Transfer],
                [custody3.signerKey, custody3Transfer],
              ])
            );
            expect(custodyRems()).toEqual(new Map());
            expect(signerAdds()).toEqual(new Map([[a.signerKey, addA3]]));
            expect(signerRems()).toEqual(new Map());
            expect(events).toEqual([
              ['addCustody', custody1.signerKey, custody1Register],
              ['addCustody', custody2.signerKey, custody2Transfer],
              ['addCustody', custody3.signerKey, custody3Transfer],
              ['addSigner', a.signerKey, addA3],
            ]);
          });
        });
      });

      describe('when signer already exists from the same custody address', () => {
        beforeEach(() => {
          expect(set.merge(addA).isOk()).toBe(true);
        });

        test('succeeds with higher message hash', () => {
          const addAHigherHash: SignerAdd = { ...addA, hash: addA.hash + 'a' };
          expect(set.merge(addAHigherHash).isOk()).toBe(true);
          expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
          expect(custodyRems()).toEqual(new Map());
          expect(signerAdds()).toEqual(new Map([[a.signerKey, addAHigherHash]]));
          expect(signerRems()).toEqual(new Map());
          expect(events).toEqual([
            ['addCustody', custody1.signerKey, custody1Register],
            ['addSigner', a.signerKey, addA],
            ['addSigner', a.signerKey, addAHigherHash],
          ]);
        });

        test('succeeds (no-ops) with lower message hash', () => {
          const addALowerHash: SignerAdd = { ...addA, hash: addA.hash.slice(0, -1) };
          expect(set.merge(addALowerHash).isOk()).toBe(true);
          expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
          expect(custodyRems()).toEqual(new Map());
          expect(signerAdds()).toEqual(new Map([[a.signerKey, addA]]));
          expect(signerRems()).toEqual(new Map());
          expect(events).toEqual([
            ['addCustody', custody1.signerKey, custody1Register],
            ['addSigner', a.signerKey, addA],
          ]);
        });
      });

      describe('when signer has been removed', () => {
        beforeEach(() => {
          expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        });

        test('succeeds with later custody address', () => {
          expect(set.merge(remA).isOk()).toBe(true);
          expect(set.merge(addA2).isOk()).toBe(true);
          expect(custodyAdds()).toEqual(
            new Map([
              [custody1.signerKey, custody1Register],
              [custody2.signerKey, custody2Transfer],
            ])
          );
          expect(custodyRems()).toEqual(new Map());
          expect(signerAdds()).toEqual(new Map([[a.signerKey, addA2]]));
          expect(signerRems()).toEqual(new Map());
          expect(events).toEqual([
            ['addCustody', custody1.signerKey, custody1Register],
            ['addCustody', custody2.signerKey, custody2Transfer],
            ['removeSigner', a.signerKey, remA],
            ['addSigner', a.signerKey, addA2],
          ]);
        });

        test('succeeds (no-ops) with earlier custody address', () => {
          expect(set.merge(remA2).isOk()).toBe(true);
          expect(set.merge(addA).isOk()).toBe(true);
          expect(custodyAdds()).toEqual(
            new Map([
              [custody1.signerKey, custody1Register],
              [custody2.signerKey, custody2Transfer],
            ])
          );
          expect(custodyRems()).toEqual(new Map());
          expect(signerAdds()).toEqual(new Map());
          expect(signerRems()).toEqual(new Map([[a.signerKey, remA2]]));
          expect(events).toEqual([
            ['addCustody', custody1.signerKey, custody1Register],
            ['addCustody', custody2.signerKey, custody2Transfer],
            ['removeSigner', a.signerKey, remA2],
          ]);
        });
      });

      describe('when signer is added and removed by two custody addresses', () => {
        beforeEach(() => {
          expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        });

        afterEach(() => {
          expect(custodyAdds()).toEqual(
            new Map([
              [custody1.signerKey, custody1Register],
              [custody2.signerKey, custody2Transfer],
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
          expect(events).toEqual([
            ['addCustody', custody1.signerKey, custody1Register],
            ['addCustody', custody2.signerKey, custody2Transfer],
            ['addSigner', a.signerKey, addA],
            ['addSigner', a.signerKey, addA2],
            ['removeSigner', a.signerKey, remA2],
          ]);
        });

        test('succeeds when removes are received first', () => {
          for (const msg of [remA, remA2, addA, addA2]) {
            expect(set.merge(msg).isOk()).toBe(true);
          }
          expect(events).toEqual([
            ['addCustody', custody1.signerKey, custody1Register],
            ['addCustody', custody2.signerKey, custody2Transfer],
            ['removeSigner', a.signerKey, remA],
            ['removeSigner', a.signerKey, remA2],
          ]);
        });

        test('succeeds when messages are ordered by custody address', () => {
          for (const msg of [addA, remA, addA2, remA2]) {
            expect(set.merge(msg).isOk()).toBe(true);
          }
          expect(events).toEqual([
            ['addCustody', custody1.signerKey, custody1Register],
            ['addCustody', custody2.signerKey, custody2Transfer],
            ['addSigner', a.signerKey, addA],
            ['removeSigner', a.signerKey, remA],
            ['addSigner', a.signerKey, addA2],
            ['removeSigner', a.signerKey, remA2],
          ]);
        });
      });
    });

    describe('mergeSignerRemove', () => {
      test('succeeds with a valid SignerRemove message', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        expect(set.merge(remA).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map([[a.signerKey, remA]]));
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
          ['removeSigner', a.signerKey, remA],
        ]);
      });

      test('succeeds when signer has not been added', () => {
        expect(set.merge(remA).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map([[a.signerKey, remA]]));
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['removeSigner', a.signerKey, remA],
        ]);
      });

      test('succeeds with duplicate signer remove message', () => {
        expect(set.merge(remA).isOk()).toBe(true);
        expect(set.merge(remA).isOk()).toBe(true);
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map());
        expect(signerRems()).toEqual(new Map([[a.signerKey, remA]]));
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['removeSigner', a.signerKey, remA],
        ]);
      });

      test('fails when signer is the delegate', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        const res = set.merge(remAFromA);
        expect(res.isOk()).toBe(false);
        expect(res._unsafeUnwrapErr()).toBe('SignerSet.mergeSignerRemove: custodyAddress does not exist');
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(new Map([[a.signerKey, addA]]));
        expect(signerRems()).toEqual(new Map());
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
        ]);
      });

      test('fails when signer is another delegate', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        expect(set.merge(addB).isOk()).toBe(true);
        const res = set.merge(remBFromA);
        expect(res.isOk()).toBe(false);
        expect(res._unsafeUnwrapErr()).toBe('SignerSet.mergeSignerRemove: custodyAddress does not exist');
        expect(custodyAdds()).toEqual(new Map([[custody1.signerKey, custody1Register]]));
        expect(custodyRems()).toEqual(new Map());
        expect(signerAdds()).toEqual(
          new Map([
            [a.signerKey, addA],
            [b.signerKey, addB],
          ])
        );
        expect(signerRems()).toEqual(new Map());
        expect(events).toEqual([
          ['addCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
          ['addSigner', b.signerKey, addB],
        ]);
      });

      describe('when signer is removed by different custody addresses from the same block', () => {
        let custody4Address: string;
        let custody4Register: IDRegistryEvent;
        let remA4: SignerRemove;

        beforeAll(async () => {
          custody4Address = custody1.signerKey + 'a';
          custody4Register = await Factories.IDRegistryEvent.create({
            args: { to: custody4Address },
            blockNumber: custody1Register.blockNumber,
            logIndex: custody1Register.logIndex + 1,
          });
          remA4 = { ...remA, signer: custody4Address };
        });

        beforeEach(() => {
          expect(set.mergeIDRegistryEvent(custody4Register));
        });

        afterAll(() => {
          expect(custodyAdds()).toEqual(
            new Map([
              [custody1.signerKey, custody1Register],
              [custody4Address, custody4Register],
            ])
          );
          expect(custodyRems()).toEqual(new Map());
          expect(signerAdds()).toEqual(new Map());
          expect(signerRems()).toEqual(new Map([[a.signerKey, remA4]]));
        });

        test('succeeds with higher logIndex', () => {
          expect(set.merge(addA).isOk()).toBe(true);
          expect(set.merge(remA).isOk()).toBe(true);
          expect(set.merge(remA4).isOk()).toBe(true);
          expect(events).toEqual([
            ['addCustody', custody1.signerKey, custody1Register],
            ['addCustody', custody4Address, custody4Register],
            ['addSigner', a.signerKey, addA],
            ['removeSigner', a.signerKey, remA],
            ['removeSigner', a.signerKey, remA4],
          ]);
        });

        test('succeeds (no-ops) with lower logIndex', () => {
          expect(set.merge(addA).isOk()).toBe(true);
          expect(set.merge(remA4).isOk()).toBe(true);
          expect(set.merge(remA).isOk()).toBe(true);
          expect(events).toEqual([
            ['addCustody', custody1.signerKey, custody1Register],
            ['addCustody', custody4Address, custody4Register],
            ['addSigner', a.signerKey, addA],
            ['removeSigner', a.signerKey, remA4],
          ]);
        });
      });
    });
  });
});
