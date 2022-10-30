import MessageModel from '~/storage/flatbuffers/model';
import { VerificationAddEthAddressBody } from '~/utils/generated/farcaster/verification-add-eth-address-body';
import { VerificationRemoveBody } from '~/utils/generated/farcaster/verification-remove-body';
import { CastAddBody, CastRemoveBody, FarcasterNetwork, FollowBody } from '~/utils/generated/message_generated';

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
}

export type UserMessagePrefix = UserPrefix.CastMessage | UserPrefix.FollowMessage | UserPrefix.VerificationMessage;

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

export type VerificationEthAddressClaim = {
  fid: Uint8Array;
  address: string; // Lowercased hex string
  network: FarcasterNetwork;
  blockHash: Uint8Array;
};
