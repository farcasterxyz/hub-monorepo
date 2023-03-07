import { IdRegistryEvent } from 'generated/id_registry_event';
import { NameRegistryEvent } from 'generated/name_registry_event';
import * as hubEventProtobufs from './generated/hub_event';
import * as protobufs from './generated/message';

/** Message types */

export type CastAddData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_CAST_ADD;
  castAddBody: protobufs.CastAddBody;
};

export type CastAddMessage = protobufs.Message & {
  data: CastAddData;
  signatureScheme: protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519;
};

export type CastRemoveData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_CAST_REMOVE;
  castRemoveBody: protobufs.CastRemoveBody;
};

export type CastRemoveMessage = protobufs.Message & {
  data: CastRemoveData;
  signatureScheme: protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519;
};

export type ReactionAddData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD;
  reactionBody: protobufs.ReactionBody;
};

export type ReactionAddMessage = protobufs.Message & {
  data: ReactionAddData;
  signatureScheme: protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519;
};

export type ReactionRemoveData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE;
  reactionBody: protobufs.ReactionBody;
};

export type ReactionRemoveMessage = protobufs.Message & {
  data: ReactionRemoveData;
  signatureScheme: protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519;
};

export type VerificationAddEthAddressData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS;
  verificationAddEthAddressBody: protobufs.VerificationAddEthAddressBody;
};

export type VerificationAddEthAddressMessage = protobufs.Message & {
  data: VerificationAddEthAddressData;
  signatureScheme: protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519;
};

export type VerificationRemoveData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE;
  verificationRemoveBody: protobufs.VerificationRemoveBody;
};

export type VerificationRemoveMessage = protobufs.Message & {
  data: VerificationRemoveData;
  signatureScheme: protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519;
};

export type SignerAddData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD;
  signerBody: protobufs.SignerAddBody;
};

export type SignerAddMessage = protobufs.Message & {
  data: SignerAddData;
  signatureScheme: protobufs.SignatureScheme.SIGNATURE_SCHEME_EIP712;
};

export type SignerRemoveData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE;
  signerBody: protobufs.SignerRemoveBody;
};

export type SignerRemoveMessage = protobufs.Message & {
  data: SignerRemoveData;
  signatureScheme: protobufs.SignatureScheme.SIGNATURE_SCHEME_EIP712;
};

export type UserDataAddData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_USER_DATA_ADD;
  userDataBody: protobufs.UserDataBody;
};

export type UserDataAddMessage = protobufs.Message & {
  data: UserDataAddData;
  signatureScheme: protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519;
};

/** Hub event types */

export type MergeMessageHubEvent = hubEventProtobufs.HubEvent & {
  type: hubEventProtobufs.HubEventType.HUB_EVENT_TYPE_MERGE_MESSAGE;
  mergeMessageBody: hubEventProtobufs.MergeMessageBody & {
    message: protobufs.Message;
  };
};

export type RevokeMessageHubEvent = hubEventProtobufs.HubEvent & {
  type: hubEventProtobufs.HubEventType.HUB_EVENT_TYPE_REVOKE_MESSAGE;
  revokeMessageBody: hubEventProtobufs.RevokeMessageBody & {
    message: protobufs.Message;
  };
};

export type PruneMessageHubEvent = hubEventProtobufs.HubEvent & {
  type: hubEventProtobufs.HubEventType.HUB_EVENT_TYPE_PRUNE_MESSAGE;
  pruneMessageBody: hubEventProtobufs.PruneMessageBody & {
    message: protobufs.Message;
  };
};

export type MergeIdRegistryEventHubEvent = hubEventProtobufs.HubEvent & {
  type: hubEventProtobufs.HubEventType.HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT;
  mergeIdRegistryEventBody: hubEventProtobufs.MergeIdRegistryEventBody & {
    idRegistryEvent: IdRegistryEvent;
  };
};

export type MergeNameRegistryEventHubEvent = hubEventProtobufs.HubEvent & {
  type: hubEventProtobufs.HubEventType.HUB_EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT;
  mergeNameRegistryEventBody: hubEventProtobufs.MergeNameRegistryEventBody & {
    nameRegistryEvent: NameRegistryEvent;
  };
};
