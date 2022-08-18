import { Factories } from '~/factories';
import Faker from 'faker';
import VerificationSet from '~/sets/verificationSet';
import {
  Ed25519Signer,
  Verification,
  VerificationAdd,
  VerificationAddFactoryTransientParams,
  VerificationRemove,
} from '~/types';
import { ethers } from 'ethers';
import { generateEd25519Signer } from '~/utils';

const set = new VerificationSet();
const adds = () => set._getAdds();
const removes = () => set._getRemoves();

let signer: Ed25519Signer;
let ethWallet: ethers.Wallet;
let transientParams: { transient: VerificationAddFactoryTransientParams };
let add1: VerificationAdd;
let add2: VerificationAdd;
let rem1: VerificationRemove;
let rem2: VerificationRemove;

beforeAll(async () => {
  signer = await generateEd25519Signer();
  ethWallet = ethers.Wallet.createRandom();
  transientParams = { transient: { signer: signer, ethWallet: ethWallet } };
  add1 = await Factories.VerificationAdd.create({}, transientParams);
  add2 = await Factories.VerificationAdd.create({}, transientParams);
  rem1 = await Factories.VerificationRemove.create(
    {
      data: { signedAt: add1.data.signedAt + 1, body: { claimHash: add1.data.body.claimHash } },
    },
    transientParams
  );
  rem2 = await Factories.VerificationRemove.create(
    {
      data: { signedAt: add2.data.signedAt + 1, body: { claimHash: add2.data.body.claimHash } },
    },
    transientParams
  );
});

beforeEach(() => {
  set._reset();
});

describe('merge', () => {
  test('fails with an incorrect message type', async () => {
    const cast = (await Factories.Cast.create()) as unknown as Verification;
    expect(set.merge(cast).isOk()).toBe(false);
    expect(adds()).toEqual([]);
    expect(removes()).toEqual([]);
  });

  describe('add', () => {
    test('succeeds with a valid VerificationAdd message', () => {
      expect(set.merge(add1).isOk()).toBe(true);
      expect(adds()).toEqual([add1]);
    });

    test('succeeds with multiple valid VerificationAdd messages', () => {
      expect(set.merge(add1).isOk()).toBe(true);
      expect(set.merge(add2).isOk()).toBe(true);
      expect(adds().length).toEqual(2);
    });

    test('fails if same, valid VerificationAdd message was already added', () => {
      expect(set.merge(add1).isOk()).toBe(true);
      expect(set.merge(add1).isOk()).toBe(false);
      expect(adds()).toEqual([add1]);
    });

    describe('when claimHash already added', () => {
      let add1Later: VerificationAdd;
      beforeAll(() => {
        add1Later = { ...add1, data: { ...add1.data, signedAt: add1.data.signedAt + 1 }, hash: add1.hash + 'a' };
      });
      test('succeeds with a later timestamp than existing add message', () => {
        expect(set.merge(add1).isOk()).toBe(true);
        expect(set.merge(add1Later).isOk()).toBe(true);
        expect(adds()).toEqual([add1Later]);
      });

      test('fails with an earlier timestamp than existing add message', () => {
        expect(set.merge(add1Later).isOk()).toBe(true);
        expect(set.merge(add1).isOk()).toBe(false);
        expect(adds()).toEqual([add1Later]);
      });

      describe('with same timestamp', () => {
        let add1HigherHash: VerificationAdd;
        beforeAll(() => {
          add1HigherHash = { ...add1, hash: add1.hash + 'a' };
        });
        test('succeeds with higher lexicographical order', () => {
          expect(set.merge(add1).isOk()).toBe(true);
          expect(set.merge(add1HigherHash).isOk()).toBe(true);
          expect(adds()).toEqual([add1HigherHash]);
        });

        test('fails with lower lexicographical order', () => {
          expect(set.merge(add1HigherHash).isOk()).toBe(true);
          expect(set.merge(add1).isOk()).toBe(false);
          expect(adds()).toEqual([add1HigherHash]);
        });
      });
    });

    describe('when claimHash already removed', () => {
      let add1Later: VerificationAdd;
      beforeAll(() => {
        add1Later = { ...add1, data: { ...add1.data, signedAt: rem1.data.signedAt + 1 } };
      });
      test('succeeds with a later timestamp than existing remove message', () => {
        expect(set.merge(add1).isOk()).toBe(true);
        expect(adds()).toEqual([add1]);
        expect(set.merge(rem1).isOk()).toBe(true);
        expect(adds()).toEqual([]);
        expect(removes()).toEqual([rem1]);
        expect(set.merge(add1Later).isOk()).toBe(true);
        expect(adds()).toEqual([add1Later]);
        expect(removes()).toEqual([]);
      });

      test('fails with an earlier timestamp than existing remove message', () => {
        expect(set.merge(rem1).isOk()).toBe(true);
        expect(set.merge(add1).isOk()).toBe(false);
        expect(adds()).toEqual([]);
      });

      test('fails with the same timestamp as remove message', () => {
        const add1SameTime = { ...add1, data: { ...add1.data, signedAt: rem1.data.signedAt } };
        expect(set.merge(rem1).isOk()).toBe(true);
        expect(set.merge(add1SameTime).isOk()).toBe(false);
        expect(adds()).toEqual([]);
      });

      test('reaches consensus even when messages are out of order', () => {
        expect(set.merge(add1Later).isOk()).toBe(true);
        expect(set.merge(rem1).isOk()).toBe(false);
        expect(set.merge(add1).isOk()).toBe(false);
        expect(adds()).toEqual([add1Later]);
        expect(removes()).toEqual([]);
      });
    });
  });

  describe('remove', () => {
    test('succeeds with a valid VerificationRemove message', () => {
      expect(set.merge(add1).isOk()).toBe(true);
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(adds()).toEqual([]);
      expect(removes()).toEqual([rem1]);
    });

    test("succeeds even if the VerificationAdd message doesn't exist", () => {
      expect(adds()).toEqual([]);
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(removes()).toEqual([rem1]);
      expect(adds()).toEqual([]);
    });

    test('succeeds with multiple valid VerificationRemove messages', () => {
      expect(adds()).toEqual([]);
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(set.merge(rem2).isOk()).toBe(true);
      expect(removes().length).toEqual(2);
    });

    test('fails if the same VerificationRemove message is added twice', () => {
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(set.merge(rem1).isOk()).toBe(false);
      expect(removes()).toEqual([rem1]);
    });

    test('fails if matching VerificationAdd message has a later timestamp', () => {
      const add1Later = { ...add1, data: { ...add1.data, signedAt: rem1.data.signedAt + 1 } };
      expect(set.merge(add1Later).isOk()).toBe(true);
      expect(set.merge(rem1).isOk()).toBe(false);
      expect(adds()).toEqual([add1Later]);
      expect(removes()).toEqual([]);
    });
  });
});

describe('revokeSigner', () => {
  test('succeeds without any messages', () => {
    expect(set.revokeSigner(add1.signer).isOk()).toBe(true);
  });

  test('succeeds and drops add messages', () => {
    expect(set.merge(add1).isOk()).toBe(true);
    expect(set.revokeSigner(add1.signer).isOk()).toBe(true);
    expect(set._getAdds()).toEqual([]);
    expect(set._getRemoves()).toEqual([]);
  });

  test('succeeds and drops remove messages', () => {
    expect(set.merge(rem1).isOk()).toBe(true);
    expect(set.revokeSigner(rem1.signer).isOk()).toBe(true);
    expect(set._getAdds()).toEqual([]);
    expect(set._getRemoves()).toEqual([]);
  });

  test('suceeds and only removes messages from signer', () => {
    const add2NewSigner: VerificationAdd = { ...add2, signer: Faker.datatype.hexaDecimal(32) };
    expect(set.merge(add1).isOk()).toBe(true);
    expect(set.merge(add2NewSigner).isOk()).toBe(true);
    expect(set.revokeSigner(add2NewSigner.signer).isOk()).toBe(true);
    expect(set._getAdds()).toEqual([add1]);
    expect(set._getRemoves()).toEqual([]);
  });
});
