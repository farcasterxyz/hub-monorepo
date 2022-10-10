import { Factories } from '~/test/factories';
import Faker from 'faker';
import VerificationSet from '~/storage/sets/verificationSet';
import {
  Ed25519Signer,
  Verification,
  VerificationEthereumAddress,
  VerificationEthereumAddressFactoryTransientParams,
  VerificationRemove,
} from '~/types';
import { ethers } from 'ethers';
import { generateEd25519Signer } from '~/utils/crypto';
import VerificationDB from '~/storage/db/verification';
import { BadRequestError, NotFoundError } from '~/utils/errors';
import { jestRocksDB } from '~/storage/db/jestUtils';

const testDb = jestRocksDB('verificationSet.test');
const verificationDb = new VerificationDB(testDb);
const set = new VerificationSet(testDb);

const fid = Faker.datatype.number();

const adds = async (): Promise<Set<VerificationEthereumAddress>> => {
  const verificationAdds = await verificationDb.getVerificationAddsByUser(fid);
  return new Set(verificationAdds);
};
const removes = async (): Promise<Set<VerificationRemove>> => {
  const verificationRemoves = await verificationDb.getVerificationRemovesByUser(fid);
  return new Set(verificationRemoves);
};

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
  add1 = await Factories.VerificationEthereumAddress.create({ data: { fid } }, transientParams);
  add2 = await Factories.VerificationEthereumAddress.create({ data: { fid } }, transientParams);
  rem1 = await Factories.VerificationRemove.create(
    {
      data: { fid, signedAt: add1.data.signedAt + 1, body: { claimHash: add1.data.body.claimHash } },
    },
    transientParams
  );
  rem2 = await Factories.VerificationRemove.create(
    {
      data: { fid, signedAt: add2.data.signedAt + 1, body: { claimHash: add2.data.body.claimHash } },
    },
    transientParams
  );
});

describe('getVerification', () => {
  test('fails when verification does not exist', async () => {
    await expect(set.getVerification(fid, add1.data.body.claimHash)).rejects.toThrow(NotFoundError);
  });

  test('returns VerificationEthereumAddress when added', async () => {
    await set.merge(add1);
    await expect(set.getVerification(fid, add1.data.body.claimHash)).resolves.toEqual(add1);
  });

  test('fails when removed', async () => {
    await set.merge(rem1);
    await expect(set.getVerification(fid, add1.data.body.claimHash)).rejects.toThrow(NotFoundError);
  });

  test('fails when using message hash', async () => {
    await set.merge(add1);
    await expect(set.getVerification(fid, add1.hash)).rejects.toThrow(NotFoundError);
  });
});

describe('merge', () => {
  test('fails with an incorrect message type', async () => {
    const cast = (await Factories.CastShort.create()) as unknown as Verification;
    await expect(set.merge(cast)).rejects.toThrow(BadRequestError);
    await expect(adds()).resolves.toEqual(new Set());
    await expect(removes()).resolves.toEqual(new Set());
  });

  describe('VerificationEthereumAddress', () => {
    test('succeeds with a valid VerificationEthereumAddress message', async () => {
      await expect(set.merge(add1)).resolves.toEqual(undefined);
      await expect(adds()).resolves.toEqual(new Set([add1]));
    });

    test('succeeds with multiple valid VerificationEthereumAddress messages', async () => {
      await expect(set.merge(add1)).resolves.toEqual(undefined);
      await expect(set.merge(add2)).resolves.toEqual(undefined);
      await expect(adds()).resolves.toEqual(new Set([add1, add2]));
    });

    test('succeeds (no-ops) if same, valid VerificationEthereumAddress message was already added', async () => {
      await expect(set.merge(add1)).resolves.toEqual(undefined);
      await expect(set.merge(add1)).resolves.toEqual(undefined);
      await expect(adds()).resolves.toEqual(new Set([add1]));
    });

    describe('when claimHash already added', () => {
      let add1Later: VerificationEthereumAddress;

      beforeAll(() => {
        add1Later = { ...add1, data: { ...add1.data, signedAt: add1.data.signedAt + 1 }, hash: add1.hash + 'a' };
      });

      test('succeeds with a later timestamp than existing add message', async () => {
        await expect(set.merge(add1)).resolves.toEqual(undefined);
        await expect(set.merge(add1Later)).resolves.toEqual(undefined);
        await expect(adds()).resolves.toEqual(new Set([add1Later]));
      });

      test('succeeds (no-ops) with an earlier timestamp than existing add message', async () => {
        await expect(set.merge(add1Later)).resolves.toEqual(undefined);
        await expect(set.merge(add1)).resolves.toEqual(undefined);
        await expect(adds()).resolves.toEqual(new Set([add1Later]));
      });

      describe('with same timestamp', () => {
        let add1HigherHash: VerificationEthereumAddress;

        beforeAll(() => {
          add1HigherHash = { ...add1, hash: add1.hash + 'a' };
        });

        test('succeeds with higher lexicographical order', async () => {
          await expect(set.merge(add1)).resolves.toEqual(undefined);
          await expect(set.merge(add1HigherHash)).resolves.toEqual(undefined);
          await expect(adds()).resolves.toEqual(new Set([add1HigherHash]));
        });

        test('succeeds (no-ops) with lower lexicographical order', async () => {
          await expect(set.merge(add1HigherHash)).resolves.toEqual(undefined);
          await expect(set.merge(add1)).resolves.toEqual(undefined);
          await expect(adds()).resolves.toEqual(new Set([add1HigherHash]));
        });
      });
    });

    describe('when claimHash already removed', () => {
      let add1Later: VerificationEthereumAddress;

      beforeAll(() => {
        add1Later = { ...add1, data: { ...add1.data, signedAt: rem1.data.signedAt + 1 } };
      });

      test('succeeds with a later timestamp than existing remove message', async () => {
        await set.merge(rem1);
        await expect(set.merge(add1Later)).resolves.toEqual(undefined);
        await expect(adds()).resolves.toEqual(new Set([add1Later]));
        await expect(removes()).resolves.toEqual(new Set());
      });

      test('succeeds (no-ops) with an earlier timestamp than existing remove message', async () => {
        await set.merge(rem1);
        await expect(set.merge(add1)).resolves.toEqual(undefined);
        await expect(adds()).resolves.toEqual(new Set());
      });

      test('succeeds (no-ops) with the same timestamp as remove message', async () => {
        const add1SameTime = { ...add1, data: { ...add1.data, signedAt: rem1.data.signedAt } };
        await set.merge(rem1);
        await expect(set.merge(add1SameTime)).resolves.toEqual(undefined);
        await expect(adds()).resolves.toEqual(new Set());
      });

      test('reaches consensus even when messages are out of order', async () => {
        await set.merge(add1Later);
        await set.merge(rem1);
        await set.merge(add1);
        await expect(adds()).resolves.toEqual(new Set([add1Later]));
        await expect(removes()).resolves.toEqual(new Set());
      });
    });
  });

  describe('VerificationRemove', () => {
    test('succeeds with a valid VerificationRemove message', async () => {
      await set.merge(add1);
      await expect(set.merge(rem1)).resolves.toEqual(undefined);
      await expect(adds()).resolves.toEqual(new Set());
      await expect(removes()).resolves.toEqual(new Set([rem1]));
    });

    test("succeeds even if the VerificationEthereumAddress message doesn't exist", async () => {
      await expect(adds()).resolves.toEqual(new Set());
      await expect(set.merge(rem1)).resolves.toEqual(undefined);
      await expect(removes()).resolves.toEqual(new Set([rem1]));
      await expect(adds()).resolves.toEqual(new Set());
    });

    test('succeeds with multiple valid VerificationRemove messages', async () => {
      await expect(adds()).resolves.toEqual(new Set());
      await expect(set.merge(rem1)).resolves.toEqual(undefined);
      await expect(set.merge(rem2)).resolves.toEqual(undefined);
      await expect(removes()).resolves.toEqual(new Set([rem1, rem2]));
    });

    test('succeeds (no-ops) if the same VerificationRemove message is added twice', async () => {
      await expect(set.merge(rem1)).resolves.toEqual(undefined);
      await expect(set.merge(rem1)).resolves.toEqual(undefined);
      await expect(removes()).resolves.toEqual(new Set([rem1]));
    });

    test('succeeds (no-ops) if matching VerificationEthereumAddress message has a later timestamp', async () => {
      const add1Later = { ...add1, data: { ...add1.data, signedAt: rem1.data.signedAt + 1 } };
      await set.merge(add1Later);
      await expect(set.merge(rem1)).resolves.toEqual(undefined);
      await expect(adds()).resolves.toEqual(new Set([add1Later]));
      await expect(removes()).resolves.toEqual(new Set());
    });
  });
});
