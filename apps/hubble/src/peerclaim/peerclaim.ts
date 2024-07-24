import { PeerId } from "@libp2p/interface-peer-id";
import { err, ok, Result } from "neverthrow";
import { HubAsyncResult, HubError, ed25519 } from "@farcaster/hub-nodejs";
import { peerIdFromString } from "@libp2p/peer-id";
import { unmarshalPrivateKey, unmarshalPublicKey } from "@libp2p/crypto/keys";

const DEFAULT_DEADLINE_MS = 1000 * 60 * 60 * 24 * 365; // 1 year

// Peer identity message contains FID and peer ID pair, to be signed by peer ID private key
export interface PeerIdentityMessage {
  fid: number;
  peerId: `0x${string}`;
}

// Peer identity claim contains message and signature of peer ID private key
export interface PeerIdentityClaim {
  message: PeerIdentityMessage;
  peerSignature: `0x${string}`;
  deadline: number;
  createdAt: number;
}

// Peer identity claim with account signature contains claim and signature of account private key
export interface PeerIdentityClaimWithAccountSignature {
  claim: PeerIdentityClaim;
  accountSignature: `0x${string}`;
  accountPublicKey: `0x${string}`;
}

export const verifyPeerIdentityClaim = async (claim: PeerIdentityClaim): HubAsyncResult<boolean> => {
  // Check if the claim has expired
  if (Date.now() > claim.deadline) {
    return err(new HubError("bad_request.invalid_param", "Peer identity claim has expired"));
  }

  // Extract the public key from the peerId
  const peerIDResult = Result.fromThrowable(
    () => {
      return peerIdFromString(claim.message.peerId.slice(2));
    },
    (err) => new HubError("bad_request.invalid_param", `Invalid Peer ID: ${err}`),
  )();
  if (peerIDResult.isErr()) {
    return err(peerIDResult.error);
  }

  const peerId = peerIDResult.value;
  const peerPublicKey = peerId.publicKey;
  if (!peerPublicKey) {
    return err(new HubError("bad_request.invalid_param", "Peer ID does not contain a public key"));
  }

  // Verify the peer signature
  const messageBuffer = Buffer.from(JSON.stringify(claim.message));
  const signatureBuffer = Buffer.from(claim.peerSignature.slice(2), "hex");

  const publicKey = unmarshalPublicKey(peerPublicKey);
  const result = await publicKey.verify(messageBuffer, signatureBuffer);
  if (!result) {
    return err(new HubError("bad_request.validation_failure", "Invalid peer signature"));
  }
  return ok(result);
};

export const verifyPeerIdentityClaimWithAccountSignature = async (
  claimWithSignature: PeerIdentityClaimWithAccountSignature,
): HubAsyncResult<boolean> => {
  // First, verify the peer identity claim
  const peerClaimVerificationResult = await verifyPeerIdentityClaim(claimWithSignature.claim);

  if (peerClaimVerificationResult.isErr()) {
    return peerClaimVerificationResult;
  }

  // Verify the account signature
  const claimBuffer = Buffer.from(JSON.stringify(claimWithSignature.claim));
  const accountSignatureBuffer = Buffer.from(claimWithSignature.accountSignature.slice(2), "hex");
  const accountPublicKey = Buffer.from(claimWithSignature.accountPublicKey.slice(2), "hex");

  const accountVerificationResult = await ed25519.verifyMessageHashSignature(
    accountSignatureBuffer,
    claimBuffer,
    accountPublicKey,
  );

  if (accountVerificationResult.isErr()) {
    return err(
      new HubError(
        "bad_request.validation_failure",
        `Error verifying account signature: ${accountVerificationResult.error.message}`,
      ),
    );
  }

  if (!accountVerificationResult.value) {
    return err(new HubError("bad_request.validation_failure", "Invalid account signature"));
  }

  return ok(true);
};

export const isPeerClaimValid = async (
  fid: number,
  peerID: PeerId,
  claim: PeerIdentityClaimWithAccountSignature,
): HubAsyncResult<boolean> => {
  // Verify that the claim matches the provided FID and PeerID
  if (claim.claim.message.fid !== fid) {
    return err(new HubError("bad_request.validation_failure", "FID in claim does not match provided FID"));
  }

  if (claim.claim.message.peerId !== `0x${peerID.toString()}`) {
    return err(new HubError("bad_request.validation_failure", "Peer ID in claim does not match provided Peer ID"));
  }

  // Verify the claim with account signature
  const verificationResult = await verifyPeerIdentityClaimWithAccountSignature(claim);

  if (verificationResult.isErr()) {
    return verificationResult;
  }

  return ok(verificationResult.value);
};

export const generateClaimForPeerID = async (
  fid: number,
  peerID: PeerId,
  accountPrivateKey: Uint8Array,
): HubAsyncResult<PeerIdentityClaimWithAccountSignature> => {
  if (fid <= 0) {
    return err(new HubError("bad_request.invalid_param", "FID must be greater than 0"));
  }
  if (peerID.toString().length === 0) {
    return err(new HubError("bad_request.invalid_param", "Peer ID must be provided"));
  }
  if (!peerID.privateKey) {
    return err(new HubError("bad_request.invalid_param", "Peer ID must contain a private key"));
  }
  if (peerID.type !== "Ed25519") {
    return err(new HubError("bad_request.invalid_param", "Peer ID must be of type Ed25519"));
  }

  const pubkeyResult = await ed25519.getPublicKey(accountPrivateKey);
  if (pubkeyResult.isErr()) {
    return err(new HubError("bad_request", `Error getting public key: ${pubkeyResult.error.message}`));
  }

  // 1. Create message associating FID with peer ID
  const message: PeerIdentityMessage = {
    fid,
    peerId: `0x${peerID.toString()}`,
  };

  // 2. Sign message with peer ID private key
  const peerPrivateKey = await unmarshalPrivateKey(peerID.privateKey);
  const peerSignature: Uint8Array = await peerPrivateKey.sign(Buffer.from(JSON.stringify(message)));

  // 3. Create claim with message and signature of peer ID private key
  const claim: PeerIdentityClaim = {
    message,
    peerSignature: `0x${Buffer.from(peerSignature).toString("hex")}`,
    deadline: Date.now() + DEFAULT_DEADLINE_MS,
    createdAt: Date.now(),
  };

  // 4. Sign claim with account private key
  const accountSignatureResult = await ed25519.signMessageHash(Buffer.from(JSON.stringify(claim)), accountPrivateKey);
  if (accountSignatureResult.isErr()) {
    return err(new HubError("bad_request", `Error signing claim: ${accountSignatureResult.error.message}`));
  }
  const accountSignature: Uint8Array = accountSignatureResult.value;
  const claimWithAccountSignature: PeerIdentityClaimWithAccountSignature = {
    claim,
    accountSignature: `0x${Buffer.from(accountSignature).toString("hex")}`,
    accountPublicKey: `0x${Buffer.from(pubkeyResult.value).toString("hex")}`,
  };
  return ok(claimWithAccountSignature);
};
