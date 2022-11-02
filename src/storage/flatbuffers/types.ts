import MessageModel from '~/storage/flatbuffers/messageModel';
import {
  CastAddBody,
  CastRemoveBody,
  FarcasterNetwork,
  FollowBody,
  SignerBody,
  VerificationAddEthAddressBody,
  VerificationRemoveBody,
  UserDataBody,
  ReactionBody,
} from '~/utils/generated/message_generated';

/**
 * RootPrefix indicates the purpose of the key. It is the 1st byte of every key.
 */
export enum RootPrefix {
  /* Used for multiple purposes, starts with a 32-byte fid */
  User = 1,
  /* Used to index casts by parent */
  CastsByParent = 2,
  /* Used to index casts by mention */
  CastsByMention = 3,
  /* Used to index follows by fid */
  FollowsByUser = 4,
  /* Used to index reactions by target  */
  ReactionsByTarget = 5,
}

/**
 * UserPostfix indicates the purpose of the key when the RootPrefix is User. It is the 34th byte of
 * every RocksDB key with RootPrefix User.
 */
export enum UserPostfix {
  /* Used to store a cast */
  CastMessage = 1,
  /* Used to index a cast in the add set */
  CastAdds = 2,
  /* Used to index a cast in the remove set */
  CastRemoves = 3,
  /* Used to index a message by its signer */
  BySigner = 4,
  /* Used to store a follow */
  FollowMessage = 5,
  /* Used to index a follow in the add set */
  FollowAdds = 6,
  /* Used to index a follow in the remove set */
  FollowRemoves = 7,
  /* Used to store a reaction */
  ReactionMessage = 8,
  /* Used to index a reaction in the add set */
  ReactionAdds = 9,
  /* Used to index a reaction in the remove set */
  ReactionRemoves = 10,
  /* Used to store a verification */
  VerificationMessage = 11,
  /* Used to index a verification in the add set */
  VerificationAdds = 12,
  /* Used to index a verification in the remove set */
  VerificationRemoves = 13,
  /* Used to store an id registry event */
  IDRegistryEvent = 14,
  /* Used to store a signer */
  SignerMessage = 15,
  /* Used to index a signer in the add set */
  SignerAdds = 16,
  /* Used to index a signer in the remove set */
  SignerRemoves = 17,
  /* Used to index a user data message in the add set */
  UserDataAdds = 18,
  /* Used to store a user data message */
  UserDataMessage = 19,
}

/** A union type of UserPostfixes that are used to store messages */
export type UserMessagePostfix =
  | UserPostfix.CastMessage
  | UserPostfix.FollowMessage
  | UserPostfix.VerificationMessage
  | UserPostfix.SignerMessage
  | UserPostfix.ReactionMessage
  | UserPostfix.UserDataMessage;

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

export interface UserDataAddModel extends MessageModel {
  body(): UserDataBody;
}

export type VerificationEthAddressClaim = {
  fid: Uint8Array;
  address: string; // Lowercased hex string
  network: FarcasterNetwork;
  blockHash: Uint8Array;
};
