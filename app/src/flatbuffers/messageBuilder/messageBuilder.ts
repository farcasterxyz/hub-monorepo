import * as flatbuffers from '@hub/flatbuffers';
import { arrayify } from 'ethers/lib/utils';
import { Builder, ByteBuffer } from 'flatbuffers';
import { getFarcasterTime } from '~/flatbuffers/utils/time';
import { Blake3Hasher, IMessageHasher } from '../messageHasher';
import { Ed25519MessageSigner, IMessageSigner } from '../messageSigner';
import MessageModel from '../models/messageModel';
import { SignerAddModel } from '../models/types';
import { validateMessage } from '../models/validations';
import { numberToLittleEndianBytes } from '../utils/bytes';

type SignerAddOptions = {
  /**
   * Public key of the EdDSA key pair .
   */
  publicKey: string;

  /**
   * Private key of the EdDSA key pair. If this parameter is provided the the
   * EdDSA signer will be setup on the builder and used to sign additional
   * messages.
   */
  privateKey?: string;
};

interface IMessageBuilder {
  makeSignerAdd(options: SignerAddOptions): Promise<SignerAddModel>;
}

type MessageBuilderOptions = {
  /** integer representation of the message sender */
  fid: number;
  eip712Signer?: IMessageSigner;
  ed2559Signer?: IMessageSigner;
  hasher?: IMessageHasher;
  network?: flatbuffers.FarcasterNetwork;
};

class MessageBuilder implements IMessageBuilder {
  /** litte endian representation of fid */
  private fid: number[];
  private network: flatbuffers.FarcasterNetwork;
  private eip712Signer: IMessageSigner | undefined;
  private ed2559Signer: IMessageSigner | undefined;
  private hasher: IMessageHasher;

  constructor({
    fid,
    eip712Signer,
    ed2559Signer,
    hasher,
    network = flatbuffers.FarcasterNetwork.Mainnet,
  }: MessageBuilderOptions) {
    const fidBytesResult = numberToLittleEndianBytes(fid);
    // TODO consider how errors should be reported
    if (fidBytesResult.isErr()) {
      throw new Error('invalid fid');
    }
    this.fid = Array.from(fidBytesResult.value);
    this.network = network;
    this.eip712Signer = eip712Signer;
    this.ed2559Signer = ed2559Signer;
    this.hasher = hasher ?? new Blake3Hasher();
  }

  /**
   * Constructs a SignerAdd message.
   *
   * @remarks
   * An `eip712Signer` must be available on this MessageBuilder instance to generate a signer message.
   */
  public async makeSignerAdd(options: SignerAddOptions): Promise<SignerAddModel> {
    if (!this.eip712Signer) {
      throw new Error('missing eip712MessageSigner');
    }

    const body = new flatbuffers.SignerBodyT(Array.from(arrayify(options.publicKey)));
    const model = await this.buildMessage(
      flatbuffers.MessageBody.SignerBody,
      body,
      flatbuffers.MessageType.SignerAdd,
      this.eip712Signer
    );

    if (options.privateKey) {
      this.ed2559Signer = new Ed25519MessageSigner(arrayify(options.privateKey), options.publicKey);
    }

    return model as SignerAddModel;
  }

  protected async buildMessage(
    bodyType: flatbuffers.MessageBody,
    body: ConstructorParameters<typeof flatbuffers.MessageDataT>[1],
    messageType: flatbuffers.MessageType,
    signer: IMessageSigner
  ) {
    const data = this.buildData(bodyType, body, messageType);
    const message = await this.buildMessageWithData(data, signer);
    const model = new MessageModel(message);
    const result = await validateMessage(model);

    // TODO consider how errors should be reported
    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  }

  private async buildMessageWithData(
    data: flatbuffers.MessageData,
    signer: IMessageSigner
  ): Promise<flatbuffers.Message> {
    const dataBytes = data.bb?.bytes() ?? new Uint8Array();
    const hash = await this.hasher.hash(dataBytes);
    const signature = await signer.sign(hash);
    const message = new flatbuffers.MessageT(
      Array.from(dataBytes),
      Array.from(hash),
      this.hasher.scheme,
      Array.from(signature),
      signer.scheme,
      Array.from(signer.signerKey)
    );

    const fbb = new Builder(1);
    fbb.finish(message.pack(fbb));

    return flatbuffers.Message.getRootAsMessage(new ByteBuffer(fbb.asUint8Array()));
  }

  private buildData(
    bodyType: flatbuffers.MessageBody,
    body: ConstructorParameters<typeof flatbuffers.MessageDataT>[1],
    messageType: flatbuffers.MessageType
  ): flatbuffers.MessageData {
    const messageData = new flatbuffers.MessageDataT(
      bodyType,
      body,
      messageType,
      getFarcasterTime(),
      Array.from(this.fid),
      this.network
    );

    const builder = new Builder(1);
    builder.finish(messageData.pack(builder));

    return flatbuffers.MessageData.getRootAsMessageData(new ByteBuffer(builder.asUint8Array()));
  }
}

export default MessageBuilder;
