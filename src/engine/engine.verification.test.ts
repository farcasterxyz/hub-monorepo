import Engine from '~/engine';
import { Factories } from '~/factories';
import { Root, Verification, VerificationAddFactoryTransientParams } from '~/types';
import Faker from 'faker';
import { ethers } from 'ethers';
import { generateEd25519KeyPair, convertToHex, hashFCObject } from '~/utils';
import { hexToBytes } from 'ethereum-cryptography/utils';

const engine = new Engine();

// TODO: add test helpers to clean up the setup of these tests
// TODO: refactor these tests to be faster (currently ~7s)
describe('mergeVerification', () => {
  let alicePrivateKey: string;
  let aliceAddress: string;
  let aliceRoot: Root;
  let transientParams: { transient: VerificationAddFactoryTransientParams };

  // Generate key pair for alice and root message
  beforeAll(async () => {
    const keyPair = await generateEd25519KeyPair();
    const privateKeyBuffer = keyPair.privateKey;
    alicePrivateKey = await convertToHex(privateKeyBuffer);
    const addressBuffer = keyPair.publicKey;
    aliceAddress = await convertToHex(addressBuffer);
    transientParams = { transient: { privateKey: hexToBytes(alicePrivateKey) } };
    aliceRoot = await Factories.Root.create({ data: { rootBlock: 100, username: 'alice' } }, transientParams);
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
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
        },
      },
      transientParams
    );
    expect((await engine.mergeVerification(verificationAddMessage)).isOk()).toBe(true);
    expect(engine._getVerificationAdds('alice')).toEqual([verificationAddMessage]);
  });

  test('fails if message signer is not valid', async () => {
    engine._resetSigners();
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
        },
      },
      transientParams
    );
    expect((await engine.mergeVerification(verificationAddMessage))._unsafeUnwrapErr()).toBe(
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
          body: { externalSignature: 'foo' },
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
    const ethWalletBob = ethers.Wallet.createRandom();
    transientParams.transient.ethWallet = ethWalletBob;
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
          body: { externalAddressUri: ethWalletAlice.address },
        },
      },
      transientParams
    );
    const res = await engine.mergeVerification(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toBe('validateVerificationAdd: externalSignature does not match externalAddressUri');
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  test('fails with invalid claimHash', async () => {
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
          body: { claimHash: 'bar' },
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
          body: { externalSignatureType: 'bar' as unknown as 'secp256k1-eip-191' },
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
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
        },
      },
      transientParams
    );
    verificationAddMessage.hash = await hashFCObject({ foo: 'bar' });
    const res = await engine.mergeVerification(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  test('fails with invalid signature', async () => {
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
        },
      },
      transientParams
    );
    verificationAddMessage.signature =
      '0x5b699d494b515b22258c01ad19710d44c3f12235f0c01e91d09a1e4e2cd25d80c77026a7319906da3b8ce62abc18477c19e444a02949a0dde54f8cadef889502';
    const res = await engine.mergeVerification(verificationAddMessage);
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
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
        },
      },
      transientParams
    );
    const res = await engine.mergeVerification(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toBe('validateMessage: no root present');
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  test('succeeds with a valid VerificationRemove', async () => {
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
        },
      },
      transientParams
    );
    expect((await engine.mergeVerification(verificationAddMessage)).isOk()).toBe(true);
    expect(engine._getVerificationAdds('alice')).toEqual([verificationAddMessage]);
    const verificationRemoveMessage = await Factories.VerificationRemove.create(
      {
        data: {
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
          body: { verificationAddHash: verificationAddMessage.hash },
        },
      },
      transientParams
    );
    expect((await engine.mergeVerification(verificationRemoveMessage)).isOk()).toBe(true);
    expect(engine._getVerificationRemoves('alice')).toEqual([verificationRemoveMessage]);
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });

  test('succeeds with a valid VerificationRemove before relevant VerificationAdd has been added', async () => {
    const verificationAddMessage = await Factories.VerificationAdd.create(
      {
        data: {
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
        },
      },
      transientParams
    );
    const verificationRemoveMessage = await Factories.VerificationRemove.create(
      {
        data: {
          rootBlock: aliceRoot.data.rootBlock,
          username: 'alice',
          signedAt: aliceRoot.data.signedAt + 1,
          body: { verificationAddHash: verificationAddMessage.hash },
        },
      },
      transientParams
    );
    expect((await engine.mergeVerification(verificationRemoveMessage)).isOk()).toBe(true);
    expect(engine._getVerificationRemoves('alice')).toEqual([verificationRemoveMessage]);
    expect(engine._getVerificationAdds('alice')).toEqual([]);
    expect((await engine.mergeVerification(verificationAddMessage)).isOk()).toBe(false);
    expect(engine._getVerificationAdds('alice')).toEqual([]);
  });
});
