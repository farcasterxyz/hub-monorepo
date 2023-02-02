import * as protobufs from '@farcaster/protobufs/src/generated/message';

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

export type AmpAddData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_AMP_ADD;
  ampBody: protobufs.AmpBody;
};

export type AmpAddMessage = protobufs.Message & {
  data: AmpAddData;
  signatureScheme: protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519;
};

export type AmpRemoveData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_AMP_REMOVE;
  ampBody: protobufs.AmpBody;
};

export type AmpRemoveMessage = protobufs.Message & {
  data: AmpRemoveData;
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
  signerBody: protobufs.SignerBody;
};

export type SignerAddMessage = protobufs.Message & {
  data: SignerAddData;
  signatureScheme: protobufs.SignatureScheme.SIGNATURE_SCHEME_EIP712;
};

export type SignerRemoveData = protobufs.MessageData & {
  type: protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE;
  signerBody: protobufs.SignerBody;
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
