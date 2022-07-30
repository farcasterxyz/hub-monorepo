import Engine from '~/engine';
import { Factories } from '~/factories';
import { Cast, EthereumSigner, MessageSigner, Reaction, Root, SignerAdd, SignerRemove } from '~/types';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';

const engine = new Engine();
const username = 'alice';

describe('mergeCast', () => {
  let aliceCustodySigner: EthereumSigner;
  let aliceDelegateSigner: MessageSigner;
  let root: Root;
  let cast: Cast;
  let delegateCast: Cast;
  let reaction: Reaction;
  const subject = () => engine._getCastAdds(username);
  let messageData: { rootBlock: number; username: string; signedAt: number };
  let addDelegateSigner: SignerAdd;
  let removeDelegateSigner: SignerRemove;

  beforeAll(async () => {
    aliceCustodySigner = await generateEthereumSigner();
    aliceDelegateSigner = await generateEd25519Signer();

    root = await Factories.Root.create(
      { data: { rootBlock: 100, username: 'alice' } },
      { transient: { signer: aliceCustodySigner } }
    );

    messageData = { rootBlock: root.data.rootBlock, username: 'alice', signedAt: root.data.signedAt + 1 };

    cast = await Factories.Cast.create(
      {
        data: messageData,
      },
      { transient: { signer: aliceCustodySigner } }
    );

    delegateCast = await Factories.Cast.create(
      {
        data: messageData,
      },
      { transient: { signer: aliceDelegateSigner } }
    );

    reaction = await Factories.Reaction.create(
      {
        data: messageData,
      },
      { transient: { signer: aliceCustodySigner } }
    );

    addDelegateSigner = await Factories.SignerAdd.create(
      { data: messageData },
      { transient: { signer: aliceCustodySigner, childSigner: aliceDelegateSigner } }
    );

    removeDelegateSigner = await Factories.SignerRemove.create(
      {
        data: { ...messageData, body: { childKey: aliceDelegateSigner.signerKey } },
      },
      { transient: { signer: aliceCustodySigner } }
    );
  });

  // Every test should start with a valid signer and root for alice
  beforeEach(() => {
    engine._reset();
    engine.addCustody('alice', aliceCustodySigner.signerKey);
    engine.mergeRoot(root);
  });

  test('fails to add a root, reaction or follow when passed in here', async () => {
    const invalidCast = root as unknown as Cast;
    expect((await engine.mergeCast(invalidCast))._unsafeUnwrapErr()).toBe('CastSet.merge: invalid cast');
    expect(subject()).toEqual([]);

    const invalidReactionCast = reaction as unknown as Cast;
    expect((await engine.mergeCast(invalidReactionCast))._unsafeUnwrapErr()).toBe('CastSet.merge: invalid cast');
    expect(subject()).toEqual([]);
  });

  describe('signer validation: ', () => {
    test('fails if there are no known signers', async () => {
      engine._resetSigners();
      const result = await engine.mergeCast(cast);
      expect(result.isOk()).toBe(false);
      expect(result._unsafeUnwrapErr()).toBe('mergeCast: unknown user');
      expect(subject()).toEqual([]);
    });

    test('fails if delegate signer has not been added', async () => {
      const result = await engine.mergeCast(delegateCast);
      expect(result.isOk()).toBe(false);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(subject()).toEqual([]);
    });

    describe('with delegate signer', () => {
      beforeEach(async () => {
        expect((await engine.mergeSignerMessage(addDelegateSigner)).isOk()).toBe(true);
      });

      test('succeeds with delegate signer', async () => {
        const result = await engine.mergeCast(delegateCast);
        expect(result.isOk()).toBe(true);
      });

      test('fails if delegate was removed', async () => {
        expect((await engine.mergeSignerMessage(removeDelegateSigner)).isOk()).toBe(true);
        const result = await engine.mergeCast(delegateCast);
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
        expect(subject()).toEqual([]);
      });
    });

    test('fails if the signer is invalid', async () => {
      // Calling Factory without specifying a signing key makes Faker choose a random one
      const castInvalidSigner = await Factories.Cast.create({
        data: {
          username: 'alice',
        },
      });

      const result = await engine.mergeCast(castInvalidSigner);
      expect(result.isOk()).toBe(false);
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
        { transient: { signer: aliceCustodySigner } }
      );
      const result = await engine.mergeCast(unknownUser);
      expect(result.isOk()).toBe(false);
      expect(result._unsafeUnwrapErr()).toBe('mergeCast: unknown user');
      expect(subject()).toEqual([]);
    });
  });

  describe('message validation: ', () => {
    test('fails if the hash is invalid', async () => {
      const invalidHash = JSON.parse(JSON.stringify(cast)) as Cast;
      invalidHash.hash = '0xd4126acebadb14b41943fc10599c00e2e3627f1e38672c8476277ecf17accb48';
      const result = await engine.mergeCast(invalidHash);
      expect(result.isOk()).toBe(false);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
      expect(subject()).toEqual([]);
    });

    test('fails if the signature is invalid', async () => {
      const invalidSignature = JSON.parse(JSON.stringify(cast)) as Cast;
      invalidSignature.signature =
        '0x5b699d494b515b22258c01ad19710d44c3f12235f0c01e91d09a1e4e2cd25d80c77026a7319906da3b8ce62abc18477c19e444a02949a0dde54f8cadef889502';
      const result = await engine.mergeCast(invalidSignature);
      expect(result.isOk()).toBe(false);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: invalid signature');
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
        { transient: { signer: aliceCustodySigner } }
      );

      const result = await engine.mergeCast(futureCast);
      expect(result.isOk()).toBe(false);
      expect(result._unsafeUnwrapErr()).toEqual('validateMessage: signedAt more than 10 mins in the future');
    });
  });

  describe('root validation: ', () => {
    test('fails if there is no root', async () => {
      engine._resetRoots();
      const result = await engine.mergeCast(cast);
      expect(result.isOk()).toBe(false);
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
        { transient: { signer: aliceCustodySigner } }
      );

      const invalidEarlyRootBlock = await Factories.Cast.create(
        {
          data: {
            username: 'alice',
            rootBlock: root.data.rootBlock - 1,
          },
        },
        { transient: { signer: aliceCustodySigner } }
      );

      expect((await engine.mergeCast(invalidLateRootBlock))._unsafeUnwrapErr()).toBe(
        'validateMessage: root block does not match'
      );
      expect(subject()).toEqual([]);

      expect((await engine.mergeCast(invalidEarlyRootBlock))._unsafeUnwrapErr()).toBe(
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
        { transient: { signer: aliceCustodySigner } }
      );

      expect((await engine.mergeCast(pastCast))._unsafeUnwrapErr()).toEqual(
        'validateMessage: message timestamp was earlier than root'
      );
    });
  });

  describe('cast validation: ', () => {
    // test('fails if the schema is invalid', async () => {});
    // test('fails if targetUri does not match schema', async () => {});
    // test('fails if the targetUri references itself', async () => {});
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
        { transient: { signer: aliceCustodySigner } }
      );
      const result = await engine.mergeCast(castLongText);

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
        { transient: { signer: aliceCustodySigner } }
      );

      const result = await engine.mergeCast(castThreeEmbeds);
      expect(result.isOk()).toBe(false);
      expect(result._unsafeUnwrapErr()).toBe('validateCast: embeds > 2');
      expect(subject()).toEqual([]);
    });

    // test('fails if required properties do not exist', async () => {});
  });

  describe('cast-short merge: ', () => {
    test('succeeds if a valid cast-short is added', async () => {
      expect((await engine.mergeCast(cast)).isOk()).toBe(true);
      expect(subject()).toEqual([cast]);
    });
  });

  describe('cast-remove merge: ', () => {
    test('succeeds and removes cast if known', async () => {
      expect((await engine.mergeCast(cast)).isOk()).toBe(true);

      const castRemove = await Factories.CastRemove.create(
        {
          data: {
            rootBlock: root.data.rootBlock,
            body: {
              targetHash: cast.hash,
            },
            username: 'alice',
          },
        },
        { transient: { signer: aliceCustodySigner } }
      );

      expect((await engine.mergeCast(castRemove)).isOk()).toBe(true);
      expect(subject()).toEqual([]);
    });

    test('succeeds and does nothing if cast is unknown', async () => {
      expect((await engine.mergeCast(cast)).isOk()).toBe(true);

      const castRemove = await Factories.CastRemove.create(
        {
          data: {
            rootBlock: root.data.rootBlock,
            username: 'alice',
          },
        },
        { transient: { signer: aliceCustodySigner } }
      );

      expect((await engine.mergeCast(castRemove)).isOk()).toBe(true);
      expect(subject()).toEqual([cast]);
    });

    // test('fails if remove timestamp is < cast timestamp', async () => {});
  });

  describe('cast-recast merge: ', () => {
    test('succeeds', async () => {
      expect((await engine.mergeCast(cast)).isOk()).toBe(true);

      const castRecast = await Factories.CastRecast.create(
        {
          data: {
            rootBlock: root.data.rootBlock,
            username: 'alice',
          },
        },
        { transient: { signer: aliceCustodySigner } }
      );

      expect((await engine.mergeCast(castRecast)).isOk()).toBe(true);
      expect(subject()).toEqual([cast, castRecast]);
    });

    // test('succeeds and replaces an older cast-recast, if latest', async () => {});
    // test('fails, if not the latest cast-recast', async () => {});
    // test('fails recast if uri references self', async () => {});
  });
});
