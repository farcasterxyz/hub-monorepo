import { Factories } from './factories';
import { makeVerificationEthAddressClaim } from './verifications';

describe('makeVerificationEthAddressClaim', () => {
  test('succeeds', () => {
    const fid = Factories.Fid.build();
    const ethAddress = Factories.EthAddress.build();
    const network = Factories.FarcasterNetwork.build();
    const blockHash = Factories.BlockHash.build();
    const claim = makeVerificationEthAddressClaim(fid, ethAddress, network, blockHash);
    expect(claim.isOk()).toBeTruthy();
  });
});
