import Faker from 'faker';
import Engine from '~/engine';
import { Factories } from '~/factories';
import { Ed25519Signer, EthereumSigner, SignerAdd, SignerMessage, SignerRemove, IDRegistryEvent } from '~/types';
import { generateEd25519Signer, generateEthereumSigner, hashFCObject } from '~/utils';

const engine = new Engine();
const aliceFid = Faker.datatype.number();
const aliceCustodyAddress = () => engine._getCustodyAddress(aliceFid);
const aliceSigners = () => engine._getSigners(aliceFid);

describe('mergeSignerMessage', () => {
  let aliceCustodySigner: EthereumSigner;
  let aliceCustodyRegister: IDRegistryEvent;
  let aliceDelegateSigner: Ed25519Signer;
  let aliceSignerAddDelegate: SignerAdd;
  let aliceSignerRemoveDelegate: SignerRemove;

  beforeAll(async () => {
    aliceCustodySigner = await generateEthereumSigner();
    aliceCustodyRegister = await Factories.IDRegistryEvent.create({
      args: { to: aliceCustodySigner.signerKey, id: aliceFid },
      name: 'Register',
    });
    aliceDelegateSigner = await generateEd25519Signer();
    aliceSignerAddDelegate = await Factories.SignerAdd.create(
      { data: { fid: aliceFid } },
      { transient: { signer: aliceCustodySigner, delegateSigner: aliceDelegateSigner } }
    );
    aliceSignerRemoveDelegate = await Factories.SignerRemove.create(
      { data: { fid: aliceFid, body: { delegate: aliceDelegateSigner.signerKey } } },
      { transient: { signer: aliceCustodySigner } }
    );
  });

  beforeEach(() => {
    engine._reset();
  });

  test('fails without a custody address', async () => {
    const res = await engine.mergeMessage(aliceSignerAddDelegate);
    expect(res.isOk()).toBe(false);
    expect(aliceCustodyAddress()).toEqual(undefined);
    expect(aliceSigners()).toEqual(new Set());
  });

  describe('with a custody address', () => {
    beforeEach(async () => {
      engine.mergeIDRegistryEvent(aliceCustodyRegister);
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
      expect(aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(aliceSigners()).toEqual(new Set([aliceDelegateSigner.signerKey]));
    });

    test('fails when delegate is another custody address', async () => {
      const ethAddress = Faker.datatype.hexaDecimal(32);
      const addEthSigner = await Factories.SignerAdd.create(
        { data: { fid: aliceFid, body: { delegate: ethAddress } } },
        { transient: { signer: aliceCustodySigner } }
      );
      const res = await engine.mergeMessage(addEthSigner);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateSignerMessage: delegate must be an EdDSA public key');
      expect(aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(aliceSigners()).toEqual(new Set());
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
      expect(res._unsafeUnwrapErr()).toBe('validateSignerMessage: signer must be a custody address');
      expect(aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(aliceSigners()).toEqual(new Set([aliceDelegateSigner.signerKey]));
    });

    test('fails with invalid hash', async () => {
      const signerAddClone = { ...aliceSignerAddDelegate };
      signerAddClone.hash = await hashFCObject({ foo: 'bar' });
      const res = await engine.mergeMessage(signerAddClone);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
      expect(aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(aliceSigners()).toEqual(new Set());
    });

    test('fails with invalid signature', async () => {
      const signerAddClone = { ...aliceSignerAddDelegate };
      signerAddClone.signature =
        '0x5b699d494b515b22258c01ad19710d44c3f12235f0c01e91d09a1e4e2cd25d80c77026a7319906da3b8ce62abc18477c19e444a02949a0dde54f8cadef889502';
      const res = await engine.mergeMessage(signerAddClone);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid signature');
      expect(aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(aliceSigners()).toEqual(new Set());
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
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: signedAt more than 10 mins in the future');
      expect(aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(aliceSigners()).toEqual(new Set());
    });

    test('succeeds with a valid SignerRemove', async () => {
      expect((await engine.mergeMessage(aliceSignerAddDelegate)).isOk()).toBe(true);
      const res = await engine.mergeMessage(aliceSignerRemoveDelegate);
      expect(res.isOk()).toBe(true);
      expect(aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(aliceSigners()).toEqual(new Set());
    });

    test('succeeds with a valid SignerRemove when relevant SignerAdd has not been merged', async () => {
      expect((await engine.mergeMessage(aliceSignerRemoveDelegate)).isOk()).toBe(true);
      expect(aliceCustodyAddress()).toEqual(aliceCustodySigner.signerKey);
      expect(aliceSigners()).toEqual(new Set());
    });
  });
});
