import { faker } from '@faker-js/faker';
import { FarcasterNetwork } from '@hub/flatbuffers';
import { blake3 } from '@noble/hashes/blake3';
import { utils, Wallet } from 'ethers';
import Factories from '~/flatbuffers/factories';
import { VerificationEthAddressClaim } from '~/flatbuffers/models/types';
import * as eip712 from '~/flatbuffers/utils/eip712';
import { bytesToHexString, hexStringToBytes, numberToBytes } from './bytes';

const wallet = new Wallet(utils.randomBytes(32));
const fidNumber = faker.datatype.number({ min: 1, max: 1_000_000 });

describe('signVerificationEthAddressClaim', () => {
  let claim: VerificationEthAddressClaim;
  let signature: Uint8Array;

  beforeAll(async () => {
    claim = {
      fid: numberToBytes(fidNumber, { endianness: 'big' })._unsafeUnwrap(),
      address: wallet.address,
      blockHash: hexStringToBytes(faker.datatype.hexadecimal({ length: 64, case: 'lower' }), {
        endianness: 'big',
      })._unsafeUnwrap(),
      network: FarcasterNetwork.Testnet,
    };
    signature = (await eip712.signVerificationEthAddressClaim(claim, wallet))._unsafeUnwrap();
  });

  test('succeeds', async () => {
    expect(signature).toBeTruthy();
    const recoveredAddress = eip712.verifyVerificationEthAddressClaimSignature(claim, signature);
    expect(recoveredAddress._unsafeUnwrap()).toEqual(hexStringToBytes(wallet.address)._unsafeUnwrap());
  });

  test('succeeds when encoding twice', async () => {
    const claim2: VerificationEthAddressClaim = { ...claim };
    const signature2 = await eip712.signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2._unsafeUnwrap()).toEqual(signature);
    expect(bytesToHexString(signature2._unsafeUnwrap())._unsafeUnwrap()).toEqual(
      bytesToHexString(signature)._unsafeUnwrap()
    );
  });

  test('succeeds with big-endian padding', async () => {
    const paddedFid = new Uint8Array([0, 0, 0, 0, ...claim.fid]);
    const claim2: VerificationEthAddressClaim = { ...claim, fid: paddedFid };
    const signature2 = await eip712.signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2._unsafeUnwrap()).toEqual(signature);
  });

  test('succeeds with lowercased address', async () => {
    const claim2: VerificationEthAddressClaim = { ...claim, address: claim.address.toLowerCase() };
    expect(claim2.address).not.toEqual(claim.address); // sanity check that original address was not lowercased
    const signature2 = await eip712.signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2._unsafeUnwrap()).toEqual(signature);
  });

  test('fails with little-endian fid', async () => {
    const claim2: VerificationEthAddressClaim = {
      ...claim,
      fid: numberToBytes(fidNumber, { endianness: 'little' })._unsafeUnwrap(),
    };
    const signature2 = await eip712.signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2._unsafeUnwrap()).not.toEqual(signature);
  });
});

describe('signMessageHash', () => {
  test('succeeds', async () => {
    const messageData = await Factories.SignerAddData.create();
    const bytes = messageData.bb?.bytes() ?? new Uint8Array();
    const hash = blake3(bytes, { dkLen: 16 });
    const signature = await eip712.signMessageHash(hash, wallet);
    const recoveredAddress = eip712.verifyMessageHashSignature(hash, signature._unsafeUnwrap());
    expect(recoveredAddress._unsafeUnwrap()).toEqual(hexStringToBytes(wallet.address)._unsafeUnwrap());
  });
});
