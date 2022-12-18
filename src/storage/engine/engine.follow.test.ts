import Engine from '~/storage/engine';
import { faker } from '@faker-js/faker';
import { Factories } from '~/test/factories';
import {
  Ed25519Signer,
  EthereumSigner,
  Follow,
  FollowAdd,
  FollowRemove,
  IdRegistryEvent,
  MessageFactoryTransientParams,
  SignerAdd,
} from '~/types';
import { generateEd25519Signer, generateEthereumSignerUnsafe } from '~/utils/crypto';
import { jestRocksDB } from '~/storage/db/jestUtils';
import FollowDB from '~/storage/db/follow';
import { BadRequestError, UnknownUserError } from '~/utils/errors';

const testDb = jestRocksDB(`engine.follow.test`);
const followDb = new FollowDB(testDb);
const engine = new Engine(testDb);
const aliceFid = faker.datatype.number();

describe('mergeFollow', () => {
  let aliceCustody: EthereumSigner;
  let aliceCustodyRegister: IdRegistryEvent;
  let aliceSigner: Ed25519Signer;
  let aliceSignerAdd: SignerAdd;
  let follow: FollowAdd;
  let unfollow: FollowRemove;
  let transientParams: { transient: MessageFactoryTransientParams };

  const aliceFollows = async () => {
    const adds = await followDb.getFollowAddsByUser(aliceFid);
    return new Set(adds);
  };

  beforeAll(async () => {
    aliceCustody = await generateEthereumSignerUnsafe();
    aliceCustodyRegister = await Factories.IdRegistryEvent.create({
      args: { to: aliceCustody.signerKey, id: aliceFid },
      name: 'Register',
    });
    aliceSigner = await generateEd25519Signer();
    aliceSignerAdd = await Factories.SignerAdd.create(
      { data: { fid: aliceFid } },
      { transient: { signer: aliceCustody, delegateSigner: aliceSigner } }
    );
    transientParams = { transient: { signer: aliceSigner } };
    follow = await Factories.FollowAdd.create({ data: { fid: aliceFid } }, transientParams);
    unfollow = await Factories.FollowRemove.create(
      { data: { fid: aliceFid, body: { targetUri: follow.data.body.targetUri }, signedAt: follow.data.signedAt + 1 } },
      transientParams
    );
  });

  beforeEach(async () => {
    await engine._reset();
  });

  test('fails if there are no known signers', async () => {
    const result = await engine.mergeMessage(follow);
    expect(result._unsafeUnwrapErr()).toMatchObject(new UnknownUserError('validateMessage: unknown user'));
    await expect(aliceFollows()).resolves.toEqual(new Set());
  });

  describe('with signers', () => {
    beforeEach(async () => {
      await engine.mergeIdRegistryEvent(aliceCustodyRegister);
      await engine.mergeMessage(aliceSignerAdd);
    });

    describe('signer validation', () => {
      test('fails if the signer is not valid', async () => {
        // Calling Factory without specifying a signing key makes Faker choose a random one
        const followNewSigner = await Factories.FollowAdd.create({
          data: {
            fid: aliceFid,
            body: { targetUri: follow.data.body.targetUri },
          },
        });

        const result = await engine.mergeMessage(followNewSigner);
        expect(result._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid signer'));
        await expect(aliceFollows()).resolves.toEqual(new Set());
      });

      test('fails if the signer is valid, but the fid is invalid', async () => {
        const unknownUser = await Factories.FollowAdd.create({ data: { fid: aliceFid + 1 } }, transientParams);
        const res = await engine.mergeMessage(unknownUser);
        expect(res.isOk()).toBe(false);
        expect(res._unsafeUnwrapErr()).toMatchObject(new UnknownUserError('validateMessage: unknown user'));
        await expect(aliceFollows()).resolves.toEqual(new Set());
      });
    });

    describe('message validation', () => {
      test('fails if the hash is invalid', async () => {
        const followInvalidHash: FollowAdd = { ...follow, hash: follow.hash + 'foo' };
        const res = await engine.mergeMessage(followInvalidHash);
        expect(res.isOk()).toBe(false);
        expect(res._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid hash'));
        await expect(aliceFollows()).resolves.toEqual(new Set());
      });

      test('fails if the signature is invalid', async () => {
        const followInvalidSignature: Follow = { ...follow, signature: faker.datatype.hexadecimal({ length: 128 }) };
        const res = await engine.mergeMessage(followInvalidSignature);
        expect(res.isOk()).toBe(false);
        expect(res._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid signature'));
        await expect(aliceFollows()).resolves.toEqual(new Set());
      });

      test('fails if signedAt is > current time + safety margin', async () => {
        const elevenMinutesAhead = Date.now() + 11 * 60 * 1000;
        const futureFollow = await Factories.FollowAdd.create(
          {
            data: {
              fid: aliceFid,
              signedAt: elevenMinutesAhead,
            },
          },
          transientParams
        );
        const res = await engine.mergeMessage(futureFollow);
        expect(res.isOk()).toBe(false);
        expect(res._unsafeUnwrapErr()).toMatchObject(
          new BadRequestError('validateMessage: signedAt more than 10 mins in the future')
        );
      });
    });

    describe('FollowAdd', () => {
      test('fails if targetUri does not match schema', async () => {
        const invalidTargets: string[] = [
          'foobar.com', // URL missing scheme
          'http://foobar.com', // web2 URLs not allowed
          'chain://eip155:1', // chain URLs not allowed
          'farcaster://fid:1/cast:0x508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982', // target must be a user, not a cast
        ];
        for (const invalidTarget of invalidTargets) {
          const invalidTargetUri = await Factories.FollowAdd.create(
            {
              data: { body: { targetUri: invalidTarget }, fid: aliceFid },
            },
            transientParams
          );
          const result = await engine.mergeMessage(invalidTargetUri);
          expect(result.isOk()).toBe(false);
          expect(result._unsafeUnwrapErr()).toMatchObject(
            new BadRequestError('validateFollow: targetUri must be valid FarcasterID')
          );
        }
      });

      test('succeeds with a valid follow', async () => {
        expect((await engine.mergeMessage(follow)).isOk()).toBe(true);
        await expect(aliceFollows()).resolves.toEqual(new Set([follow]));
      });
    });

    describe('FollowRemove', () => {
      test('succeeds with a valid unfollow', async () => {
        expect((await engine.mergeMessage(unfollow)).isOk()).toBe(true);
        await expect(aliceFollows()).resolves.toEqual(new Set());
      });

      test('succeeds with a valid unfollow and removes follow', async () => {
        expect((await engine.mergeMessage(follow)).isOk()).toBe(true);
        expect((await engine.mergeMessage(unfollow)).isOk()).toBe(true);
        await expect(aliceFollows()).resolves.toEqual(new Set());
      });
    });
  });
});
