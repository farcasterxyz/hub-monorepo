import { MessageType } from '@farcaster/protobufs';
import { Ed25519Signer } from './ed25519Signer';
import { Eip712Signer } from './eip712Signer';

export type MessageSigner<TMessageType extends MessageType> = TMessageType extends
  | MessageType.MESSAGE_TYPE_SIGNER_ADD
  | MessageType.MESSAGE_TYPE_SIGNER_REMOVE
  ? Eip712Signer
  : Ed25519Signer;
