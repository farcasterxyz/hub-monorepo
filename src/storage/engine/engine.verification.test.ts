import Engine from '~/storage/engine';
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
  CastShort,
  CastRecast,
} from '~/types';
import Faker from 'faker';
import { Wallet } from 'ethers';
import { hashFCObject, generateEd25519Signer, generateEthereumSigner } from '~/utils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import CastDB from '~/storage/db/cast';
import VerificationDB from '~/storage/db/verification';
import { BadRequestError } from '~/errors';
import SignerDB from '~/storage/db/signer';

const testDb = jestRocksDB(`engine.verification.test`);
const engine = new Engine(testDb);

const aliceFid = Faker.datatype.number();

const verificationDb = new VerificationDB(testDb);
const aliceAdds = () => engine.getVerificationsByUser(aliceFid);

const aliceRemoves = async () => {
  const removes = await verificationDb.getVerificationRemovesByUser(aliceFid);
  return new Set(removes);
};

// TODO: fix hack
const castDb = new CastDB(testDb);
const aliceCastAdds = async (): Promise<Set<CastShort | CastRecast>> => {
  const casts = await castDb.getCastAddsByUser(aliceFid);
  return new Set(casts);
};

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
      externalUri: Factories.EthereumAddressURL.build(undefined, {
        transient: { address: aliceEthWallet.address },
      }).toString(),
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
    await engine.mergeMessage(aliceSignerAdd);
  });

  test('handles invalid type cast', async () => {
    const cast = (await Factories.CastShort.create(
      { data: { fid: aliceFid } },
      transientParams
    )) as unknown as Verification;
    expect((await engine.mergeMessage(cast)).isOk()).toBeTruthy();
    expect(await aliceAdds()).toEqual(new Set([]));
    expect(await aliceCastAdds()).toEqual(new Set([cast]));
  });

  test('succeeds with a valid VerificationAdd', async () => {
    expect((await engine.mergeMessage(genericVerificationAdd)).isOk()).toBe(true);
    expect(await aliceAdds()).toEqual(new Set([genericVerificationAdd]));
  });

  test('succeeds with lowercased externalUri', async () => {
    const lowercaseExternalUri = Factories.EthereumAddressURL.build(undefined, {
      transient: { address: aliceEthWallet.address.toLowerCase() },
    }).toString();
    const verificationClaim: VerificationEthereumAddressClaim = {
      fid: aliceFid,
      externalUri: lowercaseExternalUri,
      blockHash: aliceBlockHash,
    };
    const aliceClaimHash = await hashFCObject(verificationClaim);
    const aliceExternalSignature = await aliceEthWallet.signMessage(aliceClaimHash);
    const verificationAdd = await Factories.VerificationEthereumAddress.create(
      {
        data: {
          fid: aliceFid,
          body: {
            externalUri: lowercaseExternalUri,
            claimHash: aliceClaimHash,
            blockHash: aliceBlockHash,
            externalSignature: aliceExternalSignature,
          },
        },
      },
      transientParams
    );
    expect((await engine.mergeMessage(verificationAdd)).isOk()).toBe(true);
    expect(await aliceAdds()).toEqual(new Set([verificationAdd]));
  });

  test('succeeds with uppercased externalUri', async () => {
    const uppercasedExternalUri = Factories.EthereumAddressURL.build(undefined, {
      transient: { address: '0x' + aliceEthWallet.address.slice(2).toUpperCase() },
    }).toString();
    const verificationClaim: VerificationEthereumAddressClaim = {
      fid: aliceFid,
      externalUri: uppercasedExternalUri,
      blockHash: aliceBlockHash,
    };
    const aliceClaimHash = await hashFCObject(verificationClaim);
    const aliceExternalSignature = await aliceEthWallet.signMessage(aliceClaimHash);
    const verificationAdd = await Factories.VerificationEthereumAddress.create(
      {
        data: {
          fid: aliceFid,
          body: {
            externalUri: uppercasedExternalUri,
            claimHash: aliceClaimHash,
            blockHash: aliceBlockHash,
            externalSignature: aliceExternalSignature,
          },
        },
      },
      transientParams
    );
    expect((await engine.mergeMessage(verificationAdd)).isOk()).toBe(true);
    expect(await aliceAdds()).toEqual(new Set([verificationAdd]));
  });

  test('fails when claim externalUri is checksummed and message externalUri is lowercased', async () => {
    const verificationClaim: VerificationEthereumAddressClaim = {
      fid: aliceFid,
      externalUri: Factories.EthereumAddressURL.build(undefined, {
        transient: { address: aliceEthWallet.address },
      }).toString(),
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
            }).toString(),
            claimHash: aliceClaimHash,
            blockHash: aliceBlockHash,
            externalSignature: aliceExternalSignature,
          },
        },
      },
      transientParams
    );
    const res = await engine.mergeMessage(verificationAdd);
    expect(res.isOk()).toBe(false);
    expect(res._unsafeUnwrapErr()).toMatchObject(
      new BadRequestError('validateVerificationEthereumAddress: invalid claimHash')
    );
    expect(await aliceAdds()).toEqual(new Set());
  });

  test('fails if message signer is not valid', async () => {
    // TODO: fix hack
    const signerDb = new SignerDB(testDb);
    await signerDb.deleteSignerAdd(aliceFid, aliceCustody.signerKey, aliceSigner.signerKey);
    expect((await engine.mergeMessage(genericVerificationAdd))._unsafeUnwrapErr()).toMatchObject(
      new BadRequestError('validateMessage: invalid signer')
    );
    expect(await aliceAdds()).toEqual(new Set());
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
    const res = await engine.mergeMessage(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toMatchObject(
      new BadRequestError('validateVerificationEthereumAddress: invalid externalSignature')
    );
    expect(await aliceAdds()).toEqual(new Set());
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
    const res = await engine.mergeMessage(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toMatchObject(
      new BadRequestError('validateVerificationEthereumAddress: externalSignature does not match externalUri')
    );
    expect(await aliceAdds()).toEqual(new Set());
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
    const res = await engine.mergeMessage(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toMatchObject(
      new BadRequestError('validateVerificationEthereumAddress: invalid claimHash')
    );
    expect(await aliceAdds()).toEqual(new Set());
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
    const res = await engine.mergeMessage(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toMatchObject(
      new BadRequestError('validateVerificationEthereumAddress: invalid claimHash')
    );
    expect(await aliceAdds()).toEqual(new Set());
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
    const res = await engine.mergeMessage(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: unknown message'));
    expect(await aliceAdds()).toEqual(new Set());
  });

  // TODO: share these generic message validation tests between engine tests

  test('fails with invalid hash', async () => {
    const badHashVerification: VerificationEthereumAddress = { ...genericVerificationAdd, hash: 'foo' };
    const res = await engine.mergeMessage(badHashVerification);
    expect(res._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid hash'));
    expect(await aliceAdds()).toEqual(new Set());
  });

  test('fails with invalid signature', async () => {
    const badMessageSignature: VerificationEthereumAddress = {
      ...genericVerificationAdd,
      signature:
        '0x5b699d494b515b22258c01ad19710d44c3f12235f0c01e91d09a1e4e2cd25d80c77026a7319906da3b8ce62abc18477c19e444a02949a0dde54f8cadef889502',
    };
    const res = await engine.mergeMessage(badMessageSignature);
    expect(res._unsafeUnwrapErr()).toMatchObject(new BadRequestError('validateMessage: invalid signature'));
    expect(await aliceAdds()).toEqual(new Set());
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
    const res = await engine.mergeMessage(verificationAddMessage);
    expect(res._unsafeUnwrapErr()).toMatchObject(
      new BadRequestError('validateMessage: signedAt more than 10 mins in the future')
    );
    expect(await aliceAdds()).toEqual(new Set());
  });

  test('succeeds with a valid VerificationRemove', async () => {
    expect((await engine.mergeMessage(genericVerificationAdd)).isOk()).toBe(true);
    expect(await aliceAdds()).toEqual(new Set([genericVerificationAdd]));
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
    expect((await engine.mergeMessage(verificationRemoveMessage)).isOk()).toBe(true);
    expect(await aliceRemoves()).toEqual(new Set([verificationRemoveMessage]));
    expect(await aliceAdds()).toEqual(new Set());
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
    expect((await engine.mergeMessage(verificationRemoveMessage)).isOk()).toBe(true);
    expect(await aliceRemoves()).toEqual(new Set([verificationRemoveMessage]));
    expect(await aliceAdds()).toEqual(new Set());
    expect((await engine.mergeMessage(genericVerificationAdd)).isOk()).toBe(true);
    expect(await aliceAdds()).toEqual(new Set());
  });
});
