import * as FC from '~/types';
import { hashMessage, sign, convertToHex } from '~/utils';
import * as ed from '@noble/ed25519';

class Client {
  public instanceNames: string[];

  publicKey: Uint8Array;
  privateKey: Uint8Array;
  username: string;

  constructor(username: string, privateKey: Uint8Array, publicKey: Uint8Array, instanceNames: string[]) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.username = username;
    this.instanceNames = instanceNames;
  }

  get address(): Promise<string> {
    return (async () => {
      return await convertToHex(this.publicKey);
    })();
  }

  async makeRoot(ethBlockNum: number, ethblockHash: string): Promise<FC.Root> {
    const item = {
      data: {
        body: {
          blockHash: ethblockHash,
          schema: 'farcaster.xyz/schemas/v1/root' as const,
        },
        rootBlock: ethBlockNum,
        signedAt: Date.now(),
        username: this.username,
      },
      hash: '',
      signature: '',
      signer: await convertToHex(this.publicKey),
    };

    item.hash = await hashMessage(item);
    item.signature = await sign(item.hash, this.privateKey);

    return item;
  }

  async makeCastShort(text: string, root: FC.Root): Promise<FC.CastShort> {
    const schema = 'farcaster.xyz/schemas/v1/cast-short' as const;
    const signedAt = Date.now();
    const signer = await convertToHex(this.publicKey);

    const rootBlock = root.data.rootBlock;

    const embed = { items: [] };

    const item = {
      data: {
        body: {
          embed,
          text: text,
          schema,
        },
        rootBlock,
        signedAt,
        username: this.username,
      },
      hash: '',
      signature: '',
      signer,
    };

    item.hash = await hashMessage(item);
    item.signature = await sign(item.hash, this.privateKey);
    return item;
  }

  async makeCastDelete(targetCast: FC.Cast, root: FC.Root): Promise<FC.CastDelete> {
    const schema = 'farcaster.xyz/schemas/v1/cast-delete' as const;
    const signedAt = Date.now();
    const signer = await convertToHex(this.publicKey);

    const rootBlock = root.data.rootBlock;

    const item = {
      data: {
        body: {
          targetHash: targetCast.hash,
          schema,
        },
        rootBlock,
        signedAt,
        username: this.username,
      },
      hash: '',
      signature: '',
      signer,
    };

    item.hash = await hashMessage(item);
    item.signature = await sign(item.hash, this.privateKey);

    return item;
  }

  async makeReaction(targetCast: FC.CastShort, root: FC.Root, active = true): Promise<FC.Reaction> {
    const schema = 'farcaster.xyz/schemas/v1/reaction' as const;
    const signedAt = Date.now();
    const signer = await convertToHex(this.publicKey);

    const rootBlock = root.data.rootBlock;

    const item = {
      data: {
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
      },
      hash: '',
      signature: '',
      signer,
    };

    item.hash = await hashMessage(item);
    item.signature = await sign(item.hash, this.privateKey);

    return item;
  }
}

export default Client;
