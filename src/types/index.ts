import { ethers } from 'ethers';

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
export type Data<T = Body> = {
  body: T;
  rootBlock: number;
  signedAt: number;
  username: string;
};

export type Body =
  | RootBody
  | CastBody
  | ReactionBody
  | VerificationAddBody
  | VerificationRemoveBody
  | SignerAddBody
  | SignerRemoveBody;

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

//  ===========================
//  Verification Types
//  ===========================

export type Verification = VerificationAdd | VerificationRemove;

/** VerificationAdd message */
export type VerificationAdd = Message<VerificationAddBody>;

/**
 * A VerificationAddBody represents a signed claim between a Farcaster account and an external key pair (i.e. an Ethereum key pair).
 *
 * @externalAddressUri - the Ethereum address that is part of the verification claim.
 * @claimHash - the hash of the verification claim.
 * @externalSignature - the signature of the hash of the verification claim, signed by the external key pair.
 * @externalSignatureType - type of signature from set of supported types (see version 0x45 of https://eips.ethereum.org/EIPS/eip-191 for 'eip-191-0x45')
 * @schema -
 */
export type VerificationAddBody = {
  externalAddressUri: URI;
  claimHash: string;
  externalSignature: string;
  externalSignatureType: 'eip-191-0x45';
  schema: 'farcaster.xyz/schemas/v1/verification-add';
};

/**
 * A VerificationAddFactoryTransientParams is passed to the VerificationAdd factory
 *
 * @privateKey - the private key for signing the Verification message
 * @ethWallet - the wallet to generate and/or sign the claimHash
 */
export type VerificationAddFactoryTransientParams = {
  privateKey?: Uint8Array;
  ethWallet?: ethers.Wallet;
};

/**
 * A VerificationClaim is an object that includes both the farcaster account and external address
 *
 * @username - the farcaster username
 * @externalAddressUri - URI of the external address (i.e. Ethereum address)
 */
export type VerificationClaim = {
  username: string; // TODO: make this account rather than username when we migrate the rest of the codebase to that
  externalAddressUri: URI; // TODO: constrain this farther
};

/** VerificationRemove message */
export type VerificationRemove = Message<VerificationRemoveBody>;

/**
 * A VerificationRemoveBody represents the deletion of a verification
 *
 * @claimHash - hash of the verification claim
 * @schema -
 */
export type VerificationRemoveBody = {
  claimHash: string;
  schema: 'farcaster.xyz/schemas/v1/verification-remove';
};

/**
 * A VerificationRemoveFactoryTransientParams is passed to the VerificationRemove factory
 *
 * @privateKey - the private key for signing the Verification message
 * @externalAddressUri - the external address to generate the claimHash
 */
export type VerificationRemoveFactoryTransientParams = {
  privateKey?: Uint8Array;
  externalAddressUri?: string;
};

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

export type URI = FarcasterURI | ChainURI | HTTPURI;

/**
 * A FarcasterURI points to any Farcaster message and is structured as farcaster://<user>/<type>:<id>
 * e.g. A Cast from Alice becomes farcaster://alice/cast-new:0x4eCCe9ba252fC2a05F2A7B0a55943C756eCDA6b9
 */
export type FarcasterURI = string;

/**
 * A Chain URI points to on-chain assets using the CAIP-20 standard with a `chain://` prefix.
 * e.g. An NFT becomes chain://eip155:1/erc721:0xaba7161a7fb69c88e16ed9f455ce62b791ee4d03/7894
 */
export type ChainURI = string;

export type HTTPURI = string;

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
