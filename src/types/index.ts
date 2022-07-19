/**
 * Message is a generic type that represents any cryptographically signed Message on Farcaster
 *
 * @data - the data that is being signed.
 * @hash - the keccak256 hash of the message.
 * @signature - the ecdsa signature of the hash of the message.
 * @signer - the ethereum address whose private key was used to create the signature
 */
export type Message<T = Body> = {
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
 * @signedAt - the utc unix timestamp at which the message was signed
 * @username - the farcaster username owned by the signer at the time of signature
 */
type Data<T = Body> = {
  body: T;
  rootBlock: number;
  signedAt: number;
  username: string;
};

type Body = RootBody | CastBody | ReactionBody | SignerAddBody | SignerRemoveBody;

// ===========================
//  Root Types
// ===========================

/** A Root is the first message a user sends, which must point to a unique, valid Ethereum block for ordering purposes. */
export type Root = Message<RootBody>;

/**
 * Body of a Root Message
 *
 * @blockHash - the hash of the ETH block from message.rootBlock
 * @schema - the schema of the message
 */
export type RootBody = {
  blockHash: string;
  schema: 'farcaster.xyz/schemas/v1/root';
};

// ===========================
//  Cast Types
// ===========================

/** A Cast Message */
export type Cast = Message<CastBody>;

/**A CastShort is a short-text public cast from a user */
export type CastShort = Message<CastShortBody>;

/** A CastReact is a share of an existing cast-short from any user */
export type CastRecast = Message<CastRecastBody>;

/** A CastDelete is a delete of an existing cast from the same user */
export type CastDelete = Message<CastDeleteBody>;

export type CastBody = CastShortBody | CastDeleteBody | CastRecastBody;

/**
 * Body of a CastShort Message
 *
 * @text - the text of the Cast
 * @embed -
 * @schema -
 * @targetUri - the object that this Cast is replying to.
 */
export type CastShortBody = {
  embed: Embed;
  schema: 'farcaster.xyz/schemas/v1/cast-short';
  targetUri?: URI;
  text: string;
};

type Embed = {
  items: URI[];
};

/**
 * A CastDeleteBody indicates that a previous Cast should be removed from the feed.
 *
 * @targetHash - the hash of the cast that is beign deleted.
 */
export type CastDeleteBody = {
  // TODO: is there any benefit to making this a URI, like a recast?
  targetHash: string;
  schema: 'farcaster.xyz/schemas/v1/cast-delete';
};

/**
 * A CastRecastBody indicates that a Cast should be re-displayed in the user's feed.
 *
 * @targetCastUri - the cast that is to be recast
 */
export type CastRecastBody = {
  targetCastUri: FarcasterURI;
  schema: 'farcaster.xyz/schemas/v1/cast-recast';
};

//  ===========================
//  Reaction Types
//  ===========================

/** A Reaction Message */
export type Reaction = Message<ReactionBody>;

/**
 * A ReactionBody represents the addition or removal of a reaction on an Object.
 *
 * @active - whether the reaction is active or not.
 * @targetUri - the object that is being reacted to.
 * @type - the type of reaction.
 * @schema -
 */
export type ReactionBody = {
  active: boolean;
  schema: 'farcaster.xyz/schemas/v1/reaction';
  targetUri: URI;
  type: ReactionType;
};

export type ReactionType = 'like';

// ===========================
// Signer Types
// ===========================

export type SignerMessage = SignerAdd | SignerRemove;

export type SignerAdd = Message<SignerAddBody>;

export type SignerAddBody = {
  childKey: string;
  edgeHash: string;
  childSignature: string;
  childSignatureType: 'ed25519'; // TODO: support others
  schema: 'farcaster.xyz/schemas/v1/signer-add';
};

export type SignerEdge = {
  childKey: string;
  parentKey: string;
};

export type SignerRemove = Message<SignerRemoveBody>;

export type SignerRemoveBody = {
  childKey: string;
  schema: 'farcaster.xyz/schemas/v1/signer-remove';
};

// TODO: decide if I need this
export type EdgeMsg = {
  hash: string;
  parentPubkey: string;
  childPubkey: string;
  type: 'SignerAdd' | 'SignerRemove';
};

// TODO: use this more broadly
export enum SignatureAlgorithm {
  EcdsaSecp256k1 = 'ecdsa-secp256k1',
  Ed25519 = 'ed25519',
}

// TODO: use this more broadly
export enum HashAlgorithm {
  Keccak256 = 'keccak256',
  Blake2b = 'blake2b',
}

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
//  Misc Types
// ===========================

/**
 * A KeyPair that is used in the signing process
 * @privateKey - the private key of the user
 * @publicKey - the public key of the user
 */
export type KeyPair = {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
};
