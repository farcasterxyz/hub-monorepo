import { arrayify } from 'ethers/lib/utils';
import { faker } from '@faker-js/faker';
import { VerificationEthAddressClaim } from '~/storage/flatbuffers/types';
import Factories from '~/test/factories/flatbuffer';
import { generateEthereumSigner } from '~/utils/crypto';
import { FarcasterNetwork } from '~/utils/generated/message_generated';
import {
  signMessageData,
  signVerificationEthAddressClaim,
  verifyMessageDataSignature,
  verifyVerificationEthAddressClaimSignature,
} from '~/utils/eip712';
import { EthereumSigner } from '~/types';

let ethSigner: EthereumSigner;

beforeAll(async () => {
  ethSigner = await generateEthereumSigner();
});

describe('signVerificationEthAddressClaim', () => {
  test('succeeds', async () => {
    const claim: VerificationEthAddressClaim = {
      fid: Factories.FID.build(),
      address: ethSigner.signerKey,
      blockHash: arrayify(faker.datatype.hexadecimal({ length: 64, case: 'lower' })),
      network: FarcasterNetwork.Testnet,
    };
    const signature = await signVerificationEthAddressClaim(claim, ethSigner.wallet);
    expect(signature).toBeTruthy();
    const recoveredAddress = verifyVerificationEthAddressClaimSignature(claim, signature);
    expect(recoveredAddress).toEqual(arrayify(ethSigner.signerKey));
  });

  test('encoding twice works', async () => {
    const fid1 = new Uint8Array(4);
    fid1[0] = 8;
    fid1[1] = 32;
    fid1[2] = 69;
    fid1[3] = 255;

    const fid2 = new Uint8Array(4);
    fid2[0] = 8;
    fid2[1] = 32;
    fid2[2] = 69;
    fid2[3] = 255;

    const claim1: VerificationEthAddressClaim = {
      fid: fid1,
      address: ethSigner.signerKey,
      blockHash: arrayify(faker.datatype.hexadecimal({ length: 64, case: 'lower' })),
      network: FarcasterNetwork.Testnet,
    };
    const claim2: VerificationEthAddressClaim = {
      fid: fid2,
      address: claim1.address,
      blockHash: claim1.blockHash,
      network: claim1.network,
    };

    const signature1 = await signVerificationEthAddressClaim(claim1, ethSigner.wallet);
    expect(signature1).toBeTruthy();

    const signature2 = await signVerificationEthAddressClaim(claim2, ethSigner.wallet);
    expect(signature2).toBeTruthy();

    const hex1 = Buffer.from(signature1).toString('hex');
    const hex2 = Buffer.from(signature2).toString('hex');

    expect(hex1).toEqual(hex2);
  });

  test('32bit fid & 256bit fid encode the same', async () => {
    const fid1 = new Uint8Array(4);
    fid1[0] = 8;
    fid1[1] = 32;
    fid1[2] = 69;
    fid1[3] = 255;

    const fid2 = new Uint8Array(32);
    fid2[0] = 8;
    fid2[1] = 32;
    fid2[2] = 69;
    fid2[3] = 255;
    for (let i = 4; i < 31; i++) {
      fid2[i] = 0;
    }

    const claim1: VerificationEthAddressClaim = {
      fid: fid1,
      address: ethSigner.signerKey,
      blockHash: arrayify(faker.datatype.hexadecimal({ length: 64, case: 'lower' })),
      network: FarcasterNetwork.Testnet,
    };
    const claim2: VerificationEthAddressClaim = {
      fid: fid2,
      address: claim1.address,
      blockHash: claim1.blockHash,
      network: claim1.network,
    };

    const signature1 = await signVerificationEthAddressClaim(claim1, ethSigner.wallet);
    expect(signature1).toBeTruthy();

    const signature2 = await signVerificationEthAddressClaim(claim2, ethSigner.wallet);
    expect(signature2).toBeTruthy();

    const hex1 = Buffer.from(signature1).toString('hex');
    const hex2 = Buffer.from(signature2).toString('hex');

    expect(hex1).toEqual(hex2);
  });
});

describe('signMessageData', () => {
  test('succeeds', async () => {
    const messageData = await Factories.SignerAddData.create();
    const bytes = messageData.bb?.bytes() ?? new Uint8Array();
    const signature = await signMessageData(bytes, ethSigner.wallet);
    expect(signature).toBeTruthy();
    const recoveredAddress = verifyMessageDataSignature(bytes, signature);
    expect(recoveredAddress).toEqual(arrayify(ethSigner.signerKey));
  });
});
