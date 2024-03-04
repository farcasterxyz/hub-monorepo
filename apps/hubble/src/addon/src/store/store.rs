use super::{
    bytes_compare, delete_message_transaction, get_message, hub_error_to_js_throw,
    make_message_primary_key, message, put_message_transaction,
    utils::{self, encode_messages_to_js_object, get_page_options, get_store, vec_to_u8_24},
    MessagesPage, StoreEventHandler, TS_HASH_LENGTH,
};
use crate::logger::LOGGER;
use crate::{
    db::{RocksDB, RocksDbTransactionBatch},
    protos::{self, hub_event, HubEvent, HubEventType, MergeMessageBody, Message, MessageType},
    store::make_ts_hash,
};
use neon::context::Context;
use neon::types::{Finalize, JsBuffer, JsNumber};
use neon::{context::FunctionContext, result::JsResult, types::JsPromise};
use neon::{object::Object, types::buffer::TypedArray};
use prost::Message as _;
use rocksdb;
use slog::{o, warn};
use std::sync::{Arc, Mutex};
use threadpool::ThreadPool;

#[derive(Debug)]
pub struct HubError {
    pub code: String,
    pub message: String,
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
pub trait StoreDef: Send + Sync {
    fn postfix(&self) -> u8;
    fn add_message_type(&self) -> u8;
    fn remove_message_type(&self) -> u8;

    fn is_add_type(&self, message: &Message) -> bool;
    fn is_remove_type(&self, message: &Message) -> bool;

    // If the store supports remove messages, this should return true
    fn remove_type_supported(&self) -> bool {
        self.remove_message_type() != MessageType::None as u8
    }

    fn build_secondary_indicies(
        &self,
        txn: &mut RocksDbTransactionBatch,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError>;
    fn delete_secondary_indicies(
        &self,
        txn: &mut RocksDbTransactionBatch,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError>;

    fn find_merge_add_conflicts(&self, message: &Message) -> Result<(), HubError>;
    fn find_merge_remove_conflicts(&self, message: &Message) -> Result<(), HubError>;

    fn make_add_key(&self, message: &Message) -> Result<Vec<u8>, HubError>;
    fn make_remove_key(&self, message: &Message) -> Result<Vec<u8>, HubError>;

    fn get_prune_size_limit(&self) -> u32;
}

pub struct Store {
    store_def: Box<dyn StoreDef>,
    store_event_handler: Arc<StoreEventHandler>,
    fid_locks: Arc<[Mutex<()>; 4]>,
    db: Arc<RocksDB>,
    logger: slog::Logger,
    pub pool: Arc<Mutex<threadpool::ThreadPool>>, // TODO: Move this out
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
            fid_locks: Arc::new([
                Mutex::new(()),
                Mutex::new(()),
                Mutex::new(()),
                Mutex::new(()),
            ]),
            db,
            logger: LOGGER.new(o!("component" => "Store")),
            pool: Arc::new(Mutex::new(ThreadPool::new(1))),
        }
    }

    // fn log(&self, message: &str) {
    //     // println!("{}", message);
    // }

    pub fn db(&self) -> Arc<RocksDB> {
        self.db.clone()
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

        let removes_key = self.store_def.make_remove_key(partial_message)?;
        // println!("trying to get removes key {:?}", removes_key);
        let message_ts_hash = self.db.get(&removes_key)?;
        // println!("got removes key ts_hash: {:?}", message_ts_hash);

        if message_ts_hash.is_none() {
            // println!("get_remove() message_ts_hash is none");
            return Ok(None);
        }

        // println!("get_remove() message_ts_hash: {:?}", message_ts_hash);

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

        let prefix = make_message_primary_key(fid, self.store_def.postfix(), None);
        let messages =
            message::get_messages_page_by_prefix(&self.db, &prefix, &page_options, |message| {
                self.store_def.is_remove_type(&message)
                    && filter.as_ref().map(|f| f(&message)).unwrap_or(true)
            })?;

        Ok(messages)
    }

    fn put_add_transaction(
        &self,
        txn: &mut RocksDbTransactionBatch,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        put_message_transaction(txn, &message)?;

        let adds_key = self.store_def.make_add_key(message)?;

        txn.put(adds_key, ts_hash.to_vec());

        self.store_def
            .build_secondary_indicies(txn, ts_hash, message)?;

        Ok(())
    }

    fn delete_add_transaction(
        &self,
        txn: &mut RocksDbTransactionBatch,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        self.store_def
            .delete_secondary_indicies(txn, ts_hash, message)?;

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
        if !self.store_def.remove_type_supported() {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "remove type not supported".to_string(),
            });
        }

        let remove_key = self.store_def.make_remove_key(message)?;
        txn.delete(remove_key);

        delete_message_transaction(txn, message)
    }

    fn delete_many_transaction(
        &self,
        txn: &mut RocksDbTransactionBatch,
        messages: Vec<Message>,
    ) -> Result<(), HubError> {
        for message in &messages {
            // println!("trying to deleting message: {:?}", message);
            if self.store_def.is_add_type(message) {
                let ts_hash =
                    make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;
                // println!("deleting add: {:?}", ts_hash);
                self.delete_add_transaction(txn, &ts_hash, message)?;
            }
            if self.store_def.remove_type_supported() && self.store_def.is_remove_type(message) {
                self.delete_remove_transaction(txn, message)?;
            }
        }

        Ok(())
    }

    fn get_merge_conflicts(
        &self,
        message: &Message,
        ts_hash: &[u8; TS_HASH_LENGTH],
    ) -> Result<Vec<Message>, HubError> {
        // The JS code does validateAdd()/validateRemove() here, but that's not needed because we
        // already validated that the message has a data field and a body field in the is_add_type()

        if self.store_def.is_add_type(message) {
            self.store_def.find_merge_add_conflicts(message)?;
        } else {
            self.store_def.find_merge_remove_conflicts(message)?;
        }

        let mut conflicts = vec![];

        if self.store_def.remove_type_supported() {
            let remove_key = self.store_def.make_remove_key(message)?;
            let remove_ts_hash = self.db.get(&remove_key)?;

            if remove_ts_hash.is_some() {
                let remove_compare = self.message_compare(
                    self.store_def.remove_message_type(),
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
                let existing_remove = get_message(
                    &self.db,
                    message.data.as_ref().unwrap().fid as u32,
                    self.store_def.postfix(),
                    &utils::vec_to_u8_24(&remove_ts_hash)?,
                )?
                .ok_or_else(|| HubError {
                    code: "bad_request.internal_error".to_string(),
                    message: format!(
                        "The message for the {:x?} not found",
                        remove_ts_hash.unwrap()
                    ),
                })?;
                conflicts.push(existing_remove);
            }
        }

        // Check if there is an add timestamp hash for this
        let add_key = self.store_def.make_add_key(message)?;
        let add_ts_hash = self.db.get(&add_key)?;

        if add_ts_hash.is_some() {
            let add_compare = self.message_compare(
                self.store_def.add_message_type(),
                &add_ts_hash.clone().unwrap(),
                message.data.as_ref().unwrap().r#type as u8,
                &ts_hash.to_vec(),
            );
            // println!("add_compare: {}", add_compare);

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
            let existing_add = get_message(
                &self.db,
                message.data.as_ref().unwrap().fid as u32,
                self.store_def.postfix(),
                &utils::vec_to_u8_24(&add_ts_hash)?,
            )?
            .ok_or_else(|| HubError {
                code: "bad_request.internal_error".to_string(),
                message: format!("The message for the {:x?} not found", add_ts_hash.unwrap()),
            })?;
            // println!("existing_add: {:?}", existing_add);
            conflicts.push(existing_add);
        }

        // println!("conflicts: {:?}", conflicts);
        Ok(conflicts)
    }

    pub fn merge(&self, message: &Message) -> Result<Vec<u8>, HubError> {
        // Grab a merge lock. The typescript code does this by individual fid, but we don't have a
        // good way of doing that efficiently here. We'll just use an array of locks, with each fid
        // deterministically mapped to a lock.
        let _fid_lock = &self.fid_locks
            [message.data.as_ref().unwrap().fid as usize % FID_LOCKS_COUNT]
            .lock()
            .unwrap();

        if !self.store_def.is_add_type(message)
            && (!self.store_def.remove_type_supported() || !self.store_def.is_remove_type(message))
        {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "invalid message type".to_string(),
            });
        }

        let ts_hash = make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;

        if self.store_def.is_add_type(message) {
            self.merge_add(&ts_hash, message)
        } else {
            self.merge_remove(&ts_hash, message)
        }
    }

    pub fn revoke(&self, message: &Message) -> Result<Vec<u8>, HubError> {
        // Start a transaction
        let mut txn = self.db.txn();

        // Get the message ts_hash
        let ts_hash = make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;

        if self.store_def.is_add_type(message) {
            self.delete_add_transaction(&mut txn, &ts_hash, message)?;
        } else if self.store_def.remove_type_supported() && self.store_def.is_remove_type(message) {
            self.delete_remove_transaction(&mut txn, message)?;
        } else {
            return Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: "invalid message type".to_string(),
            });
        }

        let mut hub_event = self.revoke_event_args(message);

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
        // Get the merge conflicts first
        let merge_conflicts = self.get_merge_conflicts(message, ts_hash)?;
        // println!("merge_conflicts: {:?}", merge_conflicts);

        // start a transaction
        let mut txn = self.db.txn();
        // Delete all the merge conflicts
        self.delete_many_transaction(&mut txn, merge_conflicts.clone())?;

        // Add ops to store the message by messageKey and index the the messageKey by set and by target
        self.put_add_transaction(&mut txn, &ts_hash, message)?;

        // Event handler
        let mut hub_event = self.merge_event_args(message, merge_conflicts);

        let id = self
            .store_event_handler
            .commit_transaction(&mut txn, &mut hub_event)?;

        // Commit the transaction
        self.db.commit(txn)?;

        // println!("Commiting transaction ");
        // println!("hub_event: {:?}", hub_event);

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
        // Get the merge conflicts first
        let merge_conflicts = self.get_merge_conflicts(message, ts_hash)?;

        // start a transaction
        let mut txn = self.db.txn();

        // Delete all the merge conflicts
        self.delete_many_transaction(&mut txn, merge_conflicts.clone())?;

        // Add ops to store the message by messageKey and index the the messageKey by set and by target
        self.put_remove_transaction(&mut txn, ts_hash, message)?;

        // Event handler
        let mut hub_event = self.merge_event_args(message, merge_conflicts);

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
        let mut pruned_events = vec![];

        let mut count = cached_count;
        let prune_size_limit = self.store_def.get_prune_size_limit();

        let prefix = &make_message_primary_key(fid, self.store_def.postfix(), None);
        self.db
            .for_each_iterator_by_prefix(prefix, &PageOptions::default(), |_key, value| {
                // Value is a message, so try to decode it
                let message = match protos::Message::decode(value) {
                    Ok(message) => message,
                    Err(e) => {
                        return Err(HubError {
                            code: "bad_request.internal_error".to_string(),
                            message: e.to_string(),
                        })
                    }
                };

                if message.data.is_none() {
                    // This shouldn't happen, but if it does, skip it
                    warn!(self.logger, "Message data is unexpectedly missing"; "full_message" => format!("{:?}", message));
                    return Ok(false); // Continue the iteration
                }

                if count <= (prune_size_limit as u64) * units {
                    return Ok(true); // Stop the iteration, nothing left to prune
                }

                let mut txn = self.db.txn();
                if self.store_def.is_add_type(&message) {
                    let ts_hash =
                        make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;
                    self.delete_add_transaction(&mut txn, &ts_hash, &message)?;
                } else if self.store_def.remove_type_supported()
                    && self.store_def.is_remove_type(&message)
                {
                    self.delete_remove_transaction(&mut txn, &message)?;
                }

                // Event Handler
                let mut hub_event = self.prune_event_args(&message);
                let id = self
                    .store_event_handler
                    .commit_transaction(&mut txn, &mut hub_event)?;

                self.db.commit(txn)?;
                count -= 1;

                hub_event.id = id;
                pruned_events.push(hub_event);

                Ok(false) // Continue the iteration
            })?;

        Ok(pruned_events)
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

    pub fn get_all_messages_by_fid(
        &self,
        fid: u32,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        let prefix = make_message_primary_key(fid, self.store_def.postfix(), None);
        let messages =
            message::get_messages_page_by_prefix(&self.db, &prefix, &page_options, |message| {
                self.store_def.is_add_type(&message)
                    || (self.store_def.remove_type_supported()
                        && self.store_def.is_remove_type(&message))
            })?;

        Ok(messages)
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

        if a_type == self.store_def.remove_message_type()
            && b_type == self.store_def.add_message_type()
        {
            return 1;
        }
        if a_type == self.store_def.add_message_type()
            && b_type == self.store_def.remove_message_type()
        {
            return -1;
        }

        // Compare the rest of the ts_hash to break ties
        bytes_compare(&a_ts_hash[4..24], &b_ts_hash[4..24])
    }
}

// Neon bindings
// Note about dispatch - The methods are dispatched to the Store struct, which is a Box<dyn StoreDef>.
// This means the NodeJS code can pass in any store, and the Rust code will call the correct method
// for that store
impl Store {
    pub fn js_merge(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let message_bytes = cx.argument::<JsBuffer>(0);
        let message = protos::Message::decode(message_bytes.unwrap().as_slice(&cx));

        // TODO: Using the pool is so much slower
        // let pool = store.pool.clone();
        // pool.lock().unwrap().execute(move || {
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
        // });

        Ok(promise)
    }

    pub fn js_revoke(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let message_bytes = cx.argument::<JsBuffer>(0);
        let message = protos::Message::decode(message_bytes.unwrap().as_slice(&cx));

        let result = if message.is_err() {
            let e = message.unwrap_err();
            Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: e.to_string(),
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

        deferred.settle_with(&channel, move |mut cx| {
            let pruned_events = match store.prune_messages(fid, cached_count, units) {
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
        // println!("js_get_all_messages_by_fid");
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
