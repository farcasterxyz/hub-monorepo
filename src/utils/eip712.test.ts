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
