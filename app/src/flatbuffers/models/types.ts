import * as message_generated from '@hub/flatbuffers';
import { ethers } from 'ethers';
import HubStateModel from '~/flatbuffers/models/hubStateModel';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import { HubAsyncResult } from '~/utils/hubErrors';

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
  /* Used to index amps by fid */
  AmpsByUser = 4,
  /* Used to index reactions by target  */
  ReactionsByTarget = 5,
  /* Used to store custody events */
  IdRegistryEvent = 6,
  /* Used to store name registry events */
  NameRegistryEvent = 7,
  /* Used to store custody events by custody address */
  IdRegistryEventByCustodyAddress = 8,
  /* Used to store the state of the hub */
  HubState = 9,
  /* Revoke signer jobs */
  JobRevokeSigner = 10,
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
  /* Used to store a amp */
  AmpMessage = 5,
  /* Used to index a amp in the add set */
  AmpAdds = 6,
  /* Used to index a amp in the remove set */
  AmpRemoves = 7,
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
  /* Used to store a signer */
  SignerMessage = 14,
  /* Used to index a signer in the add set */
  SignerAdds = 15,
  /* Used to index a signer in the remove set */
  SignerRemoves = 16,
  /* Used to index a user data message in the add set */
  UserDataAdds = 17,
  /* Used to store a user data message */
  UserDataMessage = 18,
}

/** A union type of UserPostfixes that are used to store messages */
export type UserMessagePostfix =
  | UserPostfix.CastMessage
  | UserPostfix.AmpMessage
  | UserPostfix.VerificationMessage
  | UserPostfix.SignerMessage
  | UserPostfix.ReactionMessage
  | UserPostfix.UserDataMessage;

export interface CastRemoveModel extends MessageModel {
  body(): message_generated.CastRemoveBody;
}

export interface CastAddModel extends MessageModel {
  body(): message_generated.CastAddBody;
}

export interface AmpAddModel extends MessageModel {
  body(): message_generated.AmpBody;
}

export interface AmpRemoveModel extends MessageModel {
  body(): message_generated.AmpBody;
}

export interface ReactionAddModel extends MessageModel {
  body(): message_generated.ReactionBody;
}

export interface ReactionRemoveModel extends MessageModel {
  body(): message_generated.ReactionBody;
}

/**
 * A Verification that proves ownership of an Ethereum address with a two-way signature.
 *
 * The Ethereum address must produce an EIP-712 signature of the fid, address, blockHash, and
 * Farcaster Network. The signature is stored in the body of the message along with the address
 * of the Ethereum address which is then signed by one of the user's signers, establishing a
 * two-way link between the Ethereum address and the user's Farcaster identity. An Ethereum address
 * can only be verified once per fid, but can be verified to multiple fids.
 *
 * body.address - the ethereum address being verified
 * body.ethSignature - the signature of the message
 * body.blockHash - user-reported latest ethereum block hash at time of signing
 */
export interface VerificationAddEthAddressModel extends MessageModel {
  body(): message_generated.VerificationAddEthAddressBody;
}

export interface VerificationRemoveModel extends MessageModel {
  body(): message_generated.VerificationRemoveBody;
}

export interface SignerAddModel extends MessageModel {
  body(): message_generated.SignerBody;
}

export interface SignerRemoveModel extends MessageModel {
  body(): message_generated.SignerBody;
}

export interface UserDataAddModel extends MessageModel {
  body(): message_generated.UserDataBody;
}

export type VerificationEthAddressClaim = {
  fid: ethers.BigNumber;
  address: string; // Hex string
  network: message_generated.FarcasterNetwork;
  blockHash: string; // Hex string
};

export type StorePruneOptions = {
  pruneSizeLimit?: number; // Max number of messages per fid
  pruneTimeLimit?: number; // Max age (in seconds) of any message in the store
};

export type HubSubmitSource = 'gossip' | 'rpc' | 'eth-provider';

export interface HubInterface {
  submitMessage(message: MessageModel, source?: HubSubmitSource): HubAsyncResult<void>;
  submitIdRegistryEvent(event: IdRegistryEventModel, source?: HubSubmitSource): HubAsyncResult<void>;
  submitNameRegistryEvent(event: NameRegistryEventModel, source?: HubSubmitSource): HubAsyncResult<void>;
  getHubState(): HubAsyncResult<HubStateModel>;
  putHubState(hubState: HubStateModel): HubAsyncResult<void>;
}

/**
 * A KeyPair that is used in the signing process
 * @privateKey - the private key of the user
 * @publicKey - the public key of the user
 */
export type KeyPair = {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
};

/** An EthereumSigner is a MessageSigner object with an ethers wallet */
export type EthereumSigner = {
  wallet: ethers.Wallet;
  signerKey: string; // Address
  type: message_generated.SignatureScheme.Eip712;
};

/** An Ed25519Signer is a MessageSigner object with a Ed25519 private key */
export type Ed25519Signer = {
  privateKey: Uint8Array;
  signerKey: string; // Public key hex
  type: message_generated.SignatureScheme.Ed25519;
};
