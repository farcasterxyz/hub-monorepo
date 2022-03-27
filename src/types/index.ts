/**
 * A SignedMessage is a generic type that represents any cryptographically signed Message on Farcaster
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
  signature: string;
  signer: string;
};

/**
 * A Message is a generic type that represents any unsigned Message on Farcaster.
 *
 * @body - the body of the message, implemented by the specific interface.
 * @prevHash - the hash of the previous message
 * @rootBlock - the block number of the Ethereum block in the root message.
 * @index - the index of the message in the SignedChain, which functions as a Lamport timestamp.
 * @signedAt - the unix timestamp of when the message was signed
 * @username - the Farcaster username of the user that signed the message.
 */
type Message<T = MessageBody> = {
  body: T;
  prevHash: string;
  rootBlock: number;
  index: number;
  signedAt: number;
  username: string;
};

type MessageBody = RootMessageBody | CastMessageBody | CastRecastMessageBody | ReactionMesageBody | FollowMessageBody;

// ===========================
//  URI Types
// ===========================

type URI = FarcasterURI | ChainURI | HTTPURI;

/**
 * A FarcasterURI points to any Farcaster message and is structured as farcaster://<user>/<type>:<id>
 * e.g. A Cast from Alice becomes farcaster://alice/cast-new:0x4eCCe9ba252fC2a05F2A7B0a55943C756eCDA6b9
 */
type FarcasterURI = string;

/**
 * A Chain URI points to on-chain assets using the CAIP-20 standard with a `chain://` prefix.
 * e.g. An NFT becomes chain://eip155:1/erc721:0xaba7161a7fb69c88e16ed9f455ce62b791ee4d03/7894
 */
type ChainURI = string;

type HTTPURI = string;

// ===========================
//  Root Types
// ===========================

/** A Root Message */
export type Root = SignedMessage<RootMessageBody>;

/**
 * A RootMessageBody is the first message in every signed chain, which must point to a unique, valid Ethereum block for ordering purposes.
 *
 * @blockHash - the hash of the ETH block from message.rootBlock
 * @prevRootBlockHash - the hash of the ETH block from the previous root message (or 0x0 if none)
 * @prevRootLastHash - the hash of the last message to include from the previous SignedChain (or 0x0 to include all)
 */
export type RootMessageBody = {
  blockHash: string;
  chainType: ChainType;
  prevRootBlockHash: string;
  prevRootLastHash: string;
  schema: 'farcaster.xyz/schemas/v1/root';
};

type ChainType = 'cast' | 'reaction' | 'follow';

// ===========================
//  Cast Types
// ===========================

/** A Cast Message */
export type Cast = SignedMessage<CastMessageBody>;
export type CastNew = SignedMessage<CastNewMessageBody>;
export type CastRecast = SignedMessage<CastRecastMessageBody>;
export type CastDelete = SignedMessage<CastDeleteMessageBody>;

export type CastMessageBody = CastNewMessageBody | CastDeleteMessageBody | CastRecastMessageBody;

/**
 * A CastNewMessageBody represents a new, short-text public broadcast from a user.
 *
 * @_text - the text of the Cast, the underscore prefix indicates that it is not hashed into the message.
 * @_embed - an array of up to 2 uris, the underscore prefix indicates that it is not hashed into the message.
 * @embedHash - calculated by joining embeds into a single string and hashing it with keccak256.
 * @targetUri - the object that this Cast is replying to.
 * @textHash - the keccak256 hash of the sText field which is hashed into the message.
 */
export type CastNewMessageBody = {
  _embed: Embed;
  _text: string;
  embedHash: string;
  schema: 'farcaster.xyz/schemas/v1/cast-new';
  targetUri?: URI;
  textHash: string;
};

type Embed = {
  items: URI[];
};

/**
 * A CastDeleteMessageBody indicates that a previous Cast should be removed from the feed.
 *
 * @targetCastUri - the CastNew that is being deleted.
 */
export type CastDeleteMessageBody = {
  targetCastUri: FarcasterURI;
  schema: 'farcaster.xyz/schemas/v1/cast-delete';
};

/**
 * A CastRecastMessageBody indicates that a Cast should be re-displayed in the user's feed.
 *
 * @targetCastUri - the CastNew that is being re-displayed.
 */
export type CastRecastMessageBody = {
  targetCastUri: FarcasterURI;
  schema: 'farcaster.xyz/schemas/v1/cast-recast';
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
 * A ReactionMessageBody represents the addition or removal of a reaction on an Object.
 *
 * @active - whether the reaction is active or not.
 * @emoji - the unicode character that represents the reaction.
 * @targetUri - the object that is being reacted to.
 * @type - 'reaction'
 */
export type ReactionMesageBody = {
  active: boolean;
  emoji: string;
  targetUri: URI;
  schema: 'farcaster.xyz/schemas/v1/reaction';
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
 * A FollowMessage represents the addition or removal of a follow on a username.
 *
 * @active - whether the reaction is active or not.
 * @targetUri - the user that is being followed. (e.g. farcaster://alice)
 */
export type FollowMessageBody = {
  active: boolean;
  targetUri: FarcasterURI;
  schema: 'farcaster.xyz/schemas/v1/follow';
};

/** An ordered array of hash-linked and signed Follows starting with a Root */
export type SignedFollowChain = [root: SignedMessage<RootMessageBody>, ...casts: SignedMessage<FollowMessageBody>[]];

/** An ordered array of hash-linked and signed Follows */
export type SignedFollowChainFragment = SignedMessage<FollowMessageBody>[];
