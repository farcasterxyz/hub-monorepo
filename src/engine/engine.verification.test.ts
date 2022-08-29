import Engine from '~/engine';
import { Factories } from '~/factories';
import {
  Ed25519Signer,
  EthereumSigner,
  SignerAdd,
  Verification,
  VerificationEthereumAddressFactoryTransientParams,
  VerificationEthereumAddress,
  VerificationEthereumAddressClaim,
  IDRegistryEvent,
  SignatureAlgorithm,
} from '~/types';
import Faker from 'faker';
import { ethers, Wallet } from 'ethers';
import { hashFCObject, generateEd25519Signer, generateEthereumSigner } from '~/utils';
import { ChainAccountURL } from '~/urls';

const engine = new Engine();
const aliceFid = Faker.datatype.number();
const aliceAdds = () => engine._getVerificationEthereumAddressAdds(aliceFid);

describe('mergeVerification', () => {
  let aliceCustody: EthereumSigner;
  let aliceCustodyRegister: IDRegistryEvent;
  let aliceSigner: Ed25519Signer;
  let aliceSignerAdd: SignerAdd;
  let aliceBlockHash: string;
  let aliceEthWallet: Wallet;
  let aliceClaimHash: string;
  let aliceExternalSignature: string;
  let transientParams: { transient: VerificationEthereumAddressFactoryTransientParams };
  let genericVerificationAdd: VerificationEthereumAddress;

  beforeAll(async () => {
    aliceCustody = await generateEthereumSigner();
    aliceCustodyRegister = await Factories.IDRegistryEvent.create({
      args: { to: aliceCustody.signerKey, id: aliceFid },
      name: 'Register',
    });
    aliceSigner = await generateEd25519Signer();
    transientParams = { transient: { signer: aliceSigner } };
    aliceSignerAdd = await Factories.SignerAdd.create(
      { data: { fid: aliceFid, body: { delegate: aliceSigner.signerKey } } },
      { transient: { signer: aliceCustody } }
    );
    aliceEthWallet = Wallet.createRandom();
    transientParams = { transient: { signer: aliceSigner, ethWallet: aliceEthWallet } };
    aliceBlockHash = Faker.datatype.hexaDecimal(64).toLowerCase();

    const verificationClaim: VerificationEthereumAddressClaim = {
      fid: aliceFid,
      externalUri: Factories.EthereumAddressURL.build(undefined, { transient: { address: aliceEthWallet.address } }),
      blockHash: aliceBlockHash,
    };
    aliceClaimHash = await hashFCObject(verificationClaim);

    aliceExternalSignature = await aliceEthWallet.signMessage(aliceClaimHash);

    genericVerificationAdd = await Factories.VerificationEthereumAddress.create(
      {
        data: {
          fid: aliceFid,
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

  beforeEach(async () => {
    engine._reset();
    await engine.mergeIDRegistryEvent(aliceCustodyRegister);
    await engine.mergeSignerMessage(aliceSignerAdd);
  });

  test('fails with invalid message type', async () => {
    const cast = (await Factories.CastShort.create(
      {
        data: { fid: aliceFid },
      },
      transientParams
    )) as unknown as Verification;
    expect((await engine.mergeVerification(cast)).isOk()).toBe(false);
  });

  test('succeeds with a valid VerificationAdd', async () => {
    expect((await engine.mergeVerification(genericVerificationAdd)).isOk()).toBe(true);
    expect(aliceAdds()).toEqual(new Set([genericVerificationAdd]));
  });

  describe('ethereum addresses', () => {
    test('works when address is checksummed', async () => {
      // leverage the fact that the happy path test above covers checksummed ethereum addresses
      const accountURL = ChainAccountURL.parse(genericVerificationAdd.data.body.externalUri)._unsafeUnwrap();
      expect(accountURL.address).toEqual(ethers.utils.getAddress(accountURL.address));
    });

    test('works when address is not checksummed', async () => {
      // construct verification claim
      const verificationClaim: VerificationEthereumAddressClaim = {
        fid: aliceFid,
        externalUri: Factories.EthereumAddressURL.build(undefined, {
          transient: { address: aliceEthWallet.address.toLowerCase() },
        }),
        blockHash: aliceBlockHash,
      };
      const aliceClaimHash = await hashFCObject(verificationClaim);
      const aliceExternalSignature = await aliceEthWallet.signMessage(aliceClaimHash);
      const verificationAdd = await Factories.VerificationEthereumAddress.create(
        {
          data: {
            fid: aliceFid,
            body: {
              externalUri: Factories.EthereumAddressURL.build(undefined, {
                transient: { address: aliceEthWallet.address.toLowerCase() },
              }),
              claimHash: aliceClaimHash,
              blockHash: aliceBlockHash,
              externalSignature: aliceExternalSignature,
            },
          },
        },
        transientParams
      );

      // sanity check that there is no checksum in the address that was signed
      const accountURL = ChainAccountURL.parse(verificationAdd.data.body.externalUri)._unsafeUnwrap();
      expect(accountURL.address).not.toEqual(ethers.utils.getAddress(accountURL.address));

      // run the verification through the engine
      expect((await engine.mergeVerification(verificationAdd)).isOk()).toBe(true);
      expect(engine._getVerificationEthereumAddressAdds(aliceFid)).toEqual(new Set([verificationAdd]));
    });
  });

  test('fails if message signer is not valid', async () => {
    engine._resetSigners();
    expect((await engine.mergeVerification(genericVerificationAdd))._unsafeUnwrapErr()).toBe(
      'validateMessage: unknown user'
    );
    expect(aliceAdds()).toEqual(new Set());
  });

  test('fails with malformed externalSignature', async () => {
    const verificationAddMessage = await Factories.VerificationEthereumAddress.create(
      {
        data: {
          fid: aliceFid,
          body: { externalSignature: 'foo', claimHash: aliceClaimHash, blockHash: aliceBlockHash },
        },
      },
      transientParams
    );
    const res = await engine.mergeVerification(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toBe('validateVerificationEthereumAddress: invalid externalSignature');
    expect(aliceAdds()).toEqual(new Set());
  });

  test('fails with externalSignature from unknown address', async () => {
    const randomEthWallet = Wallet.createRandom();
    const verificationAddMessage = await Factories.VerificationEthereumAddress.create(
      {
        data: {
          fid: aliceFid,
          body: {
            externalSignature: aliceExternalSignature,
          },
        },
      },
      {
        transient: {
          ...transientParams.transient,
          ethWallet: randomEthWallet,
        },
      }
    );
    const res = await engine.mergeVerification(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toBe(
      'validateVerificationEthereumAddress: externalSignature does not match externalUri'
    );
    expect(aliceAdds()).toEqual(new Set());
  });

  test('fails with invalid claimHash', async () => {
    const verificationAddMessage = await Factories.VerificationEthereumAddress.create(
      {
        data: {
          fid: aliceFid,
          body: { claimHash: 'bar', externalSignature: aliceExternalSignature },
        },
      },
      transientParams
    );
    const res = await engine.mergeVerification(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toBe('validateVerificationEthereumAddress: invalid claimHash');
    expect(aliceAdds()).toEqual(new Set());
  });

  test('fails with invalid blockHash', async () => {
    const verificationAddMessage = await Factories.VerificationEthereumAddress.create(
      {
        data: {
          fid: aliceFid,
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
    expect(res._unsafeUnwrapErr()).toBe('validateVerificationEthereumAddress: invalid claimHash');
    expect(aliceAdds()).toEqual(new Set());
  });

  test('fails with invalid externalSignatureType', async () => {
    const verificationAddMessage = await Factories.VerificationEthereumAddress.create(
      {
        data: {
          fid: aliceFid,
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
    expect(aliceAdds()).toEqual(new Set());
  });

  // TODO: share these generic message validation tests between engine tests

  test('fails with invalid hash', async () => {
    const badHashVerification: VerificationEthereumAddress = { ...genericVerificationAdd, hash: 'foo' };
    const res = await engine.mergeVerification(badHashVerification);
    expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
    expect(aliceAdds()).toEqual(new Set());
  });

  test('fails with invalid signature', async () => {
    const badMessageSignature: VerificationEthereumAddress = {
      ...genericVerificationAdd,
      signature:
        '0x5b699d494b515b22258c01ad19710d44c3f12235f0c01e91d09a1e4e2cd25d80c77026a7319906da3b8ce62abc18477c19e444a02949a0dde54f8cadef889502',
    };
    const res = await engine.mergeVerification(badMessageSignature);
    expect(res._unsafeUnwrapErr()).toBe('validateMessage: invalid signature');
    expect(aliceAdds()).toEqual(new Set());
  });

  test('fails if signedAt is > current time + safety margin', async () => {
    const elevenMinutesAhead = Date.now() + 11 * 60 * 1000;
    const verificationAddMessage = await Factories.VerificationEthereumAddress.create(
      {
        data: {
          fid: aliceFid,
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
    expect(aliceAdds()).toEqual(new Set());
  });

  test('succeeds with a valid VerificationRemove', async () => {
    expect((await engine.mergeVerification(genericVerificationAdd)).isOk()).toBe(true);
    expect(aliceAdds()).toEqual(new Set([genericVerificationAdd]));
    const verificationRemoveMessage = await Factories.VerificationRemove.create(
      {
        data: {
          fid: aliceFid,
          signedAt: genericVerificationAdd.data.signedAt + 1,
          body: { claimHash: genericVerificationAdd.data.body.claimHash },
        },
      },
      transientParams
    );
    expect((await engine.mergeVerification(verificationRemoveMessage)).isOk()).toBe(true);
    expect(engine._getVerificationRemoves(aliceFid)).toEqual(new Set([verificationRemoveMessage]));
    expect(aliceAdds()).toEqual(new Set());
  });

  test('succeeds with a valid VerificationRemove before relevant VerificationAdd has been added', async () => {
    const verificationRemoveMessage = await Factories.VerificationRemove.create(
      {
        data: {
          fid: aliceFid,
          signedAt: genericVerificationAdd.data.signedAt + 1,
          body: { claimHash: genericVerificationAdd.data.body.claimHash },
        },
      },
      transientParams
    );
    expect((await engine.mergeVerification(verificationRemoveMessage)).isOk()).toBe(true);
    expect(engine._getVerificationRemoves(aliceFid)).toEqual(new Set([verificationRemoveMessage]));
    expect(aliceAdds()).toEqual(new Set());
    expect((await engine.mergeVerification(genericVerificationAdd)).isOk()).toBe(true);
    expect(aliceAdds()).toEqual(new Set());
  });
});
