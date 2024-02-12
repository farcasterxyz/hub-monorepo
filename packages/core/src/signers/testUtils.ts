import { blake3 } from "@noble/hashes/blake3";
import { ok } from "neverthrow";
import { bytesToHexString, hexStringToBytes } from "../bytes";
import { eip712 } from "../crypto";
import { Factories } from "../factories";
import { FarcasterNetwork, Protocol } from "../protobufs";
import { makeVerificationAddressClaim, VerificationAddressClaim } from "../verifications";
import { makeUserNameProofClaim, UserNameProofClaim } from "../userNameProof";
import { Eip712Signer } from "./eip712Signer";
import { bytesToHex, decodeAbiParameters } from "viem";
import { IdGatewayRegisterMessage, verifyRegister } from "../eth/contracts/idGateway";
import { KeyRegistryRemoveMessage, verifyRemove } from "../eth/contracts/keyRegistry";
import {
  IdRegistryChangeRecoveryAddressMessage,
  IdRegistryTransferMessage,
  verifyChangeRecoveryAddress,
  verifyTransfer,
  verifyTransferAndChangeRecovery,
} from "../eth/contracts/idRegistry";
import { KeyGatewayAddMessage, verifyAdd } from "../eth/contracts/keyGateway";
import { SignedKeyRequestMessage, verifyKeyRequest } from "../eth/contracts/signedKeyRequestValidator";

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
      const valid = await eip712.verifyMessageHashSignature(hash, signature._unsafeUnwrap(), signerKey);
      expect(valid).toEqual(ok(true));
    });
  });

  describe("signVerificationEthAddressClaim", () => {
    let claim: VerificationAddressClaim;
    let signature: Uint8Array;

    beforeAll(async () => {
      claim = makeVerificationAddressClaim(
        Factories.Fid.build(),
        signerKey,
        FarcasterNetwork.TESTNET,
        Factories.BlockHash.build(),
        Protocol.ETHEREUM,
      )._unsafeUnwrap();
      const signatureResult = await signer.signVerificationEthAddressClaim(claim);
      expect(signatureResult.isOk()).toBeTruthy();
      signature = signatureResult._unsafeUnwrap();
    });

    test("succeeds", async () => {
      const valid = await eip712.verifyVerificationEthAddressClaimSignature(claim, signature, signerKey, 0, 0);
      expect(valid).toEqual(ok(true));
    });

    test("succeeds when encoding twice", async () => {
      const claim2: VerificationAddressClaim = { ...claim };
      const signature2 = await signer.signVerificationEthAddressClaim(claim2);
      expect(signature2).toEqual(ok(signature));
      expect(bytesToHexString(signature2._unsafeUnwrap())).toEqual(bytesToHexString(signature));
    });

    test("fails with HubError", async () => {
      const result = await signer.signVerificationEthAddressClaim({
        ...claim,
        fid: -1n,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().errCode).toBe("bad_request.invalid_param");
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
      const valid = await eip712.verifyUserNameProofClaim(claim, signature, signerKey);
      expect(valid).toEqual(ok(true));
    });

    test("succeeds when encoding twice", async () => {
      const claim2: UserNameProofClaim = { ...claim };
      const signature2 = await signer.signUserNameProofClaim(claim2);
      expect(signature2).toEqual(ok(signature));
      expect(bytesToHexString(signature2._unsafeUnwrap())).toEqual(bytesToHexString(signature));
    });

    test("fails with HubError", async () => {
      const result = await signer.signUserNameProofClaim({
        ...claim,
        timestamp: -1n,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().errCode).toBe("bad_request.invalid_param");
    });
  });

  describe("signRegister", () => {
    let message: IdGatewayRegisterMessage;
    let signature: Uint8Array;

    beforeAll(async () => {
      message = {
        to: bytesToHex(signerKey),
        recovery: bytesToHex(signerKey),
        nonce: 0n,
        deadline: BigInt(Math.floor(Date.now() / 1000)),
      };
      const signatureResult = await signer.signRegister(message);
      expect(signatureResult.isOk()).toBeTruthy();
      signature = signatureResult._unsafeUnwrap();
    });

    test("succeeds", async () => {
      const valid = await verifyRegister(message, signature, signerKey);
      expect(valid).toEqual(ok(true));
    });

    test("fails with HubError", async () => {
      const result = await signer.signRegister({
        ...message,
        deadline: -1n,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().errCode).toBe("bad_request.invalid_param");
    });
  });

  describe("signTransfer", () => {
    let message: IdRegistryTransferMessage;
    let signature: Uint8Array;

    beforeAll(async () => {
      message = {
        fid: 1n,
        to: bytesToHex(signerKey),
        nonce: 0n,
        deadline: BigInt(Math.floor(Date.now() / 1000)),
      };
      const signatureResult = await signer.signTransfer(message);
      expect(signatureResult.isOk()).toBeTruthy();
      signature = signatureResult._unsafeUnwrap();
    });

    test("succeeds", async () => {
      const valid = await verifyTransfer(message, signature, signerKey);
      expect(valid).toEqual(ok(true));
    });

    test("fails with HubError", async () => {
      const result = await signer.signTransfer({
        ...message,
        deadline: -1n,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().errCode).toBe("bad_request.invalid_param");
    });
  });

  describe("signTransferAndChangeRecovery", () => {
    let message: IdRegistryTransferAndChangeRecoveryMessage;
    let signature: Uint8Array;

    beforeAll(async () => {
      message = {
        fid: 1n,
        to: bytesToHex(signerKey),
        recovery: bytesToHex(signerKey),
        nonce: 0n,
        deadline: BigInt(Math.floor(Date.now() / 1000)),
      };
      const signatureResult = await signer.signTransferAndChangeRecovery(message);
      expect(signatureResult.isOk()).toBeTruthy();
      signature = signatureResult._unsafeUnwrap();
    });

    test("succeeds", async () => {
      const valid = await verifyTransferAndChangeRecovery(message, signature, signerKey);
      expect(valid).toEqual(ok(true));
    });

    test("fails with HubError", async () => {
      const result = await signer.signTransferAndChangeRecovery({
        ...message,
        deadline: -1n,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().errCode).toBe("bad_request.invalid_param");
    });
  });

  describe("signChangeRecoveryAddress", () => {
    let message: IdRegistryChangeRecoveryAddressMessage;
    let signature: Uint8Array;

    beforeAll(async () => {
      message = {
        fid: 1n,
        from: bytesToHex(signerKey),
        to: bytesToHex(signerKey),
        nonce: 0n,
        deadline: BigInt(Math.floor(Date.now() / 1000)),
      };
      const signatureResult = await signer.signChangeRecoveryAddress(message);
      expect(signatureResult.isOk()).toBeTruthy();
      signature = signatureResult._unsafeUnwrap();
    });

    test("succeeds", async () => {
      const valid = await verifyChangeRecoveryAddress(message, signature, signerKey);
      expect(valid).toEqual(ok(true));
    });

    test("fails with HubError", async () => {
      const result = await signer.signChangeRecoveryAddress({
        ...message,
        deadline: -1n,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().errCode).toBe("bad_request.invalid_param");
    });
  });

  describe("signAdd", () => {
    let message: KeyGatewayAddMessage;
    let signature: Uint8Array;

    beforeAll(async () => {
      const key = Factories.Bytes.build({}, { transient: { length: 65 } });
      const metadata = Factories.Bytes.build({}, { transient: { length: 65 } });
      message = {
        owner: bytesToHex(signerKey),
        keyType: 1,
        key,
        metadataType: 1,
        metadata: bytesToHex(metadata),
        nonce: 0n,
        deadline: BigInt(Math.floor(Date.now() / 1000)),
      };
      const signatureResult = await signer.signAdd(message);
      expect(signatureResult.isOk()).toBeTruthy();
      signature = signatureResult._unsafeUnwrap();
    });

    test("succeeds", async () => {
      const valid = await verifyAdd(message, signature, signerKey);
      expect(valid).toEqual(ok(true));
    });

    test("fails with HubError", async () => {
      const result = await signer.signAdd({
        ...message,
        deadline: -1n,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().errCode).toBe("bad_request.invalid_param");
    });
  });

  describe("signRemove", () => {
    let message: KeyRegistryRemoveMessage;
    let signature: Uint8Array;

    beforeAll(async () => {
      const key = Factories.Bytes.build({}, { transient: { length: 65 } });
      message = {
        owner: bytesToHex(signerKey),
        key,
        nonce: 0n,
        deadline: BigInt(Math.floor(Date.now() / 1000)),
      };
      const signatureResult = await signer.signRemove(message);
      expect(signatureResult.isOk()).toBeTruthy();
      signature = signatureResult._unsafeUnwrap();
    });

    test("succeeds", async () => {
      const valid = await verifyRemove(message, signature, signerKey);
      expect(valid).toEqual(ok(true));
    });

    test("fails with HubError", async () => {
      const result = await signer.signRemove({
        ...message,
        deadline: -1n,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().errCode).toBe("bad_request.invalid_param");
    });
  });

  describe("signKeyRequest", () => {
    let message: SignedKeyRequestMessage;
    let signature: Uint8Array;

    beforeAll(async () => {
      const key = Factories.Bytes.build({}, { transient: { length: 65 } });
      message = {
        requestFid: 1n,
        key,
        deadline: BigInt(Math.floor(Date.now() / 1000)),
      };
      const signatureResult = await signer.signKeyRequest(message);
      expect(signatureResult.isOk()).toBeTruthy();
      signature = signatureResult._unsafeUnwrap();
    });

    test("succeeds", async () => {
      const valid = await verifyKeyRequest(message, signature, signerKey);
      expect(valid).toEqual(ok(true));
    });

    test("fails with HubError", async () => {
      const result = await signer.signKeyRequest({
        ...message,
        deadline: -1n,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().errCode).toBe("bad_request.invalid_param");
    });
  });

  describe("getSignedKeyRequestMetadata", () => {
    let message: SignedKeyRequestMessage;
    let metadata: Uint8Array;

    beforeAll(async () => {
      const key = Factories.Bytes.build({}, { transient: { length: 65 } });
      message = {
        requestFid: 1n,
        key,
        deadline: BigInt(Math.floor(Date.now() / 1000)),
      };
      const metadataResult = await signer.getSignedKeyRequestMetadata(message);
      expect(metadataResult.isOk()).toBeTruthy();
      metadata = metadataResult._unsafeUnwrap();
    });

    test("succeeds", async () => {
      const decoded = decodeAbiParameters(
        [
          {
            components: [
              {
                name: "requestFid",
                type: "uint256",
              },
              {
                name: "requestSigner",
                type: "address",
              },
              {
                name: "signature",
                type: "bytes",
              },
              {
                name: "deadline",
                type: "uint256",
              },
            ],
            name: "SignedKeyRequestMetadata",
            type: "tuple",
          },
        ],
        bytesToHex(metadata),
      )[0];
      expect(decoded.requestFid).toEqual(message.requestFid);
      expect(decoded.deadline).toEqual(message.deadline);
      expect(decoded.requestSigner.toLowerCase()).toEqual(bytesToHex(signerKey).toLowerCase());
      const signatureBytes = hexStringToBytes(decoded.signature);
      const valid = await verifyKeyRequest(message, signatureBytes._unsafeUnwrap(), signerKey);
      expect(valid).toEqual(ok(true));
    });

    test("fails with HubError", async () => {
      const result = await signer.getSignedKeyRequestMetadata({
        ...message,
        deadline: -1n,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().errCode).toBe("bad_request.invalid_param");
    });
  });
};
