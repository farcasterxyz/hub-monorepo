use crate::protos::{reaction_body::Target, CastId};

use super::store::HubError;

const TS_HASH_LENGTH: usize = 24;
const HASH_LENGTH: usize = 20;

pub enum RootPrefix {
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

    /* Used to index fname username proofs by fid */
    // FNameUserNameProofByFid = 25,

    /* Used to index verifications by address */
    // VerificationByAddress = 25,

    /* Store the connected peers */
    ConnectedPeers = 26,
}

pub enum UserPostfix {
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

pub fn make_ts_hash(timestamp: u32, hash: Vec<u8>) -> Result<[u8; TS_HASH_LENGTH], HubError> {
    // No need to check if timestamp > 2^32 because it's already a u32

    let mut ts_hash = [0u8; 24];
    // Store the timestamp as big-endian in the first 4 bytes
    ts_hash[0..4].copy_from_slice(&timestamp.to_be_bytes());
    // Store the hash in the remaining 20 bytes
    ts_hash[4..24].copy_from_slice(&hash[0..HASH_LENGTH]);

    Ok(ts_hash)
}

pub fn unpack_ts_hash(ts_hash: &[u8; TS_HASH_LENGTH]) -> (u32, [u8; HASH_LENGTH]) {
    let mut timestamp_bytes = [0u8; 4];
    timestamp_bytes.copy_from_slice(&ts_hash[0..4]);
    let timestamp = u32::from_be_bytes(timestamp_bytes);

    let mut hash = [0u8; HASH_LENGTH];
    hash.copy_from_slice(&ts_hash[4..24]);

    (timestamp, hash)
}

pub fn make_fid_key(fid: u32) -> Vec<u8> {
    fid.to_be_bytes().to_vec()
}

pub fn make_user_key(fid: u32) -> Vec<u8> {
    let mut key = Vec::with_capacity(1 + 4);
    key.push(RootPrefix::User as u8);

    key.extend_from_slice(&make_fid_key(fid));

    key
}

pub fn make_cast_id_key(cast_id: CastId) -> Vec<u8> {
    let mut key = Vec::with_capacity(4 + HASH_LENGTH);
    key.extend_from_slice(&make_fid_key(cast_id.fid as u32));
    key.extend_from_slice(&cast_id.hash);

    key
}
