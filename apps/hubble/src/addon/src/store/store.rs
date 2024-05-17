use super::{
    bytes_compare, delete_message_transaction, get_message, hub_error_to_js_throw,
    make_message_primary_key, message, message_decode, message_encode, put_message_transaction,
    utils::{self, encode_messages_to_js_object, get_page_options, get_store, vec_to_u8_24},
    MessagesPage, StoreEventHandler, TS_HASH_LENGTH,
};
use crate::{
    db::{RocksDB, RocksDbTransactionBatch},
    metrics::{FidLockSource, StoreAction, StoreLifetimeCounter},
    protos::{
        self, hub_event, link_body::Target, message_data::Body, HubEvent, HubEventType,
        MergeMessageBody, Message, MessageType,
    },
    store::make_ts_hash,
};
use crate::{logger::LOGGER, THREAD_POOL};
use neon::types::{Finalize, JsBuffer, JsNumber, JsString};
use neon::{context::Context, types::JsArray};
use neon::{context::FunctionContext, result::JsResult, types::JsPromise};
use neon::{object::Object, types::buffer::TypedArray};
use prost::Message as _;
use rocksdb;
use slog::{o, warn};
use std::string::ToString;
use std::sync::{Arc, Mutex};
use std::{clone::Clone, fmt::Display};

#[derive(Debug, PartialEq)]
pub struct HubError {
    pub code: String,
    pub message: String,
}

impl HubError {
    pub fn validation_failure(error_message: &str) -> HubError {
        HubError {
            code: "bad_request.validation_failure".to_string(),
            message: error_message.to_string(),
        }
    }

    pub fn invalid_parameter(error_message: &str) -> HubError {
        HubError {
            code: "bad_request.invalid_param".to_string(),
            message: error_message.to_string(),
        }
    }

    pub fn internal_db_error(error_message: &str) -> HubError {
        HubError {
            code: "db.internal_error".to_string(),
            message: error_message.to_string(),
        }
    }
}

impl Display for HubError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}/{}", self.code, self.message)
    }
}

/** Convert RocksDB errors  */
impl From<rocksdb::Error> for HubError {
    fn from(e: rocksdb::Error) -> HubError {
        HubError {
            code: "db.internal_error".to_string(),
            message: e.to_string(),
        }
    }
}

/** Convert Neon errors */
impl From<neon::result::Throw> for HubError {
    fn from(e: neon::result::Throw) -> HubError {
        HubError {
            code: "bad_request.validation_failure".to_string(),
            message: e.to_string(),
        }
    }
}

/** Convert io::Result error type to HubError */
impl From<std::io::Error> for HubError {
    fn from(e: std::io::Error) -> HubError {
        HubError {
            code: "bad_request.io_error".to_string(),
            message: e.to_string(),
        }
    }
}

pub const FID_LOCKS_COUNT: usize = 4;
pub const PAGE_SIZE_MAX: usize = 10_000;

#[derive(Debug, Default)]
pub struct PageOptions {
    pub page_size: Option<usize>,
    pub page_token: Option<Vec<u8>>,
    pub reverse: bool,
}

/// The `Send` trait indicates that a type can be safely transferred between threads.
/// The `Sync` trait indicates that a type can be safely shared between threads.
/// The `StoreDef` trait is implemented for types that are both `Send` and `Sync`,
/// allowing them to be used as trait objects in the `Store` struct.
///
/// Some methods in this trait provide default implementations. These methods can be overridden
/// by implementing the trait for a specific type.
pub trait StoreDef: Send + Sync {
    fn debug_name(&self) -> &'static str;

    fn postfix(&self) -> u8;
    fn add_message_type(&self) -> u8;
    fn remove_message_type(&self) -> u8;
    fn compact_state_message_type(&self) -> u8;

    fn is_add_type(&self, message: &Message) -> bool;
    fn is_remove_type(&self, message: &Message) -> bool;

    // If the store supports remove messages, this should return true
    fn remove_type_supported(&self) -> bool {
        self.remove_message_type() != MessageType::None as u8
    }

    /* todo: what is this? */
    fn is_compact_state_type(&self, message: &Message) -> bool;

    // If the store supports compaction state messages, this should return true
    fn compact_state_type_supported(&self) -> bool {
        self.compact_state_message_type() != MessageType::None as u8
    }

    fn build_secondary_indices(
        &self,
        _txn: &mut RocksDbTransactionBatch,
        _ts_hash: &[u8; TS_HASH_LENGTH],
        _message: &Message,
    ) -> Result<(), HubError> {
        Ok(())
    }

    fn delete_secondary_indices(
        &self,
        _txn: &mut RocksDbTransactionBatch,
        _ts_hash: &[u8; TS_HASH_LENGTH],
        _message: &Message,
    ) -> Result<(), HubError> {
        Ok(())
    }

    fn delete_remove_secondary_indices(
        &self,
        _txn: &mut RocksDbTransactionBatch,
        _message: &Message,
    ) -> Result<(), HubError> {
        Ok(())
    }

    fn find_merge_add_conflicts(&self, db: &RocksDB, message: &Message) -> Result<(), HubError>;
    fn find_merge_remove_conflicts(&self, db: &RocksDB, message: &Message) -> Result<(), HubError>;

    fn make_add_key(&self, message: &Message) -> Result<Vec<u8>, HubError>;
    fn make_remove_key(&self, message: &Message) -> Result<Vec<u8>, HubError>;
    fn make_compact_state_add_key(&self, message: &Message) -> Result<Vec<u8>, HubError>;

    fn get_prune_size_limit(&self) -> u32;

    fn get_merge_conflicts(
        &self,
        db: &RocksDB,
        message: &Message,
        ts_hash: &[u8; TS_HASH_LENGTH],
    ) -> Result<Vec<Message>, HubError> {
        Self::get_default_merge_conflicts(&self, db, message, ts_hash)
    }

    fn get_default_merge_conflicts(
        &self,
        db: &RocksDB,
        message: &Message,
        ts_hash: &[u8; TS_HASH_LENGTH],
    ) -> Result<Vec<Message>, HubError> {
        // The JS code does validateAdd()/validateRemove() here, but that's not needed because we
        // already validated that the message has a data field and a body field in the is_add_type()

        if self.is_add_type(message) {
            self.find_merge_add_conflicts(db, message)?;
        } else {
            self.find_merge_remove_conflicts(db, message)?;
        }

        let mut conflicts = vec![];

        if self.remove_type_supported() {
            let remove_key = self.make_remove_key(message)?;
            let remove_ts_hash = db.get(&remove_key)?;

            if remove_ts_hash.is_some() {
                let remove_compare = self.message_compare(
                    self.remove_message_type(),
                    &remove_ts_hash.clone().unwrap(),
                    message.data.as_ref().unwrap().r#type as u8,
                    &ts_hash.to_vec(),
                );

                if remove_compare > 0 {
                    return Err(HubError {
                        code: "bad_request.conflict".to_string(),
                        message: "message conflicts with a more recent remove".to_string(),
                    });
                }
                if remove_compare == 0 {
                    return Err(HubError {
                        code: "bad_request.duplicate".to_string(),
                        message: "message has already been merged".to_string(),
                    });
                }

                // If the existing remove has a lower order than the new message, retrieve the full
                // Remove message and delete it as part of the RocksDB transaction
                let maybe_existing_remove = get_message(
                    &db,
                    message.data.as_ref().unwrap().fid as u32,
                    self.postfix(),
                    &utils::vec_to_u8_24(&remove_ts_hash)?,
                )?;

                if maybe_existing_remove.is_some() {
                    conflicts.push(maybe_existing_remove.unwrap());
                } else {
                    warn!(LOGGER, "Message's ts_hash exists but message not found in store"; 
                        o!("remove_ts_hash" => format!("{:x?}", remove_ts_hash.unwrap())));
                }
            }
        }

        // Check if there is an add timestamp hash for this
        let add_key = self.make_add_key(message)?;
        let add_ts_hash = db.get(&add_key)?;

        if add_ts_hash.is_some() {
            let add_compare = self.message_compare(
                self.add_message_type(),
                &add_ts_hash.clone().unwrap(),
                message.data.as_ref().unwrap().r#type as u8,
                &ts_hash.to_vec(),
            );

            if add_compare > 0 {
                return Err(HubError {
                    code: "bad_request.conflict".to_string(),
                    message: "message conflicts with a more recent add".to_string(),
                });
            }
            if add_compare == 0 {
                return Err(HubError {
                    code: "bad_request.duplicate".to_string(),
                    message: "message has already been merged".to_string(),
                });
            }

            // If the existing add has a lower order than the new message, retrieve the full
            // Add message and delete it as part of the RocksDB transaction
            let maybe_existing_add = get_message(
                &db,
                message.data.as_ref().unwrap().fid as u32,
                self.postfix(),
                &utils::vec_to_u8_24(&add_ts_hash)?,
            )?;

            if maybe_existing_add.is_none() {
                warn!(LOGGER, "Message's ts_hash exists but message not found in store"; 
                    o!("add_ts_hash" => format!("{:x?}", add_ts_hash.unwrap())));
            } else {
                conflicts.push(maybe_existing_add.unwrap());
            }
        }

        Ok(conflicts)
    }

    fn message_compare(
        &self,
        a_type: u8,
        a_ts_hash: &Vec<u8>,
        b_type: u8,
        b_ts_hash: &Vec<u8>,
    ) -> i8 {
        // Compare timestamps (first 4 bytes of ts_hash)
        let ts_compare = bytes_compare(&a_ts_hash[0..4], &b_ts_hash[0..4]);
        if ts_compare != 0 {
            return ts_compare;
        }

        if a_type == self.remove_message_type() && b_type == self.add_message_type() {
            return 1;
        }
        if a_type == self.add_message_type() && b_type == self.remove_message_type() {
            return -1;
        }

        // Compare the rest of the ts_hash to break ties
        bytes_compare(&a_ts_hash[4..24], &b_ts_hash[4..24])
    }

    fn revoke_event_args(&self, message: &Message) -> HubEvent {
        HubEvent {
            r#type: HubEventType::RevokeMessage as i32,
            body: Some(hub_event::Body::RevokeMessageBody(
                protos::RevokeMessageBody {
                    message: Some(message.clone()),
                },
            )),
            id: 0,
        }
    }

    fn merge_event_args(&self, message: &Message, merge_conflicts: Vec<Message>) -> HubEvent {
        HubEvent {
            r#type: HubEventType::MergeMessage as i32,
            body: Some(hub_event::Body::MergeMessageBody(MergeMessageBody {
                message: Some(message.clone()),
                deleted_messages: merge_conflicts,
            })),
            id: 0,
        }
    }

    fn prune_event_args(&self, message: &Message) -> HubEvent {
        HubEvent {
            r#type: HubEventType::PruneMessage as i32,
            body: Some(hub_event::Body::PruneMessageBody(
                protos::PruneMessageBody {
                    message: Some(message.clone()),
                },
            )),
            id: 0,
        }
    }
}

pub struct Store {
    store_def: Box<dyn StoreDef>,
    store_event_handler: Arc<StoreEventHandler>,
    fid_locks: Arc<[Mutex<()>]>,
    db: Arc<RocksDB>,
    logger: slog::Logger,
}

impl Finalize for Store {
    fn finalize<'a, C: neon::context::Context<'a>>(self, _cx: &mut C) {}
}

impl Store {
    pub fn new_with_store_def(
        db: Arc<RocksDB>,
        store_event_handler: Arc<StoreEventHandler>,
        store_def: Box<dyn StoreDef>,
    ) -> Store {
        Store {
            store_def,
            store_event_handler,
            fid_locks: {
                let mut locks = Vec::with_capacity(FID_LOCKS_COUNT);
                for _ in 0..FID_LOCKS_COUNT {
                    locks.push(Mutex::new(()));
                }
                locks.into()
            },
            db,
            logger: LOGGER.new(o!("component" => "Store")),
        }
    }

    pub fn logger(&self) -> &slog::Logger {
        &self.logger
    }

    pub fn store_def(&self) -> &dyn StoreDef {
        self.store_def.as_ref()
    }

    pub fn db(&self) -> Arc<RocksDB> {
        self.db.clone()
    }

    pub fn event_handler(&self) -> Arc<StoreEventHandler> {
        self.store_event_handler.clone()
    }

    pub fn postfix(&self) -> u8 {
        self.store_def.postfix()
    }

    pub fn get_add(
        &self,
        partial_message: &protos::Message,
    ) -> Result<Option<protos::Message>, HubError> {
        // First check the fid
        if partial_message.data.is_none() || partial_message.data.as_ref().unwrap().fid == 0 {
            return Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: "fid is required".to_string(),
            });
        }

        let _metric = self.metric(StoreAction::GetAdd);

        let adds_key = self.store_def.make_add_key(partial_message)?;
        let message_ts_hash = self.db.get(&adds_key)?;

        if message_ts_hash.is_none() {
            return Ok(None);
        }

        get_message(
            &self.db,
            partial_message.data.as_ref().unwrap().fid as u32,
            self.store_def.postfix(),
            &utils::vec_to_u8_24(&message_ts_hash)?,
        )
    }

    pub fn get_remove(
        &self,
        partial_message: &protos::Message,
    ) -> Result<Option<protos::Message>, HubError> {
        if !self.store_def.remove_type_supported() {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "remove type not supported".to_string(),
            });
        }

        // First check the fid
        if partial_message.data.is_none() || partial_message.data.as_ref().unwrap().fid == 0 {
            return Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: "fid is required".to_string(),
            });
        }

        let _metric = self.metric(StoreAction::GetRemoves);

        let removes_key = self.store_def.make_remove_key(partial_message)?;
        let message_ts_hash = self.db.get(&removes_key)?;

        if message_ts_hash.is_none() {
            return Ok(None);
        }

        get_message(
            &self.db,
            partial_message.data.as_ref().unwrap().fid as u32,
            self.store_def.postfix(),
            &utils::vec_to_u8_24(&message_ts_hash)?,
        )
    }

    pub fn get_adds_by_fid<F>(
        &self,
        fid: u32,
        page_options: &PageOptions,
        filter: Option<F>,
    ) -> Result<MessagesPage, HubError>
    where
        F: Fn(&protos::Message) -> bool,
    {
        let _metric = self.metric(StoreAction::GetAddsByFid);

        let prefix = make_message_primary_key(fid, self.store_def.postfix(), None);
        let messages_page =
            message::get_messages_page_by_prefix(&self.db, &prefix, &page_options, |message| {
                self.store_def.is_add_type(&message)
                    && filter.as_ref().map(|f| f(&message)).unwrap_or(true)
            })?;

        Ok(messages_page)
    }

    pub fn get_removes_by_fid<F>(
        &self,
        fid: u32,
        page_options: &PageOptions,
        filter: Option<F>,
    ) -> Result<MessagesPage, HubError>
    where
        F: Fn(&protos::Message) -> bool,
    {
        if !self.store_def.remove_type_supported() {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "remove type not supported".to_string(),
            });
        }

        let _metric = self.metric(StoreAction::GetRemovesByFid);

        let prefix = make_message_primary_key(fid, self.store_def.postfix(), None);
        let messages =
            message::get_messages_page_by_prefix(&self.db, &prefix, &page_options, |message| {
                self.store_def.is_remove_type(&message)
                    && filter.as_ref().map(|f| f(&message)).unwrap_or(true)
            })?;

        Ok(messages)
    }

    fn put_add_compact_state_transaction(
        &self,
        txn: &mut RocksDbTransactionBatch,
        message: &Message,
    ) -> Result<(), HubError> {
        if !self.store_def.compact_state_type_supported() {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "compact state type not supported".to_string(),
            });
        }

        let _metric = self.metric(StoreAction::PutAddCompactStateTransaction);

        let compact_state_key = self.store_def.make_compact_state_add_key(message)?;
        txn.put(compact_state_key, message_encode(&message));

        Ok(())
    }

    fn put_add_transaction(
        &self,
        txn: &mut RocksDbTransactionBatch,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        let _metric = self.metric(StoreAction::PutAddTransaction);

        put_message_transaction(txn, &message)?;

        let adds_key = self.store_def.make_add_key(message)?;

        txn.put(adds_key, ts_hash.to_vec());

        self.store_def
            .build_secondary_indices(txn, ts_hash, message)?;

        Ok(())
    }

    fn delete_compact_state_transaction(
        &self,
        txn: &mut RocksDbTransactionBatch,
        message: &Message,
    ) -> Result<(), HubError> {
        if !self.store_def.compact_state_type_supported() {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "compact state type not supported".to_string(),
            });
        }

        let _metric = self.metric(StoreAction::DeleteCompactStateTransaction);

        let compact_state_key = self.store_def.make_compact_state_add_key(message)?;
        txn.delete(compact_state_key);

        Ok(())
    }

    fn delete_add_transaction(
        &self,
        txn: &mut RocksDbTransactionBatch,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        let _metric = self.metric(StoreAction::DeleteAddTransaction);

        self.store_def
            .delete_secondary_indices(txn, ts_hash, message)?;

        let add_key = self.store_def.make_add_key(message)?;
        txn.delete(add_key);

        delete_message_transaction(txn, message)
    }

    fn put_remove_transaction(
        &self,
        txn: &mut RocksDbTransactionBatch,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        let _metric = self.metric(StoreAction::PutRemoveTransaction);

        if !self.store_def.remove_type_supported() {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "remove type not supported".to_string(),
            });
        }

        put_message_transaction(txn, &message)?;

        let removes_key = self.store_def.make_remove_key(message)?;
        txn.put(removes_key, ts_hash.to_vec());

        Ok(())
    }

    fn delete_remove_transaction(
        &self,
        txn: &mut RocksDbTransactionBatch,
        message: &Message,
    ) -> Result<(), HubError> {
        let _metric = self.metric(StoreAction::DeleteMoveTransaction);

        if !self.store_def.remove_type_supported() {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "remove type not supported".to_string(),
            });
        }

        self.store_def
            .delete_remove_secondary_indices(txn, message)?;

        let remove_key = self.store_def.make_remove_key(message)?;
        txn.delete(remove_key);

        delete_message_transaction(txn, message)
    }

    fn delete_many_transaction(
        &self,
        txn: &mut RocksDbTransactionBatch,
        messages: &Vec<Message>,
    ) -> Result<(), HubError> {
        let _metric = self.metric(StoreAction::DeleteMany(messages.len()));

        for message in messages {
            if self.store_def.is_compact_state_type(message) {
                self.delete_compact_state_transaction(txn, message)?;
            } else if self.store_def.is_add_type(message) {
                let ts_hash =
                    make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;
                self.delete_add_transaction(txn, &ts_hash, message)?;
            }
            if self.store_def.remove_type_supported() && self.store_def.is_remove_type(message) {
                self.delete_remove_transaction(txn, message)?;
            }
        }

        Ok(())
    }

    pub fn merge(&self, message: &Message) -> Result<Vec<u8>, HubError> {
        let _metric = self.metric(StoreAction::Merge);

        // Grab a merge lock. The typescript code does this by individual fid, but we don't have a
        // good way of doing that efficiently here. We'll just use an array of locks, with each fid
        // deterministically mapped to a lock.

        let _fid_lock = 'get_lock: {
            let index = message.data.as_ref().unwrap().fid as usize % FID_LOCKS_COUNT;
            let lock = &self.fid_locks[index];

            if let Ok(lock) = lock.try_lock() {
                break 'get_lock lock;
            }

            let _metric = self.metric(StoreAction::FidLock(FidLockSource::Merge));
            lock.lock().unwrap()
        };

        if !self.store_def.is_add_type(message)
            && !(self.store_def.remove_type_supported() && self.store_def.is_remove_type(message))
            && !(self.store_def.compact_state_type_supported()
                && self.store_def.is_compact_state_type(message))
        {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "invalid message type".to_string(),
            });
        }

        let ts_hash = make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;

        if self.store_def().is_compact_state_type(message) {
            self.merge_compact_state(message)
        } else if self.store_def.is_add_type(message) {
            self.merge_add(&ts_hash, message)
        } else {
            self.merge_remove(&ts_hash, message)
        }
    }

    pub fn revoke(&self, message: &Message) -> Result<Vec<u8>, HubError> {
        let _metric = self.metric(StoreAction::Revoke);

        // Start a transaction
        let mut txn = self.db.txn();

        // Get the message ts_hash
        let ts_hash = make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;

        if self.store_def().is_compact_state_type(message) {
            self.delete_compact_state_transaction(&mut txn, message)?;
        } else if self.store_def.is_add_type(message) {
            self.delete_add_transaction(&mut txn, &ts_hash, message)?;
        } else if self.store_def.remove_type_supported() && self.store_def.is_remove_type(message) {
            self.delete_remove_transaction(&mut txn, message)?;
        } else {
            return Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: "invalid message type".to_string(),
            });
        }

        let mut hub_event = self.store_def.revoke_event_args(message);

        let id = self
            .store_event_handler
            .commit_transaction(&mut txn, &mut hub_event)?;

        // Commit the transaction
        self.db.commit(txn)?;

        hub_event.id = id;

        // Serialize the hub_event
        let hub_event_bytes = hub_event.encode_to_vec();

        Ok(hub_event_bytes)
    }

    fn read_compact_state_details(
        &self,
        message: &Message,
    ) -> Result<(u32, u32, Vec<u64>), HubError> {
        if let Some(data) = &message.data {
            if let Some(Body::LinkCompactStateBody(link_compact_body)) = &data.body {
                Ok((
                    data.fid as u32,
                    data.timestamp,
                    link_compact_body.target_fids.clone(),
                ))
            } else {
                return Err(HubError {
                    code: "bad_request.validation_failure".to_string(),
                    message: "Invalid compact state message: No link compact state body"
                        .to_string(),
                });
            }
        } else {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "Invalid compact state message: no data".to_string(),
            });
        }
    }

    pub fn merge_compact_state(&self, message: &Message) -> Result<Vec<u8>, HubError> {
        let _metric = self.metric(StoreAction::MergeCompactState);

        let mut merge_conflicts = vec![];

        // First, find if there's an existing compact state message, and if there is,
        // delete it if it is older
        let compact_state_key = self.store_def.make_compact_state_add_key(message)?;
        let existing_compact_state = self.db.get(&compact_state_key)?;

        if existing_compact_state.is_some() {
            if let Ok(existing_compact_state_message) =
                message_decode(existing_compact_state.unwrap().as_ref())
            {
                if existing_compact_state_message
                    .data
                    .as_ref()
                    .unwrap()
                    .timestamp
                    < message.data.as_ref().unwrap().timestamp
                {
                    merge_conflicts.push(existing_compact_state_message);
                } else {
                    // Can't merge an older compact state message
                    return Err(HubError {
                        code: "bad_request.conflict".to_string(),
                        message: "A newer Compact State message is already merged".to_string(),
                    });
                }
            }
        }

        let (fid, compact_state_timestamp, target_fids) =
            self.read_compact_state_details(message)?;

        // Go over all the messages for this Fid, that are older than the compact state message and
        // 1. Delete all remove messages
        // 2. Delete all add messages that are not in the target_fids list
        let prefix = &make_message_primary_key(fid, self.store_def.postfix(), None);
        self.db
            .for_each_iterator_by_prefix(prefix, &PageOptions::default(), |_key, value| {
                let message = message_decode(value)?;

                // Only if message is older than the compact state message
                if message.data.as_ref().unwrap().timestamp > compact_state_timestamp {
                    // Finish the iteration since all future messages will have greater timestamp
                    return Ok(true);
                }

                if self.store_def.is_remove_type(&message) {
                    merge_conflicts.push(message);
                } else if self.store_def.is_add_type(&message) {
                    // Get the link_body fid
                    if let Some(data) = &message.data {
                        if let Some(Body::LinkBody(link_body)) = &data.body {
                            if let Some(Target::TargetFid(target_fid)) = link_body.target {
                                if !target_fids.contains(&target_fid) {
                                    merge_conflicts.push(message);
                                }
                            }
                        }
                    }
                }

                Ok(false) // Continue the iteration
            })?;

        let mut txn = self.db.txn();
        // Delete all the merge conflicts
        self.delete_many_transaction(&mut txn, &merge_conflicts)?;

        // Add the Link compact state message
        self.put_add_compact_state_transaction(&mut txn, message)?;

        // Event Handler
        let mut hub_event = self.store_def.merge_event_args(message, merge_conflicts);

        let id = self
            .store_event_handler
            .commit_transaction(&mut txn, &mut hub_event)?;

        // Commit the transaction
        self.db.commit(txn)?;

        hub_event.id = id;
        // Serialize the hub_event
        let hub_event_bytes = hub_event.encode_to_vec();

        Ok(hub_event_bytes)
    }

    pub fn merge_add(
        &self,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<Vec<u8>, HubError> {
        let _metric = self.metric(StoreAction::MergeAdd);

        // If the store supports compact state messages, we don't merge messages that don't exist in the compact state
        if self.store_def.compact_state_type_supported() {
            // Get the compact state message
            let compact_state_key = self.store_def.make_compact_state_add_key(message)?;
            if let Some(compact_state_message_bytes) = self.db.get(&compact_state_key)? {
                let compact_state_message = message_decode(compact_state_message_bytes.as_ref())?;

                let (_, compact_state_timestamp, target_fids) =
                    self.read_compact_state_details(&compact_state_message)?;

                if let Some(Body::LinkBody(link_body)) = &message.data.as_ref().unwrap().body {
                    if let Some(Target::TargetFid(target_fid)) = link_body.target {
                        // If the message is older than the compact state message, and the target fid is not in the target_fids list
                        if message.data.as_ref().unwrap().timestamp < compact_state_timestamp
                            && !target_fids.contains(&message.data.as_ref().unwrap().fid)
                        {
                            return Err(HubError {
                                code: "bad_request.conflict".to_string(),
                                message: format!(
                                    "Target fid {} not in the compact state target fids",
                                    target_fid
                                ),
                            });
                        }
                    }
                }
            }
        }

        // Get the merge conflicts first
        let merge_conflicts = self
            .store_def
            .get_merge_conflicts(&self.db, message, ts_hash)?;

        // start a transaction
        let mut txn = self.db.txn();
        // Delete all the merge conflicts
        self.delete_many_transaction(&mut txn, &merge_conflicts)?;

        // Add ops to store the message by messageKey and index the the messageKey by set and by target
        self.put_add_transaction(&mut txn, &ts_hash, message)?;

        // Event handler
        let mut hub_event = self.store_def.merge_event_args(message, merge_conflicts);

        let id = self
            .store_event_handler
            .commit_transaction(&mut txn, &mut hub_event)?;

        // Commit the transaction
        self.db.commit(txn)?;

        hub_event.id = id;
        // Serialize the hub_event
        let hub_event_bytes = hub_event.encode_to_vec();

        Ok(hub_event_bytes)
    }

    pub fn merge_remove(
        &self,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<Vec<u8>, HubError> {
        let _metric = self.metric(StoreAction::MergeRemove);

        // If the store supports compact state messages, we don't merge remove messages before its timestamp
        // If the store supports compact state messages, we don't merge messages that don't exist in the compact state
        if self.store_def.compact_state_type_supported() {
            // Get the compact state message
            let compact_state_key = self.store_def.make_compact_state_add_key(message)?;
            if let Some(compact_state_message_bytes) = self.db.get(&compact_state_key)? {
                let compact_state_message = message_decode(compact_state_message_bytes.as_ref())?;

                let (_, compact_state_timestamp, _) =
                    self.read_compact_state_details(&compact_state_message)?;

                // If the message is older than the compact state message, and the target fid is not in the target_fids list
                if message.data.as_ref().unwrap().timestamp < compact_state_timestamp {
                    return Err(HubError {
                        code: "bad_request.prunable".to_string(),
                        message: format!(
                            "Remove message earlier than the compact state message will be immediately pruned",
                        ),
                    });
                }
            }
        }

        // Get the merge conflicts first
        let merge_conflicts = self
            .store_def
            .get_merge_conflicts(&self.db, message, ts_hash)?;

        // start a transaction
        let mut txn = self.db.txn();

        // Delete all the merge conflicts
        self.delete_many_transaction(&mut txn, &merge_conflicts)?;

        // Add ops to store the message by messageKey and index the the messageKey by set and by target
        self.put_remove_transaction(&mut txn, ts_hash, message)?;

        // Event handler
        let mut hub_event = self.store_def.merge_event_args(message, merge_conflicts);

        let id = self
            .store_event_handler
            .commit_transaction(&mut txn, &mut hub_event)?;

        // Commit the transaction
        self.db.commit(txn)?;

        hub_event.id = id;
        // Serialize the hub_event
        let hub_event_bytes = hub_event.encode_to_vec();

        Ok(hub_event_bytes)
    }

    fn prune_messages(
        &self,
        fid: u32,
        cached_count: u64,
        units: u64,
    ) -> Result<Vec<HubEvent>, HubError> {
        // TODO: uncomment this code and monitor in production
        // // Concurrent writes on same memory space kills RocksDB performance. Ensure this doesn't happen with a lock.
        // let _fid_lock = 'get_lock: {
        //     let index = fid as usize % FID_LOCKS_COUNT;
        //     let lock = &self.fid_locks[index];

        //     if let Ok(lock) = lock.try_lock() {
        //         break 'get_lock lock;
        //     }

        //     let _metric = self.metric(StoreAction::FidLock(FidLockSource::Prune));
        //     lock.lock().unwrap()
        // };

        let mut pruned_events = vec![];

        let mut count = cached_count;
        let prune_size_limit = self.store_def.get_prune_size_limit();

        let mut txn = self.db.txn();

        let prefix = &make_message_primary_key(fid, self.store_def.postfix(), None);
        self.db
            .for_each_iterator_by_prefix(prefix, &PageOptions::default(), |_key, value| {
                if count <= (prune_size_limit as u64) * units {
                    return Ok(true); // Stop the iteration, nothing left to prune
                }

                // Value is a message, so try to decode it
                let message = message_decode(value)?;

                // Note that compact state messages are not pruned
                if self.store_def.compact_state_type_supported()
                    && self.store_def.is_compact_state_type(&message)
                {
                    return Ok(false); // Continue the iteration
                } else if self.store_def.is_add_type(&message) {
                    let ts_hash =
                        make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;
                    self.delete_add_transaction(&mut txn, &ts_hash, &message)?;
                } else if self.store_def.remove_type_supported()
                    && self.store_def.is_remove_type(&message)
                {
                    self.delete_remove_transaction(&mut txn, &message)?;
                }

                // Event Handler
                let mut hub_event = self.store_def.prune_event_args(&message);
                let id = self
                    .store_event_handler
                    .commit_transaction(&mut txn, &mut hub_event)?;

                count -= 1;

                hub_event.id = id;
                pruned_events.push(hub_event);

                Ok(false) // Continue the iteration
            })?;

        self.db.commit(txn)?;
        Ok(pruned_events)
    }

    pub fn get_all_messages_by_fid(
        &self,
        fid: u32,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        let _metric = self.metric(StoreAction::GetAllMessagesByFid(page_options.page_size));

        let prefix = make_message_primary_key(fid, self.store_def.postfix(), None);
        let messages =
            message::get_messages_page_by_prefix(&self.db, &prefix, &page_options, |message| {
                self.store_def.is_add_type(&message)
                    || (self.store_def.remove_type_supported()
                        && self.store_def.is_remove_type(&message))
            })?;

        Ok(messages)
    }

    pub fn metric(&self, action: StoreAction) -> StoreLifetimeCounter {
        StoreLifetimeCounter::new(self.store_def.as_ref(), action)
    }
}

// Neon bindings
// Note about dispatch - The methods are dispatched to the Store struct, which is a Box<dyn StoreDef>.
// This means the NodeJS code can pass in any store, and the Rust code will call the correct method
// for that store
impl Store {
    pub fn js_merge(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let message_bytes_result = cx.argument::<JsBuffer>(0);
        let message_bytes = message_bytes_result.unwrap().as_slice(&cx).to_vec();
        let message = Message::decode(message_bytes.as_slice());

        let result = if message.is_err() {
            let e = message.unwrap_err();
            Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: e.to_string(),
            })
        } else {
            let m = message.unwrap();
            store.merge(&m)
        };

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(hub_event_bytes) => {
                let mut js_buffer = cx.buffer(hub_event_bytes.len())?;
                js_buffer
                    .as_mut_slice(&mut cx)
                    .copy_from_slice(&hub_event_bytes);
                Ok(js_buffer)
            }
            Err(e) => cx.throw_error(format!("{}/{}", e.code, e.message)),
        });

        Ok(promise)
    }

    pub fn js_merge_many(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        // Get the messages array. Each message is a buffer in this array
        let messages_array = cx.argument::<JsArray>(0).unwrap();
        let messages = messages_array
            .to_vec(&mut cx)?
            .iter()
            .map(|message_bytes| {
                let message_bytes = message_bytes.downcast::<JsBuffer, _>(&mut cx).unwrap();
                let message = Message::decode(message_bytes.as_slice(&cx));
                if message.is_err() {
                    return Err(HubError {
                        code: "bad_request.validation_failure".to_string(),
                        message: message.unwrap_err().to_string(),
                    });
                }
                Ok(message.unwrap())
            })
            .collect::<Vec<_>>();

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        // We run the merge in a threadpool because it can be very CPU intensive and it will block
        // the NodeJS main thread.
        let metric = store.metric(StoreAction::ThreadPoolWait);
        THREAD_POOL.lock().unwrap().execute(move || {
            drop(metric);

            let results = messages
                .into_iter()
                .map(|message| match message {
                    Err(e) => return Err(e),
                    Ok(message) => store.merge(&message),
                })
                .collect::<Vec<_>>();

            deferred.settle_with(&channel, move |mut cx| {
                let js_array = JsArray::new(&mut cx, results.len());
                results.iter().enumerate().for_each(|(i, r)| match r {
                    Ok(hub_event_bytes) => {
                        let mut js_buffer = cx.buffer(hub_event_bytes.len()).unwrap();
                        js_buffer
                            .as_mut_slice(&mut cx)
                            .copy_from_slice(&hub_event_bytes);
                        js_array.set(&mut cx, i as u32, js_buffer).unwrap();
                    }
                    Err(e) => {
                        let js_error_string =
                            JsString::new(&mut cx, format!("{}/{}", e.code, e.message));
                        js_array.set(&mut cx, i as u32, js_error_string).unwrap();
                    }
                });

                Ok(js_array)
            });
        });

        Ok(promise)
    }

    pub fn js_revoke(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let message_bytes = cx.argument::<JsBuffer>(0);
        let message = Message::decode(message_bytes.unwrap().as_slice(&cx));

        let result = if message.is_err() {
            Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: message.unwrap_err().to_string(),
            })
        } else {
            let m = message.unwrap();
            store.revoke(&m)
        };

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(hub_event_bytes) => {
                let mut js_buffer = cx.buffer(hub_event_bytes.len())?;
                js_buffer
                    .as_mut_slice(&mut cx)
                    .copy_from_slice(&hub_event_bytes);
                Ok(js_buffer)
            }
            Err(e) => cx.throw_error(format!("{}/{}", e.code, e.message)),
        });

        Ok(promise)
    }

    pub fn js_prune_messages(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let cached_count = cx.argument::<JsNumber>(1).unwrap().value(&mut cx) as u64;
        let units = cx.argument::<JsNumber>(2).unwrap().value(&mut cx) as u64;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        // We run the prune in a threadpool because it can be very CPU intensive and it will block
        // the NodeJS main thread.
        let metric = store.metric(StoreAction::ThreadPoolWait);
        THREAD_POOL.lock().unwrap().execute(move || {
            drop(metric);

            // Run the prune job in a separate thread
            let prune_result = store.prune_messages(fid, cached_count, units);

            deferred.settle_with(&channel, move |mut cx| {
                let pruned_events = match prune_result {
                    Ok(pruned_events) => pruned_events,
                    Err(e) => return cx.throw_error(format!("{}/{}", e.code, e.message)),
                };

                let js_array = cx.empty_array();
                for (i, hub_event) in pruned_events.iter().enumerate() {
                    let hub_event_bytes = hub_event.encode_to_vec();
                    let mut js_buffer = cx.buffer(hub_event_bytes.len())?;
                    js_buffer
                        .as_mut_slice(&mut cx)
                        .copy_from_slice(&hub_event_bytes);
                    js_array.set(&mut cx, i as u32, js_buffer)?;
                }

                Ok(js_array)
            });
        });

        Ok(promise)
    }

    pub fn js_get_message(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let set = cx.argument::<JsNumber>(1).unwrap().value(&mut cx) as u8;
        let ts_hash = match vec_to_u8_24(&Some(cx.argument::<JsBuffer>(2)?.as_slice(&cx).to_vec()))
        {
            Ok(ts_hash) => ts_hash,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        deferred.settle_with(&channel, move |mut cx| {
            let message = match get_message(&store.db, fid, set, &ts_hash) {
                Ok(Some(message)) => message,
                Ok(None) => {
                    return cx.throw_error(format!("{}/{}", "not_found", "message not found"))
                }
                Err(e) => return hub_error_to_js_throw(&mut cx, e),
            };

            let message_bytes = message.encode_to_vec();
            let mut js_buffer = cx.buffer(message_bytes.len())?;
            js_buffer
                .as_mut_slice(&mut cx)
                .copy_from_slice(&message_bytes);
            Ok(js_buffer)
        });

        Ok(promise)
    }

    pub fn js_get_all_messages_by_fid(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let page_options = get_page_options(&mut cx, 1)?;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        deferred.settle_with(&channel, move |mut tcx| {
            let messages = match store.get_all_messages_by_fid(fid, &page_options) {
                Ok(messages) => messages,
                Err(e) => return tcx.throw_error(format!("{}/{}", e.code, e.message)),
            };

            encode_messages_to_js_object(&mut tcx, messages)
        });

        Ok(promise)
    }
}
