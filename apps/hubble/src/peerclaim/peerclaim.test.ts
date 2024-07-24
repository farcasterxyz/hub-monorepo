import { PeerId } from "@libp2p/interface-peer-id";
import {
  generateClaimForPeerID,
  isPeerClaimValid,
  PeerIdentityClaimWithAccountSignature,
  verifyPeerIdentityClaim,
  verifyPeerIdentityClaimWithAccountSignature,
} from "./peerclaim.js";
import { createEd25519PeerId } from "@libp2p/peer-id-factory";
import { HubError } from "@farcaster/hub-nodejs";
import { ed25519 } from "@noble/curves/ed25519";
import { unmarshalPublicKey } from "@libp2p/crypto/keys";

describe("generateClaimForPeerID", () => {
  let mockPeerId: PeerId;
  let privateKey: Uint8Array;

  beforeEach(async () => {
    mockPeerId = await createEd25519PeerId();
    privateKey = ed25519.utils.randomPrivateKey();
  });

  it("should generate a valid claim when all inputs are correct", async () => {
    const result = await generateClaimForPeerID(1, mockPeerId, privateKey);

    if (result.isErr()) {
      throw new Error(`Error generating claim: ${result.error.message}`);
    }
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const claim = result.value;
      expect(claim.claim.message.fid).toBe(1);
      expect(claim.claim.message.peerId).toBe(`0x${mockPeerId.toString()}`);
      expect(claim.claim.peerSignature).toBeTruthy();
      expect(claim.claim.peerSignature).toHaveLength(130);
      expect(claim.claim.deadline).toBeGreaterThan(Date.now());
      expect(claim.claim.createdAt).toBeLessThanOrEqual(Date.now());
      expect(claim.accountSignature).toBeTruthy();
      expect(claim.accountPublicKey).toBeTruthy();

      // Verify signatures
      expect(mockPeerId.publicKey).toBeDefined();
      expect(mockPeerId.publicKey).not.toBeNull();
      if (!mockPeerId.publicKey) {
        throw new Error("Peer ID public key is null");
      }
      const peerPublicKey = unmarshalPublicKey(mockPeerId.publicKey);
      const peerSignatureValid = await peerPublicKey.verify(
        Buffer.from(JSON.stringify(claim.claim.message)),
        Buffer.from(claim.claim.peerSignature.slice(2), "hex"),
      );
      expect(peerSignatureValid).toBe(true);

      const publicKey = ed25519.getPublicKey(privateKey);
      const accountSignatureValid = ed25519.verify(
        Buffer.from(claim.accountSignature.slice(2), "hex"),
        Buffer.from(JSON.stringify(claim.claim)),
        publicKey,
      );
      expect(accountSignatureValid).toBe(true);
    }
  });

  it("should handle invalid PeerId", async () => {
    const invalidPeerId = { toString: () => "" } as PeerId;
    const result = await generateClaimForPeerID(1, invalidPeerId, privateKey);

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(HubError);
      expect(result.error.errCode).toBe("bad_request.invalid_param");
    }
  });

  it("should handle invalid FID", async () => {
    const result = await generateClaimForPeerID(-1, mockPeerId, privateKey);

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(HubError);
      expect(result.error.errCode).toBe("bad_request.invalid_param");
    }
  });

  it("should handle empty private key", async () => {
    const emptyPrivateKey = new Uint8Array(0);
    const result = await generateClaimForPeerID(1, mockPeerId, emptyPrivateKey);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(HubError);
      expect(result.error.message).toContain("Error getting public key");
    }
  });
});

describe("Peer Identity Claim Functions", () => {
  let mockPeerId: PeerId;
  let privateKey: Uint8Array;
  let validClaim: PeerIdentityClaimWithAccountSignature;

  beforeEach(async () => {
    mockPeerId = await createEd25519PeerId();
    privateKey = ed25519.utils.randomPrivateKey();
    const result = await generateClaimForPeerID(1, mockPeerId, privateKey);
    if (result.isErr()) {
      throw new Error(`Error generating claim for tests: ${result.error.message}`);
    }
    expect(result.isOk()).toBe(true);
    validClaim = result.value;
  });

  describe("verifyPeerIdentityClaim", () => {
    it("should verify a valid peer identity claim", async () => {
      const result = await verifyPeerIdentityClaim(validClaim.claim);
      expect(result._unsafeUnwrapErr).toThrow();
      if (result.isErr()) {
        throw new Error(`Expected valid claim to be verified, found: ${result.error}`);
      }
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it("should reject an expired claim", async () => {
      const expiredClaim = { ...validClaim.claim, deadline: Date.now() - 1000 };
      const result = await verifyPeerIdentityClaim(expiredClaim);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(HubError);
        expect(result.error.message).toContain("expired");
      }
    });

    it("should reject a claim with invalid peer ID", async () => {
      const invalidPeerIdClaim = {
        ...validClaim.claim,
        message: { ...validClaim.claim.message, peerId: `0x${"0".repeat(64)}` as `0x${string}` },
      };
      const result = await verifyPeerIdentityClaim(invalidPeerIdClaim);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(HubError);
        expect(result.error.message).toContain("Invalid Peer ID");
      }
    });

    it("should reject a claim with invalid signature", async () => {
      const invalidSignatureClaim = {
        ...validClaim.claim,
        peerSignature: `0x${"0".repeat(128)}` as `0x${string}`,
      };
      const result = await verifyPeerIdentityClaim(invalidSignatureClaim);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(HubError);
        expect(result.error.message).toContain("Invalid peer signature");
      }
    });
  });

  describe("verifyPeerIdentityClaimWithAccountSignature", () => {
    it("should verify a valid claim with account signature", async () => {
      const result = await verifyPeerIdentityClaimWithAccountSignature(validClaim);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it("should reject if peer claim verification fails", async () => {
      const invalidClaim = {
        ...validClaim,
        claim: { ...validClaim.claim, deadline: Date.now() - 1000 },
      };
      const result = await verifyPeerIdentityClaimWithAccountSignature(invalidClaim);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(HubError);
        expect(result.error.message).toContain("expired");
      }
    });

    it("should reject if account signature is invalid", async () => {
      const invalidSignatureClaim = {
        ...validClaim,
        accountSignature: `0x${"0".repeat(128)}` as `0x${string}`,
      };
      const result = await verifyPeerIdentityClaimWithAccountSignature(invalidSignatureClaim);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(HubError);
        expect(result.error.message).toContain("Invalid account signature");
      }
    });
  });

  describe("isPeerClaimValid", () => {
    it("should validate a correct claim for matching FID and PeerID", async () => {
      const result = await isPeerClaimValid(1, mockPeerId, validClaim);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it("should reject if FID does not match", async () => {
      const result = await isPeerClaimValid(2, mockPeerId, validClaim);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(HubError);
        expect(result.error.message).toContain("FID in claim does not match");
      }
    });

    it("should reject if PeerID does not match", async () => {
      const differentPeerId = await createEd25519PeerId();
      const result = await isPeerClaimValid(1, differentPeerId, validClaim);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(HubError);
        expect(result.error.message).toContain("Peer ID in claim does not match");
      }
    });

    it("should reject if claim verification fails", async () => {
      const invalidClaim = {
        ...validClaim,
        accountSignature: `0x${"0".repeat(128)}` as `0x${string}`,
      };
      const result = await isPeerClaimValid(1, mockPeerId, invalidClaim);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(HubError);
        expect(result.error.message).toContain("Invalid account signature");
      }
    });
  });
});
