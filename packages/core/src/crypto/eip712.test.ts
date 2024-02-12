import { Factories } from "../factories";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { ok } from "neverthrow";
import { hexStringToBytes } from "../bytes";
import * as eip712 from "./eip712";
import { ViemLocalEip712Signer } from "../signers";
import { makeUserNameProofClaim } from "../userNameProof";
import { makeVerificationAddressClaim } from "../verifications";
import { Protocol } from "../protobufs";

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);
const signer = new ViemLocalEip712Signer(account);

describe("verifyUserNameProofClaim", () => {
  test("succeeds with a generated proof", async () => {
    const nameProof = makeUserNameProofClaim({
      name: "farcaster",
      owner: "0x8773442740c17c9d0f0b87022c722f9a136206ed",
      timestamp: 1628882891,
    });
    const signature = await signer.signUserNameProofClaim(nameProof);
    expect(signature.isOk()).toBeTruthy();
    const valid = await eip712.verifyUserNameProofClaim(
      nameProof,
      signature._unsafeUnwrap(),
      (await signer.getSignerKey())._unsafeUnwrap(),
    );
    expect(valid).toEqual(ok(true));
  });

  test("succeeds for a known proof", async () => {
    const nameProof = makeUserNameProofClaim({
      name: "farcaster",
      owner: "0x8773442740c17c9d0f0b87022c722f9a136206ed",
      timestamp: 1628882891,
    });
    const signature = hexStringToBytes(
      "0xb7181760f14eda0028e0b647ff15f45235526ced3b4ae07fcce06141b73d32960d3253776e62f761363fb8137087192047763f4af838950a96f3885f3c2289c41b",
    );
    expect(signature.isOk()).toBeTruthy();
    const valid = await eip712.verifyUserNameProofClaim(
      nameProof,
      signature._unsafeUnwrap(),
      hexStringToBytes("0xBc5274eFc266311015793d89E9B591fa46294741")._unsafeUnwrap(),
    );
    expect(valid).toEqual(ok(true));
  });
});

describe("verifyVerificationEthAddressClaimSignature", () => {
  test("succeeds with a generated claim", async () => {
    const claimRes = makeVerificationAddressClaim(
      Factories.Fid.build(),
      (await signer.getSignerKey())._unsafeUnwrap(),
      Factories.FarcasterNetwork.build(),
      Factories.BlockHash.build(),
      Protocol.ETHEREUM,
    );
    const claim = claimRes._unsafeUnwrap();
    const signature = await signer.signVerificationEthAddressClaim(claim);
    expect(signature.isOk()).toBeTruthy();
    const valid = await eip712.verifyVerificationEthAddressClaimSignature(
      claim,
      signature._unsafeUnwrap(),
      (await signer.getSignerKey())._unsafeUnwrap(),
    );
    expect(valid).toEqual(ok(true));
  });
});
