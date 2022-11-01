import MessageModel from '~/storage/flatbuffers/model';
import {
  CastAddBody,
  CastRemoveBody,
  FarcasterNetwork,
  FollowBody,
  SignerBody,
  VerificationAddEthAddressBody,
  VerificationRemoveBody,
} from '~/utils/generated/message_generated';

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
  VerificationMessage = 8,
  VerificationAdds = 9,
  VerificationRemoves = 10,
  IDRegistryEvent = 11,
  SignerMessage = 12,
  SignerAdds = 13,
  SignerRemoves = 14,
}

export type UserMessagePrefix =
  | UserPrefix.CastMessage
  | UserPrefix.FollowMessage
  | UserPrefix.VerificationMessage
  | UserPrefix.SignerMessage;

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

export interface VerificationAddEthAddressModel extends MessageModel {
  body(): VerificationAddEthAddressBody;
}

export interface VerificationRemoveModel extends MessageModel {
  body(): VerificationRemoveBody;
}

export interface SignerAddModel extends MessageModel {
  body(): SignerBody;
}

export interface SignerRemoveModel extends MessageModel {
  body(): SignerBody;
}

export type VerificationEthAddressClaim = {
  fid: Uint8Array;
  address: string; // Lowercased hex string
  network: FarcasterNetwork;
  blockHash: Uint8Array;
};
