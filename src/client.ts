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

  async makeMessage(data: FC.Data): Promise<FC.Message> {
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

  async makeRoot(ethBlockNum: number, ethblockHash: string): Promise<FC.Root> {
    const message = await this.makeMessage({
      body: {
        blockHash: ethblockHash,
        schema: 'farcaster.xyz/schemas/v1/root',
      },
      rootBlock: ethBlockNum,
      signedAt: Date.now(),
      username: this.username,
    });
    return message as FC.Root;
  }

  async makeCastShort(text: string, root: FC.Root): Promise<FC.CastShort> {
    const schema = 'farcaster.xyz/schemas/v1/cast-short' as const;
    const signedAt = Date.now();

    const rootBlock = root.data.rootBlock;

    const embed = { items: [] };

    const messageData = {
      body: {
        embed,
        text,
        schema,
      },
      rootBlock,
      signedAt,
      username: this.username,
    };

    const message = await this.makeMessage(messageData);
    return message as FC.CastShort;
  }

  async makeCastRemove(targetCast: FC.Cast, root: FC.Root): Promise<FC.CastRemove> {
    const schema = 'farcaster.xyz/schemas/v1/cast-remove' as const;
    const signedAt = Date.now();

    const rootBlock = root.data.rootBlock;

    const messageData = {
      body: {
        targetHash: targetCast.hash,
        schema,
      },
      rootBlock,
      signedAt,
      username: this.username,
    };
    const message = await this.makeMessage(messageData);

    return message as FC.CastRemove;
  }

  async makeReaction(targetCast: FC.CastShort, root: FC.Root, active = true): Promise<FC.Reaction> {
    const schema = 'farcaster.xyz/schemas/v1/reaction' as const;
    const signedAt = Date.now();

    const rootBlock = root.data.rootBlock;

    const messageData = {
      body: {
        active,
        // TODO: When we implement URI generation, this should be generated from the cast
        targetUri: targetCast.hash,
        type: 'like' as const,
        schema,
      },
      rootBlock,
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
    externalSignature: string,
    root: FC.Root
  ): Promise<FC.VerificationAdd> {
    const message = await this.makeMessage({
      body: {
        schema: 'farcaster.xyz/schemas/v1/verification-add',
        externalUri,
        externalSignature,
        externalSignatureType: 'eip-191-0x45',
        claimHash,
      },
      rootBlock: root.data.rootBlock,
      signedAt: Date.now(),
      username: this.username,
    });
    return message as FC.VerificationAdd;
  }

  async makeVerificationRemove(verificationAdd: FC.VerificationAdd, root: FC.Root): Promise<FC.VerificationRemove> {
    const message = await this.makeMessage({
      body: {
        schema: 'farcaster.xyz/schemas/v1/verification-remove',
        claimHash: verificationAdd.data.body.claimHash,
      },
      rootBlock: root.data.rootBlock,
      signedAt: Date.now(),
      username: this.username,
    });
    return message as FC.VerificationRemove;
  }
}

export default Client;
