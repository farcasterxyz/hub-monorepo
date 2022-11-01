import MessageModel from '~/storage/flatbuffers/model';
import {
  CastAddModel,
  CastRemoveModel,
  FollowAddModel,
  FollowRemoveModel,
  SignerAddModel,
  SignerRemoveModel,
  VerificationAddEthAddressModel,
  VerificationRemoveModel,
} from '~/storage/flatbuffers/types';
import { MessageBody, MessageType } from '~/utils/generated/message_generated';

export const isCastRemove = (message: MessageModel): message is CastRemoveModel => {
  return message.type() === MessageType.CastRemove && message.data.bodyType() === MessageBody.CastRemoveBody;
};

export const isCastAdd = (message: MessageModel): message is CastAddModel => {
  return message.type() === MessageType.CastAdd && message.data.bodyType() === MessageBody.CastAddBody;
};

export const isFollowRemove = (message: MessageModel): message is FollowRemoveModel => {
  return message.type() === MessageType.FollowRemove && message.data.bodyType() === MessageBody.FollowBody;
};

export const isFollowAdd = (message: MessageModel): message is FollowAddModel => {
  return message.type() === MessageType.FollowAdd && message.data.bodyType() === MessageBody.FollowBody;
};

export const isVerificationRemove = (message: MessageModel): message is VerificationRemoveModel => {
  return (
    message.type() === MessageType.VerificationRemove && message.data.bodyType() === MessageBody.VerificationRemoveBody
  );
};

export const isVerificationAddEthAddress = (message: MessageModel): message is VerificationAddEthAddressModel => {
  return (
    message.type() === MessageType.VerificationAddEthAddress &&
    message.data.bodyType() === MessageBody.VerificationAddEthAddressBody
  );
};

export const isSignerRemove = (message: MessageModel): message is SignerRemoveModel => {
  return message.type() === MessageType.SignerRemove && message.data.bodyType() === MessageBody.SignerBody;
};

export const isSignerAdd = (message: MessageModel): message is SignerAddModel => {
  return message.type() === MessageType.SignerAdd && message.data.bodyType() === MessageBody.SignerBody;
};
