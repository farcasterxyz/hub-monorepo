import MessageModel from '~/storage/flatbuffers/messageModel';
import { VerificationAddEthAddressBody } from '~/utils/generated/farcaster/verification-add-eth-address-body';
import { VerificationRemoveBody } from '~/utils/generated/farcaster/verification-remove-body';
import {
  CastAddBody,
  CastRemoveBody,
  FarcasterNetwork,
  FollowBody,
  SignerBody,
  ReactionBody,
} from '~/utils/generated/message_generated';

// TODO: Document the purpose of root prefix
// Used to prefix keys so that we know if they are a message or an index of some sort.
export enum RootPrefix {
  User = 1,
  CastsByParent = 2,
  CastsByMention = 3,
  FollowsByUser = 4,
  ReactionsByTarget = 5,
}

// TODO: Document the purpose of user prefix
export enum UserPrefix {
  CastMessage = 1,
  CastAdds = 2,
  CastRemoves = 3,
  BySigner = 4,
  FollowMessage = 5,
  FollowAdds = 6,
  FollowRemoves = 7,
  ReactionMessage = 8,
  ReactionAdds = 9,
  ReactionRemoves = 10,
  VerificationMessage = 11,
  VerificationAdds = 12,
  VerificationRemoves = 13,
  IDRegistryEvent = 14,
  SignerMessage = 15,
  SignerAdds = 16,
  SignerRemoves = 17,
}

export type UserMessagePrefix =
  | UserPrefix.CastMessage
  | UserPrefix.FollowMessage
  | UserPrefix.VerificationMessage
  | UserPrefix.SignerMessage
  | UserPrefix.ReactionMessage;

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

export interface ReactionAddModel extends MessageModel {
  body(): ReactionBody;
}

export interface ReactionRemoveModel extends MessageModel {
  body(): ReactionBody;
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
