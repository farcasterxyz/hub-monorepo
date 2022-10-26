import MessageModel from '~/storage/flatbuffers/model';
import { CastAddBody, CastRemoveBody } from '~/utils/generated/message_generated';

export enum RocksDBPrefix {
  User = 1,
  Message = 2,
  MessagesBySigner = 3,
  CastRemoves = 10,
  CastAdds = 11,
}

export interface CastRemoveModel extends MessageModel {
  body(): CastRemoveBody;
}

export interface CastAddModel extends MessageModel {
  body(): CastAddBody;
}
