import MessageModel from '~/storage/flatbuffers/messageModel';
import * as Types from '~/storage/flatbuffers/types';

import { MessageBody, MessageType } from '~/utils/generated/message_generated';

export const isCastRemove = (message: MessageModel): message is Types.CastRemoveModel => {
  return message.type() === MessageType.CastRemove && message.data.bodyType() === MessageBody.CastRemoveBody;
};

export const isCastAdd = (message: MessageModel): message is Types.CastAddModel => {
  return message.type() === MessageType.CastAdd && message.data.bodyType() === MessageBody.CastAddBody;
};

export const isAmpRemove = (message: MessageModel): message is Types.AmpRemoveModel => {
  return message.type() === MessageType.AmpRemove && message.data.bodyType() === MessageBody.AmpBody;
};

export const isAmpAdd = (message: MessageModel): message is Types.AmpAddModel => {
  return message.type() === MessageType.AmpAdd && message.data.bodyType() === MessageBody.AmpBody;
};

export const isReactionAdd = (message: MessageModel): message is Types.ReactionAddModel => {
  return message.type() === MessageType.ReactionAdd && message.data.bodyType() === MessageBody.ReactionBody;
};

export const isReactionRemove = (message: MessageModel): message is Types.ReactionRemoveModel => {
  return message.type() === MessageType.ReactionRemove && message.data.bodyType() === MessageBody.ReactionBody;
};

export const isVerificationRemove = (message: MessageModel): message is Types.VerificationRemoveModel => {
  return (
    message.type() === MessageType.VerificationRemove && message.data.bodyType() === MessageBody.VerificationRemoveBody
  );
};

export const isVerificationAddEthAddress = (message: MessageModel): message is Types.VerificationAddEthAddressModel => {
  return (
    message.type() === MessageType.VerificationAddEthAddress &&
    message.data.bodyType() === MessageBody.VerificationAddEthAddressBody
  );
};

export const isSignerRemove = (message: MessageModel): message is Types.SignerRemoveModel => {
  return message.type() === MessageType.SignerRemove && message.data.bodyType() === MessageBody.SignerBody;
};

export const isSignerAdd = (message: MessageModel): message is Types.SignerAddModel => {
  return message.type() === MessageType.SignerAdd && message.data.bodyType() === MessageBody.SignerBody;
};

export const isUserDataAdd = (message: MessageModel): message is Types.UserDataAddModel => {
  return message.type() === MessageType.UserDataAdd && message.data.bodyType() === MessageBody.UserDataBody;
};
