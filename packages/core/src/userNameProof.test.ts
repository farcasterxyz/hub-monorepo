import { Factories } from "./factories";
import { makeUserNameProofClaim } from "./userNameProof";
import { bytesToHexString } from "./bytes";

describe("makeUserNameProofClaim", () => {
  test("succeeds", () => {
    const ethAddress = Factories.EthAddress.build();
    const timestamp = Date.now();
    const name = "testname";
    const claim = makeUserNameProofClaim({
      name,
      timestamp,
      owner: bytesToHexString(ethAddress)._unsafeUnwrap(),
    });
    expect(claim).toMatchObject({
      name,
      timestamp: BigInt(timestamp),
      owner: bytesToHexString(ethAddress)._unsafeUnwrap(),
    });
  });
});
