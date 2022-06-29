import Engine from '~/engine';
import { Factories } from '~/factories';
import { Cast, Reaction, Root } from '~/types';
import Faker from 'faker';
import { generateEd25519KeyPair, convertToHex } from '~/utils';
import { hexToBytes } from 'ethereum-cryptography/utils';

const engine = new Engine();
const username = 'alice';

describe('mergeReaction', () => {
  let alicePrivateKey: string;
  let aliceAddress: string;
  let root: Root;
  let cast: Cast;
  let reaction: Reaction;
  let transient: { transient: { privateKey: Uint8Array } };
  const subject = () => engine._getActiveReactions(username);

  beforeAll(async () => {
    const keyPair = await generateEd25519KeyPair();
    const privateKeyBuffer = keyPair.privateKey;
    alicePrivateKey = await convertToHex(privateKeyBuffer);
    const addressBuffer = keyPair.publicKey;
    aliceAddress = await convertToHex(addressBuffer);
    transient = { transient: { privateKey: hexToBytes(alicePrivateKey) } };

    root = await Factories.Root.create({ data: { rootBlock: 100, username: 'alice' } }, transient);

    cast = await Factories.Cast.create(
      {
        data: {
          rootBlock: root.data.rootBlock,
          username: 'alice',
          signedAt: root.data.signedAt + 1,
        },
      },
      transient
    );

    reaction = await Factories.Reaction.create(
      {
        data: {
          rootBlock: root.data.rootBlock,
          username: 'alice',
          signedAt: root.data.signedAt + 1,
        },
      },
      transient
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
    expect((await engine.mergeReaction(invalidRootReaction))._unsafeUnwrapErr()).toBe(
      'ReactionSet.merge: invalid reaction'
    );
    expect(subject()).toEqual([]);

    const invalidCastReaction = cast as unknown as Reaction;
    expect((await engine.mergeReaction(invalidCastReaction))._unsafeUnwrapErr()).toBe(
      'ReactionSet.merge: invalid reaction'
    );
    expect(subject()).toEqual([]);
  });

  describe('signer validation: ', () => {
    test('fails if there are no known signers', async () => {
      engine._resetSigners();

      const result = await engine.mergeReaction(reaction);
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

      expect((await engine.mergeReaction(reaction))._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
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

      const result = await engine.mergeReaction(reaction);
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

      const result = await engine.mergeReaction(reactionInvalidSigner);
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
        transient
      );

      expect((await engine.mergeReaction(unknownUser))._unsafeUnwrapErr()).toBe('mergeReaction: unknown user');
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

      expect((await engine.mergeReaction(reaction)).isOk()).toBe(true);
      expect(subject()).toEqual([reaction]);
    });
  });

  describe('message validation: ', () => {
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
            rootBlock: root.data.rootBlock,
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

  describe('root validation: ', () => {
    test('fails if there is no root', async () => {
      engine._resetRoots();
      const result = await engine.mergeReaction(reaction);
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
        transient
      );

      const invalidEarlyRootBlock = await Factories.Reaction.create(
        {
          data: {
            username: 'alice',
            rootBlock: root.data.rootBlock - 1,
          },
        },
        transient
      );

      expect((await engine.mergeReaction(invalidLateRootBlock))._unsafeUnwrapErr()).toBe(
        'validateMessage: root block does not match'
      );
      expect(subject()).toEqual([]);

      expect((await engine.mergeReaction(invalidEarlyRootBlock))._unsafeUnwrapErr()).toBe(
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
        transient
      );

      expect((await engine.mergeReaction(pastCast))._unsafeUnwrapErr()).toEqual(
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
        transient
      );
      const result = await engine.mergeReaction(reactionInvalidType);

      expect(result.isOk()).toBe(false);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: unknown message');
      expect(subject()).toEqual([]);
    });
  });

  describe('reaction merge: ', () => {
    test('succeeds if a valid active reaction is added', async () => {
      expect((await engine.mergeReaction(reaction)).isOk()).toBe(true);
      expect(subject()).toEqual([reaction]);
    });
  });
});
