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
          type: 'root' as const,
          blockHash: ethblockHash,
          prevRootBlockHash: prevRootBlockHash || '0x0', // TODO: change
          prevRootLastHash: '0x0', // TODO: change, how are null props serialized.s
        },
        prevHash: '0x0',
        rootBlock: ethBlockNum,
        sequence: 0,
        signedAt: Date.now(),
        username: this.username,
      },
      hash: '',
      schema: '',
      signature: '',
      signer: this.wallet.address,
    };

    item.hash = hashMessage(item);
    item.signature = sign(item.hash, this.signingKey);

    return item;
  }

  generateCast(text: string, prevCast: Cast | Root): SignedMessage<CastNewMessageBody> {
    const type = 'cast-new' as const;
    const signedAt = Date.now();
    const signer = this.wallet.address;

    // Reference the hash, sequence and rootBlock of the previous message.
    const rootBlock = prevCast.message.rootBlock;
    const sequence = prevCast.message.sequence + 1;
    const prevHash = prevCast.hash;

    const item = {
      message: {
        body: {
          _attachments: [],
          _text: text,
          attachmentsHash: '0x0', // TODO - calculate this
          textHash: '0x0', // TODO: calculate this as a hash of the text
          type,
        },
        prevHash,
        rootBlock,
        sequence,
        signedAt,
        username: this.username,
      },
      hash: '',
      schema: '',
      signature: '',
      signer,
    };

    item.hash = hashMessage(item);
    item.signature = sign(item.hash, this.signingKey);

    return item;
  }
}

export default Client;
