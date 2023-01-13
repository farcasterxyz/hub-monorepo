import * as flatbuffers from '@farcaster/flatbuffers';

export {
  FarcasterNetwork,
  HashScheme,
  MessageType,
  ReactionType,
  SignatureScheme,
  UserDataType,
} from '@farcaster/flatbuffers';

export type Message<TData = MessageData> = Readonly<{
  flatbuffer: flatbuffers.Message;
  data: TData;
  hash: string; // Hex string
  hashScheme: flatbuffers.HashScheme;
  signature: string; // Hex string
  signatureScheme: flatbuffers.SignatureScheme;
  signer: string; // Hex string
  tsHash: string; // Hex string
}>;

export type MessageData<TBody = MessageBody, TType = flatbuffers.MessageType> = {
  flatbuffer: flatbuffers.MessageData;
  body: TBody;
  type: TType;
  timestamp: number;
  fid: number;
  network: flatbuffers.FarcasterNetwork;
};

export type CastAddData = MessageData<CastAddBody, flatbuffers.MessageType.CastAdd>;
export type CastRemoveData = MessageData<CastRemoveBody, flatbuffers.MessageType.CastRemove>;
export type ReactionAddData = MessageData<ReactionBody, flatbuffers.MessageType.ReactionAdd>;
export type ReactionRemoveData = MessageData<ReactionBody, flatbuffers.MessageType.ReactionRemove>;
export type AmpAddData = MessageData<AmpBody, flatbuffers.MessageType.AmpAdd>;
export type AmpRemoveData = MessageData<AmpBody, flatbuffers.MessageType.AmpRemove>;
export type VerificationAddEthAddressData = MessageData<
  VerificationAddEthAddressBody,
  flatbuffers.MessageType.VerificationAddEthAddress
>;
export type VerificationRemoveData = MessageData<VerificationRemoveBody, flatbuffers.MessageType.VerificationRemove>;
export type SignerAddData = MessageData<SignerBody, flatbuffers.MessageType.SignerAdd>;
export type SignerRemoveData = MessageData<SignerBody, flatbuffers.MessageType.SignerRemove>;
export type UserDataAddData = MessageData<UserDataBody, flatbuffers.MessageType.UserDataAdd>;

export type CastAddMessage = Message<CastAddData>;
export type CastRemoveMessage = Message<CastRemoveData>;
export type ReactionAddMessage = Message<ReactionAddData>;
export type ReactionRemoveMessage = Message<ReactionRemoveData>;
export type AmpAddMessage = Message<AmpAddData>;
export type AmpRemoveMessage = Message<AmpRemoveData>;
export type VerificationAddEthAddressMessage = Message<VerificationAddEthAddressData>;
export type VerificationRemoveMessage = Message<VerificationRemoveData>;
export type SignerAddMessage = Message<SignerAddData>;
export type SignerRemoveMessage = Message<SignerRemoveData>;
export type UserDataAddMessage = Message<UserDataAddData>;

export type CastId = {
  fid: number;
  tsHash: string; // Hex string
};

export type TargetId = CastId;

export type MessageBody =
  | CastAddBody
  | CastRemoveBody
  | ReactionBody
  | AmpBody
  | VerificationAddEthAddressBody
  | VerificationRemoveBody
  | SignerBody
  | UserDataBody;

export type CastAddBody = {
  embeds?: string[] | undefined;
  mentions?: number[] | undefined;
  parent?: TargetId | undefined;
  text: string;
};

export type CastRemoveBody = {
  targetTsHash: string;
};

export type ReactionBody = {
  target: TargetId;
  type: flatbuffers.ReactionType;
};

export type AmpBody = {
  user: number;
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
  type: flatbuffers.UserDataType;
  value: string;
};

export type IdRegistryEvent = Readonly<{
  flatbuffer: flatbuffers.IdRegistryEvent;
  blockNumber: number;
  blockHash: string; // Hex string
  transactionHash: string; // Hex string
  logIndex: number;
  fid: number;
  to: string; // Hex string
  type: flatbuffers.IdRegistryEventType;
  from: string; // Hex string
}>;

export type NameRegistryEvent = Readonly<{
  flatbuffer: flatbuffers.NameRegistryEvent;
  blockNumber: number;
  blockHash: string; // Hex string
  transactionHash: string; // Hex string
  logIndex: number;
  fname: string;
  to: string; // Hex string
  type: flatbuffers.NameRegistryEventType;
  from: string; // Hex string
  expiry: number;
}>;

export type MessageEventResponse = {
  flatbuffer: flatbuffers.EventResponse;
  type: flatbuffers.EventType.MergeMessage | flatbuffers.EventType.PruneMessage | flatbuffers.EventType.RevokeMessage;
  message: Message;
};

export type IdRegistryEventResponse = {
  flatbuffer: flatbuffers.EventResponse;
  type: flatbuffers.EventType.MergeIdRegistryEvent;
  idRegistryEvent: IdRegistryEvent;
};

export type NameRegistryEventResponse = {
  flatbuffer: flatbuffers.EventResponse;
  type: flatbuffers.EventType.MergeNameRegistryEvent;
  nameRegistryEvent: NameRegistryEvent;
};

export type EventResponse = NameRegistryEventResponse | IdRegistryEventResponse | MessageEventResponse;
