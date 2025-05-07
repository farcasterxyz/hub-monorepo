import * as hubEventProtobufs from "./generated/hub_event";
import * as onChainEventProtobufs from "./generated/onchain_event";
import * as protobufs from "./generated/message";
import { Protocol } from "./generated/message";
import * as types from "./types";

/** Message typeguards */

export const isCastAddData = (data: protobufs.MessageData): data is types.CastAddData => {
  return data.type === protobufs.MessageType.CAST_ADD && typeof data.castAddBody !== "undefined";
};

export const isCastAddMessage = (message: protobufs.Message): message is types.CastAddMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.ED25519 &&
    typeof message.data !== "undefined" &&
    isCastAddData(message.data)
  );
};

export const isCastRemoveData = (data: protobufs.MessageData): data is types.CastRemoveData => {
  return data.type === protobufs.MessageType.CAST_REMOVE && typeof data.castRemoveBody !== "undefined";
};

export const isCastRemoveMessage = (message: protobufs.Message): message is types.CastRemoveMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.ED25519 &&
    typeof message.data !== "undefined" &&
    isCastRemoveData(message.data)
  );
};

export const isLinkAddData = (data: protobufs.MessageData): data is types.LinkAddData => {
  return data.type === protobufs.MessageType.LINK_ADD && typeof data.linkBody !== "undefined";
};

export const isLinkCompactStateMessage = (message: protobufs.Message): message is types.LinkCompactStateMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.ED25519 &&
    typeof message.data !== "undefined" &&
    message.data.type === protobufs.MessageType.LINK_COMPACT_STATE &&
    message.data.linkCompactStateBody !== undefined
  );
};

export const isLinkAddMessage = (message: protobufs.Message): message is types.LinkAddMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.ED25519 &&
    typeof message.data !== "undefined" &&
    isLinkAddData(message.data)
  );
};

export const isLinkRemoveData = (data: protobufs.MessageData): data is types.LinkRemoveData => {
  return data.type === protobufs.MessageType.LINK_REMOVE && typeof data.linkBody !== "undefined";
};

export const isLinkRemoveMessage = (message: protobufs.Message): message is types.LinkRemoveMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.ED25519 &&
    typeof message.data !== "undefined" &&
    isLinkRemoveData(message.data)
  );
};

export const isReactionAddData = (data: protobufs.MessageData): data is types.ReactionAddData => {
  return data.type === protobufs.MessageType.REACTION_ADD && typeof data.reactionBody !== "undefined";
};

export const isReactionAddMessage = (message: protobufs.Message): message is types.ReactionAddMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.ED25519 &&
    typeof message.data !== "undefined" &&
    isReactionAddData(message.data)
  );
};

export const isReactionRemoveData = (data: protobufs.MessageData): data is types.ReactionRemoveData => {
  return data.type === protobufs.MessageType.REACTION_REMOVE && typeof data.reactionBody !== "undefined";
};

export const isReactionRemoveMessage = (message: protobufs.Message): message is types.ReactionRemoveMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.ED25519 &&
    typeof message.data !== "undefined" &&
    isReactionRemoveData(message.data)
  );
};

export const isVerificationAddAddressData = (data: protobufs.MessageData): data is types.VerificationAddAddressData => {
  return (
    data.type === protobufs.MessageType.VERIFICATION_ADD_ETH_ADDRESS &&
    typeof data.verificationAddAddressBody !== "undefined" &&
    (data.verificationAddAddressBody.protocol === Protocol.ETHEREUM ||
      data.verificationAddAddressBody.protocol === Protocol.SOLANA)
  );
};

export const isVerificationAddAddressMessage = (
  message: protobufs.Message,
): message is types.VerificationAddAddressMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.ED25519 &&
    typeof message.data !== "undefined" &&
    isVerificationAddAddressData(message.data)
  );
};
export const isVerificationRemoveData = (data: protobufs.MessageData): data is types.VerificationRemoveData => {
  return (
    data.type === protobufs.MessageType.VERIFICATION_REMOVE &&
    typeof data.verificationRemoveBody !== "undefined" &&
    (data.verificationRemoveBody.protocol === Protocol.ETHEREUM ||
      data.verificationRemoveBody.protocol === Protocol.SOLANA)
  );
};

export const isVerificationRemoveMessage = (message: protobufs.Message): message is types.VerificationRemoveMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.ED25519 &&
    typeof message.data !== "undefined" &&
    isVerificationRemoveData(message.data)
  );
};

export const isUserDataAddData = (data: protobufs.MessageData): data is types.UserDataAddData => {
  return data.type === protobufs.MessageType.USER_DATA_ADD && typeof data.userDataBody !== "undefined";
};

export const isUserDataAddMessage = (message: protobufs.Message): message is types.UserDataAddMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.ED25519 &&
    typeof message.data !== "undefined" &&
    isUserDataAddData(message.data)
  );
};

export const isUsernameProofData = (data: protobufs.MessageData): data is types.UsernameProofData => {
  return data.type === protobufs.MessageType.USERNAME_PROOF && typeof data.usernameProofBody !== "undefined";
};

export const isUsernameProofMessage = (message: protobufs.Message): message is types.UsernameProofMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.ED25519 &&
    typeof message.data !== "undefined" &&
    isUsernameProofData(message.data)
  );
};

export const isFrameActionData = (data: protobufs.MessageData): data is types.FrameActionData => {
  return data.type === protobufs.MessageType.FRAME_ACTION && typeof data.frameActionBody !== "undefined";
};

export const isFrameActionMessage = (message: protobufs.Message): message is types.FrameActionMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.ED25519 &&
    typeof message.data !== "undefined" &&
    isFrameActionData(message.data)
  );
};

export const isSignerOnChainEvent = (event: onChainEventProtobufs.OnChainEvent): event is types.SignerOnChainEvent => {
  return (
    event.type === onChainEventProtobufs.OnChainEventType.EVENT_TYPE_SIGNER &&
    typeof event.signerEventBody !== "undefined"
  );
};

export const isSignerMigratedOnChainEvent = (
  event: onChainEventProtobufs.OnChainEvent,
): event is types.SignerMigratedOnChainEvent => {
  return (
    event.type === onChainEventProtobufs.OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED &&
    typeof event.signerMigratedEventBody !== "undefined"
  );
};

export const isIdRegisterOnChainEvent = (
  event: onChainEventProtobufs.OnChainEvent,
): event is types.IdRegisterOnChainEvent => {
  return (
    event.type === onChainEventProtobufs.OnChainEventType.EVENT_TYPE_ID_REGISTER &&
    typeof event.idRegisterEventBody !== "undefined"
  );
};

export const isStorageRentOnChainEvent = (
  event: onChainEventProtobufs.OnChainEvent,
): event is types.StorageRentOnChainEvent => {
  return (
    event.type === onChainEventProtobufs.OnChainEventType.EVENT_TYPE_STORAGE_RENT &&
    typeof event.storageRentEventBody !== "undefined"
  );
};

/** Hub event typeguards */

export const isMergeMessageHubEvent = (event: hubEventProtobufs.HubEvent): event is types.MergeMessageHubEvent => {
  return (
    event.type === hubEventProtobufs.HubEventType.MERGE_MESSAGE &&
    typeof event.mergeMessageBody !== "undefined" &&
    typeof event.mergeMessageBody.message !== "undefined"
  );
};

export const isRevokeMessageHubEvent = (event: hubEventProtobufs.HubEvent): event is types.RevokeMessageHubEvent => {
  return (
    event.type === hubEventProtobufs.HubEventType.REVOKE_MESSAGE &&
    typeof event.revokeMessageBody !== "undefined" &&
    typeof event.revokeMessageBody.message !== "undefined"
  );
};

export const isPruneMessageHubEvent = (event: hubEventProtobufs.HubEvent): event is types.PruneMessageHubEvent => {
  return (
    event.type === hubEventProtobufs.HubEventType.PRUNE_MESSAGE &&
    typeof event.pruneMessageBody !== "undefined" &&
    typeof event.pruneMessageBody.message !== "undefined"
  );
};

export const isMergeFailureHubEvent = (event: hubEventProtobufs.HubEvent): event is types.MergeFailureHubEvent => {
  return (
    event.type === hubEventProtobufs.HubEventType.MERGE_FAILURE &&
    typeof event.mergeFailure !== "undefined" &&
    typeof event.mergeFailure.message !== "undefined"
  );
};

export const isMergeOnChainHubEvent = (event: hubEventProtobufs.HubEvent): event is types.MergeOnChainEventHubEvent => {
  return (
    event.type === hubEventProtobufs.HubEventType.MERGE_ON_CHAIN_EVENT &&
    typeof event.mergeOnChainEventBody !== "undefined" &&
    typeof event.mergeOnChainEventBody.onChainEvent !== "undefined"
  );
};

export const isMergeUsernameProofHubEvent = (
  event: hubEventProtobufs.HubEvent,
): event is types.MergeUsernameProofHubEvent => {
  return (
    event.type === hubEventProtobufs.HubEventType.MERGE_USERNAME_PROOF &&
    typeof event.mergeUsernameProofBody !== "undefined" &&
    (typeof event.mergeUsernameProofBody.usernameProof !== "undefined" ||
      typeof event.mergeUsernameProofBody.deletedUsernameProof !== "undefined")
  );
};
