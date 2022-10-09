import * as FC from '~/types';
import { hashMessage, signEd25519, hashFCObject } from '~/utils/utils';

class Client {
  signer: FC.Ed25519Signer;
  fid: number;
  network: FC.FarcasterNetwork;

  constructor(fid: number, signer: FC.Ed25519Signer, network: FC.FarcasterNetwork) {
    this.fid = fid;
    this.signer = signer;
    this.network = network;
  }

  get address() {
    return this.signer.signerKey;
  }

  async makeCastShort(text: string): Promise<FC.CastShort> {
    const embed = { items: [] };
    const message = await this.makeMessage(FC.MessageType.CastShort, { embed, text });
    return message as FC.CastShort;
  }

  async makeCastRecast(targetCast: FC.CastShort): Promise<FC.CastRecast> {
    const message = await this.makeMessage(FC.MessageType.CastRecast, { targetCastUri: targetCast.hash });
    return message as FC.CastRecast;
  }

  async makeCastRemove(targetCast: FC.Cast): Promise<FC.CastRemove> {
    const message = await this.makeMessage(FC.MessageType.CastRemove, { targetHash: targetCast.hash });
    return message as FC.CastRemove;
  }

  async makeReactionAdd(targetCast: FC.CastShort): Promise<FC.ReactionAdd> {
    const message = await this.makeMessage(FC.MessageType.ReactionAdd, { targetUri: targetCast.hash, type: 'like' });
    return message as FC.ReactionAdd;
  }

  async makeReactionRemove(targetCast: FC.CastShort): Promise<FC.ReactionRemove> {
    const message = await this.makeMessage(FC.MessageType.ReactionAdd, { targetUri: targetCast.hash, type: 'like' });
    return message as FC.ReactionRemove;
  }

  async makeFollowAdd(targetUser: FC.URI): Promise<FC.FollowAdd> {
    const message = await this.makeMessage(FC.MessageType.FollowAdd, { targetUri: targetUser });
    return message as FC.FollowAdd;
  }

  async makeFollowRemove(targetUser: FC.URI): Promise<FC.FollowRemove> {
    const message = await this.makeMessage(FC.MessageType.FollowRemove, { targetUri: targetUser });
    return message as FC.FollowRemove;
  }

  async makeVerificationClaimHash(externalUri: FC.URI): Promise<string> {
    return await hashFCObject({
      fid: this.fid,
      externalUri,
    });
  }

  async makeVerificationEthereumAddress(
    externalUri: FC.URI,
    claimHash: string,
    blockHash: string,
    externalSignature: string
  ): Promise<FC.VerificationEthereumAddress> {
    const message = await this.makeMessage(FC.MessageType.VerificationEthereumAddress, {
      externalUri,
      externalSignature,
      externalSignatureType: FC.SignatureAlgorithm.EthereumPersonalSign,
      claimHash,
      blockHash,
    });
    return message as FC.VerificationEthereumAddress;
  }

  async makeVerificationRemove(claimHash: string): Promise<FC.VerificationRemove> {
    const message = await this.makeMessage(FC.MessageType.VerificationRemove, {
      claimHash,
    });
    return message as FC.VerificationRemove;
  }

  async makeSignerAdd(delegate: string): Promise<FC.SignerAdd> {
    const message = await this.makeMessage(FC.MessageType.SignerAdd, {
      delegate,
    });
    return message as FC.SignerAdd;
  }

  async makeSignerRemove(delegate: string): Promise<FC.SignerRemove> {
    const message = await this.makeMessage(FC.MessageType.SignerRemove, {
      delegate,
    });
    return message as FC.SignerRemove;
  }

  private async makeMessage(type: FC.MessageType, body: FC.Body): Promise<FC.Message> {
    const message = {
      data: {
        body,
        type,
        network: this.network,
        fid: this.fid,
        signedAt: Date.now(),
      },
      hash: '',
      hashType: FC.HashAlgorithm.Blake2b,
      signature: '',
      signatureType: FC.SignatureAlgorithm.Ed25519,
      signer: this.signer.signerKey,
    };
    message.hash = await hashMessage(message);
    message.signature = await signEd25519(message.hash, this.signer.privateKey);
    return message;
  }
}

export default Client;
