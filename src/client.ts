import { Cast, CastNewMessageBody, Root, RootMessageBody, SignedMessage } from '~/types';
import { hashFCObject, hashMessage, hashString, sign } from '~/utils';
import { Wallet, utils } from 'ethers';

class Client {
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

  generateRoot(ethBlockNum: number, ethblockHash: string, prevRootBlockHash?: string): SignedMessage<RootMessageBody> {
    const item = {
      message: {
        body: {
          blockHash: ethblockHash,
          chainType: 'cast' as const,
          prevRootBlockHash: prevRootBlockHash || '0x0',
          prevRootLastHash: '0x0',
          schema: 'farcaster.xyz/schemas/v1/root' as const,
        },
        index: 0,
        prevHash: '0x0',
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

  generateCast(text: string, prevCast: Cast | Root): SignedMessage<CastNewMessageBody> {
    const schema = 'farcaster.xyz/schemas/v1/cast-new' as const;
    const signedAt = Date.now();
    const signer = this.wallet.address;

    // Reference the hash, index and rootBlock of the previous message.
    const rootBlock = prevCast.message.rootBlock;
    const index = prevCast.message.index + 1;
    const prevHash = prevCast.hash;

    const _attachments = { items: [] };

    const item = {
      message: {
        body: {
          _attachments,
          _text: text,
          attachmentsHash: hashFCObject(_attachments),
          textHash: hashString(text),
          schema,
        },
        index,
        prevHash,
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
