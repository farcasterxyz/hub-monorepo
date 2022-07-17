import { ethers } from 'ethers';
import { Factories } from '~/factories';
import Faker from 'faker';
import VerificationsSet from '~/sets/verificationsSet';
import { Verification, VerificationAdd, VerificationRemove } from '~/types';
import { convertToHex, generateEd25519KeyPair } from '~/utils';
import { hexToBytes } from 'ethereum-cryptography/utils';

const set = new VerificationsSet();
const adds = () => set._getAdds();
const deletes = () => set._getDeletes();

describe('merge', () => {
  beforeEach(() => {
    set._reset();
  });

  test('fails with an incorrect message type', async () => {
    const cast = (await Factories.Cast.create()) as unknown as Verification;
    expect(set.merge(cast).isOk()).toBe(false);
    expect(adds()).toEqual([]);
    expect(deletes()).toEqual([]);
  });

  describe('add', () => {
    let add1: VerificationAdd;

    beforeAll(async () => {
      add1 = await Factories.VerificationAdd.create();
    });

    test('succeeds with a valid VerificationAdd message', async () => {
      expect(set.merge(add1).isOk()).toBe(true);
      expect(adds()).toEqual([add1]);
    });

    test('succeeds with multiple valid VerificationAdd messages', async () => {
      const add2 = await Factories.VerificationAdd.create();
      expect(set.merge(add1).isOk()).toBe(true);
      expect(set.merge(add2).isOk()).toBe(true);
      expect(adds().length).toEqual(2);
    });

    test('fails if same, valid VerificationAdd message was already added', async () => {
      expect(set.merge(add1).isOk()).toBe(true);
      expect(set.merge(add1).isOk()).toBe(false);
      expect(adds()).toEqual([add1]);
    });

    describe('when claimHash already added', () => {
      let add2: VerificationAdd;

      beforeAll(async () => {
        const {
          data: {
            signedAt,
            body: { claimHash },
          },
        } = add1;
        add2 = await Factories.VerificationAdd.create({ data: { signedAt: signedAt + 2, body: { claimHash } } });
      });

      test('succeeds with a later timestamp than existing add message', async () => {
        expect(set.merge(add1).isOk()).toBe(true);
        expect(set.merge(add2).isOk()).toBe(true);
        expect(adds()).toEqual([add2]);
      });

      test('fails with an earlier timestamp than existing add message', async () => {
        expect(set.merge(add2).isOk()).toBe(true);
        expect(set.merge(add1).isOk()).toBe(false);
        expect(adds()).toEqual([add2]);
      });

      describe('with same timestamp', () => {
        let add3: VerificationAdd;

        beforeAll(async () => {
          const {
            data: {
              signedAt,
              body: { claimHash },
            },
          } = add1;
          add3 = await Factories.VerificationAdd.create({ data: { signedAt, body: { claimHash } } });
          add3.hash = add1.hash + 'a';
        });

        test('succeeds with higher lexicographical order', () => {
          expect(set.merge(add1).isOk()).toBe(true);
          expect(set.merge(add3).isOk()).toBe(true);
          expect(adds()).toEqual([add3]);
        });

        test('fails with lower lexicographical order', () => {
          expect(set.merge(add3).isOk()).toBe(true);
          expect(set.merge(add1).isOk()).toBe(false);
          expect(adds()).toEqual([add3]);
        });
      });
    });

    describe('when claimHash already deleted', () => {
      let rem1: VerificationRemove;
      let add2: VerificationAdd;

      beforeAll(async () => {
        const {
          data: {
            signedAt,
            body: { claimHash },
          },
        } = add1;
        rem1 = await Factories.VerificationRemove.create({ data: { signedAt: signedAt + 1, body: { claimHash } } });
        add2 = await Factories.VerificationAdd.create({ data: { signedAt: signedAt + 2, body: { claimHash } } });
      });

      test('succeeds with a later timestamp than existing remove message', async () => {
        expect(set.merge(add1).isOk()).toBe(true);
        expect(adds()).toEqual([add1]);
        expect(set.merge(rem1).isOk()).toBe(true);
        expect(adds()).toEqual([]);
        expect(deletes()).toEqual([rem1]);
        expect(set.merge(add2).isOk()).toBe(true);
        expect(adds()).toEqual([add2]);
        expect(deletes()).toEqual([]);
      });

      test('fails with an earlier timestamp than existing remove message', async () => {
        expect(set.merge(rem1).isOk()).toBe(true);
        expect(set.merge(add1).isOk()).toBe(false);
        expect(adds()).toEqual([]);
      });

      test('fails with the same timestamp as remove message', async () => {
        const {
          data: {
            signedAt,
            body: { claimHash },
          },
        } = rem1;
        const add3 = await Factories.VerificationAdd.create({ data: { signedAt, body: { claimHash } } });
        expect(set.merge(rem1).isOk()).toBe(true);
        expect(set.merge(add3).isOk()).toBe(false);
        expect(adds()).toEqual([]);
      });

      test('reaches consensus even when messages are out of order', async () => {
        expect(set.merge(add2).isOk()).toBe(true);
        expect(set.merge(rem1).isOk()).toBe(false);
        expect(set.merge(add1).isOk()).toBe(false);
        expect(adds()).toEqual([add2]);
        expect(deletes()).toEqual([]);
      });
    });
  });

  describe('remove', () => {
    let add1: VerificationAdd;
    let rem1: VerificationRemove;

    beforeAll(async () => {
      add1 = await Factories.VerificationAdd.create();
      rem1 = await Factories.VerificationRemove.create({
        data: { signedAt: add1.data.signedAt + 1, body: { claimHash: add1.data.body.claimHash } },
      });
    });

    test('succeeds with a valid VerificationRemove message', async () => {
      expect(set.merge(add1).isOk()).toBe(true);
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(adds()).toEqual([]);
      expect(deletes()).toEqual([rem1]);
    });

    test("succeeds even if the VerificationAdd message doesn't exist", async () => {
      expect(adds()).toEqual([]);
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(deletes()).toEqual([rem1]);
      expect(adds()).toEqual([]);
    });

    test('succeeds with multiple valid VerificationRemove messages', async () => {
      expect(adds()).toEqual([]);
      const rem2 = await Factories.VerificationRemove.create();
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(set.merge(rem2).isOk()).toBe(true);
      expect(deletes().length).toEqual(2);
    });

    test('fails if the same VerificationRemove message is added twice', async () => {
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(set.merge(rem1).isOk()).toBe(false);
      expect(deletes()).toEqual([rem1]);
    });

    test('fails if matching VerificationAdd message has a later timestamp', async () => {
      const add2 = await Factories.VerificationAdd.create({
        data: { signedAt: rem1.data.signedAt + 2, body: { claimHash: rem1.data.body.claimHash } },
      });
      expect(set.merge(add2).isOk()).toBe(true);
      expect(set.merge(rem1).isOk()).toBe(false);
      expect(adds()).toEqual([add2]);
      expect(deletes()).toEqual([]);
    });
  });
});
