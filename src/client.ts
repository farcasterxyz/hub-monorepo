import * as FC from '~/types';
import { hashMessage, sign } from '~/utils';
import { Wallet, utils } from 'ethers';

class Client {
  public static instanceNames = ['alice', 'bob'];

  wallet: Wallet;
  signingKey: utils.SigningKey;
  username: string;

  constructor(username: string) {
    this.wallet = Wallet.createRandom();
    this.signingKey = new utils.SigningKey(this.wallet.privateKey);
    this.username = username;
  }

  get address(): string {
    return this.wallet.address;
  }

  makeRoot(ethBlockNum: number, ethblockHash: string): FC.Root {
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
      signer: this.wallet.address,
    };

    item.hash = hashMessage(item);
    item.signature = sign(item.hash, this.signingKey);

    return item;
  }

  makeCastShort(text: string, root: FC.Root): FC.CastShort {
    const schema = 'farcaster.xyz/schemas/v1/cast-short' as const;
    const signedAt = Date.now();
    const signer = this.wallet.address;

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

    item.hash = hashMessage(item);
    item.signature = sign(item.hash, this.signingKey);

    return item;
  }

  makeCastDelete(targetCast: FC.Cast, root: FC.Root): FC.CastDelete {
    const schema = 'farcaster.xyz/schemas/v1/cast-delete' as const;
    const signedAt = Date.now();
    const signer = this.wallet.address;

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

    item.hash = hashMessage(item);
    item.signature = sign(item.hash, this.signingKey);

    return item;
  }

  makeReaction(targetCast: FC.CastShort, root: FC.Root, active = true): FC.Reaction {
    const schema = 'farcaster.xyz/schemas/v1/reaction' as const;
    const signedAt = Date.now();
    const signer = this.wallet.address;

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

    item.hash = hashMessage(item);
    item.signature = sign(item.hash, this.signingKey);

    return item;
  }
}

export default Client;
