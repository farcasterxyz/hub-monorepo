import * as FC from '~/types';
import { hashMessage, signEd25519, hashFCObject } from '~/utils';

class Client {
  signer: FC.MessageSigner;
  username: string;

  constructor(username: string, signer: FC.MessageSigner) {
    this.username = username;
    this.signer = signer;
  }

  get address() {
    return this.signer.signerKey;
  }

  async makeCastShort(text: string): Promise<FC.CastShort> {
    const schema = 'farcaster.xyz/schemas/v1/cast-short' as const;
    const signedAt = Date.now();

    const embed = { items: [] };

    const messageData = {
      body: {
        embed,
        text,
        schema,
      },
      signedAt,
      username: this.username,
    };

    const message = await this.makeMessage(messageData);
    return message as FC.CastShort;
  }

  async makeCastRemove(targetCast: FC.Cast): Promise<FC.CastRemove> {
    const schema = 'farcaster.xyz/schemas/v1/cast-remove' as const;
    const signedAt = Date.now();

    const messageData = {
      body: {
        targetHash: targetCast.hash,
        schema,
      },
      signedAt,
      username: this.username,
    };
    const message = await this.makeMessage(messageData);

    return message as FC.CastRemove;
  }

  async makeReaction(targetCast: FC.CastShort, active = true): Promise<FC.Reaction> {
    const schema = 'farcaster.xyz/schemas/v1/reaction' as const;
    const signedAt = Date.now();

    const messageData = {
      body: {
        active,
        // TODO: When we implement URI generation, this should be generated from the cast
        targetUri: targetCast.hash,
        type: 'like' as const,
        schema,
      },
      signedAt,
      username: this.username,
    };
    const message = await this.makeMessage(messageData);
    return message as FC.Reaction;
  }

  async makeVerificationClaimHash(externalUri: FC.URI): Promise<string> {
    return await hashFCObject({
      username: this.username,
      externalUri,
    });
  }

  async makeVerificationAdd(
    externalUri: FC.URI,
    claimHash: string,
    externalSignature: string
  ): Promise<FC.VerificationAdd> {
    const message = await this.makeMessage({
      body: {
        schema: 'farcaster.xyz/schemas/v1/verification-add',
        externalUri,
        externalSignature,
        externalSignatureType: 'eip-191-0x45',
        claimHash,
      },
      signedAt: Date.now(),
      username: this.username,
    });
    return message as FC.VerificationAdd;
  }

  async makeVerificationRemove(claimHash: string): Promise<FC.VerificationRemove> {
    const message = await this.makeMessage({
      body: {
        schema: 'farcaster.xyz/schemas/v1/verification-remove',
        claimHash,
      },
      signedAt: Date.now(),
      username: this.username,
    });
    return message as FC.VerificationRemove;
  }

  async makeSignerAdd(childKey: string, edgeHash: string, childSignature: string): Promise<FC.SignerAdd> {
    const message = await this.makeMessage({
      body: {
        childKey,
        edgeHash,
        childSignature,
        childSignatureType: FC.SignatureAlgorithm.Ed25519,
        schema: 'farcaster.xyz/schemas/v1/signer-add',
      },
      signedAt: Date.now(),
      username: this.username,
    });
    return message as FC.SignerAdd;
  }

  async makeSignerEdgeHash(parentKey: string, childKey: string): Promise<string> {
    const signerEdge: FC.SignerEdge = {
      childKey,
      parentKey,
    };
    return await hashFCObject(signerEdge);
  }

  async makeSignerRemove(childKey: string): Promise<FC.SignerRemove> {
    const message = await this.makeMessage({
      body: {
        childKey,
        schema: 'farcaster.xyz/schemas/v1/signer-remove',
      },
      signedAt: Date.now(),
      username: this.username,
    });
    return message as FC.SignerRemove;
  }

  private async makeMessage(data: FC.Data): Promise<FC.Message> {
    const message = {
      data,
      hash: '',
      hashType: FC.HashAlgorithm.Blake2b,
      signature: '',
      signatureType: this.signer.type,
      signer: this.signer.signerKey,
    };
    message.hash = await hashMessage(message);
    if (this.signer.type === FC.SignatureAlgorithm.EthereumPersonalSign) {
      message.signature = await this.signer.wallet.signMessage(message.hash);
    } else if (this.signer.type === FC.SignatureAlgorithm.Ed25519) {
      message.signature = await signEd25519(message.hash, this.signer.privateKey);
    }
    return message;
  }
}

export default Client;
