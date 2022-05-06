import { Root, RootMessageBody, Message, CastShortMessageBody, CastDeleteMessageBody, Cast } from '~/types';
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

  makeRoot(ethBlockNum: number, ethblockHash: string): Message<RootMessageBody> {
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

  makeCastShort(text: string, root: Root): Message<CastShortMessageBody> {
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

  makeCastDelete(targetCast: Cast, root: Root): Message<CastDeleteMessageBody> {
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
}

export default Client;
