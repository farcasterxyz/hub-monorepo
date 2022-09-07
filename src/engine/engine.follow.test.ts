import Engine from '~/engine';
import Faker from 'faker';
import { Factories } from '~/factories';
import {
  Cast,
  Ed25519Signer,
  EthereumSigner,
  Follow,
  FollowAdd,
  FollowRemove,
  IDRegistryEvent,
  MessageFactoryTransientParams,
  SignerAdd,
} from '~/types';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';

const engine = new Engine();
const aliceFid = Faker.datatype.number();

describe('mergeFollow', () => {
  let aliceCustody: EthereumSigner;
  let aliceCustodyRegister: IDRegistryEvent;
  let aliceSigner: Ed25519Signer;
  let aliceSignerAdd: SignerAdd;
  let cast: Cast;
  let follow: FollowAdd;
  let unfollow: FollowRemove;
  let transientParams: { transient: MessageFactoryTransientParams };

  const aliceFollows = () => engine._getFollowAdds(aliceFid);
  const aliceCastAdds = () => engine._getCastAdds(aliceFid);

  beforeAll(async () => {
    aliceCustody = await generateEthereumSigner();
    aliceCustodyRegister = await Factories.IDRegistryEvent.create({
      args: { to: aliceCustody.signerKey, id: aliceFid },
      name: 'Register',
    });
    aliceSigner = await generateEd25519Signer();
    aliceSignerAdd = await Factories.SignerAdd.create(
      { data: { fid: aliceFid } },
      { transient: { signer: aliceCustody, delegateSigner: aliceSigner } }
    );
    transientParams = { transient: { signer: aliceSigner } };
    cast = await Factories.CastShort.create({ data: { fid: aliceFid } }, transientParams);
    follow = await Factories.FollowAdd.create({ data: { fid: aliceFid } }, transientParams);
    unfollow = await Factories.FollowRemove.create(
      { data: { fid: aliceFid, body: { targetUri: follow.data.body.targetUri } } },
      transientParams
    );
  });

  beforeEach(async () => {
    engine._reset();
    engine.mergeIDRegistryEvent(aliceCustodyRegister);
    await engine.mergeMessage(aliceSignerAdd);
  });

  test('handles invalid type cast', async () => {
    const invalidFollow = cast as unknown as Follow;
    const result = await engine.mergeMessage(invalidFollow);
    expect(result.isOk()).toBeTruthy();
    expect(aliceFollows()).toEqual(new Set());
    expect(aliceCastAdds()).toEqual(new Set([invalidFollow]));
  });

  describe('signer validation', () => {
    test('fails if there are no known signers', async () => {
      engine._resetSigners();
      const result = await engine.mergeMessage(follow);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: unknown user');
      expect(aliceFollows()).toEqual(new Set());
    });

    test('fails if the signer is not valid', async () => {
      // Calling Factory without specifying a signing key makes Faker choose a random one
      const followNewSigner = await Factories.FollowAdd.create({
        data: {
          fid: aliceFid,
          body: { targetUri: follow.data.body.targetUri },
        },
      });

      const result = await engine.mergeMessage(followNewSigner);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(aliceFollows()).toEqual(new Set());
    });

    test('fails if the signer is valid, but the fid is invalid', async () => {
      const unknownUser = await Factories.FollowAdd.create({ data: { fid: aliceFid + 1 } }, transientParams);
      const res = await engine.mergeMessage(unknownUser);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: unknown user');
      expect(aliceFollows()).toEqual(new Set());
    });
  });

  describe('message validation', () => {
    test('fails if the hash is invalid', async () => {
      const followInvalidHash: FollowAdd = { ...follow, hash: follow.hash + 'foo' };
      const res = await engine.mergeMessage(followInvalidHash);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
      expect(aliceFollows()).toEqual(new Set());
    });

    test('fails if the signature is invalid', async () => {
      const followInvalidSignature: Follow = { ...follow, signature: Faker.datatype.hexaDecimal(128) };
      const res = await engine.mergeMessage(followInvalidSignature);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid signature');
      expect(aliceFollows()).toEqual(new Set());
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
      expect(res._unsafeUnwrapErr()).toEqual('validateMessage: signedAt more than 10 mins in the future');
    });

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
        expect(result._unsafeUnwrapErr()).toEqual('validateFollow: targetUri must be valid FarcasterID');
      }
    });
  });

  test('succeeds with a valid follow', async () => {
    expect((await engine.mergeMessage(follow)).isOk()).toBe(true);
    expect(aliceFollows()).toEqual(new Set([follow]));
  });

  test('succeeds with a valid unfollow', async () => {
    expect((await engine.mergeMessage(unfollow)).isOk()).toBe(true);
    expect(aliceFollows()).toEqual(new Set());
  });

  test('succeeds with a valid unfollow and removes follow', async () => {
    expect((await engine.mergeMessage(follow)).isOk()).toBe(true);
    expect((await engine.mergeMessage(unfollow)).isOk()).toBe(true);
    expect(aliceFollows()).toEqual(new Set());
  });
});
