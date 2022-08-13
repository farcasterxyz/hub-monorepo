import { Factories } from '~/factories';
import VerificationSet from '~/sets/verificationSet';
import {
  MessageSigner,
  Verification,
  VerificationAdd,
  VerificationAddFactoryTransientParams,
  VerificationClaim,
  VerificationRemove,
} from '~/types';
import { ethers } from 'ethers';
import { generateEd25519Signer, hashFCObject } from '~/utils';

const set = new VerificationSet();
const adds = () => set._getAdds();
const removes = () => set._getRemoves();

describe('merge', () => {
  let aliceSigner: MessageSigner;
  let aliceEthWallet: ethers.Wallet;
  let aliceClaimHash: string;
  let aliceExternalSignature: string;
  let transientParams: { transient: VerificationAddFactoryTransientParams };

  let add1: VerificationAdd;
  let add2: VerificationAdd;
  let add3: VerificationAdd;

  let rem1: VerificationRemove;
  let rem2: VerificationRemove;

  beforeAll(async () => {
    aliceSigner = await generateEd25519Signer();
    aliceEthWallet = ethers.Wallet.createRandom();
    transientParams = { transient: { signer: aliceSigner, ethWallet: aliceEthWallet } };

    const verificationClaim: VerificationClaim = {
      username: 'alice',
      externalUri: aliceEthWallet.address,
    };
    aliceClaimHash = await hashFCObject(verificationClaim);

    aliceExternalSignature = await aliceEthWallet.signMessage(aliceClaimHash);

    add1 = await Factories.VerificationAdd.create(
      {
        data: {
          username: 'alice',
          body: {
            claimHash: aliceClaimHash,
            externalSignature: aliceExternalSignature,
          },
        },
      },
      transientParams
    );

    const { signedAt } = add1.data;

    add2 = await Factories.VerificationAdd.create(
      { data: { signedAt: signedAt + 2, body: { claimHash: aliceClaimHash } } },
      transientParams
    );

    add3 = await Factories.VerificationAdd.create(
      { data: { signedAt: signedAt, body: { claimHash: aliceClaimHash } } },
      transientParams
    );
    add3.hash = add1.hash + 'a';

    rem1 = await Factories.VerificationRemove.create({
      data: { signedAt: signedAt + 1, body: { claimHash: aliceClaimHash } },
    });
    rem2 = await Factories.VerificationRemove.create();
  });

  beforeEach(() => {
    set._reset();
  });

  test('fails with an incorrect message type', async () => {
    const cast = (await Factories.Cast.create()) as unknown as Verification;
    expect(set.merge(cast).isOk()).toBe(false);
    expect(adds()).toEqual([]);
    expect(removes()).toEqual([]);
  });

  describe('add', () => {
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

    describe('when claimHash already removed', () => {
      test('succeeds with a later timestamp than existing remove message', async () => {
        expect(set.merge(add1).isOk()).toBe(true);
        expect(adds()).toEqual([add1]);
        expect(set.merge(rem1).isOk()).toBe(true);
        expect(adds()).toEqual([]);
        expect(removes()).toEqual([rem1]);
        expect(set.merge(add2).isOk()).toBe(true);
        expect(adds()).toEqual([add2]);
        expect(removes()).toEqual([]);
      });

      test('fails with an earlier timestamp than existing remove message', async () => {
        expect(set.merge(rem1).isOk()).toBe(true);
        expect(set.merge(add1).isOk()).toBe(false);
        expect(adds()).toEqual([]);
      });

      test('fails with the same timestamp as remove message', async () => {
        expect(set.merge(rem1).isOk()).toBe(true);
        expect(set.merge(add3).isOk()).toBe(false);
        expect(adds()).toEqual([]);
      });

      test('reaches consensus even when messages are out of order', async () => {
        expect(set.merge(add2).isOk()).toBe(true);
        expect(set.merge(rem1).isOk()).toBe(false);
        expect(set.merge(add1).isOk()).toBe(false);
        expect(adds()).toEqual([add2]);
        expect(removes()).toEqual([]);
      });
    });
  });

  describe('remove', () => {
    test('succeeds with a valid VerificationRemove message', async () => {
      expect(set.merge(add1).isOk()).toBe(true);
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(adds()).toEqual([]);
      expect(removes()).toEqual([rem1]);
    });

    test("succeeds even if the VerificationAdd message doesn't exist", async () => {
      expect(adds()).toEqual([]);
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(removes()).toEqual([rem1]);
      expect(adds()).toEqual([]);
    });

    test('succeeds with multiple valid VerificationRemove messages', async () => {
      expect(adds()).toEqual([]);
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(set.merge(rem2).isOk()).toBe(true);
      expect(removes().length).toEqual(2);
    });

    test('fails if the same VerificationRemove message is added twice', async () => {
      expect(set.merge(rem1).isOk()).toBe(true);
      expect(set.merge(rem1).isOk()).toBe(false);
      expect(removes()).toEqual([rem1]);
    });

    test('fails if matching VerificationAdd message has a later timestamp', async () => {
      expect(set.merge(add2).isOk()).toBe(true);
      expect(set.merge(rem1).isOk()).toBe(false);
      expect(adds()).toEqual([add2]);
      expect(removes()).toEqual([]);
    });
  });
});
