import Engine from '~/engine';
import { Factories } from '~/factories';
import {
  CustodyAddEvent,
  CustodyRemoveAll,
  Ed25519Signer,
  EthereumSigner,
  SignatureAlgorithm,
  SignerAdd,
  SignerMessage,
  SignerRemove,
} from '~/types';
import {
  blake2BHash,
  convertToHex,
  generateEd25519KeyPair,
  generateEd25519Signer,
  generateEthereumSigner,
  hashFCObject,
} from '~/utils';

const engine = new Engine();

const aliceAllSigners = () => engine._getAllSigners('alice');

describe('mergeSignerMessage', () => {
  let aliceCustodySigner: EthereumSigner;
  let aliceCustodyAdd: CustodyAddEvent;
  let aliceCustodyRemoveAll: CustodyRemoveAll;
  let aliceDelegateSigner: Ed25519Signer;
  let aliceSignerAddDelegate: SignerAdd;
  let aliceSignerRemoveDelegate: SignerRemove;

  beforeAll(async () => {
    aliceCustodySigner = await generateEthereumSigner();
    aliceCustodyAdd = await Factories.CustodyAddEvent.create({}, { transient: { signer: aliceCustodySigner } });
    aliceCustodyRemoveAll = await Factories.CustodyRemoveAll.create(
      { data: { username: 'alice' } },
      { transient: { signer: aliceCustodySigner } }
    );
    aliceDelegateSigner = await generateEd25519Signer();
    aliceSignerAddDelegate = await Factories.SignerAdd.create(
      { data: { username: 'alice' } },
      { transient: { signer: aliceCustodySigner, delegateSigner: aliceDelegateSigner } }
    );
    aliceSignerRemoveDelegate = await Factories.SignerRemove.create(
      { data: { username: 'alice', body: { delegate: aliceDelegateSigner.signerKey } } },
      { transient: { signer: aliceCustodySigner } }
    );
  });

  beforeEach(() => {
    engine._reset();
  });

  test('fails without a custody address', async () => {
    const res = await engine.mergeSignerMessage(aliceSignerAddDelegate);
    expect(res.isOk()).toBe(false);
    expect(aliceAllSigners()).toEqual(new Set());
  });

  describe('with a custody address', () => {
    beforeEach(async () => {
      engine.addCustody('alice', aliceCustodyAdd);
    });

    test('fails with invalid message type', async () => {
      const cast = (await Factories.Cast.create(
        { data: { username: 'alice' } },
        { transient: { signer: aliceCustodySigner } }
      )) as unknown as SignerMessage;
      expect((await engine.mergeSignerMessage(cast)).isOk()).toBe(false);
    });

    test('succeeds with valid CustodyRemoveAll', async () => {
      const res = await engine.mergeSignerMessage(aliceCustodyRemoveAll);
      expect(res.isOk()).toBe(true);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustodySigner.signerKey]));
    });

    test('succeeds with a valid SignerAdd', async () => {
      const res = await engine.mergeSignerMessage(aliceSignerAddDelegate);
      expect(res.isOk()).toBe(true);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustodySigner.signerKey, aliceDelegateSigner.signerKey]));
    });

    test('fails with malformed delegateSignature', async () => {
      const badSignerAdd = await Factories.SignerAdd.create(
        { data: { username: 'alice', body: { delegateSignature: 'foo' } } },
        { transient: { signer: aliceCustodySigner } }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateSignerAdd: invalid delegateSignature');
      expect(aliceAllSigners()).toEqual(new Set([aliceCustodySigner.signerKey]));
    });

    test('fails when delegateSignature and delegate do not match', async () => {
      const delegateKeyPair = await generateEd25519KeyPair();
      const delegatePubKey = await convertToHex(delegateKeyPair.publicKey);
      const badSignerAdd = await Factories.SignerAdd.create(
        { data: { username: 'alice', body: { delegate: delegatePubKey } } },
        { transient: { signer: aliceCustodySigner } }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateSignerAdd: delegateSignature does not match delegate');
      expect(aliceAllSigners()).toEqual(new Set([aliceCustodySigner.signerKey]));
    });

    test('fails with invalid edgeHash', async () => {
      const badEdgeHash = await blake2BHash('bar');
      const badSignerAdd = await Factories.SignerAdd.create(
        { data: { username: 'alice', body: { edgeHash: badEdgeHash } } },
        { transient: { signer: aliceCustodySigner } }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateSignerAdd: invalid edgeHash');
      expect(aliceAllSigners()).toEqual(new Set([aliceCustodySigner.signerKey]));
    });

    test('fails with invalid delegateSignatureType', async () => {
      const badSignerAdd = await Factories.SignerAdd.create(
        {
          data: { username: 'alice', body: { delegateSignatureType: 'bar' as unknown as SignatureAlgorithm.Ed25519 } },
        },
        { transient: { signer: aliceCustodySigner } }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(aliceAllSigners()).toEqual(new Set([aliceCustodySigner.signerKey]));
    });

    test('fails with invalid hash', async () => {
      const signerAddClone = { ...aliceSignerAddDelegate };
      signerAddClone.hash = await hashFCObject({ foo: 'bar' });
      const res = await engine.mergeSignerMessage(signerAddClone);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
      expect(aliceAllSigners()).toEqual(new Set([aliceCustodySigner.signerKey]));
    });

    test('fails with invalid signature', async () => {
      const signerAddClone = { ...aliceSignerAddDelegate };
      signerAddClone.signature =
        '0x5b699d494b515b22258c01ad19710d44c3f12235f0c01e91d09a1e4e2cd25d80c77026a7319906da3b8ce62abc18477c19e444a02949a0dde54f8cadef889502';
      const res = await engine.mergeSignerMessage(signerAddClone);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid signature');
      expect(aliceAllSigners()).toEqual(new Set([aliceCustodySigner.signerKey]));
    });

    test('fails if signedAt is > current time + safety margin', async () => {
      const badSignerAdd = await Factories.SignerAdd.create(
        {
          data: { username: 'alice', signedAt: Date.now() + 11 * 60 * 1000 },
        },
        { transient: { signer: aliceCustodySigner } }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: signedAt more than 10 mins in the future');
      expect(aliceAllSigners()).toEqual(new Set([aliceCustodySigner.signerKey]));
    });

    test('succeeds with a valid SignerRemove', async () => {
      expect((await engine.mergeSignerMessage(aliceSignerAddDelegate)).isOk()).toBe(true);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustodySigner.signerKey, aliceDelegateSigner.signerKey]));
      const res = await engine.mergeSignerMessage(aliceSignerRemoveDelegate);
      expect(res.isOk()).toBe(true);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustodySigner.signerKey]));
    });

    test('succeeds with a valid SignerRemove when relevant SignerAdd has not been merged', async () => {
      expect((await engine.mergeSignerMessage(aliceSignerRemoveDelegate)).isOk()).toBe(true);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustodySigner.signerKey]));
    });
  });
});
