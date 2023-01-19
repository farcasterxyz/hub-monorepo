import { faker } from '@faker-js/faker';
import { FarcasterNetwork } from '@farcaster/flatbuffers';
import { blake3 } from '@noble/hashes/blake3';
import { BigNumber, utils, Wallet } from 'ethers';
import { bytesToHexString, hexStringToBytes } from '../bytes';
import { Factories } from '../factories';
import { VerificationEthAddressClaim } from '../verifications';
import * as eip712 from './eip712';

const wallet = new Wallet(utils.randomBytes(32));
const fidNumber = faker.datatype.number({ min: 1, max: 1_000_000 });

describe('signVerificationEthAddressClaim', () => {
  let claim: VerificationEthAddressClaim;
  let signature: Uint8Array;

  beforeAll(async () => {
    claim = {
      fid: BigNumber.from(fidNumber),
      address: wallet.address,
      blockHash: Factories.BlockHashHex.build(),
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

  test('succeeds with lowercased address', async () => {
    const claim2: VerificationEthAddressClaim = { ...claim, address: claim.address.toLowerCase() };
    expect(claim2.address).not.toEqual(claim.address); // sanity check that original address was not lowercased
    const signature2 = await eip712.signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2._unsafeUnwrap()).toEqual(signature);
  });
});

describe('signMessageHash', () => {
  test('succeeds', async () => {
    const messageData = await Factories.SignerAddData.create();
    const bytes = messageData.bb?.bytes() ?? new Uint8Array();
    const hash = blake3(bytes, { dkLen: 20 });
    const signature = await eip712.signMessageHash(hash, wallet);
    const recoveredAddress = eip712.verifyMessageHashSignature(hash, signature._unsafeUnwrap());
    expect(recoveredAddress._unsafeUnwrap()).toEqual(hexStringToBytes(wallet.address)._unsafeUnwrap());
  });
});
