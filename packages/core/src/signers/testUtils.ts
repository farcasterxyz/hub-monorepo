import { blake3 } from "@noble/hashes/blake3";
import { ok } from "neverthrow";
import { bytesToHexString } from "../bytes";
import { eip712 } from "../crypto";
import { Factories } from "../factories";
import { FarcasterNetwork } from "../protobufs";
import {
  makeVerificationEthAddressClaim,
  VerificationEthAddressClaim,
} from "../verifications";
import { makeUserNameProofClaim, UserNameProofClaim } from "../userNameProof";
import { Eip712Signer } from "./eip712Signer";
import { bytesToHex } from "viem";
import { SignedKeyRequest } from "../signedKeyRequest";

export const testEip712Signer = async (signer: Eip712Signer) => {
  let signerKey: Uint8Array;

  beforeAll(async () => {
    signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  });

  describe("signMessageHash", () => {
    test("generates valid signature", async () => {
      const bytes = Factories.Bytes.build({}, { transient: { length: 32 } });
      const hash = blake3(bytes, { dkLen: 20 });
      const signature = await signer.signMessageHash(hash);
      expect(signature.isOk()).toBeTruthy();
      const valid = await eip712.verifyMessageHashSignature(
        hash,
        signature._unsafeUnwrap(),
        signerKey
      );
      expect(valid).toEqual(ok(true));
    });
  });

  describe("signVerificationEthAddressClaim", () => {
    let claim: VerificationEthAddressClaim;
    let signature: Uint8Array;

    beforeAll(async () => {
      claim = makeVerificationEthAddressClaim(
        Factories.Fid.build(),
        signerKey,
        FarcasterNetwork.TESTNET,
        Factories.BlockHash.build()
      )._unsafeUnwrap();
      const signatureResult = await signer.signVerificationEthAddressClaim(
        claim
      );
      expect(signatureResult.isOk()).toBeTruthy();
      signature = signatureResult._unsafeUnwrap();
    });

    test("succeeds", async () => {
      const valid = await eip712.verifyVerificationEthAddressClaimSignature(
        claim,
        signature,
        signerKey
      );
      expect(valid).toEqual(ok(true));
    });

    test("succeeds when encoding twice", async () => {
      const claim2: VerificationEthAddressClaim = { ...claim };
      const signature2 = await signer.signVerificationEthAddressClaim(claim2);
      expect(signature2).toEqual(ok(signature));
      expect(bytesToHexString(signature2._unsafeUnwrap())).toEqual(
        bytesToHexString(signature)
      );
    });

    test("fails with HubError", async () => {
      const result = await signer.signVerificationEthAddressClaim({
        ...claim,
        fid: -1n,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().errCode).toBe(
        "bad_request.invalid_param"
      );
    });
  });

  describe("signUserNameProofClaim", () => {
    let claim: UserNameProofClaim;
    let signature: Uint8Array;

    beforeAll(async () => {
      claim = makeUserNameProofClaim({
        name: "0x000",
        timestamp: Math.floor(Date.now() / 1000),
        owner: bytesToHex(signerKey),
      });
      const signatureResult = await signer.signUserNameProofClaim(claim);
      expect(signatureResult.isOk()).toBeTruthy();
      signature = signatureResult._unsafeUnwrap();
    });

    test("succeeds", async () => {
      const valid = await eip712.verifyUserNameProofClaim(
        claim,
        signature,
        signerKey
      );
      expect(valid).toEqual(ok(true));
    });

    test("succeeds when encoding twice", async () => {
      const claim2: UserNameProofClaim = { ...claim };
      const signature2 = await signer.signUserNameProofClaim(claim2);
      expect(signature2).toEqual(ok(signature));
      expect(bytesToHexString(signature2._unsafeUnwrap())).toEqual(
        bytesToHexString(signature)
      );
    });

    test("fails with HubError", async () => {
      const result = await signer.signUserNameProofClaim({
        ...claim,
        timestamp: -1n,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().errCode).toBe(
        "bad_request.invalid_param"
      );
    });
  });

  describe("signSignedKeyRequest", () => {
    let request: SignedKeyRequest;
    let signature: Uint8Array;

    beforeAll(async () => {
      request = {
        requestFid: BigInt(1),
        key: bytesToHex(signerKey),
        deadline: BigInt(Math.floor(Date.now() / 1000)),
      };
      const signatureResult = await signer.signSignedKeyRequest(request);
      expect(signatureResult.isOk()).toBeTruthy();
      signature = signatureResult._unsafeUnwrap();
    });

    test("succeeds", async () => {
      const valid = await eip712.verifySignedKeyRequest(
        request,
        signature,
        signerKey
      );
      expect(valid).toEqual(ok(true));
    });

    test("succeeds when encoding twice", async () => {
      const request2: SignedKeyRequest = { ...request };
      const signature2 = await signer.signSignedKeyRequest(request2);
      expect(signature2).toEqual(ok(signature));
      expect(bytesToHexString(signature2._unsafeUnwrap())).toEqual(
        bytesToHexString(signature)
      );
    });

    test("fails with HubError", async () => {
      const result = await signer.signSignedKeyRequest({
        ...request,
        deadline: -1n,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().errCode).toBe(
        "bad_request.invalid_param"
      );
    });
  });
};
