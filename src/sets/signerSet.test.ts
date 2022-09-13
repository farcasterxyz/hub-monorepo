import Faker from 'faker';
import { SignerAdd, SignerRemove, EthereumSigner, Ed25519Signer, IDRegistryEvent } from '~/types';
import SignerSet, { SignerSetEvents } from '~/sets/signerSet';
import { Factories } from '~/factories';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';

const set = new SignerSet();
const custodyAddress = () => set.getCustodyAddress();
const signersByCustody = () => set._getSignersByCustody();

let events: any[] = [];
const eventNames: (keyof SignerSetEvents)[] = ['changeCustody', 'addSigner', 'removeSigner'];
for (const eventName of eventNames) {
  set.addListener(eventName, (...args: any[]) => events.push([eventName, ...args]));
}

let custody1: EthereumSigner;
let custody1Register: IDRegistryEvent;
let custody2: EthereumSigner;
let custody2Transfer: IDRegistryEvent;
let a: Ed25519Signer;
let addA: SignerAdd;
let remA: SignerRemove;
let addA2: SignerAdd;
let remA2: SignerRemove;
let b: Ed25519Signer;
let addB: SignerAdd;

beforeAll(async () => {
  custody1 = await generateEthereumSigner();
  custody1Register = await Factories.IDRegistryEvent.create({ args: { to: custody1.signerKey } }, {});
  custody2 = await generateEthereumSigner();
  custody2Transfer = await Factories.IDRegistryEvent.create({
    args: { to: custody2.signerKey },
    blockNumber: custody1Register.blockNumber + 1,
  });
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
  b = await generateEd25519Signer();
  addB = await Factories.SignerAdd.create({}, { transient: { signer: custody1, delegateSigner: b } });
});

afterAll(() => {
  set.removeAllListeners();
});

beforeEach(() => {
  events = [];
  set._reset();
});

describe('getCustodyAddress', () => {
  test('fails when custody address does not exist', () => {
    expect(set.getCustodyAddress()).toBeFalsy();
  });

  test('succeeds when custody event has been added', () => {
    set.mergeIDRegistryEvent(custody1Register);
    expect(set.getCustodyAddress()).toEqual(custody1.signerKey);
  });

  test('succeeds after custody address has been changed', () => {
    set.mergeIDRegistryEvent(custody1Register);
    set.mergeIDRegistryEvent(custody2Transfer);
    expect(set.getCustodyAddress()).toEqual(custody2.signerKey);
  });
});

describe('getSigner', () => {
  test('fails when custody address does not exist', () => {
    expect(set.getSigner(custody1.signerKey)).toBeFalsy();
  });

  test('fails when called with a custody address', () => {
    set.mergeIDRegistryEvent(custody1Register);
    expect(set.getSigner(custody1.signerKey)).toBeFalsy();
  });

  test('fails when delegate signer does not exist', () => {
    expect(set.getSigner(a.signerKey)).toBeFalsy();
  });

  test('returns SignerAdd when delegate signer has been added', () => {
    set.mergeIDRegistryEvent(custody1Register);
    set.merge(addA);
    expect(set.getSigner(a.signerKey)).toEqual(addA);
  });

  test('fails when delegate signer has been removed', () => {
    set.mergeIDRegistryEvent(custody1Register);
    set.merge(addA);
    set.merge(remA);
    expect(set.getSigner(a.signerKey)).toBeFalsy();
  });

  test('fails when custody address has been changed', () => {
    set.mergeIDRegistryEvent(custody1Register);
    set.merge(addA);
    set.mergeIDRegistryEvent(custody2Transfer);
    expect(set.getSigner(a.signerKey)).toBeFalsy();
  });
});

describe('mergeIDRegistryEvent', () => {
  test('succeeds with new custody address', () => {
    expect(set.mergeIDRegistryEvent(custody1Register).isOk()).toBe(true);
    expect(custodyAddress()).toEqual(custody1.signerKey);
    expect(signersByCustody()).toEqual(new Map());
    expect(events).toEqual([['changeCustody', custody1.signerKey, custody1Register]]);
  });

  test('succeeds with multiple new custody addresses', () => {
    expect(set.mergeIDRegistryEvent(custody1Register).isOk()).toBe(true);
    expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
    expect(custodyAddress()).toEqual(custody2.signerKey);
    expect(signersByCustody()).toEqual(new Map());
    expect(events).toEqual([
      ['changeCustody', custody1.signerKey, custody1Register],
      ['changeCustody', custody2.signerKey, custody2Transfer],
    ]);
  });

  describe('with existing custody address', () => {
    beforeEach(() => {
      expect(set.mergeIDRegistryEvent(custody1Register).isOk()).toBe(true);
    });

    test('succeeds (no-ops) with duplicate custody address', () => {
      expect(set.mergeIDRegistryEvent(custody1Register).isOk()).toBe(true);
      expect(custodyAddress()).toEqual(custody1.signerKey);
      expect(signersByCustody()).toEqual(new Map());
      expect(events).toEqual([['changeCustody', custody1.signerKey, custody1Register]]);
    });

    test('succeeds (no-ops) with the same block, earlier log index', () => {
      const addSameBlockEarlierLog: IDRegistryEvent = {
        ...custody2Transfer,
        blockNumber: custody1Register.blockNumber,
        logIndex: custody1Register.logIndex - 1,
      };
      expect(set.mergeIDRegistryEvent(addSameBlockEarlierLog).isOk()).toBe(true);
      expect(custodyAddress()).toEqual(custody1.signerKey);
      expect(signersByCustody()).toEqual(new Map());
      expect(events).toEqual([['changeCustody', custody1.signerKey, custody1Register]]);
    });

    test('succeeds with the same block, later log index', () => {
      const addSameBlockLaterLog: IDRegistryEvent = {
        ...custody2Transfer,
        blockNumber: custody1Register.blockNumber,
        logIndex: custody1Register.logIndex + 1,
      };
      expect(set.mergeIDRegistryEvent(addSameBlockLaterLog).isOk()).toBe(true);
      expect(custodyAddress()).toEqual(custody2.signerKey);
      expect(signersByCustody()).toEqual(new Map());
      expect(events).toEqual([
        ['changeCustody', custody1.signerKey, custody1Register],
        ['changeCustody', custody2.signerKey, addSameBlockLaterLog],
      ]);
    });

    test('succeeds when custody address is re-added later', () => {
      expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
      const custody1Transfer: IDRegistryEvent = {
        ...custody1Register,
        name: 'Transfer',
        blockNumber: custody2Transfer.blockNumber + 1,
      };
      expect(set.mergeIDRegistryEvent(custody1Transfer).isOk()).toBe(true);
      expect(custodyAddress()).toEqual(custody1.signerKey);
      expect(signersByCustody()).toEqual(new Map());
      expect(events).toEqual([
        ['changeCustody', custody1.signerKey, custody1Register],
        ['changeCustody', custody2.signerKey, custody2Transfer],
        ['changeCustody', custody1.signerKey, custody1Transfer],
      ]);
    });

    describe('with signers', () => {
      beforeEach(() => {
        expect(set.merge(addA).isOk()).toBe(true);
      });

      test('succeeds and emits removeSigner event', () => {
        expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        expect(custodyAddress()).toEqual(custody2.signerKey);
        expect(signersByCustody()).toEqual(new Map());
        expect(events).toEqual([
          ['changeCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
          ['changeCustody', custody2.signerKey, custody2Transfer],
          ['removeSigner', a.signerKey], // Revoke signer
        ]);
      });

      test('succeeds and does not emit new removeSigner event when signer has been removed', () => {
        expect(set.merge(remA).isOk()).toBe(true);
        expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        expect(custodyAddress()).toEqual(custody2.signerKey);
        expect(signersByCustody()).toEqual(new Map());
        expect(events).toEqual([
          ['changeCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
          ['removeSigner', a.signerKey, remA],
          ['changeCustody', custody2.signerKey, custody2Transfer],
        ]);
      });
    });

    describe('with new signers', () => {
      beforeEach(() => {
        expect(set.merge(addA2).isOk()).toBe(true);
      });

      test('succeeds and emits addSigner event', () => {
        expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        expect(custodyAddress()).toEqual(custody2.signerKey);
        expect(signersByCustody()).toEqual(
          new Map([[custody2.signerKey, { adds: new Map([[a.signerKey, addA2]]), removes: new Map() }]])
        );
        expect(events).toEqual([
          ['changeCustody', custody1.signerKey, custody1Register],
          ['changeCustody', custody2.signerKey, custody2Transfer],
          ['addSigner', a.signerKey, addA2],
        ]);
      });

      test('succeeds and does not emit addSigner event when signer has been removed', () => {
        expect(set.merge(remA2).isOk()).toBe(true);
        expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        expect(custodyAddress()).toEqual(custody2.signerKey);
        expect(signersByCustody()).toEqual(
          new Map([[custody2.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA2]]) }]])
        );
        expect(events).toEqual([
          ['changeCustody', custody1.signerKey, custody1Register],
          ['changeCustody', custody2.signerKey, custody2Transfer],
        ]);
      });
    });

    test('succeeds and emits addSigner event when the same signer was added by both custody addresses', () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(addA2).isOk()).toBe(true);
      expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
      expect(custodyAddress()).toEqual(custody2.signerKey);
      expect(signersByCustody()).toEqual(
        new Map([[custody2.signerKey, { adds: new Map([[a.signerKey, addA2]]), removes: new Map() }]])
      );
      expect(events).toEqual([
        ['changeCustody', custody1.signerKey, custody1Register],
        ['addSigner', a.signerKey, addA],
        ['changeCustody', custody2.signerKey, custody2Transfer],
        ['addSigner', a.signerKey, addA2],
      ]);
    });
  });
});

describe('merge', () => {
  test('fails with invalid message type', async () => {
    const invalidMessage = (await Factories.CastShort.create()) as any as SignerAdd;
    const res = set.merge(invalidMessage);
    expect(res.isOk()).toBe(false);
    expect(res._unsafeUnwrapErr()).toBe('SignerSet.merge: invalid message format');
  });

  describe('without custody address', () => {
    describe('mergeSignerAdd', () => {
      test('succeeds but does not emit addSigner event', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        expect(custodyAddress()).toEqual(undefined);
        expect(signersByCustody()).toEqual(
          new Map([[custody1.signerKey, { adds: new Map([[a.signerKey, addA]]), removes: new Map() }]])
        );
        expect(events).toEqual([]);
      });
    });

    describe('mergeSignerRemove', () => {
      test('succeeds but does not emit removeSigner event', () => {
        expect(set.merge(remA).isOk()).toBe(true);
        expect(custodyAddress()).toEqual(undefined);
        expect(signersByCustody()).toEqual(
          new Map([[custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA]]) }]])
        );
        expect(events).toEqual([]);
      });
    });
  });

  describe('with custody address', () => {
    beforeEach(() => {
      expect(set.mergeIDRegistryEvent(custody1Register).isOk()).toBe(true);
    });

    describe('mergeSignerAdd', () => {
      test('succeeds with a valid SignerAdd message', () => {
        expect(set.merge(addA).isOk()).toEqual(true);
        expect(custodyAddress()).toEqual(custody1.signerKey);
        expect(signersByCustody()).toEqual(
          new Map([[custody1.signerKey, { adds: new Map([[a.signerKey, addA]]), removes: new Map() }]])
        );
        expect(events).toEqual([
          ['changeCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
        ]);
      });

      test('succeeds but does not emit addSigner event with a duplicate valid SignerAdd message', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        expect(set.merge(addA).isOk()).toBe(true);
        expect(custodyAddress()).toEqual(custody1.signerKey);
        expect(signersByCustody()).toEqual(
          new Map([[custody1.signerKey, { adds: new Map([[a.signerKey, addA]]), removes: new Map() }]])
        );
        expect(events).toEqual([
          ['changeCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
        ]);
      });

      test('succeeds with multiple valid SignerAdd messages', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        expect(set.merge(addB).isOk()).toBe(true);
        expect(custodyAddress()).toEqual(custody1.signerKey);
        expect(signersByCustody()).toEqual(
          new Map([
            [
              custody1.signerKey,
              {
                adds: new Map([
                  [a.signerKey, addA],
                  [b.signerKey, addB],
                ]),
                removes: new Map(),
              },
            ],
          ])
        );
        expect(events).toEqual([
          ['changeCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
          ['addSigner', b.signerKey, addB],
        ]);
      });

      test('fails when signer and delegate are the same', async () => {
        const addSelf = await Factories.SignerAdd.create(
          { data: { body: { delegate: custody1.signerKey } } },
          { transient: { signer: custody1 } }
        );
        const res = set.merge(addSelf);
        expect(res.isOk()).toBe(false);
        expect(res._unsafeUnwrapErr()).toBe('SignerSet.mergeSignerAdd: signer and delegate must be different');
        expect(custodyAddress()).toEqual(custody1.signerKey);
        expect(signersByCustody()).toEqual(new Map());
        expect(events).toEqual([['changeCustody', custody1.signerKey, custody1Register]]);
      });

      describe('when signer was already added by a different custody address', () => {
        beforeEach(() => {
          expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        });

        test('succeeds with later custody address', () => {
          expect(set.merge(addA).isOk()).toBe(true);
          expect(set.merge(addA2).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody2.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([
              [custody1.signerKey, { adds: new Map([[a.signerKey, addA]]), removes: new Map() }],
              [custody2.signerKey, { adds: new Map([[a.signerKey, addA2]]), removes: new Map() }],
            ])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['changeCustody', custody2.signerKey, custody2Transfer],
            ['addSigner', a.signerKey, addA2],
          ]);
        });

        test('succeeds but does not emit addSigner event with earlier custody address', () => {
          expect(set.merge(addA2).isOk()).toBe(true);
          expect(set.merge(addA).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody2.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([
              [custody1.signerKey, { adds: new Map([[a.signerKey, addA]]), removes: new Map() }],
              [custody2.signerKey, { adds: new Map([[a.signerKey, addA2]]), removes: new Map() }],
            ])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['changeCustody', custody2.signerKey, custody2Transfer],
            ['addSigner', a.signerKey, addA2],
          ]);
        });
      });

      describe('when signer was already added by the same custody address', () => {
        beforeEach(() => {
          expect(set.merge(addA).isOk()).toBe(true);
        });

        test('succeeds with later timestamp', () => {
          const addALater: SignerAdd = {
            ...addA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addA.data, signedAt: addA.data.signedAt + 1 },
          };
          expect(set.merge(addALater).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody1.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([[custody1.signerKey, { adds: new Map([[a.signerKey, addALater]]), removes: new Map() }]])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['addSigner', a.signerKey, addA],
            ['addSigner', a.signerKey, addALater],
          ]);
        });

        test('succeeds (no-ops) with earlier timestamp', () => {
          const addAEarlier: SignerAdd = {
            ...addA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addA.data, signedAt: addA.data.signedAt - 1 },
          };
          expect(set.merge(addAEarlier).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody1.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([[custody1.signerKey, { adds: new Map([[a.signerKey, addA]]), removes: new Map() }]])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['addSigner', a.signerKey, addA],
          ]);
        });

        describe('with the same timestamp', () => {
          test('succeeds with higher message hash', () => {
            const addAHigherHash: SignerAdd = { ...addA, hash: addA.hash + 'a' };
            expect(set.merge(addAHigherHash).isOk()).toBe(true);
            expect(custodyAddress()).toEqual(custody1.signerKey);
            expect(signersByCustody()).toEqual(
              new Map([[custody1.signerKey, { adds: new Map([[a.signerKey, addAHigherHash]]), removes: new Map() }]])
            );
            expect(events).toEqual([
              ['changeCustody', custody1.signerKey, custody1Register],
              ['addSigner', a.signerKey, addA],
              ['addSigner', a.signerKey, addAHigherHash],
            ]);
          });

          test('succeeds (no-ops) with lower message hash', () => {
            const addALowerHash: SignerAdd = { ...addA, hash: addA.hash.slice(0, -1) };
            expect(set.merge(addALowerHash).isOk()).toBe(true);
            expect(custodyAddress()).toEqual(custody1.signerKey);
            expect(signersByCustody()).toEqual(
              new Map([[custody1.signerKey, { adds: new Map([[a.signerKey, addA]]), removes: new Map() }]])
            );
            expect(events).toEqual([
              ['changeCustody', custody1.signerKey, custody1Register],
              ['addSigner', a.signerKey, addA],
            ]);
          });
        });
      });

      describe('when signer was already removed by a different custody address', () => {
        beforeEach(() => {
          expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        });

        test('succeeds with later custody address', () => {
          expect(set.merge(remA).isOk()).toBe(true);
          expect(set.merge(addA2).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody2.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([
              [custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA]]) }],
              [custody2.signerKey, { adds: new Map([[a.signerKey, addA2]]), removes: new Map() }],
            ])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['changeCustody', custody2.signerKey, custody2Transfer],
            ['addSigner', a.signerKey, addA2],
          ]);
        });

        test('succeeds but does not emit addSigner event with earlier custody address', () => {
          expect(set.merge(remA2).isOk()).toBe(true);
          expect(set.merge(addA).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody2.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([
              [custody2.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA2]]) }],
              [custody1.signerKey, { adds: new Map([[a.signerKey, addA]]), removes: new Map() }],
            ])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['changeCustody', custody2.signerKey, custody2Transfer],
            ['removeSigner', a.signerKey, remA2],
          ]);
        });
      });

      describe('when signer was already removed by the same custody address', () => {
        beforeEach(() => {
          expect(set.merge(remA).isOk()).toBe(true);
        });

        test('succeeds with later timestamp', () => {
          const addALater: SignerAdd = {
            ...addA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addA.data, signedAt: remA.data.signedAt + 1 },
          };
          expect(set.merge(addALater).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody1.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([[custody1.signerKey, { adds: new Map([[a.signerKey, addALater]]), removes: new Map() }]])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['removeSigner', a.signerKey, remA],
            ['addSigner', a.signerKey, addALater],
          ]);
        });

        test('succeeds (no-ops) with earlier timestamp', () => {
          const addAEarlier: SignerAdd = {
            ...addA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addA.data, signedAt: remA.data.signedAt - 1 },
          };
          expect(set.merge(addAEarlier).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody1.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([[custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA]]) }]])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['removeSigner', a.signerKey, remA],
          ]);
        });

        test('succeeds (no-ops) with the same timestamp', () => {
          const addASameTimestamp: SignerAdd = {
            ...addA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addA.data, signedAt: remA.data.signedAt },
          };
          expect(set.merge(addASameTimestamp).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody1.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([[custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA]]) }]])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['removeSigner', a.signerKey, remA],
          ]);
        });
      });

      describe('when signer is added and removed by two different custody addresses', () => {
        beforeEach(() => {
          expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        });

        afterEach(() => {
          expect(custodyAddress()).toEqual(custody2.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([
              [custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA]]) }],
              [custody2.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA2]]) }],
            ])
          );
        });
        test('succeeds when adds are received first', () => {
          for (const msg of [addA, addA2, remA, remA2]) {
            expect(set.merge(msg).isOk()).toBe(true);
          }
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['changeCustody', custody2.signerKey, custody2Transfer],
            ['addSigner', a.signerKey, addA2],
            ['removeSigner', a.signerKey, remA2],
          ]);
        });

        test('succeeds when removes are received first', () => {
          for (const msg of [remA, remA2, addA, addA2]) {
            expect(set.merge(msg).isOk()).toBe(true);
          }
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['changeCustody', custody2.signerKey, custody2Transfer],
            ['removeSigner', a.signerKey, remA2],
          ]);
        });

        test('succeeds when messages are ordered by custody address', () => {
          for (const msg of [addA, remA, addA2, remA2]) {
            expect(set.merge(msg).isOk()).toBe(true);
          }
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['changeCustody', custody2.signerKey, custody2Transfer],
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
        expect(custodyAddress()).toEqual(custody1.signerKey);
        expect(signersByCustody()).toEqual(
          new Map([[custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA]]) }]])
        );
        expect(events).toEqual([
          ['changeCustody', custody1.signerKey, custody1Register],
          ['addSigner', a.signerKey, addA],
          ['removeSigner', a.signerKey, remA],
        ]);
      });

      test('succeeds when signer has not been added', () => {
        expect(set.merge(remA).isOk()).toBe(true);
        expect(custodyAddress()).toEqual(custody1.signerKey);
        expect(signersByCustody()).toEqual(
          new Map([[custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA]]) }]])
        );
        expect(events).toEqual([
          ['changeCustody', custody1.signerKey, custody1Register],
          ['removeSigner', a.signerKey, remA],
        ]);
      });

      test('succeeds (no-ops) with duplicate signer remove message', () => {
        expect(set.merge(remA).isOk()).toBe(true);
        expect(set.merge(remA).isOk()).toBe(true);
        expect(custodyAddress()).toEqual(custody1.signerKey);
        expect(signersByCustody()).toEqual(
          new Map([[custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA]]) }]])
        );
        expect(events).toEqual([
          ['changeCustody', custody1.signerKey, custody1Register],
          ['removeSigner', a.signerKey, remA],
        ]);
      });

      test('fails when signer and delegate are the same', async () => {
        const remSelf = await Factories.SignerRemove.create(
          { data: { body: { delegate: custody1.signerKey } } },
          { transient: { signer: custody1 } }
        );
        const res = set.merge(remSelf);
        expect(res.isOk()).toBe(false);
        expect(res._unsafeUnwrapErr()).toBe('SignerSet.mergeSignerRemove: signer and delegate must be different');
        expect(custodyAddress()).toEqual(custody1.signerKey);
        expect(signersByCustody()).toEqual(new Map());
        expect(events).toEqual([['changeCustody', custody1.signerKey, custody1Register]]);
      });

      describe('when signer was already added by a different custody address', () => {
        beforeEach(() => {
          expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        });

        test('succeeds with later custody address', () => {
          expect(set.merge(addA).isOk()).toBe(true);
          expect(set.merge(remA2).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody2.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([
              [custody1.signerKey, { adds: new Map([[a.signerKey, addA]]), removes: new Map() }],
              [custody2.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA2]]) }],
            ])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['changeCustody', custody2.signerKey, custody2Transfer],
            ['removeSigner', a.signerKey, remA2],
          ]);
        });

        test('succeeds but does not emit removeSigner event with earlier custody address', () => {
          expect(set.merge(addA2).isOk()).toBe(true);
          expect(set.merge(remA).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody2.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([
              [custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA]]) }],
              [custody2.signerKey, { adds: new Map([[a.signerKey, addA2]]), removes: new Map() }],
            ])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['changeCustody', custody2.signerKey, custody2Transfer],
            ['addSigner', a.signerKey, addA2],
          ]);
        });
      });

      describe('when signer was already added by the same custody address', () => {
        beforeEach(() => {
          expect(set.merge(addA).isOk()).toBe(true);
        });

        test('succeeds with later timestamp', () => {
          expect(set.merge(remA).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody1.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([[custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA]]) }]])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['addSigner', a.signerKey, addA],
            ['removeSigner', a.signerKey, remA],
          ]);
        });

        test('succeeds (no-ops) with earlier timestamp', () => {
          const remAEarlier: SignerRemove = {
            ...remA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...remA.data, signedAt: addA.data.signedAt - 1 },
          };
          expect(set.merge(remAEarlier).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody1.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([[custody1.signerKey, { adds: new Map([[a.signerKey, addA]]), removes: new Map() }]])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['addSigner', a.signerKey, addA],
          ]);
        });

        test('succeeds with the same timestamp', () => {
          const remASameTimestamp: SignerRemove = {
            ...remA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...remA.data, signedAt: addA.data.signedAt },
          };
          expect(set.merge(remASameTimestamp).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody1.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([[custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remASameTimestamp]]) }]])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['addSigner', a.signerKey, addA],
            ['removeSigner', a.signerKey, remASameTimestamp],
          ]);
        });
      });

      describe('when signer was already removed by a different custody address', () => {
        beforeEach(() => {
          expect(set.mergeIDRegistryEvent(custody2Transfer).isOk()).toBe(true);
        });

        test('succeeds with later custody address', () => {
          expect(set.merge(remA).isOk()).toBe(true);
          expect(set.merge(remA2).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody2.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([
              [custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA]]) }],
              [custody2.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA2]]) }],
            ])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['changeCustody', custody2.signerKey, custody2Transfer],
            ['removeSigner', a.signerKey, remA2],
          ]);
        });

        test('succeeds but does not emit removeSigner event with earlier custody address', () => {
          expect(set.merge(remA2).isOk()).toBe(true);
          expect(set.merge(remA).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody2.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([
              [custody2.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA2]]) }],
              [custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA]]) }],
            ])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['changeCustody', custody2.signerKey, custody2Transfer],
            ['removeSigner', a.signerKey, remA2],
          ]);
        });
      });

      describe('when signer was already removed by the same custody address', () => {
        beforeEach(() => {
          expect(set.merge(remA).isOk()).toBe(true);
        });

        test('succeeds with later timestamp', () => {
          const remALater: SignerRemove = {
            ...remA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...remA.data, signedAt: remA.data.signedAt + 1 },
          };
          expect(set.merge(remALater).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody1.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([[custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remALater]]) }]])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['removeSigner', a.signerKey, remA],
            ['removeSigner', a.signerKey, remALater],
          ]);
        });

        test('succeeds (no-ops) with earlier timestamp', () => {
          const remAEarlier: SignerRemove = {
            ...remA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...remA.data, signedAt: remA.data.signedAt - 1 },
          };
          expect(set.merge(remAEarlier).isOk()).toBe(true);
          expect(custodyAddress()).toEqual(custody1.signerKey);
          expect(signersByCustody()).toEqual(
            new Map([[custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA]]) }]])
          );
          expect(events).toEqual([
            ['changeCustody', custody1.signerKey, custody1Register],
            ['removeSigner', a.signerKey, remA],
          ]);
        });

        describe('with the same timestamp', () => {
          test('succeeds with higher message hash', () => {
            const remAHigherHash: SignerRemove = { ...remA, hash: remA.hash + 'a' };
            expect(set.merge(remAHigherHash).isOk()).toBe(true);
            expect(custodyAddress()).toEqual(custody1.signerKey);
            expect(signersByCustody()).toEqual(
              new Map([[custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remAHigherHash]]) }]])
            );
            expect(events).toEqual([
              ['changeCustody', custody1.signerKey, custody1Register],
              ['removeSigner', a.signerKey, remA],
              ['removeSigner', a.signerKey, remAHigherHash],
            ]);
          });

          test('succeeds (no-ops) with lower message hash', () => {
            const remALowerHash: SignerRemove = { ...remA, hash: remA.hash.slice(0, -1) };
            expect(set.merge(remALowerHash).isOk()).toBe(true);
            expect(custodyAddress()).toEqual(custody1.signerKey);
            expect(signersByCustody()).toEqual(
              new Map([[custody1.signerKey, { adds: new Map(), removes: new Map([[a.signerKey, remA]]) }]])
            );
            expect(events).toEqual([
              ['changeCustody', custody1.signerKey, custody1Register],
              ['removeSigner', a.signerKey, remA],
            ]);
          });
        });
      });
    });
  });
});
