import * as flatbuffers from '@hub/flatbuffers';
import { Ed25519Signer, Eip712Signer, Signer } from '@hub/utils';
import * as constructors from '../models/constructors';
import { SignerAddModel } from '../models/types';

type MessageBuilderOptions = {
  /** integer representation of the message sender */
  fid: number;
  privateKey: Uint8Array;
  network?: flatbuffers.FarcasterNetwork;
};

type AbstractMessageBuilderOptions<TSigner extends Signer> = {
  /** integer representation of the message sender */
  fid: number;
  signer: TSigner;
  network: flatbuffers.FarcasterNetwork | undefined;
};

abstract class AbstractMessageBuilder<TSigner extends Signer> {
  public readonly fid: number;
  public readonly network: flatbuffers.FarcasterNetwork;
  protected signer: TSigner;

  constructor({ fid, network = flatbuffers.FarcasterNetwork.Mainnet, signer }: AbstractMessageBuilderOptions<TSigner>) {
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

export class SignerMessageBuilder extends AbstractMessageBuilder<Eip712Signer> {
  constructor({ fid, network, privateKey }: MessageBuilderOptions) {
    const signer = new Eip712Signer(privateKey);
    super({ fid, network, signer });
  }

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

export class MessageBuilder extends AbstractMessageBuilder<Ed25519Signer> {}
