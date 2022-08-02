import Engine from '~/engine';
import { Factories } from '~/factories';
import { Ed25519Signer, EthereumSigner, SignatureAlgorithm, SignerAdd, SignerMessage, SignerRemove } from '~/types';
import {
  blake2BHash,
  convertToHex,
  generateEd25519KeyPair,
  generateEd25519Signer,
  generateEthereumSigner,
  hashFCObject,
} from '~/utils';

const engine = new Engine();

describe('mergeSignerMessage', () => {
  let aliceCustodySigner: EthereumSigner;
  let aliceDelegateSigner: Ed25519Signer;
  let genericMessageData: { username: string };
  let aliceSignerAddDelegate: SignerAdd;
  let aliceSignerRemoveDelegate: SignerRemove;

  beforeAll(async () => {
    aliceCustodySigner = await generateEthereumSigner();
    aliceDelegateSigner = await generateEd25519Signer();
    genericMessageData = {
      username: 'alice',
    };
    aliceSignerAddDelegate = await Factories.SignerAdd.create(
      { data: genericMessageData },
      { transient: { signer: aliceCustodySigner, childSigner: aliceDelegateSigner } }
    );
    aliceSignerRemoveDelegate = await Factories.SignerRemove.create(
      { data: { ...genericMessageData, body: { childKey: aliceDelegateSigner.signerKey } } },
      { transient: { signer: aliceCustodySigner } }
    );
  });

  beforeEach(() => {
    engine._reset();
  });

  test('fails without a custody address', async () => {
    const res = await engine.mergeSignerMessage(aliceSignerAddDelegate);
    expect(res.isOk()).toBe(false);
    expect(engine._getSigners('alice')).toEqual([]);
  });

  describe('with a custody address', () => {
    beforeEach(async () => {
      engine.addCustody('alice', aliceCustodySigner.signerKey);
    });

    test('fails with invalid message type', async () => {
      const cast = (await Factories.Cast.create(
        { data: genericMessageData },
        { transient: { signer: aliceCustodySigner } }
      )) as unknown as SignerMessage;
      expect((await engine.mergeSignerMessage(cast)).isOk()).toBe(false);
    });

    test('succeeds with a valid SignerAdd', async () => {
      const res = await engine.mergeSignerMessage(aliceSignerAddDelegate);
      expect(res.isOk()).toBe(true);
      expect(engine._getSigners('alice')).toEqual([aliceDelegateSigner.signerKey]);
    });

    test('fails with malformed childSignature', async () => {
      const badSignerAdd = await Factories.SignerAdd.create(
        { data: { ...genericMessageData, body: { childSignature: 'foo' } } },
        { transient: { signer: aliceCustodySigner } }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateSignerAdd: invalid childSignature');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails when childSignature and childKey do not match', async () => {
      const childKeyPair = await generateEd25519KeyPair();
      const childPubKey = await convertToHex(childKeyPair.publicKey);
      const badSignerAdd = await Factories.SignerAdd.create(
        { data: { ...genericMessageData, body: { childKey: childPubKey } } },
        { transient: { signer: aliceCustodySigner } }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateSignerAdd: childSignature does not match childKey');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails with invalid edgeHash', async () => {
      const badEdgeHash = await blake2BHash('bar');
      const badSignerAdd = await Factories.SignerAdd.create(
        { data: { ...genericMessageData, body: { edgeHash: badEdgeHash } } },
        { transient: { signer: aliceCustodySigner } }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateSignerAdd: invalid edgeHash');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails with invalid childSignatureType', async () => {
      const badSignerAdd = await Factories.SignerAdd.create(
        {
          data: { ...genericMessageData, body: { childSignatureType: 'bar' as unknown as SignatureAlgorithm.Ed25519 } },
        },
        { transient: { signer: aliceCustodySigner } }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails with invalid hash', async () => {
      const signerAddClone = { ...aliceSignerAddDelegate };
      signerAddClone.hash = await hashFCObject({ foo: 'bar' });
      const res = await engine.mergeSignerMessage(signerAddClone);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails with invalid signature', async () => {
      const signerAddClone = { ...aliceSignerAddDelegate };
      signerAddClone.signature =
        '0x5b699d494b515b22258c01ad19710d44c3f12235f0c01e91d09a1e4e2cd25d80c77026a7319906da3b8ce62abc18477c19e444a02949a0dde54f8cadef889502';
      const res = await engine.mergeSignerMessage(signerAddClone);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid signature');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails if signedAt is > current time + safety margin', async () => {
      const badSignerAdd = await Factories.SignerAdd.create(
        {
          data: { ...genericMessageData, signedAt: Date.now() + 11 * 60 * 1000 },
        },
        { transient: { signer: aliceCustodySigner } }
      );
      const res = await engine.mergeSignerMessage(badSignerAdd);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('validateMessage: signedAt more than 10 mins in the future');
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('succeeds with a valid SignerRemove', async () => {
      expect((await engine.mergeSignerMessage(aliceSignerAddDelegate)).isOk()).toBe(true);
      expect(engine._getSigners('alice')).toEqual([aliceDelegateSigner.signerKey]);
      const res = await engine.mergeSignerMessage(aliceSignerRemoveDelegate);
      expect(res.isOk()).toBe(true);
      expect(engine._getSigners('alice')).toEqual([]);
    });

    test('fails with a valid SignerRemove when relevant SignerAdd has not been merged', async () => {
      const res = await engine.mergeSignerMessage(aliceSignerRemoveDelegate);
      expect(res.isOk()).toBe(false);
      expect(res._unsafeUnwrapErr()).toBe('SignerSet.remove: edge does not exist');
      expect(engine._getSigners('alice')).toEqual([]);
    });
  });
});
