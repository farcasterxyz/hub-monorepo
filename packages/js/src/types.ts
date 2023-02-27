import * as protobufs from '@farcaster/protobufs';

export {
  FarcasterNetwork,
  HashScheme,
  MessageType,
  ReactionType,
  SignatureScheme,
  UserDataType,
} from '@farcaster/protobufs';
export type { VerificationEthAddressClaim } from '@farcaster/utils';

export type Message<TData = MessageData> = Readonly<{
  _protobuf: protobufs.Message;
  data: TData;
  hash: string; // Hex string
  hashScheme: protobufs.HashScheme;
  signature: string; // Hex string
  signatureScheme: protobufs.SignatureScheme;
  signer: string; // Hex string
}>;

export type MessageData<TBody = MessageBody, TType = protobufs.MessageType> = {
  _protobuf: protobufs.MessageData;
  body: TBody;
  type: TType;
  /** Unix milleseconds */
  timestamp: number;
  fid: number;
  network: protobufs.FarcasterNetwork;
};

export type CastAddData = MessageData<CastAddBody, protobufs.MessageType.MESSAGE_TYPE_CAST_ADD>;
export type CastRemoveData = MessageData<CastRemoveBody, protobufs.MessageType.MESSAGE_TYPE_CAST_REMOVE>;
export type ReactionAddData = MessageData<ReactionBody, protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD>;
export type ReactionRemoveData = MessageData<ReactionBody, protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE>;
export type VerificationAddEthAddressData = MessageData<
  VerificationAddEthAddressBody,
  protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS
>;
export type VerificationRemoveData = MessageData<
  VerificationRemoveBody,
  protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE
>;
export type SignerAddData = MessageData<SignerBody, protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD>;
export type SignerRemoveData = MessageData<SignerBody, protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE>;
export type UserDataAddData = MessageData<UserDataBody, protobufs.MessageType.MESSAGE_TYPE_USER_DATA_ADD>;

export type CastAddMessage = Message<CastAddData>;
export type CastRemoveMessage = Message<CastRemoveData>;
export type ReactionAddMessage = Message<ReactionAddData>;
export type ReactionRemoveMessage = Message<ReactionRemoveData>;
export type VerificationAddEthAddressMessage = Message<VerificationAddEthAddressData>;
export type VerificationRemoveMessage = Message<VerificationRemoveData>;
export type SignerAddMessage = Message<SignerAddData>;
export type SignerRemoveMessage = Message<SignerRemoveData>;
export type UserDataAddMessage = Message<UserDataAddData>;

export type CastId = {
  fid: number;
  hash: string; // Hex string
};

export type MessageBody =
  | CastAddBody
  | CastRemoveBody
  | ReactionBody
  | VerificationAddEthAddressBody
  | VerificationRemoveBody
  | SignerBody
  | UserDataBody;

export type CastAddBody = {
  embeds?: string[] | undefined;
  mentions?: number[] | undefined;
  mentionsPositions?: number[] | undefined;
  parent?: CastId | undefined;
  text: string;
};

export type CastRemoveBody = {
  targetHash: string;
};

export type ReactionBody = {
  target: CastId;
  type: protobufs.ReactionType;
};

export type AmpBody = {
  targetFid: number;
};

export type VerificationAddEthAddressBody = {
  address: string; // Hex string
  ethSignature: string; // Hex string
  blockHash: string; // Hex string
};

export type VerificationRemoveBody = {
  address: string; // Hex string
};

export type SignerBody = {
  signer: string; // Hex string
};

export type UserDataBody = {
  type: protobufs.UserDataType;
  value: string;
};

export type IdRegistryEvent = Readonly<{
  _protobuf: protobufs.IdRegistryEvent;
  blockNumber: number;
  blockHash: string; // Hex string
  transactionHash: string; // Hex string
  logIndex: number;
  fid: number;
  to: string; // Hex string
  type: protobufs.IdRegistryEventType;
  from: string | undefined; // Hex string
}>;

export type NameRegistryEvent = Readonly<{
  _protobuf: protobufs.NameRegistryEvent;
  blockNumber: number;
  blockHash: string; // Hex string
  transactionHash: string; // Hex string
  logIndex: number;
  fname: string;
  to: string; // Hex string
  type: protobufs.NameRegistryEventType;
  from: string; // Hex string
  expiry: number | undefined;
}>;

type GenericHubEvent = {
  _protobuf: protobufs.HubEvent;
  id: number;
  type: protobufs.HubEventType;
};

export type MergeMessageHubEvent = GenericHubEvent & {
  type: protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_MESSAGE;
  message: Message;
  deletedMessages?: Message[];
};

export type PruneMessageHubEvent = GenericHubEvent & {
  type: protobufs.HubEventType.HUB_EVENT_TYPE_PRUNE_MESSAGE;
  message: Message;
};

export type RevokeMessageHubEvent = GenericHubEvent & {
  type: protobufs.HubEventType.HUB_EVENT_TYPE_REVOKE_MESSAGE;
  message: Message;
};

export type MergeIdRegistryEventHubEvent = GenericHubEvent & {
  type: protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT;
  idRegistryEvent: IdRegistryEvent;
};

export type MergeNameRegistryEventHubEvent = GenericHubEvent & {
  type: protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT;
  nameRegistryEvent: NameRegistryEvent;
};

export type HubEvent =
  | MergeMessageHubEvent
  | PruneMessageHubEvent
  | RevokeMessageHubEvent
  | MergeIdRegistryEventHubEvent
  | MergeNameRegistryEventHubEvent;
