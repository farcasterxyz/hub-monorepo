import MessageModel from '~/storage/flatbuffers/model';
import { CastAddBody, CastRemoveBody } from '~/utils/generated/message_generated';

export enum RootPrefix {
  User = 1,
}

export enum UserPrefix {
  CastMessage = 1,
  CastAdds = 2,
  CastRemoves = 3,
  BySigner = 4,
}

export type UserMessagePrefix = UserPrefix.CastMessage;

export interface CastRemoveModel extends MessageModel {
  body(): CastRemoveBody;
}

export interface CastAddModel extends MessageModel {
  body(): CastAddBody;
}
