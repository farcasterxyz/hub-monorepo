import * as protobufs from './generated/message';

export type CastAddData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_CAST_ADD;
  castAddBody: protobufs.CastAddBody;
};

export type CastRemoveData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_CAST_REMOVE;
  castRemoveBody: protobufs.CastRemoveBody;
};

export type ReactionAddData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD;
  reactionBody: protobufs.ReactionBody;
};

export type ReactionRemoveData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE;
  reactionBody: protobufs.ReactionBody;
};

export type AmpAddData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_AMP_ADD;
  ampBody: protobufs.AmpBody;
};

export type AmpRemoveData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_AMP_REMOVE;
  ampBody: protobufs.AmpBody;
};

export type VerificationAddEthAddressData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS;
  verificationAddEthAddressBody: protobufs.VerificationAddEthAddressBody;
};

export type VerificationRemoveData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE;
  verificationRemoveBody: protobufs.VerificationRemoveBody;
};

export type SignerAddData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD;
  signerBody: protobufs.SignerBody;
};

export type SignerRemoveData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE;
  signerBody: protobufs.SignerBody;
};

export type UserDataAddData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_USER_DATA_ADD;
  userDataBody: protobufs.UserDataBody;
};
