import { faker } from '@faker-js/faker';
import { blake3 } from '@noble/hashes/blake3';
import { utils, Wallet } from 'ethers';
import Factories from '~/flatbuffers/factories';
import { FarcasterNetwork } from '~/flatbuffers/generated/message_generated';
import { VerificationEthAddressClaim } from '~/flatbuffers/models/types';
import * as eip712 from '~/flatbuffers/utils/eip712';

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
    signature = await eip712.signVerificationEthAddressClaim(claim, wallet);
  });

  test('succeeds', async () => {
    expect(signature).toBeTruthy();
    const recoveredAddress = eip712.verifyVerificationEthAddressClaimSignature(claim, signature);
    expect(recoveredAddress).toEqual(utils.arrayify(wallet.address));
  });

  test('succeeds when encoding twice', async () => {
    const claim2: VerificationEthAddressClaim = { ...claim };
    const signature2 = await eip712.signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2).toEqual(signature);
    expect(utils.hexlify(signature2)).toEqual(utils.hexlify(signature));
  });

  test('succeeds with big-endian padding', async () => {
    const paddedFid = new Uint8Array([0, 0, 0, 0, ...claim.fid]);
    const claim2: VerificationEthAddressClaim = { ...claim, fid: paddedFid };
    const signature2 = await eip712.signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2).toEqual(signature);
  });

  test('succeeds with lowercased address', async () => {
    const claim2: VerificationEthAddressClaim = { ...claim, address: claim.address.toLowerCase() };
    expect(claim2.address).not.toEqual(claim.address); // sanity check that original address was not lowercased
    const signature2 = await eip712.signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2).toEqual(signature);
  });

  test('fails with little-endian fid', async () => {
    const claim2: VerificationEthAddressClaim = { ...claim, fid: claim.fid.reverse() };
    const signature2 = await eip712.signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2).not.toEqual(signature);
  });
});

describe('signMessageHash', () => {
  test('succeeds', async () => {
    const messageData = await Factories.SignerAddData.create();
    const bytes = messageData.bb?.bytes() ?? new Uint8Array();
    const hash = blake3(bytes, { dkLen: 16 });
    const signature = await eip712.signMessageHash(hash, wallet);
    expect(signature).toBeTruthy();
    const recoveredAddress = eip712.verifyMessageHashSignature(hash, signature);
    expect(recoveredAddress).toEqual(utils.arrayify(wallet.address));
  });
});
