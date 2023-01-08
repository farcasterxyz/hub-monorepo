import {
  FarcasterNetwork,
  HashScheme,
  MessageType,
  ReactionType,
  SignatureScheme,
  UserDataType,
} from '@hub/flatbuffers';

export type Message<TData = MessageData> = {
  data: TData;
  hash: string; // Hex string
  hashScheme: HashScheme;
  signature: string; // Hex string
  signatureScheme: SignatureScheme;
  signer: string; // Hex string
};

export type MessageData<TBody = MessageBody, TType = MessageType> = {
  body: TBody;
  type: TType;
  timestamp: number;
  fid: number;
  network: FarcasterNetwork;
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
  embeds?: string[];
  mentions?: number[];
  parent?: TargetId;
  text: string;
};

export type CastRemoveBody = {
  targetTsHash: string;
};

export type ReactionBody = {
  target: TargetId;
  type: ReactionType;
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
  type: UserDataType;
  value: string;
};
