import * as flatbuffers from '@hub/flatbuffers';
import { bytesToHexString, toTsHash, validations } from '@hub/utils';
import { ByteBuffer } from 'flatbuffers';
import { Result } from 'neverthrow';
import * as types from './types';
import { deserializeEd25519PublicKey, deserializeEthAddress, deserializeMessageData } from './utils';

export class WrappedMessage implements types.Message {
  // Custom
  public readonly flatbuffer: flatbuffers.Message;
  public readonly tsHash: string; // Hex string

  // Message implementation
  public readonly data: types.MessageData;
  public readonly hash: string; // Hex string
  public readonly hashScheme: flatbuffers.HashScheme;
  public readonly signature: string; // Hex string
  public readonly signatureScheme: flatbuffers.SignatureScheme;
  public readonly signer: string; // Hex string

  constructor(flatbuffer: flatbuffers.Message) {
    this.flatbuffer = flatbuffer;

    const messageData = flatbuffers.MessageData.getRootAsMessageData(
      new ByteBuffer(flatbuffer.dataArray() ?? new Uint8Array())
    );
    const isEip712Signer = validations.EIP712_MESSAGE_TYPES.includes(messageData.type() ?? 0);
    const deserialize = Result.combine([
      deserializeMessageData(messageData),
      bytesToHexString(flatbuffer.hashArray() ?? new Uint8Array(), { size: 32 }),
      bytesToHexString(flatbuffer.signatureArray() ?? new Uint8Array(), { size: 128 }),
      isEip712Signer
        ? deserializeEthAddress(flatbuffer.signerArray() ?? new Uint8Array())
        : deserializeEd25519PublicKey(flatbuffer.signerArray() ?? new Uint8Array()),
    ]);
    if (deserialize.isErr()) {
      throw deserialize.error;
    }
    const [data, hash, signature, signer] = deserialize.value;

    this.data = data;
    this.hash = hash;
    this.hashScheme = flatbuffer.hashScheme();
    this.signature = signature;
    this.signatureScheme = flatbuffer.signatureScheme();
    this.signer = signer;

    const tsHash = toTsHash(messageData.timestamp(), flatbuffer.hashArray() ?? new Uint8Array()).andThen(
      (tsHashBytes) => bytesToHexString(tsHashBytes, { size: 40 })
    );
    if (tsHash.isErr()) {
      throw tsHash.error;
    }
    this.tsHash = tsHash.value;
  }
}
