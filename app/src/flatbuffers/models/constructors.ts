import * as flatbuffers from '@hub/flatbuffers';
import { SignerBodyT } from '@hub/flatbuffers';
import { blake3 } from '@noble/hashes/blake3';
import { Builder, ByteBuffer } from 'flatbuffers';
import { EthersMessageSigner, IMessageSigner } from '../messageSigner';
import { hexStringToBytes, numberToBytes } from '../utils/bytes';
import { getFarcasterTime } from '../utils/time';
import MessageModel from './messageModel';
import { SignerAddModel, SignerRemoveModel } from './types';
import { validateMessage } from './validations';

type MessageBaseOptions<TExtOpts, TSigner extends IMessageSigner> = {
  fid: number;
  signer: TSigner;
  network: flatbuffers.FarcasterNetwork;
} & TExtOpts;

type SignerMessageBaseOptions<TOpts> = MessageBaseOptions<TOpts, EthersMessageSigner>;

export type SignerAddOptions = {
  /** Public key of the EdDSA key pair to add as a signer. */
  publicKey: string;
};

export const makeSignerAddModel = async ({
  publicKey,
  ...rest
}: SignerMessageBaseOptions<SignerAddOptions>): Promise<SignerAddModel> => {
  const body = makeSignerBodyT(publicKey);
  const model = await makeMessageModel({
    bodyType: flatbuffers.MessageBody.SignerBody,
    body,
    messageType: flatbuffers.MessageType.SignerAdd,
    ...rest,
  });

  return model as SignerAddModel;
};

export type SignerRemoveOptions = {
  /** Public key of the EdDSA key pair to remove as a signer. */
  publicKey: string;
};

export const makeSignerRemoveModel = async ({
  publicKey,
  ...rest
}: SignerMessageBaseOptions<SignerRemoveOptions>): Promise<SignerAddModel> => {
  const body = makeSignerBodyT(publicKey);
  const model = await makeMessageModel({
    bodyType: flatbuffers.MessageBody.SignerBody,
    body,
    messageType: flatbuffers.MessageType.SignerRemove,
    ...rest,
  });

  return model as SignerRemoveModel;
};

type MakeMessageModelOptions = {
  bodyType: flatbuffers.MessageBody;
  body: ConstructorParameters<typeof flatbuffers.MessageDataT>[1];
  fid: number;
  messageType: flatbuffers.MessageType;
  network: flatbuffers.FarcasterNetwork;
  signer: IMessageSigner;
};

const makeMessageModel = async ({ bodyType, body, messageType, signer, fid, network }: MakeMessageModelOptions) => {
  const fidBytesResult = numberToBytes(fid);
  // TODO consider how errors should be reported
  if (fidBytesResult.isErr()) {
    throw new Error('invalid fid');
  }
  const fidBytes = Array.from(fidBytesResult.value);
  const data = makeMessageData({ bodyType, body, messageType, fid: fidBytes, network });
  const message = await makeMessage({ data, signer });
  const model = new MessageModel(message);
  const result = await validateMessage(model);

  // TODO consider how errors should be reported
  if (result.isErr()) {
    throw result.error;
  }

  return result.value;
};

type MakeMessageOptions = {
  data: flatbuffers.MessageData;
  signer: IMessageSigner;
};

const makeMessage = async ({ data, signer }: MakeMessageOptions): Promise<flatbuffers.Message> => {
  const dataBytes = data.bb?.bytes() ?? new Uint8Array();
  const hash = await blake3(dataBytes, { dkLen: 16 });
  const signature = (await signer.sign(hash))._unsafeUnwrap();
  const message = new flatbuffers.MessageT(
    Array.from(dataBytes),
    Array.from(hash),
    flatbuffers.HashScheme.Blake3,
    Array.from(signature),
    signer.scheme,
    Array.from(signer.signerKey)
  );

  const fbb = new Builder(1);
  fbb.finish(message.pack(fbb));

  return flatbuffers.Message.getRootAsMessage(new ByteBuffer(fbb.asUint8Array()));
};

type MakeMessageDataOptions = {
  bodyType: flatbuffers.MessageBody;
  body: ConstructorParameters<typeof flatbuffers.MessageDataT>[1];
  messageType: flatbuffers.MessageType;
  fid: number[];
  network: flatbuffers.FarcasterNetwork;
};

const makeMessageData = ({
  bodyType,
  body,
  messageType,
  fid,
  network,
}: MakeMessageDataOptions): flatbuffers.MessageData => {
  const messageData = new flatbuffers.MessageDataT(bodyType, body, messageType, getFarcasterTime(), fid, network);

  const builder = new Builder(1);
  builder.finish(messageData.pack(builder));

  return flatbuffers.MessageData.getRootAsMessageData(new ByteBuffer(builder.asUint8Array()));
};

const makeSignerBodyT = (publicKey: string): SignerBodyT => {
  const publicKeyBytes = hexStringToBytes(publicKey);
  if (publicKeyBytes.isErr()) {
    // TODO refactor to HubResult
    throw publicKeyBytes.error;
  }

  return new flatbuffers.SignerBodyT(Array.from(publicKeyBytes.value));
};
