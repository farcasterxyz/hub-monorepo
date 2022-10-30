import { arrayify } from 'ethers/lib/utils';
import Faker from 'faker';
import { VerificationEthAddressClaim } from '~/storage/flatbuffers/types';
import Factories from '~/test/factories/flatbuffer';
import { generateEthereumSigner } from '~/utils/crypto';
import { FarcasterNetwork } from '~/utils/generated/message_generated';
import { signVerificationEthAddressClaim, verifyVerificationEthAddressClaimSignature } from '~/utils/verification';

describe('signVerificationEthAddressClaim', () => {
  test('succeeds', async () => {
    const signer = await generateEthereumSigner();
    const claim: VerificationEthAddressClaim = {
      fid: Factories.FID.build(),
      address: signer.signerKey,
      blockHash: arrayify(Faker.datatype.hexaDecimal(64).toLowerCase()),
      network: FarcasterNetwork.Testnet,
    };
    const signature = await signVerificationEthAddressClaim(claim, signer.wallet);
    expect(signature).toBeTruthy();
    const recoveredAddress = verifyVerificationEthAddressClaimSignature(claim, signature);
    expect(recoveredAddress).toEqual(arrayify(signer.signerKey));
  });
});
