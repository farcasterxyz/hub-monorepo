import { Factories } from "./factories";
import { makeVerificationEthAddressClaim, makeVerificationSolAddressClaim } from "./verifications";

describe("makeVerificationEthAddressClaim", () => {
  test("succeeds", () => {
    const fid = Factories.Fid.build();
    const ethAddress = Factories.EthAddress.build();
    const network = Factories.FarcasterNetwork.build();
    const blockHash = Factories.BlockHash.build();
    const claim = makeVerificationEthAddressClaim(fid, ethAddress, network, blockHash);
    expect(claim.isOk()).toBeTruthy();
  });
});

describe("makeVerificationSolAddressClaim", () => {
  test("succeeds", () => {
    const fid = Factories.Fid.build();
    const solAddress = Factories.EthAddress.build();
    const network = Factories.FarcasterNetwork.build();
    const blockHash = Factories.BlockHash.build();
    const claim = makeVerificationSolAddressClaim(fid, solAddress, network, blockHash);
    expect(claim.isOk()).toBeTruthy();
  });
});
