import Engine from '~/engine';
import { Factories } from '~/factories';
import {
  MessageSigner,
  Root,
  Verification,
  VerificationAdd,
  VerificationAddFactoryTransientParams,
  VerificationClaim,
} from '~/types';
import Faker from 'faker';
import { ethers } from 'ethers';
import { hashFCObject, generateEd25519Signer } from '~/utils';

const engine = new Engine();

// TODO: add test helpers to clean up the setup of these tests
// TODO: refactor these tests to be faster (currently ~7s)
describe('mergeVerification', () => {
  let aliceSigner: MessageSigner;
  let aliceAddress: string;
  let aliceRoot: Root;
  let aliceBlockHash: string;
  let aliceEthWallet: ethers.Wallet;
  let aliceClaimHash: string;
  let aliceExternalSignature: string;
  let transientParams: { transient: VerificationAddFactoryTransientParams };
  let genericVerificationAdd: VerificationAdd;

  // Generate key pair for alice and root message
  beforeAll(async () => {
    aliceSigner = await generateEd25519Signer();
    aliceEthWallet = ethers.Wallet.createRandom();
    aliceAddress = aliceSigner.signerKey;
    transientParams = { transient: { signer: aliceSigner, ethWallet: aliceEthWallet } };
    aliceRoot = await Factories.Root.create({ data: { rootBlock: 100, username: 'alice' } }, transientParams);
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
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
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
    engine.mergeRoot(aliceRoot);
  });

  test('fails with invalid message type', async () => {
    const cast = (await Factories.Cast.create(
      {
        data: { rootBlock: aliceRoot.data.rootBlock, username: 'alice', signedAt: aliceRoot.data.signedAt + 1 },
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
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
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
    const ethWalletAlice = ethers.Wallet.createRandom();
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
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
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
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
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
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
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
          body: {
            claimHash: aliceClaimHash,
            externalSignature: aliceExternalSignature,
            externalSignatureType: 'bar' as unknown as 'eip-191-0x45',
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
          rootBlock: aliceRoot.data.rootBlock,
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

  test('fails if there is no root', async () => {
    engine._resetRoots();
    const res = await engine.mergeVerification(genericVerificationAdd);
    expect(res._unsafeUnwrapErr()).toBe('validateMessage: no root present');
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  test('succeeds with a valid VerificationRemove', async () => {
    expect((await engine.mergeVerification(genericVerificationAdd)).isOk()).toBe(true);
    expect(engine._getVerificationAdds('alice')).toEqual([genericVerificationAdd]);
    const verificationRemoveMessage = await Factories.VerificationRemove.create(
      {
        data: {
          rootBlock: aliceRoot.data.rootBlock,
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
          rootBlock: aliceRoot.data.rootBlock,
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
