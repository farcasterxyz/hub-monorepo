import { MessageType } from '@farcaster/flatbuffers';
import { Ed25519Signer } from './ed25519Signer';
import { Eip712Signer } from './eip712Signer';

export type MessageSigner<TMessageType extends MessageType> = TMessageType extends
  | MessageType.SignerAdd
  | MessageType.SignerRemove
  ? Eip712Signer
  : Ed25519Signer;
