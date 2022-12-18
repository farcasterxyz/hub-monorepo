import { faker } from '@faker-js/faker';
import { ResultAsync } from 'neverthrow';

import { jestRocksDB } from '~/storage/db/jestUtils';
import SignerDB from '~/storage/db/signer';
import Engine from '~/storage/engine';
import { BadRequestError } from '~/utils/errors';
import { Factories } from '~/test/factories';
import { Ed25519Signer, EthereumSigner, SignerAdd, SignerMessage, SignerRemove, IdRegistryEvent } from '~/types';
import { generateEd25519Signer, generateEthereumSignerUnsafe, hashFCObject } from '~/utils/crypto';
import { HubError } from '~/utils/hubErrors';

const testDb = jestRocksDB(`engine.signer.test`);
const engine = new Engine(testDb);
const aliceFid = faker.datatype.number();

const signerDb = new SignerDB(testDb);
const aliceCustodyAddress = async (): Promise<string> => {
  const event = await signerDb.getCustodyEvent(aliceFid);
  return event.args.to;
};
const aliceSigners = async (): Promise<Set<SignerAdd>> => {
  const address = await ResultAsync.fromPromise(aliceCustodyAddress(), () => undefined);
  if (address.isErr()) return new Set();
  const signerAdds = await signerDb.getSignerAddsByUser(aliceFid, address.value);
  return new Set(signerAdds);
};

describe('mergeSignerMessage', () => {
  let aliceCustodySigner: EthereumSigner;
  let aliceCustodyRegister: IdRegistryEvent;
  let aliceDelegateSigner: Ed25519Signer;
  let aliceSignerAddDelegate: SignerAdd;
  let aliceSignerRemoveDelegate: SignerRemove;

  beforeAll(async () => {
    aliceCustodySigner = await generateEthereumSignerUnsafe();
    aliceCustodyRegister = await Factories.IdRegistryEvent.create({
      args: { to: aliceCustodySigner.signerKey, id: aliceFid },
      name: 'Register',
    });
    aliceDelegateSigner = await generateEd25519Signer();
    aliceSignerAddDelegate = await Factories.SignerAdd.create(
      { data: { fid: aliceFid } },
      { transient: { signer: aliceCustodySigner, delegateSigner: aliceDelegateSigner } }
    );
    aliceSignerRemoveDelegate = await Factories.SignerRemove.create(
      {
        data: {
          fid: aliceFid,
          body: { delegate: aliceDelegateSigner.signerKey },
          signedAt: aliceSignerAddDelegate.data.signedAt + 1,
        },
      },
      { transient: { signer: aliceCustodySigner } }
    );
  });

  test('fails without a custody address', async () => {
    const res = await engine.mergeMessage(aliceSignerAddDelegate);
    expect(res.isOk()).toBe(false);
    await expect(aliceCustodyAddress()).rejects.toThrow(HubError);
    expect(await aliceSigners()).toEqual(new Set());
  });

  describe('with a custody address', () => {
    beforeEach(async () => {
      await engine.mergeIdRegistryEvent(aliceCustodyRegister);
    });

    test('fails with invalid message type', async () => {
      const cast = (await Factories.CastShort.create(
        { data: { fid: aliceFid } },
        { transient: { signer: aliceCustodySigner } }
      )) as unknown as SignerMessage;
      expect((await engine.mergeMessage(cast)).isOk()).toBe(false);
    });

    test('succeeds with a valid SignerAdd', async () => {
      const res = await engine.mergeMessage(aliceSignerAddDelegate);
      expect(res.isOk()).toBe(true);
      expect(await aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(await aliceSigners()).toEqual(new Set([aliceSignerAddDelegate]));
    });

    test('fails when delegate is another custody address', async () => {
      const ethAddress = faker.datatype.hexadecimal({ length: 32 });
      const addEthSigner = await Factories.SignerAdd.create(
        { data: { fid: aliceFid, body: { delegate: ethAddress } } },
        { transient: { signer: aliceCustodySigner } }
      );
      const res = await engine.mergeMessage(addEthSigner);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toMatchObject(
        new BadRequestError('validateSignerMessage: delegate must be an EdDSA public key')
      );
      expect(await aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(await aliceSigners()).toEqual(new Set());
    });

    test('fails when signer is a delegate signer', async () => {
      await engine.mergeMessage(aliceSignerAddDelegate);
      const bobDelegate = await generateEd25519Signer();
      const addBob = await Factories.SignerAdd.create(
        { data: { fid: aliceFid, body: { delegate: bobDelegate.signerKey } } },
        { transient: { signer: aliceDelegateSigner as unknown as EthereumSigner } }
      );
      const res = await engine.mergeMessage(addBob);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toMatchObject(
        new BadRequestError('validateSignerMessage: signer must be a custody address')
      );
      expect(await aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(await aliceSigners()).toEqual(new Set([aliceSignerAddDelegate]));
    });

    test('fails with invalid hash', async () => {
      const signerAddClone = { ...aliceSignerAddDelegate };
      signerAddClone.hash = await hashFCObject({ foo: 'bar' });
      const res = await engine.mergeMessage(signerAddClone);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid hash'));
      expect(await aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(await aliceSigners()).toEqual(new Set());
    });

    test('fails with invalid signature', async () => {
      const signerAddClone = { ...aliceSignerAddDelegate };
      signerAddClone.signature =
        '0x5b699d494b515b22258c01ad19710d44c3f12235f0c01e91d09a1e4e2cd25d80c77026a7319906da3b8ce62abc18477c19e444a02949a0dde54f8cadef889502';
      const res = await engine.mergeMessage(signerAddClone);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid signature'));
      expect(await aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(await aliceSigners()).toEqual(new Set());
    });

    test('fails if signedAt is > current time + safety margin', async () => {
      const badSignerAdd = await Factories.SignerAdd.create(
        {
          data: { fid: aliceFid, signedAt: Date.now() + 11 * 60 * 1000 },
        },
        { transient: { signer: aliceCustodySigner } }
      );
      const res = await engine.mergeMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toMatchObject(
        new BadRequestError('validateMessage: signedAt more than 10 mins in the future')
      );
      expect(await aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(await aliceSigners()).toEqual(new Set());
    });

    test('succeeds with a valid SignerRemove', async () => {
      expect((await engine.mergeMessage(aliceSignerAddDelegate)).isOk()).toBe(true);
      const res = await engine.mergeMessage(aliceSignerRemoveDelegate);
      expect(res.isOk()).toBe(true);
      expect(await aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(await aliceSigners()).toEqual(new Set());
    });

    test('succeeds with a valid SignerRemove when relevant SignerAdd has not been merged', async () => {
      expect((await engine.mergeMessage(aliceSignerRemoveDelegate)).isOk()).toBe(true);
      expect(await aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(await aliceSigners()).toEqual(new Set());
    });
  });
});
