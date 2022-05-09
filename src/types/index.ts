/**
 * Message is a generic type that represents any cryptographically signed Message on Farcaster
 *
 * @data - the data that is being signed.
 * @hash - the keccak256 hash of the message.
 * @signature - the ecdsa signature of the hash of the message.
 * @signer - the ethereum address whose private key was used to create the signature
 */
export type Message<T = MessageBody> = {
  data: Data<T>;
  hash: string;
  signature: string;
  signer: string;
};

/**
 * Data is a generic type that holds the part of the message that is going to be signed.
 *
 * @body - the body of the message which is implemented by the specific type
 * @rootBlock - the block number of the ethereum block in the root
 * @signedAt - the unix timestamp at which the message was signed
 * @username - the farcaster username owned by the signer at the time of signature
 */
type Data<T = MessageBody> = {
  body: T;
  rootBlock: number;
  signedAt: number;
  username: string;
};

type MessageBody = RootMessageBody | CastMessageBody | CastRecastMessageBody | ReactionMessageBody | FollowMessageBody;

// ===========================
//  Root Types
// ===========================

/** A Root Message */
export type Root = Message<RootMessageBody>;

/**
 * A RootMessageBody is the first message in every signed chain, which must point to a unique, valid Ethereum block for ordering purposes.
 *
 * @blockHash - the hash of the ETH block from message.rootBlock
 */
export type RootMessageBody = {
  blockHash: string;
  schema: 'farcaster.xyz/schemas/v1/root';
};

// ===========================
//  Cast Types
// ===========================

/** A Cast Message */
export type Cast = Message<CastMessageBody>;
export type CastShort = Message<CastShortMessageBody>;
export type CastRecast = Message<CastRecastMessageBody>;
export type CastDelete = Message<CastDeleteMessageBody>;

export type CastMessageBody = CastShortMessageBody | CastDeleteMessageBody | CastRecastMessageBody;

/**
 * A CastShortMessageBody represents a new, short-text public broadcast from a user.
 *
 * @text - the text of the Cast
 * @embed -
 * @schema -
 * @targetUri - the object that this Cast is replying to.
 */
export type CastShortMessageBody = {
  embed: Embed;
  text: string;
  schema: 'farcaster.xyz/schemas/v1/cast-short';
  targetUri?: URI;
};

type Embed = {
  items: URI[];
};

/**
 * A CastDeleteMessageBody indicates that a previous Cast should be removed from the feed.
 *
 * @targetHash - the hash of the cast that is beign deleted.
 */
export type CastDeleteMessageBody = {
  // TODO: is there any benefit to making this a URI, like a recast?
  targetHash: string;
  schema: 'farcaster.xyz/schemas/v1/cast-delete';
};

/**
 * A CastRecastMessageBody indicates that a Cast should be re-displayed in the user's feed.
 *
 * @targetCastUri - the cast that is to be recast
 */
export type CastRecastMessageBody = {
  targetCastUri: FarcasterURI;
  schema: 'farcaster.xyz/schemas/v1/cast-recast';
};

//  ===========================
//  Reaction Types
//  ===========================

/** A Reaction Message */
export type Reaction = Message<ReactionMessageBody>;

/**
 * A ReactionMessageBody represents the addition or removal of a reaction on an Object.
 *
 * @active - whether the reaction is active or not.
 * @targetUri - the object that is being reacted to.
 * @type - the type of reaction.
 * @schema -
 */
export type ReactionMessageBody = {
  active: boolean;
  targetUri: URI;
  type: ReactionType;
  schema: 'farcaster.xyz/schemas/v1/reaction';
};

export type ReactionType = 'like';

/** An ordered array of hash-linked and signed Reactions starting with a Root */
export type SignedReactionChain = [root: Message<RootMessageBody>, ...casts: Message<ReactionMessageBody>[]];

/** An ordered array of hash-linked and signed Reactions */
export type SignedReactionChainFragment = Message<ReactionMessageBody>[];

//  ===========================
//  Follow Types
//  ===========================

/** A Follow Message */
export type Follow = Message<FollowMessageBody>;

/**
 * A FollowMessage represents the addition or removal of a follow on a username.
 *
 * @active - whether the reaction is active or not.
 * @targetUri - the user that is being followed. (e.g. farcaster://alice)
 * @schema -
 */
export type FollowMessageBody = {
  active: boolean;
  targetUri: FarcasterURI;
  schema: 'farcaster.xyz/schemas/v1/follow';
};

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
