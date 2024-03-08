/** Used when index keys are sufficiently descriptive */
export const TRUE_VALUE = Buffer.from([1]);

/**
 * Size in bytes of a Farcaster ID. Even though it's technically 64 bit, we use 32-bit keys in the DB
 * to save 4 bytes per key. This is fine until 4 billion users, after which we'll need to do a migration
 */
export const FID_BYTES = 4;

/**
 * The size of the hash
 */
export const HASH_LENGTH = 20; // Used to represent a 160-bit BLAKE3 hash

/**
 * Size of the TS_HASH which is 4 byte timestamp + 20 byte hash
 */
export const TSHASH_LENGTH = 4 + HASH_LENGTH;

/**
 * RootPrefix indicates the purpose of the key. It is the 1st byte of every key.
 */
export enum RootPrefix {
  /* Used for multiple purposes, starts with a 4-byte fid */
  User = 1,
  /* Used to index casts by parent */
  CastsByParent = 2,
  /* Used to index casts by mention */
  CastsByMention = 3,
  /* Used to index links by target */
  LinksByTarget = 4,
  /* Used to index reactions by target  */
  ReactionsByTarget = 5,
  /* Deprecated */
  // IdRegistryEvent = 6,
  // NameRegistryEvent = 7,
  // IdRegistryEventByCustodyAddress = 8,
  /* Used to store the state of the hub */
  HubState = 9,
  /* Revoke signer jobs */
  JobRevokeMessageBySigner = 10,
  /* Sync Merkle Trie Node */
  SyncMerkleTrieNode = 11,
  /* Deprecated */
  // JobUpdateNameExpiry = 12,
  // NameRegistryEventsByExpiry = 13,
  /* To check if the Hub was cleanly shutdown */
  HubCleanShutdown = 14,
  /* Event log */
  HubEvents = 15,
  /* The network ID that the rocksDB was created with */
  Network = 16,
  /* Used to store fname server name proofs */
  FNameUserNameProof = 17,
  /* Used to store gossip network metrics */
  // Deprecated, DO NOT USE
  // GossipMetrics = 18,

  /* Used to index user submited username proofs */
  UserNameProofByName = 19,

  // Deprecated
  // RentRegistryEvent = 20,
  // RentRegistryEventsByExpiry = 21,
  // StorageAdminRegistryEvent = 22,

  /* Used to store on chain events */
  OnChainEvent = 23,

  /** DB Schema version */
  DBSchemaVersion = 24,

  /* Used to index verifications by address */
  VerificationByAddress = 25,

  /* Store the connected peers */
  ConnectedPeers = 26,

  /* Used to index fname username proofs by fid */
  FNameUserNameProofByFid = 27,
}

/**
 * UserPostfix indicates the purpose of the key when the RootPrefix is User. It is the 34th byte of
 * every RocksDB key with RootPrefix User.
 *
 * Within a user key, we want to group all records that contain a message, so we reserve the first 85
 * UserPostfix values for messages and the remaining 170 values for indices. This grouping makes it possible
 * to filter for all messages inside an fid.
 */
export enum UserPostfix {
  /* Message records (1-85) */

  CastMessage = 1,
  LinkMessage = 2,
  ReactionMessage = 3,
  VerificationMessage = 4,
  // Deprecated
  // SignerMessage = 5,
  UserDataMessage = 6,
  UsernameProofMessage = 7,

  // Add new message types here
  // NOTE: If you add a new message type, make sure that it is only used to store Message protobufs.
  // If you need to store an index, use one of the UserPostfix values below (>86).

  /** Index records (must be 86-255) */

  BySigner = 86, // Index message by its signer

  /** CastStore add and remove sets */
  CastAdds = 87,
  CastRemoves = 88,

  /* LinkStore add and remove sets */
  LinkAdds = 89,
  LinkRemoves = 90,

  /** ReactionStore add and remove sets */
  ReactionAdds = 91,
  ReactionRemoves = 92,

  /** Verification add and remove sets */
  VerificationAdds = 93,
  VerificationRemoves = 94,

  /* Deprecated */
  // SignerAdds = 95,
  // SignerRemoves = 96,

  /* UserDataStore add set */
  UserDataAdds = 97,

  /* UserNameProof add set */
  UserNameProofAdds = 99,
}

export enum OnChainEventPostfix {
  OnChainEvents = 1,

  // Secondary indexes
  SignerByFid = 51,
  IdRegisterByFid = 52,
  IdRegisterByCustodyAddress = 53,
}

/**
 * Export the max (inclusive) message UserPostfix so that we can query all messages for an fid
 */
export const UserMessagePostfixMax = 85;

/** A union type of UserPostfixes that are used to store messages */
export type UserMessagePostfix =
  | UserPostfix.CastMessage
  | UserPostfix.LinkMessage
  | UserPostfix.VerificationMessage
  | UserPostfix.ReactionMessage
  | UserPostfix.UserDataMessage
  | UserPostfix.UsernameProofMessage;
