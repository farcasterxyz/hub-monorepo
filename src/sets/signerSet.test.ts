import Faker from 'faker';
import { SignerAdd, SignerRemove, EthereumSigner, Ed25519Signer, IDRegistryEvent } from '~/types';
import SignerSet, { SignerSetEvents } from '~/sets/signerSet';
import { Factories } from '~/factories';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';

import { jestRocksDB } from '~/db/jestUtils';
import SignerDB from '~/db/signer';

const rocksDb = jestRocksDB('castSet.test');
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
  custody1Register = await Factories.IDRegistryEvent.create({ args: { to: custody1.signerKey, id: fid } }, {});
  custody2 = await generateEthereumSigner();
  custody2Transfer = await Factories.IDRegistryEvent.create({
    args: { to: custody2.signerKey, id: fid },
    blockNumber: custody1Register.blockNumber + 1,
  });
  a = await generateEd25519Signer();
  addA = await Factories.SignerAdd.create({ data: { fid } }, { transient: { signer: custody1, delegateSigner: a } });
  remA = await Factories.SignerRemove.create(
    { data: { fid, body: { delegate: a.signerKey } } },
    { transient: { signer: custody1 } }
  );
  addA2 = await Factories.SignerAdd.create({ data: { fid } }, { transient: { signer: custody2, delegateSigner: a } });
  remA2 = await Factories.SignerRemove.create(
    { data: { fid, body: { delegate: a.signerKey } } },
    { transient: { signer: custody2 } }
  );
  b = await generateEd25519Signer();
  addB = await Factories.SignerAdd.create({ data: { fid } }, { transient: { signer: custody1, delegateSigner: b } });
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
    const res = set.getSigner(fid, custody1.signerKey);
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
    await set.merge(addA);
    const res = set.getSigner(fid, a.signerKey);
    await expect(res).resolves.toEqual(addA);
  });

  test('fails when delegate signer has been removed', async () => {
    await set.mergeIDRegistryEvent(custody1Register);
    await set.merge(addA);
    await set.merge(remA);
    const res = set.getSigner(fid, a.signerKey);
    await expect(res).rejects.toThrow();
  });

  test('fails when custody address has been changed', async () => {
    await set.mergeIDRegistryEvent(custody1Register);
    await set.merge(addA);
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
        await set.merge(addA);
      });

      test('succeeds and emits removeSigner event', async () => {
        await expect(set.mergeIDRegistryEvent(custody2Transfer)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
        await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({ adds: new Map(), removes: new Map() });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['addSigner', fid, a.signerKey, addA],
          ['changeCustody', fid, custody2.signerKey, custody2Transfer],
          ['removeSigner', fid, a.signerKey], // Revoke signer
        ]);
      });

      test('succeeds and does not emit new removeSigner event when signer has been removed', async () => {
        await expect(set.merge(remA)).resolves.toEqual(undefined);
        await expect(set.mergeIDRegistryEvent(custody2Transfer)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
        await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({ adds: new Map(), removes: new Map() });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['addSigner', fid, a.signerKey, addA],
          ['removeSigner', fid, a.signerKey, remA],
          ['changeCustody', fid, custody2.signerKey, custody2Transfer],
        ]);
      });
    });

    describe('with new signers', () => {
      beforeEach(async () => {
        await set.merge(addA2);
      });

      test('succeeds and emits addSigner event', async () => {
        await expect(set.mergeIDRegistryEvent(custody2Transfer)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
        await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
          adds: new Map([[a.signerKey, addA2.hash]]),
          removes: new Map(),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['changeCustody', fid, custody2.signerKey, custody2Transfer],
          ['addSigner', fid, a.signerKey, addA2],
        ]);
      });

      test('succeeds and does not emit addSigner event when signer has been removed', async () => {
        await expect(set.merge(remA2)).resolves.toEqual(undefined);
        await expect(set.mergeIDRegistryEvent(custody2Transfer)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
        await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
          adds: new Map(),
          removes: new Map([[a.signerKey, remA2.hash]]),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['changeCustody', fid, custody2.signerKey, custody2Transfer],
        ]);
      });
    });

    test('succeeds and emits addSigner event when the same signer was added by both custody addresses', async () => {
      await expect(set.merge(addA)).resolves.toEqual(undefined);
      await expect(set.merge(addA2)).resolves.toEqual(undefined);
      await expect(set.mergeIDRegistryEvent(custody2Transfer)).resolves.toEqual(undefined);
      await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
      await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
        adds: new Map([[a.signerKey, addA2.hash]]),
        removes: new Map(),
      });
      expect(events).toEqual([
        ['changeCustody', fid, custody1.signerKey, custody1Register],
        ['addSigner', fid, a.signerKey, addA],
        ['changeCustody', fid, custody2.signerKey, custody2Transfer],
        ['addSigner', fid, a.signerKey, addA2],
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
        await expect(set.merge(addA)).resolves.toEqual(undefined);
        await expect(custodyAddress()).rejects.toThrow();
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map([[a.signerKey, addA.hash]]),
          removes: new Map(),
        });
        expect(events).toEqual([]);
      });
    });

    describe('mergeSignerRemove', () => {
      test('succeeds but does not emit removeSigner event', async () => {
        await expect(set.merge(remA)).resolves.toEqual(undefined);
        await expect(custodyAddress()).rejects.toThrow();
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map(),
          removes: new Map([[a.signerKey, remA.hash]]),
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
        await expect(set.merge(addA)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map([[a.signerKey, addA.hash]]),
          removes: new Map(),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['addSigner', fid, a.signerKey, addA],
        ]);
      });

      test('succeeds but does not emit addSigner event with a duplicate valid SignerAdd message', async () => {
        await expect(set.merge(addA)).resolves.toEqual(undefined);
        await expect(set.merge(addA)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map([[a.signerKey, addA.hash]]),
          removes: new Map(),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['addSigner', fid, a.signerKey, addA],
        ]);
      });

      test('succeeds with multiple valid SignerAdd messages', async () => {
        await expect(set.merge(addA)).resolves.toEqual(undefined);
        await expect(set.merge(addB)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map([
            [a.signerKey, addA.hash],
            [b.signerKey, addB.hash],
          ]),
          removes: new Map(),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['addSigner', fid, a.signerKey, addA],
          ['addSigner', fid, b.signerKey, addB],
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
          await expect(set.merge(addA)).resolves.toEqual(undefined);
          await expect(set.merge(addA2)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addA.hash]]),
            removes: new Map(),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addA2.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['addSigner', fid, a.signerKey, addA2],
          ]);
        });

        test('succeeds but does not emit addSigner event with earlier custody address', async () => {
          await expect(set.merge(addA2)).resolves.toEqual(undefined);
          await expect(set.merge(addA)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addA.hash]]),
            removes: new Map(),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addA2.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['addSigner', fid, a.signerKey, addA2],
          ]);
        });
      });

      describe('when signer was already added by the same custody address', () => {
        beforeEach(async () => {
          await set.merge(addA);
        });

        test('succeeds with later timestamp', async () => {
          const addALater: SignerAdd = {
            ...addA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addA.data, signedAt: addA.data.signedAt + 1 },
          };
          await expect(set.merge(addALater)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addALater.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['addSigner', fid, a.signerKey, addA],
            ['addSigner', fid, a.signerKey, addALater],
          ]);
        });

        test('succeeds (no-ops) with earlier timestamp', async () => {
          const addAEarlier: SignerAdd = {
            ...addA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addA.data, signedAt: addA.data.signedAt - 1 },
          };
          await expect(set.merge(addAEarlier)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addA.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['addSigner', fid, a.signerKey, addA],
          ]);
        });

        describe('with the same timestamp', () => {
          test('succeeds with higher message hash', async () => {
            const addAHigherHash: SignerAdd = { ...addA, hash: addA.hash + 'a' };
            await expect(set.merge(addAHigherHash)).resolves.toEqual(undefined);
            await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
            await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
              adds: new Map([[a.signerKey, addAHigherHash.hash]]),
              removes: new Map(),
            });
            expect(events).toEqual([
              ['changeCustody', fid, custody1.signerKey, custody1Register],
              ['addSigner', fid, a.signerKey, addA],
              ['addSigner', fid, a.signerKey, addAHigherHash],
            ]);
          });

          test('succeeds (no-ops) with lower message hash', async () => {
            const addALowerHash: SignerAdd = { ...addA, hash: addA.hash.slice(0, -1) };
            await expect(set.merge(addALowerHash)).resolves.toEqual(undefined);
            await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
            await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
              adds: new Map([[a.signerKey, addA.hash]]),
              removes: new Map(),
            });
            expect(events).toEqual([
              ['changeCustody', fid, custody1.signerKey, custody1Register],
              ['addSigner', fid, a.signerKey, addA],
            ]);
          });
        });
      });

      describe('when signer was already removed by a different custody address', () => {
        beforeEach(async () => {
          await set.mergeIDRegistryEvent(custody2Transfer);
        });

        test('succeeds with later custody address', async () => {
          await expect(set.merge(remA)).resolves.toEqual(undefined);
          await expect(set.merge(addA2)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remA.hash]]),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addA2.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['addSigner', fid, a.signerKey, addA2],
          ]);
        });

        test('succeeds but does not emit addSigner event with earlier custody address', async () => {
          await expect(set.merge(remA2)).resolves.toEqual(undefined);
          await expect(set.merge(addA)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addA.hash]]),
            removes: new Map(),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remA2.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['removeSigner', fid, a.signerKey, remA2],
          ]);
        });
      });

      describe('when signer was already removed by the same custody address', () => {
        beforeEach(async () => {
          await set.merge(remA);
        });

        test('succeeds with later timestamp', async () => {
          const addALater: SignerAdd = {
            ...addA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addA.data, signedAt: remA.data.signedAt + 1 },
          };
          await expect(set.merge(addALater)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addALater.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['removeSigner', fid, a.signerKey, remA],
            ['addSigner', fid, a.signerKey, addALater],
          ]);
        });

        test('succeeds (no-ops) with earlier timestamp', async () => {
          const addAEarlier: SignerAdd = {
            ...addA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addA.data, signedAt: remA.data.signedAt - 1 },
          };
          await expect(set.merge(addAEarlier)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remA.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['removeSigner', fid, a.signerKey, remA],
          ]);
        });

        test('succeeds (no-ops) with the same timestamp', async () => {
          const addASameTimestamp: SignerAdd = {
            ...addA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...addA.data, signedAt: remA.data.signedAt },
          };
          await expect(set.merge(addASameTimestamp)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remA.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['removeSigner', fid, a.signerKey, remA],
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
            removes: new Map([[a.signerKey, remA.hash]]),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remA2.hash]]),
          });
        });
        test('succeeds when adds are received first', async () => {
          for (const msg of [addA, addA2, remA, remA2]) {
            await expect(set.merge(msg)).resolves.toEqual(undefined);
          }
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['addSigner', fid, a.signerKey, addA2],
            ['removeSigner', fid, a.signerKey, remA2],
          ]);
        });

        test('succeeds when removes are received first', async () => {
          for (const msg of [remA, remA2, addA, addA2]) {
            await expect(set.merge(msg)).resolves.toEqual(undefined);
          }
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['removeSigner', fid, a.signerKey, remA2],
          ]);
        });

        test('succeeds when messages are ordered by custody address', async () => {
          for (const msg of [addA, remA, addA2, remA2]) {
            await expect(set.merge(msg)).resolves.toEqual(undefined);
          }
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['addSigner', fid, a.signerKey, addA2],
            ['removeSigner', fid, a.signerKey, remA2],
          ]);
        });
      });
    });

    describe('mergeSignerRemove', () => {
      test('succeeds with a valid SignerRemove message', async () => {
        await expect(set.merge(addA)).resolves.toEqual(undefined);
        await expect(set.merge(remA)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map(),
          removes: new Map([[a.signerKey, remA.hash]]),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['addSigner', fid, a.signerKey, addA],
          ['removeSigner', fid, a.signerKey, remA],
        ]);
      });

      test('succeeds when signer has not been added', async () => {
        await expect(set.merge(remA)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map(),
          removes: new Map([[a.signerKey, remA.hash]]),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['removeSigner', fid, a.signerKey, remA],
        ]);
      });

      test('succeeds (no-ops) with duplicate signer remove message', async () => {
        await expect(set.merge(remA)).resolves.toEqual(undefined);
        await expect(set.merge(remA)).resolves.toEqual(undefined);
        await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
        await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
          adds: new Map(),
          removes: new Map([[a.signerKey, remA.hash]]),
        });
        expect(events).toEqual([
          ['changeCustody', fid, custody1.signerKey, custody1Register],
          ['removeSigner', fid, a.signerKey, remA],
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
          await expect(set.merge(addA)).resolves.toEqual(undefined);
          await expect(set.merge(remA2)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addA.hash]]),
            removes: new Map(),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remA2.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['removeSigner', fid, a.signerKey, remA2],
          ]);
        });

        test('succeeds but does not emit removeSigner event with earlier custody address', async () => {
          await expect(set.merge(addA2)).resolves.toEqual(undefined);
          await expect(set.merge(remA)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remA.hash]]),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addA2.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['addSigner', fid, a.signerKey, addA2],
          ]);
        });
      });

      describe('when signer was already added by the same custody address', () => {
        beforeEach(async () => {
          await set.merge(addA);
        });

        test('succeeds with later timestamp', async () => {
          await expect(set.merge(remA)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remA.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['addSigner', fid, a.signerKey, addA],
            ['removeSigner', fid, a.signerKey, remA],
          ]);
        });

        test('succeeds (no-ops) with earlier timestamp', async () => {
          const remAEarlier: SignerRemove = {
            ...remA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...remA.data, signedAt: addA.data.signedAt - 1 },
          };
          await expect(set.merge(remAEarlier)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map([[a.signerKey, addA.hash]]),
            removes: new Map(),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['addSigner', fid, a.signerKey, addA],
          ]);
        });

        test('succeeds with the same timestamp', async () => {
          const remASameTimestamp: SignerRemove = {
            ...remA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...remA.data, signedAt: addA.data.signedAt },
          };
          await expect(set.merge(remASameTimestamp)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remASameTimestamp.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['addSigner', fid, a.signerKey, addA],
            ['removeSigner', fid, a.signerKey, remASameTimestamp],
          ]);
        });
      });

      describe('when signer was already removed by a different custody address', () => {
        beforeEach(async () => {
          await set.mergeIDRegistryEvent(custody2Transfer);
        });

        test('succeeds with later custody address', async () => {
          await expect(set.merge(remA)).resolves.toEqual(undefined);
          await expect(set.merge(remA2)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remA.hash]]),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remA2.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['removeSigner', fid, a.signerKey, remA2],
          ]);
        });

        test('succeeds but does not emit removeSigner event with earlier custody address', async () => {
          await expect(set.merge(remA2)).resolves.toEqual(undefined);
          await expect(set.merge(remA)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody2.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remA.hash]]),
          });
          await expect(signersByCustody(custody2.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remA2.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['changeCustody', fid, custody2.signerKey, custody2Transfer],
            ['removeSigner', fid, a.signerKey, remA2],
          ]);
        });
      });

      describe('when signer was already removed by the same custody address', () => {
        beforeEach(async () => {
          await set.merge(remA);
        });

        test('succeeds with later timestamp', async () => {
          const remALater: SignerRemove = {
            ...remA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...remA.data, signedAt: remA.data.signedAt + 1 },
          };
          await expect(set.merge(remALater)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remALater.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['removeSigner', fid, a.signerKey, remA],
            ['removeSigner', fid, a.signerKey, remALater],
          ]);
        });

        test('succeeds (no-ops) with earlier timestamp', async () => {
          const remAEarlier: SignerRemove = {
            ...remA,
            hash: Faker.datatype.hexaDecimal(128),
            data: { ...remA.data, signedAt: remA.data.signedAt - 1 },
          };
          await expect(set.merge(remAEarlier)).resolves.toEqual(undefined);
          await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
          await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
            adds: new Map(),
            removes: new Map([[a.signerKey, remA.hash]]),
          });
          expect(events).toEqual([
            ['changeCustody', fid, custody1.signerKey, custody1Register],
            ['removeSigner', fid, a.signerKey, remA],
          ]);
        });

        describe('with the same timestamp', () => {
          test('succeeds with higher message hash', async () => {
            const remAHigherHash: SignerRemove = { ...remA, hash: remA.hash + 'a' };
            await expect(set.merge(remAHigherHash)).resolves.toEqual(undefined);
            await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
            await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
              adds: new Map(),
              removes: new Map([[a.signerKey, remAHigherHash.hash]]),
            });
            expect(events).toEqual([
              ['changeCustody', fid, custody1.signerKey, custody1Register],
              ['removeSigner', fid, a.signerKey, remA],
              ['removeSigner', fid, a.signerKey, remAHigherHash],
            ]);
          });

          test('succeeds (no-ops) with lower message hash', async () => {
            const remALowerHash: SignerRemove = { ...remA, hash: remA.hash.slice(0, -1) };
            await expect(set.merge(remALowerHash)).resolves.toEqual(undefined);
            await expect(custodyAddress()).resolves.toEqual(custody1.signerKey);
            await expect(signersByCustody(custody1.signerKey)).resolves.toEqual({
              adds: new Map(),
              removes: new Map([[a.signerKey, remA.hash]]),
            });
            expect(events).toEqual([
              ['changeCustody', fid, custody1.signerKey, custody1Register],
              ['removeSigner', fid, a.signerKey, remA],
            ]);
          });
        });
      });
    });
  });
});
