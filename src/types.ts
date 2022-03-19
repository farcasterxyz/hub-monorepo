/**
 * The first message in every Signed Chain.
 *
 * TODO: choose a good name for this because it is not an easy concept to grok
 * suggestions include Life, Genesis, Origin, ChainStart, Root, Head
 */
export type RootMessageBody = {
  type: 'root';
  blockHash: string;
  prevRootBlockHash: string;
  stitchHash: string | undefined;
};

export function isRoot(msg: SignedMessage): msg is SignedMessage<RootMessageBody> {
  const body = (msg as SignedMessage<RootMessageBody>).message.body;
  return body.type === 'root' && !!body.blockHash && !!body.prevRootBlockHash;
}

type CastMessageBody = CastAddMessageBody | CastDeleteMessageBody;

export function isCast(msg: SignedMessage): msg is SignedMessage<CastMessageBody> {
  return isCastAdd(msg) || isCastDelete(msg);
}

/**
 * A message that represents a public broadcast from a user.
 *
 * TODO: how would you support other cast types like long-form text?
 */
export type CastAddMessageBody = {
  replyTo?: string;
  text: string;
  type: 'cast-add';
};

function isCastAdd(msg: SignedMessage): msg is SignedMessage<CastAddMessageBody> {
  const body = (msg as SignedMessage<CastAddMessageBody>).message.body;
  return body.type === 'cast-add' && !!body.text;
}

/** A message that removes a previous broadcast from a user. */
export type CastDeleteMessageBody = {
  targetCastHash: string;
  type: 'cast-delete';
};

function isCastDelete(msg: SignedMessage): msg is SignedMessage<CastDeleteMessageBody> {
  const body = (msg as SignedMessage<CastDeleteMessageBody>).message.body;
  return body.type === 'cast-delete' && !!body.targetCastHash;
}

type MessageBody = RootMessageBody | CastMessageBody;

// TODO: SignedMessage having a message component is confusing for variable naming.
export type SignedMessage<T = MessageBody> = {
  message: {
    body: T;
    prevHash: string;
    rootBlock: number;
    // TODO: research whether this is more akin to a version vector.
    sequence: number;
    signedAt: number;
    username: string;
  };
  hash: string;
  // TODO: If this is not checked, should this be allowed to cause a failure when transmitted?
  schema: string;
  signature: string;
  // TODO: consider tradeoffs between exposing the public key and the address.
  signer: string;
};

/** An ordered array of hash-linked and signed messages, starting with a root message */
export type SignedCastChain = [root: SignedMessage<RootMessageBody>, ...casts: SignedMessage<CastMessageBody>[]];

/** An ordered array of hash-linked and signed messages */
export type SignedCastChainFragment = SignedMessage<CastAddMessageBody | CastDeleteMessageBody>[];

export type Cast = SignedMessage<CastAddMessageBody | CastDeleteMessageBody>;
export type Root = SignedMessage<RootMessageBody>;
