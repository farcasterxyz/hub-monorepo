import { faker } from '@faker-js/faker';
import Engine from '~/storage/engine';
import { Factories } from '~/test/factories';
import { Cast, CastShort, EthereumSigner, IdRegistryEvent, MessageSigner, SignerAdd, SignerRemove } from '~/types';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils/crypto';
import { jestRocksDB } from '~/storage/db/jestUtils';
import CastDB from '~/storage/db/cast';
import { BadRequestError, UnknownUserError } from '~/utils/errors';

const rocksDb = jestRocksDB('engine.cast.test');
const castDb = new CastDB(rocksDb);
const engine = new Engine(rocksDb);

const aliceFid = faker.datatype.number();
const aliceAdds = async () => new Set(await castDb.getCastAddsByUser(aliceFid));

describe('mergeCast', () => {
  let aliceCustodySigner: EthereumSigner;
  let aliceCustodyRegister: IdRegistryEvent;
  let aliceDelegateSigner: MessageSigner;
  let cast: CastShort;
  let addDelegateSigner: SignerAdd;
  let removeDelegateSigner: SignerRemove;

  beforeAll(async () => {
    aliceCustodySigner = await generateEthereumSigner();
    aliceCustodyRegister = await Factories.IdRegistryEvent.create({
      args: { to: aliceCustodySigner.signerKey, id: aliceFid },
      name: 'Register',
    });
    aliceDelegateSigner = await generateEd25519Signer();

    cast = await Factories.CastShort.create(
      {
        data: { fid: aliceFid },
      },
      { transient: { signer: aliceDelegateSigner } }
    );

    addDelegateSigner = await Factories.SignerAdd.create(
      { data: { fid: aliceFid } },
      { transient: { signer: aliceCustodySigner, delegateSigner: aliceDelegateSigner } }
    );

    removeDelegateSigner = await Factories.SignerRemove.create(
      {
        data: {
          fid: aliceFid,
          body: { delegate: aliceDelegateSigner.signerKey },
          signedAt: addDelegateSigner.data.signedAt + 1,
        },
      },
      { transient: { signer: aliceCustodySigner } }
    );
  });

  beforeEach(async () => {
    await engine._reset();
  });

  describe('signer validation', () => {
    test('fails if there are no known signers', async () => {
      const result = await engine.mergeMessage(cast);
      expect(result.isOk()).toBe(false);
      expect(result._unsafeUnwrapErr()).toMatchObject(new UnknownUserError('validateMessage: unknown user'));
      expect(await aliceAdds()).toEqual(new Set());
    });

    describe('with custody address', () => {
      beforeEach(async () => {
        await engine.mergeIdRegistryEvent(aliceCustodyRegister);
      });

      test('fails if signer is custody address', async () => {
        const custodyCast = await Factories.CastShort.create(
          {
            data: { fid: aliceFid },
          },
          { transient: { signer: aliceCustodySigner } }
        );
        const result = await engine.mergeMessage(custodyCast);
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid signer'));
        expect(await aliceAdds()).toEqual(new Set());
      });

      test('fails if delegate signer has not been added', async () => {
        const result = await engine.mergeMessage(cast);
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid signer'));
        expect(await aliceAdds()).toEqual(new Set());
      });

      describe('with delegate signer', () => {
        beforeEach(async () => {
          expect((await engine.mergeMessage(addDelegateSigner)).isOk()).toBe(true);
        });

        test('succeeds', async () => {
          const result = await engine.mergeMessage(cast);
          expect(result.isOk()).toBe(true);
          expect(await aliceAdds()).toEqual(new Set([cast]));
        });

        test('fails if delegate was removed', async () => {
          expect((await engine.mergeMessage(removeDelegateSigner)).isOk()).toBe(true);
          const result = await engine.mergeMessage(cast);
          expect(result.isOk()).toBe(false);
          expect(result._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid signer'));
          expect(await aliceAdds()).toEqual(new Set());
        });

        test('fails with invalid fid', async () => {
          const unknownUser = await Factories.CastShort.create(
            { data: { fid: aliceFid + 1 } },
            { transient: { signer: aliceDelegateSigner } }
          );
          const result = await engine.mergeMessage(unknownUser);
          expect(result.isOk()).toBe(false);
          expect(result._unsafeUnwrapErr()).toMatchObject(new UnknownUserError('validateMessage: unknown user'));
          expect(await aliceAdds()).toEqual(new Set());
        });
      });

      test('fails if the signer is invalid', async () => {
        // Calling Factory without specifying a signing key makes Faker choose a random one
        const castInvalidSigner = await Factories.CastShort.create({
          data: {
            fid: aliceFid,
          },
        });

        const result = await engine.mergeMessage(castInvalidSigner);
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid signer'));
        expect(await aliceAdds()).toEqual(new Set());
      });
    });
  });

  describe('with signers', () => {
    beforeEach(async () => {
      await engine.mergeIdRegistryEvent(aliceCustodyRegister);
      await engine.mergeMessage(addDelegateSigner);
    });

    // TODO: move these generic message validation tests to a shared location
    describe('message validation', () => {
      test('fails if the hash is invalid', async () => {
        const invalidHash = JSON.parse(JSON.stringify(cast)) as Cast;
        invalidHash.hash = '0xd4126acebadb14b41943fc10599c00e2e3627f1e38672c8476277ecf17accb48';
        const result = await engine.mergeMessage(invalidHash);
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid hash'));
        expect(await aliceAdds()).toEqual(new Set());
      });

      test('fails if the signature is invalid', async () => {
        const invalidSignature = JSON.parse(JSON.stringify(cast)) as Cast;
        invalidSignature.signature =
          '0x5b699d494b515b22258c01ad19710d44c3f12235f0c01e91d09a1e4e2cd25d80c77026a7319906da3b8ce62abc18477c19e444a02949a0dde54f8cadef889502';
        const result = await engine.mergeMessage(invalidSignature);
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid signature'));
        expect(await aliceAdds()).toEqual(new Set());
      });

      test('fails if signedAt is > current time + safety margin', async () => {
        const elevenMinutesAhead = Date.now() + 11 * 60 * 1000;
        const futureCast = await Factories.CastShort.create(
          {
            data: {
              fid: aliceFid,
              signedAt: elevenMinutesAhead,
            },
          },
          { transient: { signer: aliceDelegateSigner } }
        );

        const result = await engine.mergeMessage(futureCast);
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toMatchObject(
          new BadRequestError('validateMessage: signedAt more than 10 mins in the future')
        );
      });
    });

    describe('CastShort', () => {
      // test('fails if the schema is invalid', async () => {});
      test('fails if parent does not match schema', async () => {
        const invalidTargets: string[] = [
          'foobar.com', // URL missing scheme
          'http://foobar.com', // web2 URLs not allowed
          'chain://eip155:1', // chain URLs not allowed
          'farcaster://fid:1', // target must be a cast, not a user
        ];
        for (const invalidTarget of invalidTargets) {
          const invalidCast = await Factories.CastShort.create(
            {
              data: { body: { parent: invalidTarget }, fid: aliceFid },
            },
            { transient: { signer: aliceDelegateSigner } }
          );
          const result = await engine.mergeMessage(invalidCast);
          expect(result.isOk()).toBe(false);
          expect(result._unsafeUnwrapErr()).toMatchObject(
            new BadRequestError('validateCastShort: parent must be a valid Cast URL')
          );
        }
      });
      // test('fails if the parent references itself', async () => {});

      test('fails if text is greater than 320 chars', async () => {
        const castLongText = await Factories.CastShort.create(
          {
            data: {
              fid: aliceFid,
              body: {
                text: 'a'.repeat(321),
              },
            },
          },
          { transient: { signer: aliceDelegateSigner } }
        );
        const result = await engine.mergeMessage(castLongText);

        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateCastShort: text > 320 chars'));
        expect(await aliceAdds()).toEqual(new Set());
      });

      test('fails if there are more than two embeds', async () => {
        const castThreeEmbeds = await Factories.CastShort.create(
          {
            data: {
              fid: aliceFid,
              body: {
                embeds: ['a', 'b', 'c'],
              },
            },
          },
          { transient: { signer: aliceDelegateSigner } }
        );

        const result = await engine.mergeMessage(castThreeEmbeds);
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateCastShort: embeds > 2'));
        expect(await aliceAdds()).toEqual(new Set());
      });

      test('fails if there are more than 5 mentions', async () => {
        const invalidCast = await Factories.CastShort.create(
          { data: { fid: aliceFid, body: { mentions: [1, 2, 3, 4, 5, 6] } } },
          { transient: { signer: aliceDelegateSigner } }
        );
        const result = await engine.mergeMessage(invalidCast);
        expect(result.isOk()).toBeFalsy();
        expect(result._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateCastShort: mentions > 5'));
        expect(await aliceAdds()).toEqual(new Set());
      });

      test('fails if meta is greater than 256 chars', async () => {
        const invalidCast = await Factories.CastShort.create(
          { data: { fid: aliceFid, body: { meta: faker.random.alphaNumeric(257) } } },
          { transient: { signer: aliceDelegateSigner } }
        );
        const result = await engine.mergeMessage(invalidCast);
        expect(result.isOk()).toBe(false);
        expect(result._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateCastShort: meta > 256 chars'));
        expect(await aliceAdds()).toEqual(new Set());
      });

      // test('fails if required properties do not exist', async () => {});

      test('succeeds if a valid cast-short is added', async () => {
        expect((await engine.mergeMessage(cast)).isOk()).toBe(true);
        expect(await aliceAdds()).toEqual(new Set([cast]));
      });
    });

    describe('CastRecast', () => {
      test('succeeds', async () => {
        expect((await engine.mergeMessage(cast)).isOk()).toBe(true);

        const castRecast = await Factories.CastRecast.create(
          { data: { fid: aliceFid } },
          { transient: { signer: aliceDelegateSigner } }
        );

        expect((await engine.mergeMessage(castRecast)).isOk()).toBe(true);
        expect(await aliceAdds()).toEqual(new Set([cast, castRecast]));
      });

      // test('succeeds and replaces an older cast-recast, if latest', async () => {});
      // test('fails, if not the latest cast-recast', async () => {});
      // test('fails recast if uri references self', async () => {});
    });

    describe('CastRemove', () => {
      test('succeeds and removes cast if known', async () => {
        expect((await engine.mergeMessage(cast)).isOk()).toBe(true);

        const castRemove = await Factories.CastRemove.create(
          {
            data: {
              body: {
                targetHash: cast.hash,
              },
              fid: aliceFid,
            },
          },
          { transient: { signer: aliceDelegateSigner } }
        );

        expect((await engine.mergeMessage(castRemove)).isOk()).toBe(true);
        expect(await aliceAdds()).toEqual(new Set());
      });

      test('succeeds and does nothing if cast is unknown', async () => {
        expect((await engine.mergeMessage(cast)).isOk()).toBe(true);

        const castRemove = await Factories.CastRemove.create(
          { data: { fid: aliceFid } },
          { transient: { signer: aliceDelegateSigner } }
        );

        expect((await engine.mergeMessage(castRemove)).isOk()).toBe(true);
        expect(await aliceAdds()).toEqual(new Set([cast]));
      });

      // test('fails if remove timestamp is < cast timestamp', async () => {});
    });
  });
});
