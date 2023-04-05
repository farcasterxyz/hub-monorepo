import * as protobufs from '../protobufs';
import { blake3 } from '@noble/hashes/blake3';
import { getAddress, Wallet } from 'ethers';
import { ok } from 'neverthrow';
import { bytesToHexString, hexStringToBytes } from '../bytes';
import { Factories } from '../factories';
import { VerificationEthAddressClaim } from '../verifications';
import * as eip712 from './eip712';

const wallet = Wallet.createRandom();
const fid = Factories.Fid.build();

describe('signVerificationEthAddressClaim', () => {
  const claim = Factories.VerificationEthAddressClaim.build({ fid });
  let signature: Uint8Array;

  beforeAll(async () => {
    const sign = await eip712.signVerificationEthAddressClaim(claim, wallet);
    expect(sign.isOk()).toBeTruthy();
    signature = sign._unsafeUnwrap();
  });

  test('succeeds', async () => {
    expect(signature).toBeTruthy();
    const recoveredAddress = eip712.verifyVerificationEthAddressClaimSignature(claim, signature);
    expect(recoveredAddress).toEqual(ok(hexStringToBytes(wallet.address)._unsafeUnwrap()));
  });

  test('succeeds when encoding twice', async () => {
    const claim2: VerificationEthAddressClaim = { ...claim };
    const signature2 = await eip712.signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2).toEqual(ok(signature));
    expect(bytesToHexString(signature2._unsafeUnwrap())).toEqual(ok(bytesToHexString(signature)._unsafeUnwrap()));
  });

  test('succeeds with lowercased address', async () => {
    const claim2: VerificationEthAddressClaim = { ...claim, address: claim.address.toLowerCase() };
    const signature2 = await eip712.signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2).toEqual(ok(signature));
  });

  test('succeeds with checksummed address', async () => {
    const claim2: VerificationEthAddressClaim = { ...claim, address: getAddress(claim.address) };
    const signature2 = await eip712.signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2).toEqual(ok(signature));
  });

  test('fails with uppercased address', async () => {
    const claim2: VerificationEthAddressClaim = { ...claim, address: claim.address.toUpperCase() };
    const signature2 = await eip712.signVerificationEthAddressClaim(claim2, wallet);
    expect(signature2.isErr()).toBeTruthy();
  });
});

describe('signMessageHash', () => {
  test('succeeds', async () => {
    const messageData = Factories.SignerAddData.build();
    const bytes = protobufs.MessageData.encode(messageData).finish();
    const hash = blake3(bytes, { dkLen: 20 });
    const signature = await eip712.signMessageHash(hash, wallet);
    expect(signature.isOk()).toBeTruthy();
    const recoveredAddress = eip712.verifyMessageHashSignature(hash, signature._unsafeUnwrap());
    expect(recoveredAddress).toEqual(ok(hexStringToBytes(wallet.address)._unsafeUnwrap()));
  });
});
