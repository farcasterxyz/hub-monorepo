import Engine from '~/engine';
import { Factories } from '~/factories';
import {
  Ed25519Signer,
  EthereumSigner,
  SignerAdd,
  Verification,
  VerificationAddFactoryTransientParams,
  VerificationAdd,
  VerificationClaim,
  IDRegistryEvent,
  SignatureAlgorithm,
} from '~/types';
import Faker from 'faker';
import { Wallet } from 'ethers';
import { hashFCObject, generateEd25519Signer, generateEthereumSigner } from '~/utils';

const engine = new Engine();

// TODO: add test helpers to clean up the setup of these tests
describe('mergeVerification', () => {
  let aliceCustody: EthereumSigner;
  let aliceCustodyRegister: IDRegistryEvent;
  let aliceSigner: Ed25519Signer;
  let aliceSignerAdd: SignerAdd;
  let aliceBlockHash: string;
  let aliceEthWallet: Wallet;
  let aliceClaimHash: string;
  let aliceExternalSignature: string;
  let transientParams: { transient: VerificationAddFactoryTransientParams };
  let genericVerificationAdd: VerificationAdd;

  beforeAll(async () => {
    aliceCustody = await generateEthereumSigner();
    aliceCustodyRegister = await Factories.IDRegistryEvent.create({
      args: { to: aliceCustody.signerKey },
      name: 'Register',
    });
    aliceSigner = await generateEd25519Signer();
    transientParams = { transient: { signer: aliceSigner } };
    aliceSignerAdd = await Factories.SignerAdd.create(
      { data: { username: 'alice' } },
      { transient: { signer: aliceCustody, delegateSigner: aliceSigner } }
    );
    aliceEthWallet = Wallet.createRandom();
    transientParams = { transient: { signer: aliceSigner, ethWallet: aliceEthWallet } };
    aliceBlockHash = Faker.datatype.hexaDecimal(64).toLowerCase();

    const verificationClaim: VerificationClaim = {
      username: 'alice',
      externalUri: aliceEthWallet.address,
      blockHash: aliceBlockHash,
    };
    aliceClaimHash = await hashFCObject(verificationClaim);

    aliceExternalSignature = await aliceEthWallet.signMessage(aliceClaimHash);

    genericVerificationAdd = await Factories.VerificationAdd.create(
      {
        data: {
          username: 'alice',
          body: {
            claimHash: aliceClaimHash,
            blockHash: aliceBlockHash,
            externalSignature: aliceExternalSignature,
          },
        },
      },
      transientParams
    );
  });

  beforeEach(() => {
    engine._reset();
    engine.mergeIDRegistryEvent('alice', aliceCustodyRegister);
    engine.mergeSignerMessage(aliceSignerAdd);
  });

  test('fails with invalid message type', async () => {
    const cast = (await Factories.Cast.create(
      {
        data: { username: 'alice' },
      },
      transientParams
    )) as unknown as Verification;
    expect((await engine.mergeVerification(cast)).isOk()).toBe(false);
  });

  test('succeeds with a valid VerificationAdd', async () => {
    expect((await engine.mergeVerification(genericVerificationAdd)).isOk()).toBe(true);
    expect(engine._getVerificationAdds('alice')).toEqual([genericVerificationAdd]);
  });

  test('fails if message signer is not valid', async () => {
    engine._resetSigners();
    expect((await engine.mergeVerification(genericVerificationAdd))._unsafeUnwrapErr()).toBe(
      'mergeVerification: unknown user'
    );
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  test('fails with malformed externalSignature', async () => {
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          username: 'alice',
          body: { externalSignature: 'foo', claimHash: aliceClaimHash, blockHash: aliceBlockHash },
        },
      },
      transientParams
    );
    const res = await engine.mergeVerification(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toBe('validateVerificationAdd: invalid externalSignature');
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  test('fails with externalSignature from unknown address', async () => {
    const ethWalletAlice = Wallet.createRandom();
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          username: 'alice',
          body: {
            externalUri: ethWalletAlice.address,
            externalSignature: aliceExternalSignature,
          },
        },
      },
      transientParams
    );
    const res = await engine.mergeVerification(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toBe('validateVerificationAdd: externalSignature does not match externalUri');
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  test('fails with invalid claimHash', async () => {
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          username: 'alice',
          body: { claimHash: 'bar', externalSignature: aliceExternalSignature },
        },
      },
      transientParams
    );
    const res = await engine.mergeVerification(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toBe('validateVerificationAdd: invalid claimHash');
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  test('fails with invalid blockHash', async () => {
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          username: 'alice',
          body: {
            claimHash: aliceClaimHash,
            blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
            externalSignature: aliceExternalSignature,
          },
        },
      },
      transientParams
    );
    const res = await engine.mergeVerification(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toBe('validateVerificationAdd: invalid claimHash');
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  test('fails with invalid externalSignatureType', async () => {
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          username: 'alice',
          body: {
            claimHash: aliceClaimHash,
            externalSignature: aliceExternalSignature,
            externalSignatureType: 'bar' as unknown as SignatureAlgorithm.EthereumPersonalSign,
          },
        },
      },
      transientParams
    );
    const res = await engine.mergeVerification(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toBe('validateMessage: unknown message');
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  // TODO: share these generic message validation tests between engine tests

  test('fails with invalid hash', async () => {
    const badHashVerification: VerificationAdd = { ...genericVerificationAdd, hash: 'foo' };
    const res = await engine.mergeVerification(badHashVerification);
    expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  test('fails with invalid signature', async () => {
    const badMessageSignature: VerificationAdd = {
      ...genericVerificationAdd,
      signature:
        '0x5b699d494b515b22258c01ad19710d44c3f12235f0c01e91d09a1e4e2cd25d80c77026a7319906da3b8ce62abc18477c19e444a02949a0dde54f8cadef889502',
    };
    const res = await engine.mergeVerification(badMessageSignature);
    expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid signature');
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  test('fails if signedAt is > current time + safety margin', async () => {
    const elevenMinutesAhead = Date.now() + 11 * 60 * 1000;
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          username: 'alice',
          signedAt: elevenMinutesAhead,
          body: {
            claimHash: aliceClaimHash,
            externalSignature: aliceExternalSignature,
          },
        },
      },
      transientParams
    );
    const res = await engine.mergeVerification(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toBe('validateMessage: signedAt more than 10 mins in the future');
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  test('succeeds with a valid VerificationRemove', async () => {
    expect((await engine.mergeVerification(genericVerificationAdd)).isOk()).toBe(true);
    expect(engine._getVerificationAdds('alice')).toEqual([genericVerificationAdd]);
    const verificationRemoveMessage = await Factories.VerificationRemove.create(
      {
        data: {
          username: 'alice',
          signedAt: genericVerificationAdd.data.signedAt + 1,
          body: { claimHash: genericVerificationAdd.data.body.claimHash },
        },
      },
      transientParams
    );
    expect((await engine.mergeVerification(verificationRemoveMessage)).isOk()).toBe(true);
    expect(engine._getVerificationRemoves('alice')).toEqual([verificationRemoveMessage]);
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  test('succeeds with a valid VerificationRemove before relevant VerificationAdd has been added', async () => {
    const verificationRemoveMessage = await Factories.VerificationRemove.create(
      {
        data: {
          username: 'alice',
          signedAt: genericVerificationAdd.data.signedAt + 1,
          body: { claimHash: genericVerificationAdd.data.body.claimHash },
        },
      },
      transientParams
    );
    expect((await engine.mergeVerification(verificationRemoveMessage)).isOk()).toBe(true);
    expect(engine._getVerificationRemoves('alice')).toEqual([verificationRemoveMessage]);
    expect(engine._getVerificationAdds('alice')).toEqual([]);
    expect((await engine.mergeVerification(genericVerificationAdd)).isOk()).toBe(false);
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });
});
