import Engine from '~/engine';
import { Factories } from '~/factories';
import { Cast, Reaction, Root } from '~/types';
import Faker from 'faker';

const engine = new Engine();
const username = 'alice';

describe('mergeCast', () => {
  let alicePrivateKey: string;
  let aliceAddress: string;
  let root: Root;
  let cast: Cast;
  let reaction: Reaction;
  const subject = () => engine._getCastAdds(username);

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

  test('fails to add a root, reaction or follow when passed in here', async () => {
    const invalidCast = root as unknown as Cast;
    expect(engine.mergeCast(invalidCast)._unsafeUnwrapErr()).toBe('CastSet.merge: unknown cast type');
    expect(subject()).toEqual([]);

    const invalidReactionCast = reaction as unknown as Cast;
    expect(engine.mergeCast(invalidReactionCast)._unsafeUnwrapErr()).toBe('CastSet.merge: unknown cast type');
    expect(subject()).toEqual([]);
  });

  describe('signer validation: ', () => {
    test('fails if there are no known signers', async () => {
      engine._resetSigners();

      const result = engine.mergeCast(cast);
      expect(result._unsafeUnwrapErr()).toBe('mergeCast: unknown user');
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

      expect(engine.mergeCast(cast)._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
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

      const result = engine.mergeCast(cast);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(subject()).toEqual([]);
    });

    test('fails if the signer was not valid', async () => {
      // Calling Factory without specifying a signing key makes Faker choose a random one
      const castInvalidSigner = await Factories.Cast.create({
        data: {
          username: 'alice',
        },
      });

      const result = engine.mergeCast(castInvalidSigner);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(subject()).toEqual([]);
    });

    test('fails if the signer was valid, but the username was invalid', async () => {
      const unknownUser = await Factories.Cast.create(
        {
          data: {
            rootBlock: root.data.rootBlock,
            username: 'rob',
            signedAt: root.data.signedAt + 1,
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );

      expect(engine.mergeCast(unknownUser)._unsafeUnwrapErr()).toBe('mergeCast: unknown user');
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

      expect(engine.mergeCast(cast).isOk()).toBe(true);
      expect(subject()).toEqual([cast]);
    });
  });

  describe('message validation: ', () => {
    test('fails if the hash is invalid', async () => {
      const invalidHash = JSON.parse(JSON.stringify(cast)) as Cast;
      invalidHash.hash = '0xd4126acebadb14b41943fc10599c00e2e3627f1e38672c8476277ecf17accb48';

      expect(engine.mergeCast(invalidHash)._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
      expect(subject()).toEqual([]);
    });

    test('fails if the signature is invalid', async () => {
      const invalidSignature = JSON.parse(JSON.stringify(cast)) as Cast;
      invalidSignature.signature =
        '0x52afdda1d6701e29dcd91dea5539c32cdaa2227de257bc0784b1da04be5be32e6a92c934b5d20dd2cb2989f814e74de6b9e7bc1da130543a660822023f9fd0e91c';

      expect(engine.mergeCast(invalidSignature)._unsafeUnwrapErr()).toBe('validateMessage: invalid signature');
      expect(subject()).toEqual([]);
    });

    test('fails if signedAt is > current time + safety margin', async () => {
      const elevenMinutesAhead = Date.now() + 11 * 60 * 1000;

      const futureCast = await Factories.Cast.create(
        {
          data: {
            username: 'alice',
            rootBlock: root.data.rootBlock,
            signedAt: elevenMinutesAhead,
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );

      expect(engine.mergeCast(futureCast)._unsafeUnwrapErr()).toEqual(
        'validateMessage: signedAt more than 10 mins in the future'
      );
    });
  });

  describe('root validation: ', () => {
    test('fails if there is no root', async () => {
      engine._resetRoots();
      const result = engine.mergeCast(cast);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: no root present');
      expect(subject()).toEqual([]);
    });

    test('fails if the message does not reference the correct root', async () => {
      const invalidLateRootBlock = await Factories.Cast.create(
        {
          data: {
            username: 'alice',
            rootBlock: root.data.rootBlock + 1,
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );

      const invalidEarlyRootBlock = await Factories.Cast.create(
        {
          data: {
            username: 'alice',
            rootBlock: root.data.rootBlock - 1,
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );

      expect(engine.mergeCast(invalidLateRootBlock)._unsafeUnwrapErr()).toBe(
        'validateMessage: root block does not match'
      );
      expect(subject()).toEqual([]);

      expect(engine.mergeCast(invalidEarlyRootBlock)._unsafeUnwrapErr()).toBe(
        'validateMessage: root block does not match'
      );
      expect(subject()).toEqual([]);
    });

    test('fails if signedAt is < than the roots signedAt', async () => {
      const pastCast = await Factories.Cast.create(
        {
          data: {
            username: 'alice',
            rootBlock: root.data.rootBlock,
            signedAt: root.data.signedAt - 1,
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );

      expect(engine.mergeCast(pastCast)._unsafeUnwrapErr()).toEqual(
        'validateMessage: message timestamp was earlier than root'
      );
    });
  });

  describe('cast validation: ', () => {
    // test('fails if the schema is invalid', async () => {});
    // test('fails if targetUri does not match schema', async () => {});
    // test('fails if the targetUri references itself', async () => {});
  });

  describe('cast merge: ', () => {
    test('fails if the cast is a duplicate', async () => {
      expect(engine.mergeCast(cast).isOk()).toBe(true);
      expect(subject()).toEqual([cast]);

      const castDuplicate = JSON.parse(JSON.stringify(cast)) as Cast;
      const resultLow = engine.mergeCast(castDuplicate);
      expect(resultLow._unsafeUnwrapErr()).toBe('CastSet.add: message is already present');
      expect(subject()).toEqual([cast]);
    });
  });

  describe('cast-short validation: ', () => {
    test('fails if text is greater than 280 chars', async () => {
      const castLongText = await Factories.Cast.create(
        {
          data: {
            username: 'alice',
            rootBlock: root.data.rootBlock,
            body: {
              text: 'a'.repeat(281),
            },
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );
      const result = engine.mergeCast(castLongText);

      expect(result.isOk()).toBe(false);
      expect(result._unsafeUnwrapErr()).toBe('validateCast: text > 280 chars');
      expect(subject()).toEqual([]);
    });

    test('fails if there are more than two embeds', async () => {
      const castThreeEmbeds = await Factories.Cast.create(
        {
          data: {
            username: 'alice',
            rootBlock: root.data.rootBlock,
            body: {
              embed: { items: ['a', 'b', 'c'] },
            },
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );

      const result = engine.mergeCast(castThreeEmbeds);
      expect(result._unsafeUnwrapErr()).toBe('validateCast: embeds > 2');
      expect(subject()).toEqual([]);
    });

    // test('fails if required properties do not exist', async () => {});
  });

  describe('cast-short merge: ', () => {
    test('succeeds if a valid cast-short is added', async () => {
      expect(engine.mergeCast(cast).isOk()).toBe(true);
      expect(subject()).toEqual([cast]);
    });
  });

  describe('cast-delete merge: ', () => {
    test('succeeds and removes cast if known', async () => {
      expect(engine.mergeCast(cast).isOk()).toBe(true);

      const castDelete = await Factories.CastDelete.create(
        {
          data: {
            rootBlock: root.data.rootBlock,
            body: {
              targetHash: cast.hash,
            },
            username: 'alice',
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );

      expect(engine.mergeCast(castDelete).isOk()).toBe(true);
      expect(subject()).toEqual([]);
    });

    test('succeeds and does nothing if cast is unknown', async () => {
      expect(engine.mergeCast(cast).isOk()).toBe(true);

      const castDelete = await Factories.CastDelete.create(
        {
          data: {
            rootBlock: root.data.rootBlock,
            username: 'alice',
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );

      expect(engine.mergeCast(castDelete).isOk()).toBe(true);
      expect(subject()).toEqual([cast]);
    });

    // test('fails if delete timestamp is < cast timestamp', async () => {});
  });

  describe('cast-recast merge: ', () => {
    test('succeeds', async () => {
      expect(engine.mergeCast(cast).isOk()).toBe(true);

      const castRecast = await Factories.CastRecast.create(
        {
          data: {
            rootBlock: root.data.rootBlock,
            username: 'alice',
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );

      expect(engine.mergeCast(castRecast).isOk()).toBe(true);
      expect(subject()).toEqual([cast, castRecast]);
    });

    // test('succeeds and replaces an older cast-recast, if latest', async () => {});
    // test('fails, if not the latest cast-recast', async () => {});
    // test('fails recast if uri references self', async () => {});
  });
});
