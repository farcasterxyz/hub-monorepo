import { MessageType } from '../protobufs';
import { Ed25519Signer } from './ed25519Signer';
import { Eip712Signer } from './eip712Signer';

export type MessageSigner<TMessageType extends MessageType> = TMessageType extends
  | MessageType.SIGNER_ADD
  | MessageType.SIGNER_REMOVE
  ? Eip712Signer
  : Ed25519Signer;
