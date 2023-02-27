import * as hubEventProtobufs from './generated/hub_event';
import * as protobufs from './generated/message';
import * as types from './types';

/** Message typeguards */

export const isCastAddData = (data: protobufs.MessageData): data is types.CastAddData => {
  return data.type === protobufs.MessageType.MESSAGE_TYPE_CAST_ADD && typeof data.castAddBody !== 'undefined';
};

export const isCastAddMessage = (message: protobufs.Message): message is types.CastAddMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519 &&
    typeof message.data !== 'undefined' &&
    isCastAddData(message.data)
  );
};

export const isCastRemoveData = (data: protobufs.MessageData): data is types.CastRemoveData => {
  return data.type === protobufs.MessageType.MESSAGE_TYPE_CAST_REMOVE && typeof data.castRemoveBody !== 'undefined';
};

export const isCastRemoveMessage = (message: protobufs.Message): message is types.CastRemoveMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519 &&
    typeof message.data !== 'undefined' &&
    isCastRemoveData(message.data)
  );
};

export const isReactionAddData = (data: protobufs.MessageData): data is types.ReactionAddData => {
  return data.type === protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD && typeof data.reactionBody !== 'undefined';
};

export const isReactionAddMessage = (message: protobufs.Message): message is types.ReactionAddMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519 &&
    typeof message.data !== 'undefined' &&
    isReactionAddData(message.data)
  );
};

export const isReactionRemoveData = (data: protobufs.MessageData): data is types.ReactionRemoveData => {
  return data.type === protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE && typeof data.reactionBody !== 'undefined';
};

export const isReactionRemoveMessage = (message: protobufs.Message): message is types.ReactionRemoveMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519 &&
    typeof message.data !== 'undefined' &&
    isReactionRemoveData(message.data)
  );
};

export const isVerificationAddEthAddressData = (
  data: protobufs.MessageData
): data is types.VerificationAddEthAddressData => {
  return (
    data.type === protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS &&
    typeof data.verificationAddEthAddressBody !== 'undefined'
  );
};

export const isVerificationAddEthAddressMessage = (
  message: protobufs.Message
): message is types.VerificationAddEthAddressMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519 &&
    typeof message.data !== 'undefined' &&
    isVerificationAddEthAddressData(message.data)
  );
};

export const isVerificationRemoveData = (data: protobufs.MessageData): data is types.VerificationRemoveData => {
  return (
    data.type === protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE &&
    typeof data.verificationRemoveBody !== 'undefined'
  );
};

export const isVerificationRemoveMessage = (message: protobufs.Message): message is types.VerificationRemoveMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519 &&
    typeof message.data !== 'undefined' &&
    isVerificationRemoveData(message.data)
  );
};

export const isSignerAddData = (data: protobufs.MessageData): data is types.SignerAddData => {
  return data.type === protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD && typeof data.signerBody !== 'undefined';
};

export const isSignerAddMessage = (message: protobufs.Message): message is types.SignerAddMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.SIGNATURE_SCHEME_EIP712 &&
    typeof message.data !== 'undefined' &&
    isSignerAddData(message.data)
  );
};

export const isSignerRemoveData = (data: protobufs.MessageData): data is types.SignerRemoveData => {
  return data.type === protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE && typeof data.signerBody !== 'undefined';
};

export const isSignerRemoveMessage = (message: protobufs.Message): message is types.SignerRemoveMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.SIGNATURE_SCHEME_EIP712 &&
    typeof message.data !== 'undefined' &&
    isSignerRemoveData(message.data)
  );
};

export const isUserDataAddData = (data: protobufs.MessageData): data is types.UserDataAddData => {
  return data.type === protobufs.MessageType.MESSAGE_TYPE_USER_DATA_ADD && typeof data.userDataBody !== 'undefined';
};

export const isUserDataAddMessage = (message: protobufs.Message): message is types.UserDataAddMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519 &&
    typeof message.data !== 'undefined' &&
    isUserDataAddData(message.data)
  );
};

/** Hub event typeguards */

export const isMergeMessageHubEvent = (event: hubEventProtobufs.HubEvent): event is types.MergeMessageHubEvent => {
  return (
    event.type === hubEventProtobufs.HubEventType.HUB_EVENT_TYPE_MERGE_MESSAGE &&
    typeof event.mergeMessageBody !== 'undefined' &&
    typeof event.mergeMessageBody.message !== 'undefined'
  );
};

export const isRevokeMessageHubEvent = (event: hubEventProtobufs.HubEvent): event is types.RevokeMessageHubEvent => {
  return (
    event.type === hubEventProtobufs.HubEventType.HUB_EVENT_TYPE_REVOKE_MESSAGE &&
    typeof event.revokeMessageBody !== 'undefined' &&
    typeof event.revokeMessageBody.message !== 'undefined'
  );
};

export const isPruneMessageHubEvent = (event: hubEventProtobufs.HubEvent): event is types.PruneMessageHubEvent => {
  return (
    event.type === hubEventProtobufs.HubEventType.HUB_EVENT_TYPE_PRUNE_MESSAGE &&
    typeof event.pruneMessageBody !== 'undefined' &&
    typeof event.pruneMessageBody.message !== 'undefined'
  );
};

export const isMergeIdRegistryEventHubEvent = (
  event: hubEventProtobufs.HubEvent
): event is types.MergeIdRegistryEventHubEvent => {
  return (
    event.type === hubEventProtobufs.HubEventType.HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT &&
    typeof event.mergeIdRegistryEventBody !== 'undefined' &&
    typeof event.mergeIdRegistryEventBody.idRegistryEvent !== 'undefined'
  );
};

export const isMergeNameRegistryEventHubEvent = (
  event: hubEventProtobufs.HubEvent
): event is types.MergeNameRegistryEventHubEvent => {
  return (
    event.type === hubEventProtobufs.HubEventType.HUB_EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT &&
    typeof event.mergeNameRegistryEventBody !== 'undefined' &&
    typeof event.mergeNameRegistryEventBody.nameRegistryEvent !== 'undefined'
  );
};
