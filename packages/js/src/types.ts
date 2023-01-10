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

export type CastAddMessage = Message<MessageData<CastAddBody, flatbuffers.MessageType.CastAdd>>;
export type CastRemoveMessage = Message<MessageData<CastRemoveBody, flatbuffers.MessageType.CastRemove>>;
export type ReactionAddMessage = Message<MessageData<ReactionBody, flatbuffers.MessageType.ReactionAdd>>;
export type ReactionRemoveMessage = Message<MessageData<ReactionBody, flatbuffers.MessageType.ReactionRemove>>;
export type AmpAddMessage = Message<MessageData<AmpBody, flatbuffers.MessageType.AmpAdd>>;
export type AmpRemoveMessage = Message<MessageData<AmpBody, flatbuffers.MessageType.AmpRemove>>;
export type VerificationAddEthAddressMessage = Message<
  MessageData<VerificationAddEthAddressBody, flatbuffers.MessageType.VerificationAddEthAddress>
>;
export type VerificationRemoveMessage = Message<
  MessageData<VerificationRemoveBody, flatbuffers.MessageType.VerificationRemove>
>;
export type SignerAddMessage = Message<MessageData<SignerBody, flatbuffers.MessageType.SignerAdd>>;
export type SignerRemoveMessage = Message<MessageData<SignerBody, flatbuffers.MessageType.SignerRemove>>;
export type UserDataAddMessage = Message<MessageData<UserDataBody, flatbuffers.MessageType.UserDataAdd>>;

export type MessageData<TBody = MessageBody, TType = flatbuffers.MessageType> = {
  body: TBody;
  type: TType;
  timestamp: number;
  fid: number;
  network: flatbuffers.FarcasterNetwork;
};

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

export type IdRegistryEvent = {
  blockNumber: number;
  blockHash: string; // Hex string
  transactionHash: string; // Hex string
  logIndex: number;
  fid: number;
  to: string; // Hex string
  type: flatbuffers.IdRegistryEventType;
  from: string; // Hex string
};

export type NameRegistryEvent = {
  blockNumber: number;
  blockHash: string; // Hex string
  transactionHash: string; // Hex string
  logIndex: number;
  fname: string;
  to: string; // Hex string
  type: flatbuffers.NameRegistryEventType;
  from: string; // Hex string
  expiry: number;
};
