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

  beforeAll(async () => {
    aliceSigner = await generateEd25519Signer();
    aliceEthWallet = ethers.Wallet.createRandom();
    transientParams = { transient: { signer: aliceSigner, ethWallet: aliceEthWallet } };

    // Generate a claim hash for alice
    const verificationClaim: VerificationClaim = {
      username: 'alice',
      externalUri: aliceEthWallet.address,
    };
    aliceClaimHash = await hashFCObject(verificationClaim);

    // Generate an external signature for alice
    aliceExternalSignature = await aliceEthWallet.signMessage(aliceClaimHash);
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
    let add1: VerificationAdd;

    beforeAll(async () => {
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
        add2 = await Factories.VerificationAdd.create(
          { data: { signedAt: signedAt + 2, body: { claimHash } } },
          transientParams
        );
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
          add3 = await Factories.VerificationAdd.create({ data: { signedAt, body: { claimHash } } }, transientParams);
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

    describe('when claimHash already removed', () => {
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
        add2 = await Factories.VerificationAdd.create(
          { data: { signedAt: signedAt + 2, body: { claimHash } } },
          transientParams
        );
      });

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
        const {
          data: {
            signedAt,
            body: { claimHash },
          },
        } = rem1;
        const add3 = await Factories.VerificationAdd.create(
          { data: { signedAt, body: { claimHash } } },
          transientParams
        );
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
    let add1: VerificationAdd;
    let rem1: VerificationRemove;

    beforeAll(async () => {
      add1 = await Factories.VerificationAdd.create({}, transientParams);
      rem1 = await Factories.VerificationRemove.create({
        data: { signedAt: add1.data.signedAt + 1, body: { claimHash: add1.data.body.claimHash } },
      });
    });

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
      const rem2 = await Factories.VerificationRemove.create();
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
      const add2 = await Factories.VerificationAdd.create(
        {
          data: { signedAt: rem1.data.signedAt + 2, body: { claimHash: rem1.data.body.claimHash } },
        },
        transientParams
      );
      expect(set.merge(add2).isOk()).toBe(true);
      expect(set.merge(rem1).isOk()).toBe(false);
      expect(adds()).toEqual([add2]);
      expect(removes()).toEqual([]);
    });
  });
});
