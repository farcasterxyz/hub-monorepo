import { Factories } from "./factories";
import { makeVerificationAddressClaim } from "./verifications";
import { Protocol } from "./protobufs";

describe("makeVerificationEthAddressClaim", () => {
  test("succeeds", () => {
    const fid = Factories.Fid.build();
    const ethAddress = Factories.EthAddress.build();
    const network = Factories.FarcasterNetwork.build();
    const blockHash = Factories.BlockHash.build();
    const claim = makeVerificationAddressClaim(fid, ethAddress, network, blockHash, Protocol.ETHEREUM);
    expect(claim.isOk()).toBeTruthy();
  });
});

describe("makeVerificationSolAddressClaim", () => {
  test("succeeds", () => {
    const fid = Factories.Fid.build();
    const solAddress = Factories.SolAddress.build();
    const network = Factories.FarcasterNetwork.build();
    const blockHash = Factories.BlockHash.build();
    const claim = makeVerificationAddressClaim(fid, solAddress, network, blockHash, Protocol.SOLANA);
    expect(claim.isOk()).toBeTruthy();
  });
});
