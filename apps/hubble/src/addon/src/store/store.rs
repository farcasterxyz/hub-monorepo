use crate::{
    db::{RocksDB, RocksDbTransaction},
    protos::{self, hub_event, HubEvent, HubEventType, MergeMessageBody, Message, MessageType},
    store::make_ts_hash,
};
use neon::context::Context;
use neon::types::buffer::TypedArray;
use neon::types::{Finalize, JsArray, JsBox, JsBuffer, JsNumber};
use neon::{context::FunctionContext, result::JsResult, types::JsPromise};
use neon::{object::Object, types::JsBoolean};
use prost::Message as _;
use std::borrow::Borrow;
use std::{
    convert::TryInto,
    sync::{Arc, Mutex},
};
use threadpool::ThreadPool;

use super::{
    bytes_compare, get_message, make_message_primary_key, message, put_message_transaction,
    StoreEventHandler, TS_HASH_LENGTH,
};
use rocksdb;

#[derive(Debug)]
pub struct HubError {
    pub code: String,
    pub message: String,
}

impl From<rocksdb::Error> for HubError {
    fn from(e: rocksdb::Error) -> HubError {
        HubError {
            code: "db.internal_error".to_string(),
            message: e.to_string(),
        }
    }
}

pub const FID_LOCKS_COUNT: usize = 4;
pub const PAGE_SIZE_MAX: usize = 10_000;

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
        txn: &RocksDbTransaction<'_>,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError>;
    fn delete_secondary_indicies(
        &self,
        txn: &RocksDbTransaction<'_>,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError>;

    fn find_merge_add_conflicts(&self, message: &Message) -> Result<(), HubError>;
    fn find_merge_remove_conflicts(&self, message: &Message) -> Result<(), HubError>;

    fn make_add_key(&self, message: &Message) -> Vec<u8>;
    fn make_remove_key(&self, message: &Message) -> Vec<u8>;
}

pub struct Store {
    store_def: Box<dyn StoreDef>,
    store_event_handler: Arc<StoreEventHandler>,
    fid_locks: Arc<[Mutex<()>; 4]>,
    db: RocksDB,                                  // TODO: Move this out
    pub pool: Arc<Mutex<threadpool::ThreadPool>>, // TODO: Move this out
}

impl Finalize for Store {
    fn finalize<'a, C: neon::context::Context<'a>>(self, _cx: &mut C) {}
}

impl Store {
    pub fn new_with_store_def(store_def: Box<dyn StoreDef>) -> Store {
        Store {
            store_def,
            store_event_handler: Arc::new(StoreEventHandler::new()),
            fid_locks: Arc::new([
                Mutex::new(()),
                Mutex::new(()),
                Mutex::new(()),
                Mutex::new(()),
            ]),
            // TODO: This is a bad idea. RocksDB should be shared across all stores.
            db: RocksDB::new("/tmp/tmprocksdb").unwrap(),
            pool: Arc::new(Mutex::new(ThreadPool::new(4))),
        }
    }

    // fn log(&self, message: &str) {
    //     // println!("{}", message);
    // }

    fn put_add_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        put_message_transaction(txn, &message)?;

        let adds_key = self.store_def.make_add_key(message);

        // TODO: Test check for the postfix

        txn.put(&adds_key, ts_hash)?;

        self.store_def
            .build_secondary_indicies(txn, ts_hash, message)?;

        Ok(())
    }

    fn delete_add_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        self.store_def
            .delete_secondary_indicies(txn, ts_hash, message)?;

        let add_key = self.store_def.make_add_key(message);
        txn.delete(&add_key)?;

        Ok(())
    }

    fn put_remove_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        message: &Message,
    ) -> Result<(), HubError> {
        if !self.store_def.remove_type_supported() {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "remove type not supported".to_string(),
            });
        }

        put_message_transaction(txn, &message)?;

        let removes_key = self.store_def.make_remove_key(message);
        txn.put(&removes_key, &message.hash)?;

        Ok(())
    }

    fn delete_remove_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        message: &Message,
    ) -> Result<(), HubError> {
        if !self.store_def.remove_type_supported() {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "remove type not supported".to_string(),
            });
        }

        let remove_key = self.store_def.make_remove_key(message);
        txn.delete(&remove_key)?;

        Ok(())
    }

    fn delete_many_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        messages: Vec<Message>,
    ) -> Result<(), HubError> {
        for message in &messages {
            if self.store_def.is_add_type(message) {
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

        if self.store_def.is_remove_type(message) {
            let remove_key = self.store_def.make_remove_key(message);
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
                    &remove_ts_hash
                        .clone()
                        .unwrap()
                        .try_into()
                        .map_err(|e: Vec<u8>| HubError {
                            code: "bad_request.internal_error".to_string(),
                            message: format!("remove_ts_hash is not 24 bytes: {:x?}", e),
                        })?, // Convert Vec<u8> to [u8; 24]
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
        let add_key = self.store_def.make_add_key(message);
        let add_ts_hash = self.db.get(&add_key)?;

        if add_ts_hash.is_some() {
            let add_compare = self.message_compare(
                self.store_def.add_message_type(),
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
            let existing_add = get_message(
                &self.db,
                message.data.as_ref().unwrap().fid as u32,
                self.store_def.postfix(),
                &add_ts_hash
                    .clone()
                    .unwrap()
                    .try_into()
                    .map_err(|e: Vec<u8>| HubError {
                        code: "bad_request.internal_error".to_string(),
                        message: format!("add_ts_hash is not 24 bytes: {:x?}", e),
                    })?, // Convert Vec<u8> to [u8; 24]
            )?
            .ok_or_else(|| HubError {
                code: "bad_request.internal_error".to_string(),
                message: format!("The message for the {:x?} not found", add_ts_hash.unwrap()),
            })?;
            conflicts.push(existing_add);
        }

        Ok(conflicts)
    }

    pub fn merge(&self, message: &Message) -> Result<u64, HubError> {
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

        // TODO: We're skipping the prune check.

        if self.store_def.is_add_type(message) {
            self.merge_add(&ts_hash, message)
        } else {
            self.merge_remove(&ts_hash, message)
        }
    }

    pub fn merge_add(
        &self,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<u64, HubError> {
        // Get the merge conflicts first
        let merge_conflicts = self.get_merge_conflicts(message, ts_hash)?;

        // start a transaction
        let txn = self.db.txn();
        // Delete all the merge conflicts
        self.delete_many_transaction(&txn, merge_conflicts.clone())?;

        // Add ops to store the message by messageKey and index the the messageKey by set and by target
        self.put_add_transaction(&txn, &ts_hash, message)?;

        // Event handler
        let id = self
            .store_event_handler
            .commit_transaction(&txn, self.merge_event_args(message, merge_conflicts))?;

        // Commit the transaction
        txn.commit()?;

        Ok(id)
    }

    pub fn merge_remove(
        &self,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<u64, HubError> {
        // Get the merge conflicts first
        let merge_conflicts = self.get_merge_conflicts(message, ts_hash)?;

        // start a transaction
        let txn = self.db.txn();
        // Delete all the merge conflicts
        self.delete_many_transaction(&txn, merge_conflicts.clone())?;

        // Add ops to store the message by messageKey and index the the messageKey by set and by target
        self.put_remove_transaction(&txn, message)?;

        // Event handler
        let id = self
            .store_event_handler
            .commit_transaction(&txn, self.merge_event_args(message, merge_conflicts))?;

        // Commit the transaction
        txn.commit()?;

        Ok(id)
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

    pub fn get_all_messages_by_fid(
        &self,
        fid: u32,
        page_options: PageOptions,
    ) -> Result<Vec<Message>, HubError> {
        // TODO: The page_token's pageToken and reverse are not handled yet
        let prefix = make_message_primary_key(fid, self.store_def.postfix(), None);
        let messages = message::get_messages_page_by_prefix(
            &self.db,
            &prefix,
            page_options.page_size.unwrap_or(PAGE_SIZE_MAX),
            |message| {
                self.store_def.is_add_type(&message)
                    || (self.store_def.remove_type_supported()
                        && self.store_def.is_remove_type(&message))
            },
        )?;

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
    pub fn js_db_clear(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store_js_box = cx
            .this()
            .downcast_or_throw::<JsBox<Arc<Store>>, _>(&mut cx)
            .unwrap();
        let store = (**store_js_box.borrow()).clone();

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        // let pool = store.pool.clone();
        // pool.lock().unwrap().execute(move || {
        let result = store.db.clear();
        deferred.settle_with(&channel, move |mut cx| {
            Ok(cx.number(result.unwrap_or_default() as f64))
        });
        // });

        Ok(promise)
    }

    pub fn js_merge(mut cx: FunctionContext) -> JsResult<JsPromise> {
        // println!("js_merge");
        let store_js_box = cx
            .this()
            .downcast_or_throw::<JsBox<Arc<Store>>, _>(&mut cx)
            .unwrap();
        let store = (**store_js_box.borrow()).clone();

        let channel = cx.channel();
        let message_bytes = cx.argument::<JsBuffer>(0);
        let message = protos::Message::decode(message_bytes.unwrap().as_slice(&cx));

        let (deferred, promise) = cx.promise();

        // TODO: Using the pool is so much slower
        // let pool = store.pool.clone();
        // pool.lock().unwrap().execute(move || {
        let result = if message.is_err() {
            -2
        } else {
            let m = message.unwrap();
            store.merge(&m).map(|r| r as i64).unwrap_or(-1)
        };

        deferred.settle_with(&channel, move |mut cx| Ok(cx.number(result as f64)));
        // });

        Ok(promise)
    }

    pub fn js_get_all_messages_by_fid(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store_js_box = cx
            .this()
            .downcast_or_throw::<JsBox<Arc<Store>>, _>(&mut cx)
            .unwrap();
        let store = (**store_js_box.borrow()).clone();

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let page_size = cx.argument::<JsNumber>(1).unwrap().value(&mut cx) as usize;

        let page_token_arg = cx.argument::<JsBuffer>(2)?;
        let reverse_arg = cx.argument::<JsBoolean>(3)?;

        let page_token = page_token_arg.as_slice(&cx).to_vec();
        let reverse = reverse_arg.value(&mut cx);

        let channel = cx.channel();

        let (deferred, promise) = cx.promise();

        let messages = store.get_all_messages_by_fid(fid, {
            PageOptions {
                page_size: Some(page_size),
                page_token: Some(page_token.to_vec()),
                reverse,
            }
        });

        deferred.settle_with(&channel, move |mut cx| {
            let messages = messages.unwrap();
            let js_messages = JsArray::new(&mut cx, messages.len() as u32);
            for (i, message) in messages.iter().enumerate() {
                let message_bytes = message.encode_to_vec();
                let mut js_buffer = cx.buffer(message_bytes.len())?;
                js_buffer
                    .as_mut_slice(&mut cx)
                    .copy_from_slice(&message_bytes);

                js_messages.set(&mut cx, i as u32, js_buffer).unwrap();
            }
            Ok(js_messages)
        });

        Ok(promise)
    }
}
