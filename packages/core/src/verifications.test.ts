import { Factories } from "./factories";
import { makeVerificationAddressClaim } from "./verifications";

describe("makeVerificationEthAddressClaim", () => {
  test("succeeds", () => {
    const fid = Factories.Fid.build();
    const ethAddress = Factories.EthAddress.build();
    const network = Factories.FarcasterNetwork.build();
    const blockHash = Factories.BlockHash.build();
    const claim = makeVerificationAddressClaim(fid, ethAddress, network, blockHash);
    expect(claim.isOk()).toBeTruthy();
  });
});
