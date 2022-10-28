import MessageModel from '~/storage/flatbuffers/model';
import { CastAddBody, CastRemoveBody, FollowBody } from '~/utils/generated/message_generated';

export enum RootPrefix {
  User = 1,
  CastsByParent = 2,
  CastsByMention = 3,
  FollowsByUser = 4,
}

export enum UserPrefix {
  CastMessage = 1,
  CastAdds = 2,
  CastRemoves = 3,
  BySigner = 4,
  FollowMessage = 5,
  FollowAdds = 6,
  FollowRemoves = 7,
}

export type UserMessagePrefix = UserPrefix.CastMessage | UserPrefix.FollowMessage;

export interface CastRemoveModel extends MessageModel {
  body(): CastRemoveBody;
}

export interface CastAddModel extends MessageModel {
  body(): CastAddBody;
}

export interface FollowAddModel extends MessageModel {
  body(): FollowBody;
}

export interface FollowRemoveModel extends MessageModel {
  body(): FollowBody;
}
