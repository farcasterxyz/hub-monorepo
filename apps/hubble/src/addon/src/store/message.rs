use prost::Message as _;

use crate::{
    db::{RocksDB, RocksDbTransactionBatch},
    protos::{CastId, Message as MessageProto, MessageData, MessageType},
};

use super::{store::HubError, PageOptions, PAGE_SIZE_MAX};

pub const FID_BYTES: usize = 4;

pub const TS_HASH_LENGTH: usize = 24;
pub const HASH_LENGTH: usize = 20;
pub const PRIMARY_KEY_LENGTH: usize = 1 + FID_BYTES + 1 + TS_HASH_LENGTH; // Root prefix + fid + set + ts_hash

pub const TRUE_VALUE: u8 = 1;

/** Copied from the JS code */
#[allow(dead_code)]
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

    /* Used to index user submitted username proofs */
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

/** Copied from the JS code */
#[repr(u8)]
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
    // Deprecated
    // BySigner = 86, // Index message by its signer

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

    /* Link Compact State set */
    LinkCompactStateMessage = 100,
}

impl UserPostfix {
    pub fn as_u8(self) -> u8 {
        self as u8
    }
}

/** A page of messages returned from various APIs */
pub struct MessagesPage {
    pub messages_bytes: Vec<Vec<u8>>,
    pub next_page_token: Option<Vec<u8>>,
}

pub trait IntoU8 {
    fn into_u8(self) -> u8;
}
impl IntoU8 for MessageType {
    fn into_u8(self) -> u8 {
        self as u8
    }
}

pub trait IntoI32 {
    fn into_i32(self) -> i32;
}

impl IntoI32 for MessageType {
    fn into_i32(self) -> i32 {
        self as i32
    }
}

/** Convert a specific message type (CastAdd / CastRemove) to a class of message (CastMessage) */
pub fn type_to_set_postfix(message_type: MessageType) -> UserPostfix {
    if message_type == MessageType::CastAdd || message_type == MessageType::CastRemove {
        return UserPostfix::CastMessage;
    }

    if message_type == MessageType::ReactionAdd || message_type == MessageType::ReactionRemove {
        return UserPostfix::ReactionMessage;
    }

    if message_type == MessageType::VerificationAddEthAddress
        || message_type == MessageType::VerificationRemove
    {
        return UserPostfix::VerificationMessage;
    }

    if message_type == MessageType::UserDataAdd {
        return UserPostfix::UserDataMessage;
    }

    if message_type == MessageType::LinkAdd || message_type == MessageType::LinkRemove {
        return UserPostfix::LinkMessage;
    }

    if message_type == MessageType::LinkCompactState {
        return UserPostfix::LinkCompactStateMessage;
    }

    if message_type == MessageType::UsernameProof {
        return UserPostfix::UsernameProofMessage;
    }

    panic!("invalid type");
}

pub fn make_ts_hash(timestamp: u32, hash: &Vec<u8>) -> Result<[u8; TS_HASH_LENGTH], HubError> {
    // No need to check if timestamp > 2^32 because it's already a u32

    if hash.len() != HASH_LENGTH {
        return Err(HubError {
            code: "internal_error".to_string(),
            message: "hash length is not 20".to_string(),
        });
    }

    let mut ts_hash = [0u8; 24];
    // Store the timestamp as big-endian in the first 4 bytes
    ts_hash[0..4].copy_from_slice(&timestamp.to_be_bytes());
    // Store the hash in the remaining 20 bytes
    ts_hash[4..24].copy_from_slice(&hash[0..HASH_LENGTH]);

    Ok(ts_hash)
}

#[allow(dead_code)]
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

pub fn read_fid_key(key: &[u8]) -> u32 {
    let mut fid_bytes = [0u8; 4];
    fid_bytes.copy_from_slice(&key[0..4]);
    u32::from_be_bytes(fid_bytes)
}

pub fn make_user_key(fid: u32) -> Vec<u8> {
    let mut key = Vec::with_capacity(1 + 4);
    key.push(RootPrefix::User as u8);

    key.extend_from_slice(&make_fid_key(fid));

    key
}

pub fn make_message_primary_key(
    fid: u32,
    set: u8,
    ts_hash: Option<&[u8; TS_HASH_LENGTH]>,
) -> Vec<u8> {
    let mut key = Vec::with_capacity(1 + FID_BYTES + 1 + TS_HASH_LENGTH);
    key.extend_from_slice(&make_user_key(fid));
    key.push(set);
    if ts_hash.is_some() {
        key.extend_from_slice(ts_hash.unwrap());
    }

    key
}

pub fn make_cast_id_key(cast_id: &CastId) -> Vec<u8> {
    let mut key = Vec::with_capacity(4 + HASH_LENGTH);
    key.extend_from_slice(&make_fid_key(cast_id.fid as u32));
    key.extend_from_slice(&cast_id.hash);

    key
}

pub fn get_message(
    db: &RocksDB,
    fid: u32,
    set: u8,
    ts_hash: &[u8; TS_HASH_LENGTH],
) -> Result<Option<MessageProto>, HubError> {
    let key = make_message_primary_key(fid, set, Some(ts_hash));
    // println!("get_message key: {:?}", key);

    match db.get(&key)? {
        Some(bytes) => match message_decode(bytes.as_slice()) {
            Ok(message) => Ok(Some(message)),
            Err(_) => Err(HubError {
                code: "db.internal_error".to_string(),
                message: "could not decode message".to_string(),
            }),
        },
        None => Ok(None),
    }
}

/** Read many messages.
 * Note that if a message is not found, that corresponding entry in the result will be None.
 * This is different from the behaviour of get_message, which returns an error.
 */
pub fn get_many_messages_as_bytes(
    db: &RocksDB,
    primary_keys: Vec<Vec<u8>>,
) -> Result<Vec<Vec<u8>>, HubError> {
    let mut messages = Vec::new();

    for key in primary_keys {
        if let Ok(Some(value)) = db.get(&key) {
            messages.push(value);
        } else {
            return Err(HubError::not_found(
                format!("could not get message with key: {:?}", key).as_str(),
            ));
        }
    }

    Ok(messages)
}

pub fn get_messages_page_by_prefix<F>(
    db: &RocksDB,
    prefix: &[u8],
    page_options: &PageOptions,
    filter: F,
) -> Result<MessagesPage, HubError>
where
    F: Fn(&MessageProto) -> bool,
{
    let mut messages_bytes = Vec::new();
    let mut last_key = vec![];

    db.for_each_iterator_by_prefix(prefix, page_options, |key, value| {
        match message_decode(value) {
            Ok(message) => {
                if filter(&message) {
                    messages_bytes.push(value.to_vec());

                    if messages_bytes.len() >= page_options.page_size.unwrap_or(PAGE_SIZE_MAX) {
                        last_key = key.to_vec();
                        return Ok(true); // Stop iterating
                    }
                }

                Ok(false) // Continue iterating
            }
            Err(e) => Err(HubError {
                code: "db.internal_error".to_string(),
                message: format!("could not decode message: {}", e),
            }),
        }
    })?;

    let next_page_token = if last_key.len() > 0 {
        Some(last_key[prefix.len()..].to_vec())
    } else {
        None
    };

    Ok(MessagesPage {
        messages_bytes,
        next_page_token,
    })
}

pub fn message_encode(message: &MessageProto) -> Vec<u8> {
    if message.data_bytes.is_some() && message.data_bytes.as_ref().unwrap().len() > 0 {
        // Clone the message
        let mut cloned = message.clone();
        cloned.data = None;

        cloned.encode_to_vec()
    } else {
        message.encode_to_vec()
    }
}

pub fn message_decode(bytes: &[u8]) -> Result<MessageProto, HubError> {
    if let Ok(mut msg) = MessageProto::decode(bytes) {
        if msg.data.is_none()
            && msg.data_bytes.is_some()
            && msg.data_bytes.as_ref().unwrap().len() > 0
        {
            if let Ok(msg_data) = MessageData::decode(msg.data_bytes.as_ref().unwrap().as_slice()) {
                msg.data = Some(msg_data);
            }
        }

        Ok(msg)
    } else {
        Err(HubError {
            code: "db.internal_error".to_string(),
            message: "could not decode message".to_string(),
        })
    }
}

pub fn put_message_transaction(
    txn: &mut RocksDbTransactionBatch,
    message: &MessageProto,
) -> Result<(), HubError> {
    let ts_hash = make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;

    let primary_key = make_message_primary_key(
        message.data.as_ref().unwrap().fid as u32,
        type_to_set_postfix(MessageType::try_from(message.data.as_ref().unwrap().r#type).unwrap())
            as u8,
        Some(&ts_hash),
    );
    txn.put(primary_key, message_encode(&message));

    Ok(())
}

pub fn delete_message_transaction(
    txn: &mut RocksDbTransactionBatch,
    message: &MessageProto,
) -> Result<(), HubError> {
    let ts_hash = make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;

    let primary_key = make_message_primary_key(
        message.data.as_ref().unwrap().fid as u32,
        type_to_set_postfix(MessageType::try_from(message.data.as_ref().unwrap().r#type).unwrap())
            as u8,
        Some(&ts_hash),
    );
    txn.delete(primary_key);

    Ok(())
}
