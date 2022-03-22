/**
 * A SignedMessage is generic that represents any cryptographically signed Message on Farcaster
 *
 * @message - the message that is being signed.
 * @hash - the keccak256 hash of the message.
 * @schema - the schema of the message.
 * @signature - the ecdsa signature of the hash of the message.
 * @signer - the ethereum address whose private key was used to create the signature
 */
export type SignedMessage<T = MessageBody> = {
  hash: string;
  message: Message<T>;
  schema: string; // TODO: should the schema be validated by nodes?
  signature: string;
  signer: string;
};

/**
 * A Message is generic that represents any unsigned Message on Farcaster.
 *
 * @body - the body of the message, implemented by the specific interface.
 * @prevHash - the hash of the previous message
 * @rootBlock - the block number of the Ethereum block in the root message.
 * @sequence - the sequence number of the message
 * @signedAt - the unix timestamp of when the message was signed
 * @username - the Farcaster username of the user that signed the message.
 */
type Message<T = MessageBody> = {
  body: T;
  prevHash: string;
  rootBlock: number;
  // TODO: research whether this is more akin to a version vector.
  sequence: number;
  signedAt: number;
  username: string;
};

type MessageBody = RootMessageBody | CastMessageBody | CastRecastMessageBody | ReactionMesageBody | FollowMessageBody;

// ===========================
//  Root Types
// ===========================

/** A Root is first message in every Signed Chain */
export type Root = SignedMessage<RootMessageBody>;

/**
 * A Message is generic that represents any unsigned Message on Farcaster.
 *
 * @blockHash - the hash of the ETH block from message.rootBlock
 * @prevRootBlockHash - the hash of the ETH block from the previous root message (or 0x0 if none)
 * @prevRootLastHash - the hash of the last message to include from the previous SignedChain (or 0x0 to include all)
 */
export type RootMessageBody = {
  type: 'root';
  blockHash: string;
  prevRootBlockHash: string;
  prevRootLastHash: string;
};

// ===========================
//  Cast Types
// ===========================

/** A Cast Message */
export type Cast = SignedMessage<CastMessageBody>;

export type CastMessageBody = CastAddMessageBody | CastDeleteMessageBody | CastRecastMessageBody;

/** A message body that represents a public broadcast from a user. */
export type CastAddMessageBody = {
  replyTo?: string;
  text: string;
  type: 'cast-add';
};

/** A message body that removes a previous broadcast from a user. */
export type CastDeleteMessageBody = {
  targetCastHash: string;
  type: 'cast-delete';
};

/** A message body that re-posts another cast in the current feed. */
export type CastRecastMessageBody = {
  targetUri: string;
  type: 'cast-recast';
};

/** An ordered array of hash-linked and signed Casts starting with a root message */
export type SignedCastChain = [root: SignedMessage<RootMessageBody>, ...casts: SignedMessage<CastMessageBody>[]];

/** An ordered array of hash-linked and signed Casts */
export type SignedCastChainFragment = SignedMessage<CastMessageBody>[];

//  ===========================
//  Reaction Types
//  ===========================

/** A Reaction Message */
export type Reaction = SignedMessage<ReactionMesageBody>;

/**
 * A message that represents a reaction to an entity
 *
 * @active - whether the reaction is active or not.
 * @emoji - the unicode character that represents the reaction.
 * @targetUri - a unique identifier to the entity being reacted to. (only FC Cast and NFT supported for now)
 * @type - 'reaction'
 */
export type ReactionMesageBody = {
  active: boolean;
  emoji: string;
  targetUri: string;
  type: 'reaction';
};

/** An ordered array of hash-linked and signed Reactions starting with a Root */
export type SignedReactionChain = [root: SignedMessage<RootMessageBody>, ...casts: SignedMessage<ReactionMesageBody>[]];

/** An ordered array of hash-linked and signed Reactions */
export type SignedReactionChainFragment = SignedMessage<ReactionMesageBody>[];

//  ===========================
//  Follow Types
//  ===========================

/** A Follow Message */
export type Follow = SignedMessage<FollowMessageBody>;

/**
 * A message that represents a follow of another entity
 *
 * @active - whether the reaction is active or not.
 * @targetUri - a unique identifier to the entity being followed (only FC user supported for now)
 * @type - 'reaction'
 */
export type FollowMessageBody = {
  active: boolean;
  targetUri: string;
  type: 'follow';
};

/** An ordered array of hash-linked and signed Follows starting with a Root */
export type SignedFollowChain = [root: SignedMessage<RootMessageBody>, ...casts: SignedMessage<FollowMessageBody>[]];

/** An ordered array of hash-linked and signed Follows */
export type SignedFollowChainFragment = SignedMessage<FollowMessageBody>[];
