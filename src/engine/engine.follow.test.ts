import Engine from '~/engine';
import Faker from 'faker';
import { Factories } from '~/factories';
import {
  Cast,
  Ed25519Signer,
  EthereumSigner,
  Follow,
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
  let follow: Follow;
  let unfollow: Follow;
  let transientParams: { transient: MessageFactoryTransientParams };

  const aliceFollows = () => engine._getActiveFollows(aliceFid);

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
    cast = await Factories.Cast.create({ data: { fid: aliceFid } }, transientParams);
    follow = await Factories.Follow.create({ data: { fid: aliceFid, body: { active: true } } }, transientParams);
    unfollow = await Factories.Follow.create(
      { data: { fid: aliceFid, body: { targetUri: follow.data.body.targetUri, active: false } } },
      transientParams
    );
  });

  beforeEach(async () => {
    engine._reset();
    engine.mergeIDRegistryEvent(aliceCustodyRegister);
    await engine.mergeSignerMessage(aliceSignerAdd);
  });

  test('fails with invalid message type', async () => {
    const invalidFollow = cast as unknown as Follow;
    const result = await engine.mergeFollow(invalidFollow);
    expect(result.isOk()).toBe(false);
    expect(result._unsafeUnwrapErr()).toBe('FollowSet.merge: invalid message format');
    expect(aliceFollows()).toEqual(new Set());
  });

  describe('signer validation', () => {
    test('fails if there are no known signers', async () => {
      engine._resetSigners();
      const result = await engine.mergeFollow(follow);
      expect(result._unsafeUnwrapErr()).toBe('mergeFollow: unknown user');
      expect(aliceFollows()).toEqual(new Set());
    });

    test('fails if the signer is not valid', async () => {
      // Calling Factory without specifying a signing key makes Faker choose a random one
      const followNewSigner = await Factories.Follow.create({
        data: {
          fid: aliceFid,
          body: { targetUri: follow.data.body.targetUri, active: true },
        },
      });

      const result = await engine.mergeFollow(followNewSigner);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(aliceFollows()).toEqual(new Set());
    });

    test('fails if the signer is valid, but the fid is invalid', async () => {
      const unknownUser = await Factories.Follow.create(
        { data: { fid: aliceFid + 1, body: { active: true } } },
        transientParams
      );
      const res = await engine.mergeFollow(unknownUser);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('mergeFollow: unknown user');
      expect(aliceFollows()).toEqual(new Set());
    });
  });

  describe('message validation', () => {
    test('fails if the hash is invalid', async () => {
      const followInvalidHash: Follow = { ...follow, hash: follow.hash + 'foo' };
      const res = await engine.mergeFollow(followInvalidHash);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
      expect(aliceFollows()).toEqual(new Set());
    });

    test('fails if the signature is invalid', async () => {
      const followInvalidSignature: Follow = { ...follow, signature: Faker.datatype.hexaDecimal(128) };
      const res = await engine.mergeFollow(followInvalidSignature);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid signature');
      expect(aliceFollows()).toEqual(new Set());
    });

    test('fails if signedAt is > current time + safety margin', async () => {
      const elevenMinutesAhead = Date.now() + 11 * 60 * 1000;
      const futureFollow = await Factories.Follow.create(
        {
          data: {
            fid: aliceFid,
            signedAt: elevenMinutesAhead,
          },
        },
        transientParams
      );
      const res = await engine.mergeFollow(futureFollow);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toEqual('validateMessage: signedAt more than 10 mins in the future');
    });
  });

  test('succeeds with a valid follow', async () => {
    expect((await engine.mergeFollow(follow)).isOk()).toBe(true);
    expect(aliceFollows()).toEqual(new Set([follow]));
  });

  test('succeeds with a valid unfollow', async () => {
    expect((await engine.mergeFollow(unfollow)).isOk()).toBe(true);
    expect(aliceFollows()).toEqual(new Set());
  });

  test('succeeds with a valid unfollow and removes follow', async () => {
    expect((await engine.mergeFollow(follow)).isOk()).toBe(true);
    expect((await engine.mergeFollow(unfollow)).isOk()).toBe(true);
    expect(aliceFollows()).toEqual(new Set());
  });
});
