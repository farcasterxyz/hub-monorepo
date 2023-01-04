import * as flatbuffers from '@hub/flatbuffers';
import { Ed25519MessageSigner, EthersMessageSigner, IMessageSigner } from '../messageSigner';
import * as constructors from '../models/constructors';
import { SignerAddModel } from '../models/types';

type MessageBuilderOptions<TSigner extends IMessageSigner> = {
  /** integer representation of the message sender */
  fid: number;
  signer: TSigner;
  network?: flatbuffers.FarcasterNetwork;
};

abstract class BaseMessageBuilder<TSigner extends IMessageSigner> {
  protected fid: number;
  protected network: flatbuffers.FarcasterNetwork;
  protected signer: TSigner;

  constructor({ fid, signer, network = flatbuffers.FarcasterNetwork.Mainnet }: MessageBuilderOptions<TSigner>) {
    this.fid = fid;
    this.network = network;
    this.signer = signer;
  }

  protected get baseOptions() {
    return {
      fid: this.fid,
      network: this.network,
      signer: this.signer,
    };
  }
}

export class SignerMessageBuilder extends BaseMessageBuilder<EthersMessageSigner> {
  /**
   * Constructs a SignerAdd message.
   */
  public makeSignerAdd(options: constructors.SignerAddOptions): Promise<SignerAddModel> {
    return constructors.makeSignerAddModel({
      publicKey: options.publicKey,
      ...this.baseOptions,
    });
  }

  /**
   * Constructs a SignerRemove message.
   */
  public makeSignerRemove(options: constructors.SignerRemoveOptions): Promise<SignerAddModel> {
    return constructors.makeSignerRemoveModel({
      publicKey: options.publicKey,
      ...this.baseOptions,
    });
  }
}

export class MessageBuilder extends BaseMessageBuilder<Ed25519MessageSigner> {}
