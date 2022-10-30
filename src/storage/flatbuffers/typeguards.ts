import MessageModel from '~/storage/flatbuffers/model';
import {
  CastAddModel,
  CastRemoveModel,
  FollowAddModel,
  FollowRemoveModel,
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
