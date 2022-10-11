import Engine from '~/storage/engine';
import Faker from 'faker';
import { Factories } from '~/test/factories';
import {
  Ed25519Signer,
  EthereumSigner,
  IDRegistryEvent,
  MessageFactoryTransientParams,
  ProfileMeta,
  ProfileMetaType,
  SignerAdd,
} from '~/types';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils/crypto';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { BadRequestError } from '~/utils/errors';
import ProfileDB from '../db/profile';

const testDb = jestRocksDB(`engine.profile.test`);
const profileDb = new ProfileDB(testDb);
const engine = new Engine(testDb);

const aliceFid = Faker.datatype.number();

describe('mergeProfileMessage', () => {
  let aliceCustody: EthereumSigner;
  let aliceCustodyRegister: IDRegistryEvent;
  let aliceSigner: Ed25519Signer;
  let aliceSignerAdd: SignerAdd;
  let profileMeta: ProfileMeta;
  let transientParams: { transient: MessageFactoryTransientParams };

  const aliceMetas = async () => {
    const metas = await profileDb.getProfileMetaByUser(aliceFid);
    return new Set(metas);
  };

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
    profileMeta = await Factories.ProfileMeta.create({ data: { fid: aliceFid } }, transientParams);
  });

  beforeEach(async () => {
    await engine._reset();
  });

  test('fails if there are no known signers', async () => {
    const result = await engine.mergeMessage(profileMeta);
    expect(result._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: unknown user'));
    await expect(aliceMetas()).resolves.toEqual(new Set());
  });

  describe('with signers', () => {
    beforeEach(async () => {
      await engine.mergeIDRegistryEvent(aliceCustodyRegister);
      await engine.mergeMessage(aliceSignerAdd);
    });

    describe('signer validation', () => {
      afterEach(async () => {
        await expect(aliceMetas()).resolves.toEqual(new Set());
      });

      test('fails if the signer is not valid', async () => {
        // Calling Factory without specifying a signing key makes Faker choose a random one
        const newSignerMessage = await Factories.ProfileMeta.create({
          data: {
            fid: aliceFid,
          },
        });
        const result = await engine.mergeMessage(newSignerMessage);
        expect(result._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid signer'));
      });

      test('fails if the signer is valid, but the fid is invalid', async () => {
        const unknownUserMessage = await Factories.ProfileMeta.create({ data: { fid: aliceFid + 1 } }, transientParams);
        const res = await engine.mergeMessage(unknownUserMessage);
        expect(res._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: unknown user'));
      });
    });

    describe('message validation', () => {
      afterEach(async () => {
        await expect(aliceMetas()).resolves.toEqual(new Set());
      });

      test('fails if the hash is invalid', async () => {
        const invalidHashMessage: ProfileMeta = { ...profileMeta, hash: profileMeta.hash + 'foo' };
        const res = await engine.mergeMessage(invalidHashMessage);
        expect(res._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid hash'));
      });

      test('fails if the signature is invalid', async () => {
        const invalidSignatureMessage: ProfileMeta = { ...profileMeta, signature: Faker.datatype.hexaDecimal(128) };
        const res = await engine.mergeMessage(invalidSignatureMessage);
        expect(res._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid signature'));
      });

      test('fails if signedAt is > current time + safety margin', async () => {
        const elevenMinutesAhead = Date.now() + 11 * 60 * 1000;
        const futureMessage = await Factories.ProfileMeta.create(
          {
            data: {
              fid: aliceFid,
              signedAt: elevenMinutesAhead,
            },
          },
          transientParams
        );
        const res = await engine.mergeMessage(futureMessage);
        expect(res._unsafeUnwrapErr()).toMatchObject(
          new BadRequestError('validateMessage: signedAt more than 10 mins in the future')
        );
      });
    });

    describe('ProfileMeta', () => {
      test('succeeds with a valid ProfileMeta message', async () => {
        expect((await engine.mergeMessage(profileMeta)).isOk()).toBe(true);
        await expect(aliceMetas()).resolves.toEqual(new Set([profileMeta]));
      });

      describe('fails', () => {
        let invalidMessage: ProfileMeta;

        afterEach(async () => {
          const result = await engine.mergeMessage(invalidMessage);
          expect(result._unsafeUnwrapErr().statusCode).toEqual(400);
        });

        test('with pfp > 256 characters', async () => {
          invalidMessage = await Factories.ProfileMeta.create(
            {
              data: { fid: aliceFid, body: { type: ProfileMetaType.Pfp, value: Faker.random.alphaNumeric(257) } },
            },
            transientParams
          );
        });

        test('with display > 32 characters', async () => {
          invalidMessage = await Factories.ProfileMeta.create(
            {
              data: { fid: aliceFid, body: { type: ProfileMetaType.Display, value: Faker.random.alphaNumeric(33) } },
            },
            transientParams
          );
        });

        test('with bio > 256 characters', async () => {
          invalidMessage = await Factories.ProfileMeta.create(
            {
              data: { fid: aliceFid, body: { type: ProfileMetaType.Bio, value: Faker.random.alphaNumeric(257) } },
            },
            transientParams
          );
        });

        test('with location > 64 characters', async () => {
          invalidMessage = await Factories.ProfileMeta.create(
            {
              data: { fid: aliceFid, body: { type: ProfileMetaType.Location, value: Faker.random.alphaNumeric(65) } },
            },
            transientParams
          );
        });

        test('with url > 256 characters', async () => {
          invalidMessage = await Factories.ProfileMeta.create(
            {
              data: { fid: aliceFid, body: { type: ProfileMetaType.Url, value: Faker.random.alphaNumeric(257) } },
            },
            transientParams
          );
        });
      });
    });
  });
});
