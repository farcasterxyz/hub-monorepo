import Engine from '~/engine';
import { Factories } from '~/factories';
import {
  Cast,
  Ed25519Signer,
  EthereumSigner,
  IDRegistryEvent,
  MessageFactoryTransientParams,
  Reaction,
  SignerAdd,
} from '~/types';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';

const engine = new Engine();
const username = 'alice';

describe('mergeReaction', () => {
  let aliceCustody: EthereumSigner;
  let aliceCustodyRegister: IDRegistryEvent;
  let aliceSigner: Ed25519Signer;
  let aliceSignerAdd: SignerAdd;
  let cast: Cast;
  let reaction: Reaction;
  let transient: { transient: MessageFactoryTransientParams };
  const subject = () => engine._getActiveReactions(username);

  beforeAll(async () => {
    aliceCustody = await generateEthereumSigner();
    aliceCustodyRegister = await Factories.IDRegistryEvent.create({
      args: { to: aliceCustody.signerKey },
      name: 'Register',
    });
    aliceSigner = await generateEd25519Signer();
    aliceSignerAdd = await Factories.SignerAdd.create(
      { data: { username: 'alice' } },
      { transient: { signer: aliceCustody, delegateSigner: aliceSigner } }
    );
    transient = { transient: { signer: aliceSigner } };
    cast = await Factories.Cast.create({ data: { username: 'alice' } }, transient);
    reaction = await Factories.Reaction.create({ data: { username: 'alice' } }, transient);
  });

  beforeEach(async () => {
    engine._reset();
    engine.mergeIDRegistryEvent('alice', aliceCustodyRegister);
    await engine.mergeSignerMessage(aliceSignerAdd);
  });

  test('fails with invalid message type', async () => {
    const invalidCastReaction = cast as unknown as Reaction;
    const result = await engine.mergeReaction(invalidCastReaction);
    expect(result.isOk()).toBe(false);
    expect(result._unsafeUnwrapErr()).toBe('ReactionSet.merge: invalid reaction');
    expect(subject()).toEqual([]);
  });

  describe('signer validation', () => {
    test('fails if there are no known signers', async () => {
      engine._resetSigners();

      const result = await engine.mergeReaction(reaction);
      expect(result._unsafeUnwrapErr()).toBe('mergeReaction: unknown user');
      expect(subject()).toEqual([]);
    });

    test('fails if the signer was not valid', async () => {
      // Calling Factory without specifying a signing key makes Faker choose a random one
      const reactionInvalidSigner = await Factories.Reaction.create({
        data: {
          username: 'alice',
        },
      });

      const result = await engine.mergeReaction(reactionInvalidSigner);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(subject()).toEqual([]);
    });

    test('fails if the signer was valid, but the username was invalid', async () => {
      const unknownUser = await Factories.Reaction.create({ data: { username: 'rob' } }, transient);

      expect((await engine.mergeReaction(unknownUser))._unsafeUnwrapErr()).toBe('mergeReaction: unknown user');
      expect(subject()).toEqual([]);
    });
  });

  describe('message validation', () => {
    test('fails if the hash is invalid', async () => {
      const invalidHash = JSON.parse(JSON.stringify(reaction)) as Reaction;
      invalidHash.hash = '0xd4126acebadb14b41943fc10599c00e2e3627f1e38672c8476277ecf17accb48';

      expect((await engine.mergeReaction(invalidHash))._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
      expect(subject()).toEqual([]);
    });

    test('fails if the signature is invalid', async () => {
      const invalidSignature = JSON.parse(JSON.stringify(reaction)) as Reaction;
      invalidSignature.signature =
        '0x5b699d494b515b22258c01ad19710d44c3f12235f0c01e91d09a1e4e2cd25d80c77026a7319906da3b8ce62abc18477c19e444a02949a0dde54f8cadef889502';
      expect((await engine.mergeReaction(invalidSignature))._unsafeUnwrapErr()).toBe(
        'validateMessage: invalid signature'
      );
      expect(subject()).toEqual([]);
    });

    test('fails if signedAt is > current time + safety margin', async () => {
      const elevenMinutesAhead = Date.now() + 11 * 60 * 1000;

      const futureReaction = await Factories.Reaction.create(
        {
          data: {
            username: 'alice',

            signedAt: elevenMinutesAhead,
          },
        },
        transient
      );

      expect((await engine.mergeReaction(futureReaction))._unsafeUnwrapErr()).toEqual(
        'validateMessage: signedAt more than 10 mins in the future'
      );
    });
  });

  // test('fails if the schema is invalid', async () => {});
  // test('fails if targetUri does not match schema', async () => {});
  test('fails if the type is invalid', async () => {
    const reactionInvalidType = await Factories.Reaction.create(
      {
        data: {
          username: 'alice',

          body: {
            type: 'wrong' as unknown as any,
          },
        },
      },
      transient
    );
    const result = await engine.mergeReaction(reactionInvalidType);

    expect(result.isOk()).toBe(false);
    expect(result._unsafeUnwrapErr()).toBe('validateMessage: unknown message');
    expect(subject()).toEqual([]);
  });

  test('succeeds if a valid active reaction is added', async () => {
    expect((await engine.mergeReaction(reaction)).isOk()).toBe(true);
    expect(subject()).toEqual([reaction]);
  });
});
