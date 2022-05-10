import Engine from '~/engine';
import { Factories } from '~/factories';
import { Cast, Reaction, Root } from '~/types';
import Faker from 'faker';

const engine = new Engine();
const username = 'alice';

describe('mergeReaction', () => {
  let alicePrivateKey: string;
  let aliceAddress: string;
  let root: Root;
  let cast: Cast;
  let reaction: Reaction;
  const subject = () => engine._getActiveReactions(username);

  beforeAll(async () => {
    const keypair = await Factories.EthAddress.create({});
    alicePrivateKey = keypair.privateKey;
    aliceAddress = keypair.address;

    root = await Factories.Root.create(
      { data: { rootBlock: 100, username: 'alice' } },
      { transient: { privateKey: alicePrivateKey } }
    );

    cast = await Factories.Cast.create(
      {
        data: {
          rootBlock: root.data.rootBlock,
          username: 'alice',
          signedAt: root.data.signedAt + 1,
        },
      },
      { transient: { privateKey: alicePrivateKey } }
    );

    reaction = await Factories.Reaction.create(
      {
        data: {
          rootBlock: root.data.rootBlock,
          username: 'alice',
          signedAt: root.data.signedAt + 1,
        },
      },
      { transient: { privateKey: alicePrivateKey } }
    );
    engine._resetSigners();
  });

  // Every test should start with a valid signer and root for alice
  beforeEach(() => {
    engine._reset();

    const aliceRegistrationSignerChange = {
      blockNumber: 99,
      blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
      logIndex: 0,
      address: aliceAddress,
    };

    engine.addSignerChange('alice', aliceRegistrationSignerChange);
    engine.mergeRoot(root);
  });

  test('fails to add a root or cast when passed in here', async () => {
    const invalidRootReaction = root as unknown as Reaction;
    expect(engine.mergeReaction(invalidRootReaction)._unsafeUnwrapErr()).toBe('ReactionSet.merge: invalid reaction');
    expect(subject()).toEqual([]);

    const invalidCastReaction = cast as unknown as Reaction;
    expect(engine.mergeReaction(invalidCastReaction)._unsafeUnwrapErr()).toBe('ReactionSet.merge: invalid reaction');
    expect(subject()).toEqual([]);
  });

  describe('signer validation: ', () => {
    test('fails if there are no known signers', async () => {
      engine._resetSigners();

      const result = engine.mergeReaction(reaction);
      expect(result._unsafeUnwrapErr()).toBe('mergeReaction: unknown user');
      expect(subject()).toEqual([]);
    });

    test('fails if the signer was valid, but it changed before this block', async () => {
      // move the username alice to a different address
      const changeSigner = {
        blockNumber: 99,
        blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
        logIndex: 1,
        address: Faker.datatype.hexaDecimal(40).toLowerCase(),
      };
      engine.addSignerChange('alice', changeSigner);

      expect(engine.mergeReaction(reaction)._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(subject()).toEqual([]);
    });

    test('fails if the signer was valid, but only after this block', async () => {
      engine._resetSigners();
      const changeSigner = {
        blockNumber: 101,
        blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
        logIndex: 0,
        address: aliceAddress,
      };

      engine.addSignerChange('alice', changeSigner);

      const result = engine.mergeReaction(reaction);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(subject()).toEqual([]);
    });

    test('fails if the signer was not valid', async () => {
      // Calling Factory without specifying a signing key makes Faker choose a random one
      const reactionInvalidSigner = await Factories.Reaction.create({
        data: {
          username: 'alice',
        },
      });

      const result = engine.mergeReaction(reactionInvalidSigner);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(subject()).toEqual([]);
    });

    test('fails if the signer was valid, but the username was invalid', async () => {
      const unknownUser = await Factories.Reaction.create(
        {
          data: {
            rootBlock: root.data.rootBlock,
            username: 'rob',
            signedAt: root.data.signedAt + 1,
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );

      expect(engine.mergeReaction(unknownUser)._unsafeUnwrapErr()).toBe('mergeReaction: unknown user');
      expect(subject()).toEqual([]);
    });

    test('succeeds if the signer was valid, even if it changes in a later block', async () => {
      const signerChange = {
        blockNumber: 150,
        blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
        logIndex: 0,
        address: Faker.datatype.hexaDecimal(40).toLowerCase(),
      };

      engine.addSignerChange('alice', signerChange);

      expect(engine.mergeReaction(reaction).isOk()).toBe(true);
      expect(subject()).toEqual([reaction]);
    });
  });

  describe('message validation: ', () => {
    test('fails if the hash is invalid', async () => {
      const invalidHash = JSON.parse(JSON.stringify(reaction)) as Reaction;
      invalidHash.hash = '0xd4126acebadb14b41943fc10599c00e2e3627f1e38672c8476277ecf17accb48';

      expect(engine.mergeReaction(invalidHash)._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
      expect(subject()).toEqual([]);
    });

    test('fails if the signature is invalid', async () => {
      const invalidSignature = JSON.parse(JSON.stringify(reaction)) as Reaction;
      invalidSignature.signature =
        '0x52afdda1d6701e29dcd91dea5539c32cdaa2227de257bc0784b1da04be5be32e6a92c934b5d20dd2cb2989f814e74de6b9e7bc1da130543a660822023f9fd0e91c';

      expect(engine.mergeReaction(invalidSignature)._unsafeUnwrapErr()).toBe('validateMessage: invalid signature');
      expect(subject()).toEqual([]);
    });

    test('fails if signedAt is > current time + safety margin', async () => {
      const elevenMinutesAhead = Date.now() + 11 * 60 * 1000;

      const futureReaction = await Factories.Reaction.create(
        {
          data: {
            username: 'alice',
            rootBlock: root.data.rootBlock,
            signedAt: elevenMinutesAhead,
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );

      expect(engine.mergeReaction(futureReaction)._unsafeUnwrapErr()).toEqual(
        'validateMessage: signedAt more than 10 mins in the future'
      );
    });
  });

  describe('root validation: ', () => {
    test('fails if there is no root', async () => {
      engine._resetRoots();
      const result = engine.mergeReaction(reaction);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: no root present');
      expect(subject()).toEqual([]);
    });

    test('fails if the message does not reference the correct root', async () => {
      const invalidLateRootBlock = await Factories.Reaction.create(
        {
          data: {
            username: 'alice',
            rootBlock: root.data.rootBlock + 1,
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );

      const invalidEarlyRootBlock = await Factories.Reaction.create(
        {
          data: {
            username: 'alice',
            rootBlock: root.data.rootBlock - 1,
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );

      expect(engine.mergeReaction(invalidLateRootBlock)._unsafeUnwrapErr()).toBe(
        'validateMessage: root block does not match'
      );
      expect(subject()).toEqual([]);

      expect(engine.mergeReaction(invalidEarlyRootBlock)._unsafeUnwrapErr()).toBe(
        'validateMessage: root block does not match'
      );
      expect(subject()).toEqual([]);
    });

    test('fails if signedAt is < than the roots signedAt', async () => {
      const pastCast = await Factories.Reaction.create(
        {
          data: {
            username: 'alice',
            rootBlock: root.data.rootBlock,
            signedAt: root.data.signedAt - 1,
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );

      expect(engine.mergeReaction(pastCast)._unsafeUnwrapErr()).toEqual(
        'validateMessage: message timestamp was earlier than root'
      );
    });
  });

  describe('reaction validation: ', () => {
    // test('fails if the schema is invalid', async () => {});
    // test('fails if targetUri does not match schema', async () => {});
    test('fails if the type is invalid', async () => {
      const reactionInvalidType = await Factories.Reaction.create(
        {
          data: {
            username: 'alice',
            rootBlock: root.data.rootBlock,
            body: {
              type: 'wrong' as unknown as any,
            },
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );
      const result = engine.mergeReaction(reactionInvalidType);

      expect(result.isOk()).toBe(false);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: unknown message');
      expect(subject()).toEqual([]);
    });
  });

  describe('reaction merge: ', () => {
    test('succeeds if a valid active reaction is added', async () => {
      expect(engine.mergeReaction(reaction).isOk()).toBe(true);
      expect(subject()).toEqual([reaction]);
    });
  });
});
