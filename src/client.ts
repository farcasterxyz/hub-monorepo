import * as FC from '~/types';
import { hashMessage, signEd25519, convertToHex, hashFCObject } from '~/utils';

class Client {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  username: string;

  constructor(username: string, privateKey: Uint8Array, publicKey: Uint8Array) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.username = username;
  }

  get address(): Promise<string> {
    return (async () => {
      return await convertToHex(this.publicKey);
    })();
  }

  async makeMessage(data: FC.Data): Promise<FC.Message> {
    const message = {
      data,
      hash: '',
      signature: '',
      signer: await convertToHex(this.publicKey),
    };
    message.hash = await hashMessage(message);
    message.signature = await signEd25519(message.hash, this.privateKey);
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

  async makeCastDelete(targetCast: FC.Cast, root: FC.Root): Promise<FC.CastDelete> {
    const schema = 'farcaster.xyz/schemas/v1/cast-delete' as const;
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

    return message as FC.CastDelete;
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

  async makeVerificationClaimHash(externalAddressUri: FC.URI): Promise<string> {
    return await hashFCObject({
      username: this.username,
      externalAddressUri,
    });
  }

  async makeVerificationAdd(
    externalAddressUri: FC.URI,
    claimHash: string,
    externalSignature: string,
    root: FC.Root
  ): Promise<FC.VerificationAdd> {
    const message = await this.makeMessage({
      body: {
        schema: 'farcaster.xyz/schemas/v1/verification-add',
        externalAddressUri,
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
