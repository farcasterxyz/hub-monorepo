import Faker from 'faker';
import { SignerAdd, SignerRemove, EthereumSigner, Ed25519Signer, IDRegistryEvent } from '~/types';
import SignerSet, { SignerSetEvents } from '~/sets/signerSet';
import { Factories } from '~/factories';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';

import { jestRocksDB } from '~/db/jestUtils';
import SignerDB from '~/db/signer';

const rocksDb = jestRocksDB('signerSet.test');
const testDb = new SignerDB(rocksDb);

const fid = Faker.datatype.number();
const set = new SignerSet(rocksDb);

const custodyAddress = () => set.getCustodyAddress(fid);

const signersByCustody = async (custodyAddress: string) => {
  const getAdds = await testDb.getSignerAddsByUser(fid, custodyAddress);
  const getRemoves = await testDb.getSignerRemovesByUser(fid, custodyAddress);
  return {
    adds: new Map(getAdds.map((signerAdd) => [signerAdd.data.body.delegate, signerAdd.hash])),
    removes: new Map(getRemoves.map((signerRemove) => [signerRemove.data.body.delegate, signerRemove.hash])),
  };
};

let events: any[] = [];
const eventNames: (keyof SignerSetEvents)[] = ['changeCustody', 'addSigner', 'removeSigner'];
for (const eventName of eventNames) {
  set.addListener(eventName, (...args: any[]) => events.push([eventName, ...args]));
}

// Custody Addresses
let custody1: EthereumSigner;
let custody2: EthereumSigner;

// Custody Address Events
let custody1Register: IDRegistryEvent;
let custody2Transfer: IDRegistryEvent;

// Singers
let a: Ed25519Signer;
let b: Ed25519Signer;

// Signer Messages
let addATo1: SignerAdd;
let addATo2: SignerAdd;
let remAFrom1: SignerRemove;
let remAFrom2: SignerRemove;
let addBTo1: SignerAdd;

beforeAll(async () => {
  custody1 = await generateEthereumSigner();
  custody1Register = await Factories.IDRegistryEvent.create({ args: { to: custody1.signerKey, id: fid } }, {});
  custody2 = await generateEthereumSigner();
  custody2Transfer = await Factories.IDRegistryEvent.create({
    args: { to: custody2.signerKey, id: fid },
    blockNumber: custody1Register.blockNumber + 1,
  });
  a = await generateEd25519Signer();
  addATo1 = await Factories.SignerAdd.create({ data: { fid } }, { transient: { signer: custody1, delegateSigner: a } });
  remAFrom1 = await Factories.SignerRemove.create(
    { data: { fid, body: { delegate: a.signerKey } } },
    { transient: { signer: custody1 } }
  );
  addATo2 = await Factories.SignerAdd.create({ data: { fid } }, { transient: { signer: custody2, delegateSigner: a } });
  remAFrom2 = await Factories.SignerRemove.create(
    { data: { fid, body: { delegate: a.signerKey } } },
    { transient: { signer: custody2 } }
  );
  b = await generateEd25519Signer();
  addBTo1 = await Factories.SignerAdd.create({ data: { fid } }, { transient: { signer: custody1, delegateSigner: b } });
});

afterAll(() => {
  set.removeAllListeners();
});

beforeEach(() => {
  events = [];
});

describe('getCustodyAddress', () => {
  test('fails when custody address does not exist', async () => {
    const res = set.getCustodyAddress(fid);
    await expect(res).rejects.toThrow();
  });

  test('succeeds when custody event has been added', async () => {
    await set.mergeIDRegistryEvent(custody1Register);
    const res = set.getCustodyAddress(fid);
    await expect(res).resolves.toEqual(custody1.signerKey);
  });

  test('succeeds after custody address has been changed', async () => {
    await set.mergeIDRegistryEvent(custody1Register);
    await set.mergeIDRegistryEvent(custody2Transfer);
    const res = set.getCustodyAddress(fid);
    await expect(res).resolves.toEqual(custody2.signerKey);
  });
});

describe('getSigner', () => {
  test('fails when custody address does not exist', async () => {
    const res = set.getSigner(fid, a.signerKey);
    await expect(res).rejects.toThrow();
  });

  test('fails when called with a custody address', async () => {
    await set.mergeIDRegistryEvent(custody1Register);
    const res = set.getSigner(fid, custody1.signerKey);
    await expect(res).rejects.toThrow();
  });

  test('fails when delegate signer does not exist', async () => {
    const res = set.getSigner(fid, a.signerKey);
    await expect(res).rejects.toThrow();
  });

  test('returns SignerAdd when delegate signer has been added', async () => {
    await set.mergeIDRegistryEvent(custody1Register);
    await set.merge(addATo1);
    const res = set.getSigner(fid, a.signerKey);
    await expect(res).resolves.toEqual(addATo1);
  });

  test('fails when delegate signer has been removed', async () => {
    await set.mergeIDRegistryEvent(custody1Register);
    await set.merge(addATo1);
    await set.merge(remAFrom1);
    const res = set.getSigner(fid, a.signerKey);
    await expect(res).rejects.toThrow();
  });

  test('fails when custody address has been changed', async () => {
    await set.mergeIDRegistryEvent(custody1Register);
    await set.merge(addATo1);
    await set.mergeIDRegistryEvent(custody2Transfer);
    const res = set.getSigner(fid, a.signerKey);
    await expect(res).rejects.toThrow();
  });
});

describe('mergeIDRegistryEvent', () => {
  test('succeeds with new custody address', async () => {
    await expect(set.mergeIDRegistryEvent(custody1Register)).resolves.toEqual(undefined);
    await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
    await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({ adds: new Map(), removes: new Map() });
    expect(events).toEqual([['changeCustody', fid, custody1.signerKey, custody1Register]]);
  });

  test('succeeds with multiple new custody addresses', async () => {
    await expect(set.mergeIDRegistryEvent(custody1Register)).resolves.toEqual(undefined);
    await expect(set.mergeIDRegistryEvent(custody2Transfer)).resolves.toEqual(undefined);
    await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
    await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({ adds: new Map(), removes: new Map() });
    await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({ adds: new Map(), removes: new Map() });
    expect(events).toEqual([
      ['changeCustody', fid, custody1.signerKey, custody1Register],
      ['changeCustody', fid, custody2.signerKey, custody2Transfer],
    ]);
  });

  describe('with existing custody address', () => {
    beforeEach(async () => {
      await set.mergeIDRegistryEvent(custody1Register);
    });

    test('succeeds (no-ops) with duplicate custody address', async () => {
      await expect(set.mergeIDRegistryEvent(custody1Register)).resolves.toEqual(undefined);
      await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
      await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({ adds: new Map(), removes: new Map() });
      expect(events).toEqual([['changeCustody', fid, custody1.signerKey, custody1Register]]);
    });

    test('succeeds (no-ops) with the same block, earlier log index', async () => {
      const addSameBlockEarlierLog: IDRegistryEvent = {
        ...custody2Transfer,
        blockNumber: custody1Register.blockNumber,
        logIndex: custody1Register.logIndex - 1,
      };
      await expect(set.mergeIDRegistryEvent(addSameBlockEarlierLog)).resolves.toEqual(undefined);
      await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
      await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({ adds: new Map(), removes: new Map() });
      expect(events).toEqual([['changeCustody', fid, custody1.signerKey, custody1Register]]);
    });

    test('succeeds with the same block, later log index', async () => {
      const addSameBlockLaterLog: IDRegistryEvent = {
        ...custody2Transfer,
        blockNumber: custody1Register.blockNumber,
        logIndex: custody1Register.logIndex + 1,
      };
      await expect(set.mergeIDRegistryEvent(addSameBlockLaterLog)).resolves.toEqual(undefined);
      await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
      await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({ adds: new Map(), removes: new Map() });
      expect(events).toEqual([
        ['changeCustody', fid, custody1.signerKey, custody1Register],
        ['changeCustody', fid, custody2.signerKey, addSameBlockLaterLog],
      ]);
    });

    test('succeeds when custody address is re-added later', async () => {
      await expect(set.mergeIDRegistryEvent(custody2Transfer)).resolves.toEqual(undefined);
      const custody1Transfer: IDRegistryEvent = {
        ...custody1Register,
        name: 'Transfer',
        blockNumber: custody2Transfer.blockNumber + 1,
      };
      await expect(set.mergeIDRegistryEvent(custody1Transfer)).resolves.toEqual(undefined);
      await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
      await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({ adds: new Map(), removes: new Map() });
      await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({ adds: new Map(), removes: new Map() });
      expect(events).toEqual([
        ['changeCustody', fid, custody1.signerKey, custody1Register],
        ['changeCustody', fid, custody2.signerKey, custody2Transfer],
        ['changeCustody', fid, custody1.signerKey, custody1Transfer],
      ]);
    });

    describe('with signers', () => {
      beforeEach(async () => {
        await set.merge(addATo1);
      });

      test('succeeds and emits removeSigner event', async () => {
        await expect(set.mergeIDRegistryEvent(custody2Transfer)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
        await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({ adds: new Map(), removes: new Map() });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['addSigner', fid, a.signerKey, addATo1],
          ['changeCustody', fid, custody2.signerKey, custody2Transfer],
          ['removeSigner', fid, a.signerKey], // Revoke signer
        ]);
      });

      test('succeeds and does not emit new removeSigner event when signer has been removed', async () => {
        await expect(set.merge(remAFrom1)).resolves.toEqual(undefined);
        await expect(set.mergeIDRegistryEvent(custody2Transfer)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
        await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({ adds: new Map(), removes: new Map() });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['addSigner', fid, a.signerKey, addATo1],
          ['removeSigner', fid, a.signerKey, remAFrom1],
          ['changeCustody', fid, custody2.signerKey, custody2Transfer],
        ]);
      });
    });

    describe('with new signers', () => {
      beforeEach(async () => {
        await set.merge(addATo2);
      });

      test('succeeds and emits addSigner event', async () => {
        await expect(set.mergeIDRegistryEvent(custody2Transfer)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
        await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
          adds: new Map([[a.signerKey, addATo2.hash]]),
          removes: new Map(),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['changeCustody', fid, custody2.signerKey, custody2Transfer],
          ['addSigner', fid, a.signerKey, addATo2],
        ]);
      });

      test('succeeds and does not emit addSigner event when signer has been removed', async () => {
        await expect(set.merge(remAFrom2)).resolves.toEqual(undefined);
        await expect(set.mergeIDRegistryEvent(custody2Transfer)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
        await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
          adds: new Map(),
          removes: new Map([[a.signerKey, remAFrom2.hash]]),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['changeCustody', fid, custody2.signerKey, custody2Transfer],
        ]);
      });
    });

    test('succeeds and emits addSigner event when the same signer was added by both custody addresses', async () => {
      await expect(set.merge(addATo1)).resolves.toEqual(undefined);
      await expect(set.merge(addATo2)).resolves.toEqual(undefined);
      await expect(set.mergeIDRegistryEvent(custody2Transfer)).resolves.toEqual(undefined);
      await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
      await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
        adds: new Map([[a.signerKey, addATo2.hash]]),
        removes: new Map(),
      });
      expect(events).toEqual([
        ['changeCustody', fid, custody1.signerKey, custody1Register],
        ['addSigner', fid, a.signerKey, addATo1],
        ['changeCustody', fid, custody2.signerKey, custody2Transfer],
        ['addSigner', fid, a.signerKey, addATo2],
      ]);
    });
  });
});

describe('merge', () => {
  test('fails with invalid message type', async () => {
    const invalidMessage = (await Factories.CastShort.create()) as any as SignerAdd;
    const res = set.merge(invalidMessage);
    await expect(res).rejects.toThrow();
  });

  describe('without custody address', () => {
    describe('mergeSignerAdd', () => {
      test('succeeds but does not emit addSigner event', async () => {
        await expect(set.merge(addATo1)).resolves.toEqual(undefined);
        await expect(custodyAddress()).rejects.toThrow();
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map([[a.signerKey, addATo1.hash]]),
          removes: new Map(),
        });
        expect(events).toEqual([]);
      });
    });

    describe('mergeSignerRemove', () => {
      test('succeeds but does not emit removeSigner event', async () => {
        await expect(set.merge(remAFrom1)).resolves.toEqual(undefined);
        await expect(custodyAddress()).rejects.toThrow();
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map(),
          removes: new Map([[a.signerKey, remAFrom1.hash]]),
        });
        expect(events).toEqual([]);
      });
    });
  });

  describe('with custody address', () => {
    beforeEach(async () => {
      await set.mergeIDRegistryEvent(custody1Register);
    });

    describe('mergeSignerAdd', () => {
      test('succeeds with a valid SignerAdd message', async () => {
        await expect(set.merge(addATo1)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map([[a.signerKey, addATo1.hash]]),
          removes: new Map(),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['addSigner', fid, a.signerKey, addATo1],
        ]);
      });

      test('succeeds but does not emit addSigner event with a duplicate valid SignerAdd message', async () => {
        await expect(set.merge(addATo1)).resolves.toEqual(undefined);
        await expect(set.merge(addATo1)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map([[a.signerKey, addATo1.hash]]),
          removes: new Map(),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['addSigner', fid, a.signerKey, addATo1],
        ]);
      });

      test('succeeds with multiple valid SignerAdd messages', async () => {
        await expect(set.merge(addATo1)).resolves.toEqual(undefined);
        await expect(set.merge(addBTo1)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map([
            [a.signerKey, addATo1.hash],
            [b.signerKey, addBTo1.hash],
          ]),
          removes: new Map(),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['addSigner', fid, a.signerKey, addATo1],
          ['addSigner', fid, b.signerKey, addBTo1],
        ]);
      });

      test('fails when signer and delegate are the same', async () => {
        const addSelf = await Factories.SignerAdd.create(
          { data: { body: { delegate: custody1.signerKey } } },
          { transient: { signer: custody1 } }
        );
        await expect(set.merge(addSelf)).rejects.toThrow();
        await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({ adds: new Map(), removes: new Map() });
        expect(events).toEqual([['changeCustody', fid, custody1.signerKey, custody1Register]]);
      });

      describe('when signer was already added by a different custody address', () => {
        beforeEach(async () => {
          await set.mergeIDRegistryEvent(custody2Transfer);
        });

        test('succeeds with later custody address', async () => {
          await expect(set.merge(addATo1)).resolves.toEqual(undefined);
          await expect(set.merge(addATo2)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addATo1.hash]]),
            removes: new Map(),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addATo2.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['addSigner', fid, a.signerKey, addATo2],
          ]);
        });

        test('succeeds but does not emit addSigner event with earlier custody address', async () => {
          await expect(set.merge(addATo2)).resolves.toEqual(undefined);
          await expect(set.merge(addATo1)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addATo1.hash]]),
            removes: new Map(),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addATo2.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['addSigner', fid, a.signerKey, addATo2],
          ]);
        });
      });

      describe('when signer was already added by the same custody address', () => {
        beforeEach(async () => {
          await set.merge(addATo1);
        });

        test('succeeds with later timestamp', async () => {
          const addALater: SignerAdd = {
            ...addATo1,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addATo1.data, signedAt: addATo1.data.signedAt + 1 },
          };
          await expect(set.merge(addALater)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addALater.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['addSigner', fid, a.signerKey, addATo1],
            ['addSigner', fid, a.signerKey, addALater],
          ]);
        });

        test('succeeds (no-ops) with earlier timestamp', async () => {
          const addAEarlier: SignerAdd = {
            ...addATo1,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addATo1.data, signedAt: addATo1.data.signedAt - 1 },
          };
          await expect(set.merge(addAEarlier)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addATo1.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['addSigner', fid, a.signerKey, addATo1],
          ]);
        });

        describe('with the same timestamp', () => {
          test('succeeds with higher message hash', async () => {
            const addAHigherHash: SignerAdd = { ...addATo1, hash: addATo1.hash + 'a' };
            await expect(set.merge(addAHigherHash)).resolves.toEqual(undefined);
            await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
            await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
              adds: new Map([[a.signerKey, addAHigherHash.hash]]),
              removes: new Map(),
            });
            expect(events).toEqual([
              ['changeCustody', fid, custody1.signerKey, custody1Register],
              ['addSigner', fid, a.signerKey, addATo1],
              ['addSigner', fid, a.signerKey, addAHigherHash],
            ]);
          });

          test('succeeds (no-ops) with lower message hash', async () => {
            const addALowerHash: SignerAdd = { ...addATo1, hash: addATo1.hash.slice(0, -1) };
            await expect(set.merge(addALowerHash)).resolves.toEqual(undefined);
            await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
            await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
              adds: new Map([[a.signerKey, addATo1.hash]]),
              removes: new Map(),
            });
            expect(events).toEqual([
              ['changeCustody', fid, custody1.signerKey, custody1Register],
              ['addSigner', fid, a.signerKey, addATo1],
            ]);
          });
        });
      });

      describe('when signer was already removed by a different custody address', () => {
        beforeEach(async () => {
          await set.mergeIDRegistryEvent(custody2Transfer);
        });

        test('succeeds with later custody address', async () => {
          await expect(set.merge(remAFrom1)).resolves.toEqual(undefined);
          await expect(set.merge(addATo2)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remAFrom1.hash]]),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addATo2.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['addSigner', fid, a.signerKey, addATo2],
          ]);
        });

        test('succeeds but does not emit addSigner event with earlier custody address', async () => {
          await expect(set.merge(remAFrom2)).resolves.toEqual(undefined);
          await expect(set.merge(addATo1)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addATo1.hash]]),
            removes: new Map(),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remAFrom2.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['removeSigner', fid, a.signerKey, remAFrom2],
          ]);
        });
      });

      describe('when signer was already removed by the same custody address', () => {
        beforeEach(async () => {
          await set.merge(remAFrom1);
        });

        test('succeeds with later timestamp', async () => {
          const addALater: SignerAdd = {
            ...addATo1,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addATo1.data, signedAt: remAFrom1.data.signedAt + 1 },
          };
          await expect(set.merge(addALater)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addALater.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['removeSigner', fid, a.signerKey, remAFrom1],
            ['addSigner', fid, a.signerKey, addALater],
          ]);
        });

        test('succeeds (no-ops) with earlier timestamp', async () => {
          const addAEarlier: SignerAdd = {
            ...addATo1,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addATo1.data, signedAt: remAFrom1.data.signedAt - 1 },
          };
          await expect(set.merge(addAEarlier)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remAFrom1.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['removeSigner', fid, a.signerKey, remAFrom1],
          ]);
        });

        test('succeeds (no-ops) with the same timestamp', async () => {
          const addASameTimestamp: SignerAdd = {
            ...addATo1,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addATo1.data, signedAt: remAFrom1.data.signedAt },
          };
          await expect(set.merge(addASameTimestamp)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remAFrom1.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['removeSigner', fid, a.signerKey, remAFrom1],
          ]);
        });
      });

      describe('when signer is added and removed by two different custody addresses', () => {
        beforeEach(async () => {
          await set.mergeIDRegistryEvent(custody2Transfer);
        });

        afterEach(async () => {
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remAFrom1.hash]]),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remAFrom2.hash]]),
          });
        });
        test('succeeds when adds are received first', async () => {
          for (const msg of [addATo1, addATo2, remAFrom1, remAFrom2]) {
            await expect(set.merge(msg)).resolves.toEqual(undefined);
          }
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['addSigner', fid, a.signerKey, addATo2],
            ['removeSigner', fid, a.signerKey, remAFrom2],
          ]);
        });

        test('succeeds when removes are received first', async () => {
          for (const msg of [remAFrom1, remAFrom2, addATo1, addATo2]) {
            await expect(set.merge(msg)).resolves.toEqual(undefined);
          }
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['removeSigner', fid, a.signerKey, remAFrom2],
          ]);
        });

        test('succeeds when messages are ordered by custody address', async () => {
          for (const msg of [addATo1, remAFrom1, addATo2, remAFrom2]) {
            await expect(set.merge(msg)).resolves.toEqual(undefined);
          }
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['addSigner', fid, a.signerKey, addATo2],
            ['removeSigner', fid, a.signerKey, remAFrom2],
          ]);
        });
      });
    });

    describe('mergeSignerRemove', () => {
      test('succeeds with a valid SignerRemove message', async () => {
        await expect(set.merge(addATo1)).resolves.toEqual(undefined);
        await expect(set.merge(remAFrom1)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map(),
          removes: new Map([[a.signerKey, remAFrom1.hash]]),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['addSigner', fid, a.signerKey, addATo1],
          ['removeSigner', fid, a.signerKey, remAFrom1],
        ]);
      });

      test('succeeds when signer has not been added', async () => {
        await expect(set.merge(remAFrom1)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map(),
          removes: new Map([[a.signerKey, remAFrom1.hash]]),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['removeSigner', fid, a.signerKey, remAFrom1],
        ]);
      });

      test('succeeds (no-ops) with duplicate signer remove message', async () => {
        await expect(set.merge(remAFrom1)).resolves.toEqual(undefined);
        await expect(set.merge(remAFrom1)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map(),
          removes: new Map([[a.signerKey, remAFrom1.hash]]),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['removeSigner', fid, a.signerKey, remAFrom1],
        ]);
      });

      test('fails when signer and delegate are the same', async () => {
        const remSelf = await Factories.SignerRemove.create(
          { data: { body: { delegate: custody1.signerKey } } },
          { transient: { signer: custody1 } }
        );
        await expect(set.merge(remSelf)).rejects.toThrow();
        await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({ adds: new Map(), removes: new Map() });
        expect(events).toEqual([['changeCustody', fid, custody1.signerKey, custody1Register]]);
      });

      describe('when signer was already added by a different custody address', () => {
        beforeEach(async () => {
          await set.mergeIDRegistryEvent(custody2Transfer);
        });

        test('succeeds with later custody address', async () => {
          await expect(set.merge(addATo1)).resolves.toEqual(undefined);
          await expect(set.merge(remAFrom2)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addATo1.hash]]),
            removes: new Map(),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remAFrom2.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['removeSigner', fid, a.signerKey, remAFrom2],
          ]);
        });

        test('succeeds but does not emit removeSigner event with earlier custody address', async () => {
          await expect(set.merge(addATo2)).resolves.toEqual(undefined);
          await expect(set.merge(remAFrom1)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remAFrom1.hash]]),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addATo2.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['addSigner', fid, a.signerKey, addATo2],
          ]);
        });
      });

      describe('when signer was already added by the same custody address', () => {
        beforeEach(async () => {
          await set.merge(addATo1);
        });

        test('succeeds with later timestamp', async () => {
          await expect(set.merge(remAFrom1)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remAFrom1.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['addSigner', fid, a.signerKey, addATo1],
            ['removeSigner', fid, a.signerKey, remAFrom1],
          ]);
        });

        test('succeeds (no-ops) with earlier timestamp', async () => {
          const remAEarlier: SignerRemove = {
            ...remAFrom1,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...remAFrom1.data, signedAt: addATo1.data.signedAt - 1 },
          };
          await expect(set.merge(remAEarlier)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addATo1.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['addSigner', fid, a.signerKey, addATo1],
          ]);
        });

        test('succeeds with the same timestamp', async () => {
          const remASameTimestamp: SignerRemove = {
            ...remAFrom1,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...remAFrom1.data, signedAt: addATo1.data.signedAt },
          };
          await expect(set.merge(remASameTimestamp)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remASameTimestamp.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['addSigner', fid, a.signerKey, addATo1],
            ['removeSigner', fid, a.signerKey, remASameTimestamp],
          ]);
        });
      });

      describe('when signer was already removed by a different custody address', () => {
        beforeEach(async () => {
          await set.mergeIDRegistryEvent(custody2Transfer);
        });

        test('succeeds with later custody address', async () => {
          await expect(set.merge(remAFrom1)).resolves.toEqual(undefined);
          await expect(set.merge(remAFrom2)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remAFrom1.hash]]),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remAFrom2.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['removeSigner', fid, a.signerKey, remAFrom2],
          ]);
        });

        test('succeeds but does not emit removeSigner event with earlier custody address', async () => {
          await expect(set.merge(remAFrom2)).resolves.toEqual(undefined);
          await expect(set.merge(remAFrom1)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remAFrom1.hash]]),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remAFrom2.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['removeSigner', fid, a.signerKey, remAFrom2],
          ]);
        });
      });

      describe('when signer was already removed by the same custody address', () => {
        beforeEach(async () => {
          await set.merge(remAFrom1);
        });

        test('succeeds with later timestamp', async () => {
          const remALater: SignerRemove = {
            ...remAFrom1,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...remAFrom1.data, signedAt: remAFrom1.data.signedAt + 1 },
          };
          await expect(set.merge(remALater)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remALater.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['removeSigner', fid, a.signerKey, remAFrom1],
            ['removeSigner', fid, a.signerKey, remALater],
          ]);
        });

        test('succeeds (no-ops) with earlier timestamp', async () => {
          const remAEarlier: SignerRemove = {
            ...remAFrom1,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...remAFrom1.data, signedAt: remAFrom1.data.signedAt - 1 },
          };
          await expect(set.merge(remAEarlier)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remAFrom1.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['removeSigner', fid, a.signerKey, remAFrom1],
          ]);
        });

        describe('with the same timestamp', () => {
          test('succeeds with higher message hash', async () => {
            const remAHigherHash: SignerRemove = { ...remAFrom1, hash: remAFrom1.hash + 'a' };
            await expect(set.merge(remAHigherHash)).resolves.toEqual(undefined);
            await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
            await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
              adds: new Map(),
              removes: new Map([[a.signerKey, remAHigherHash.hash]]),
            });
            expect(events).toEqual([
              ['changeCustody', fid, custody1.signerKey, custody1Register],
              ['removeSigner', fid, a.signerKey, remAFrom1],
              ['removeSigner', fid, a.signerKey, remAHigherHash],
            ]);
          });

          test('succeeds (no-ops) with lower message hash', async () => {
            const remALowerHash: SignerRemove = { ...remAFrom1, hash: remAFrom1.hash.slice(0, -1) };
            await expect(set.merge(remALowerHash)).resolves.toEqual(undefined);
            await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
            await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
              adds: new Map(),
              removes: new Map([[a.signerKey, remAFrom1.hash]]),
            });
            expect(events).toEqual([
              ['changeCustody', fid, custody1.signerKey, custody1Register],
              ['removeSigner', fid, a.signerKey, remAFrom1],
            ]);
          });
        });
      });
    });
  });
});
