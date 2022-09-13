import { Factories } from '~/factories';
import Faker from 'faker';
import VerificationSet from '~/sets/verificationSet';
import {
  Ed25519Signer,
  Verification,
  VerificationEthereumAddress,
  VerificationEthereumAddressFactoryTransientParams,
  VerificationRemove,
} from '~/types';
import { ethers } from 'ethers';
import { generateEd25519Signer } from '~/utils';

const set = new VerificationSet();
const adds = () => set._getAdds();
const removes = () => set._getRemoves();

let signer: Ed25519Signer;
let ethWallet: ethers.Wallet;
let transientParams: { transient: VerificationEthereumAddressFactoryTransientParams };
let add1: VerificationEthereumAddress;
let add2: VerificationEthereumAddress;
let rem1: VerificationRemove;
let rem2: VerificationRemove;

beforeAll(async () => {
  signer = await generateEd25519Signer();
  ethWallet = ethers.Wallet.createRandom();
  transientParams = { transient: { signer: signer, ethWallet: ethWallet } };
  const cast = await Factories.CastShort.create({ data: { body: { text: Faker.datatype.string(280) } } });
  console.log(JSON.stringify(cast));
  add1 = await Factories.VerificationEthereumAddress.create({}, transientParams);
  add2 = await Factories.VerificationEthereumAddress.create({}, transientParams);
  console.log(JSON.stringify(add1));
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

describe('get', () => {
  test('fails when verification does not exist', () => {
    expect(set.get(add1.data.body.claimHash)).toBeFalsy();
  });

  test('returns VerificationEthereumAddress when added', () => {
    set.merge(add1);
    expect(set.get(add1.data.body.claimHash)).toEqual(add1);
  });

  test('returns VerificationRemove when removed', () => {
    set.merge(rem1);
    expect(set.get(add1.data.body.claimHash)).toEqual(rem1);
  });

  test('fails when using message hash', () => {
    set.merge(add1);
    expect(set.get(add1.hash)).toBeFalsy();
  });
});

describe('merge', () => {
  test('fails with an incorrect message type', async () => {
    const cast = (await Factories.CastShort.create()) as unknown as Verification;
    const res = set.merge(cast);
    expect(res.isOk()).toBe(false);
    expect(res._unsafeUnwrapErr()).toEqual('VerificationSet.merge: invalid message format');
    expect(adds()).toEqual(new Set());
    expect(removes()).toEqual(new Set());
  });

  describe('add', () => {
    test('succeeds with a valid VerificationEthereumAddress message', () => {
      expect(set.merge(add1).isOk()).toBe(true);
      expect(adds()).toEqual(new Set([add1]));
    });

    test('succeeds with multiple valid VerificationEthereumAddress messages', () => {
      expect(set.merge(add1).isOk()).toBe(true);
      expect(set.merge(add2).isOk()).toBe(true);
      expect(adds()).toEqual(new Set([add1, add2]));
    });

    test('succeeds (no-ops) if same, valid VerificationEthereumAddress message was already added', () => {
      expect(set.merge(add1).isOk()).toBe(true);
      expect(set.merge(add1).isOk()).toBe(true);
      expect(adds()).toEqual(new Set([add1]));
    });

    describe('when claimHash already added', () => {
      let add1Later: VerificationEthereumAddress;

      beforeAll(() => {
        add1Later = { ...add1, data: { ...add1.data, signedAt: add1.data.signedAt + 1 }, hash: add1.hash + 'a' };
      });

      test('succeeds with a later timestamp than existing add message', () => {
        expect(set.merge(add1).isOk()).toBe(true);
        expect(set.merge(add1Later).isOk()).toBe(true);
        expect(adds()).toEqual(new Set([add1Later]));
      });

      test('succeeds (no-ops) with an earlier timestamp than existing add message', () => {
        expect(set.merge(add1Later).isOk()).toBe(true);
        expect(set.merge(add1).isOk()).toBe(true);
        expect(adds()).toEqual(new Set([add1Later]));
      });

      describe('with same timestamp', () => {
        let add1HigherHash: VerificationEthereumAddress;

        beforeAll(() => {
          add1HigherHash = { ...add1, hash: add1.hash + 'a' };
        });

        test('succeeds with higher lexicographical order', () => {
          expect(set.merge(add1).isOk()).toBe(true);
          expect(set.merge(add1HigherHash).isOk()).toBe(true);
          expect(adds()).toEqual(new Set([add1HigherHash]));
        });

        test('succeeds (no-ops) with lower lexicographical order', () => {
          expect(set.merge(add1HigherHash).isOk()).toBe(true);
          expect(set.merge(add1).isOk()).toBe(true);
          expect(adds()).toEqual(new Set([add1HigherHash]));
        });
      });
    });

    describe('when claimHash already removed', () => {
      let add1Later: VerificationEthereumAddress;

      beforeAll(() => {
        add1Later = { ...add1, data: { ...add1.data, signedAt: rem1.data.signedAt + 1 } };
      });

      test('succeeds with a later timestamp than existing remove message', () => {
        expect(set.merge(add1).isOk()).toBe(true);
        expect(adds()).toEqual(new Set([add1]));
        expect(set.merge(rem1).isOk()).toBe(true);
        expect(adds()).toEqual(new Set());
        expect(removes()).toEqual(new Set([rem1]));
        expect(set.merge(add1Later).isOk()).toBe(true);
        expect(adds()).toEqual(new Set([add1Later]));
        expect(removes()).toEqual(new Set());
      });

      test('succeeds (no-ops) with an earlier timestamp than existing remove message', () => {
        expect(set.merge(rem1).isOk()).toBe(true);
        expect(set.merge(add1).isOk()).toBe(true);
        expect(adds()).toEqual(new Set());
      });

      test('succeeds (no-ops) with the same timestamp as remove message', () => {
        const add1SameTime = { ...add1, data: { ...add1.data, signedAt: rem1.data.signedAt } };
        expect(set.merge(rem1).isOk()).toBe(true);
        expect(set.merge(add1SameTime).isOk()).toBe(true);
        expect(adds()).toEqual(new Set());
      });

      test('reaches consensus even when messages are out of order', () => {
        expect(set.merge(add1Later).isOk()).toBe(true);
        expect(set.merge(rem1).isOk()).toBe(true);
        expect(set.merge(add1).isOk()).toBe(true);
        expect(adds()).toEqual(new Set([add1Later]));
        expect(removes()).toEqual(new Set());
      });
    });
  });

  describe('remove', () => {
    test('succeeds with a valid VerificationRemove message', () => {
      expect(set.merge(add1).isOk()).toBe(true);
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(adds()).toEqual(new Set());
      expect(removes()).toEqual(new Set([rem1]));
    });

    test("succeeds even if the VerificationEthereumAddress message doesn't exist", () => {
      expect(adds()).toEqual(new Set());
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(removes()).toEqual(new Set([rem1]));
      expect(adds()).toEqual(new Set());
    });

    test('succeeds with multiple valid VerificationRemove messages', () => {
      expect(adds()).toEqual(new Set());
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(set.merge(rem2).isOk()).toBe(true);
      expect(removes()).toEqual(new Set([rem1, rem2]));
    });

    test('succeeds (no-ops) if the same VerificationRemove message is added twice', () => {
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(removes()).toEqual(new Set([rem1]));
    });

    test('succeeds (no-ops) if matching VerificationEthereumAddress message has a later timestamp', () => {
      const add1Later = { ...add1, data: { ...add1.data, signedAt: rem1.data.signedAt + 1 } };
      expect(set.merge(add1Later).isOk()).toBe(true);
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(adds()).toEqual(new Set([add1Later]));
      expect(removes()).toEqual(new Set());
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
    expect(set._getAdds()).toEqual(new Set());
    expect(set._getRemoves()).toEqual(new Set());
  });

  test('succeeds and drops remove messages', () => {
    expect(set.merge(rem1).isOk()).toBe(true);
    expect(set.revokeSigner(rem1.signer).isOk()).toBe(true);
    expect(set._getAdds()).toEqual(new Set());
    expect(set._getRemoves()).toEqual(new Set());
  });

  test('suceeds and only removes messages from signer', () => {
    const add2NewSigner: VerificationEthereumAddress = { ...add2, signer: Faker.datatype.hexaDecimal(32) };
    expect(set.merge(add1).isOk()).toBe(true);
    expect(set.merge(add2NewSigner).isOk()).toBe(true);
    expect(set.revokeSigner(add2NewSigner.signer).isOk()).toBe(true);
    expect(set._getAdds()).toEqual(new Set([add1]));
    expect(set._getRemoves()).toEqual(new Set());
  });
});
