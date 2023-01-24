import * as protobufs from './generated/message';
import * as types from './types';

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

export const isAmpAddData = (data: protobufs.MessageData): data is types.AmpAddData => {
  return data.type === protobufs.MessageType.MESSAGE_TYPE_AMP_ADD && typeof data.ampBody !== 'undefined';
};

export const isAmpAddMessage = (message: protobufs.Message): message is types.AmpAddMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519 &&
    typeof message.data !== 'undefined' &&
    isAmpAddData(message.data)
  );
};

export const isAmpRemoveData = (data: protobufs.MessageData): data is types.AmpRemoveData => {
  return data.type === protobufs.MessageType.MESSAGE_TYPE_AMP_REMOVE && typeof data.ampBody !== 'undefined';
};

export const isAmpRemoveMessage = (message: protobufs.Message): message is types.AmpRemoveMessage => {
  return (
    message.signatureScheme === protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519 &&
    typeof message.data !== 'undefined' &&
    isAmpRemoveData(message.data)
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
