import { utils, Wallet } from 'ethers';
import { faker } from '@faker-js/faker';
import { VerificationEthAddressClaim } from '~/storage/flatbuffers/types';
import Factories from '~/test/factories/flatbuffer';
import { FarcasterNetwork } from '~/utils/generated/message_generated';
import {
  signMessageHash,
  signVerificationEthAddressClaim,
  verifyMessageHashSignature,
  verifyVerificationEthAddressClaimSignature,
} from '~/utils/eip712';
import { blake3 } from '@noble/hashes/blake3';

const wallet = new Wallet(utils.randomBytes(32));

describe('signVerificationEthAddressClaim', () => {
  let claim: VerificationEthAddressClaim;
  let signature: Uint8Array;

  beforeAll(async () => {
    claim = {
      fid: Factories.FID.build(),
      address: wallet.address,
      blockHash: utils.arrayify(faker.datatype.hexadecimal({ length: 64, case: 'lower' })),
      network: FarcasterNetwork.Testnet,
    };
    signature = await signVerificationEthAddressClaim(claim, wallet);
  });

  test('succeeds', async () => {
    expect(signature).toBeTruthy();
    const recoveredAddress = verifyVerificationEthAddressClaimSignature(claim, signature);
    expect(recoveredAddress).toEqual(utils.arrayify(wallet.address));
  });

  test('succeeds when encoding twice', async () => {
    const claim2: VerificationEthAddressClaim = { ...claim };
    const signature2 = await signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2).toEqual(signature);
    expect(utils.hexlify(signature2)).toEqual(utils.hexlify(signature));
  });

  test('succeeds with big-endian padding', async () => {
    const paddedFid = new Uint8Array([0, 0, 0, 0, ...claim.fid]);
    const claim2: VerificationEthAddressClaim = { ...claim, fid: paddedFid };
    const signature2 = await signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2).toEqual(signature);
  });

  test('succeeds with lowercased address', async () => {
    const claim2: VerificationEthAddressClaim = { ...claim, address: claim.address.toLowerCase() };
    expect(claim2.address).not.toEqual(claim.address); // sanity check that original address was not lowercased
    const signature2 = await signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2).toEqual(signature);
  });

  test('fails with little-endian fid', async () => {
    const claim2: VerificationEthAddressClaim = { ...claim, fid: claim.fid.reverse() };
    const signature2 = await signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2).not.toEqual(signature);
  });
});

describe('signMessageHash', () => {
  test('succeeds', async () => {
    const messageData = await Factories.SignerAddData.create();
    const bytes = messageData.bb?.bytes() ?? new Uint8Array();
    const hash = blake3(bytes, { dkLen: 16 });
    const signature = await signMessageHash(hash, wallet);
    expect(signature).toBeTruthy();
    const recoveredAddress = verifyMessageHashSignature(hash, signature);
    expect(recoveredAddress).toEqual(utils.arrayify(wallet.address));
  });
});
