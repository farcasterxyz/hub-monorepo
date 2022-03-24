import { Cast, CastNewMessageBody, Root, RootMessageBody, SignedMessage } from '~/types';
import { hashMessage, sign } from '~/utils';
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

  generateRoot(ethBlockNum: number, ethblockHash: string, prevRootBlockHash?: string): SignedMessage<RootMessageBody> {
    const item = {
      message: {
        body: {
          blockHash: ethblockHash,
          chainType: 'cast' as const,
          prevRootBlockHash: prevRootBlockHash || '0x0', // TODO: change
          prevRootLastHash: '0x0', // TODO: change, how are null props serialized.s
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

    const item = {
      message: {
        body: {
          _attachments: { items: [] },
          _text: text,
          attachmentsHash: '0x0', // TODO - calculate this
          textHash: '0x0', // TODO: calculate this as a hash of the text
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
