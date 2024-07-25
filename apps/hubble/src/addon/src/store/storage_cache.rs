use crate::db::RocksDB;
use crate::THREAD_POOL;
use neon::{
    context::{Context, FunctionContext},
    result::JsResult,
    types::{buffer::TypedArray, JsBox, JsNumber, JsPromise},
};

use crate::protos::{hub_event, HubEvent, Message, MessageType};
use crate::store::{
    bytes_compare, get_storage_cache, hub_error_to_js_throw, make_message_primary_key,
    make_ts_hash, type_to_set_postfix, HubError, PageOptions, FID_BYTES, PRIMARY_KEY_LENGTH,
};
use neon::prelude::Finalize;
use neon::types::JsBoolean;
use std::clone::Clone;
use std::collections::HashMap;
use std::ops::Deref;
use std::sync::{Arc, Mutex, RwLock};

pub const PENDING_SCANS_LOCKS_COUNT: usize = 5;

pub struct StorageCache {
    db: Arc<RocksDB>,
    earliest_ts_hashes: Arc<RwLock<HashMap<Vec<u8>, Option<Vec<u8>>>>>, // We're not using a RwLock here because this is very read heavy
    fid_locks: Arc<[Mutex<()>; PENDING_SCANS_LOCKS_COUNT]>,
}

// Needed to let the StorageCache be owned by the JS runtime
impl Finalize for StorageCache {}

impl StorageCache {
    pub fn new(db: Arc<RocksDB>) -> Self {
        Self {
            db,
            earliest_ts_hashes: Arc::new(RwLock::new(HashMap::new())),
            fid_locks: Arc::new([
                Mutex::new(()),
                Mutex::new(()),
                Mutex::new(()),
                Mutex::new(()),
                Mutex::new(()),
            ]),
        }
    }

    pub fn get_earliest_ts_hash(&self, fid: u32, set: u8) -> Result<Option<Vec<u8>>, HubError> {
        let prefix = make_message_primary_key(fid, set, None);

        let existing_value = self.get_earliest_ts_hash_from_cache(&prefix);
        return if let Some(value) = existing_value {
            // We have a cached value
            if let Some(value) = value {
                Ok(Some(value.clone()))
            } else {
                Ok(None)
            }
        } else {
            // Nothing in the cache, read from db, locking on the fid to prevent too many concurrent db scans
            let _lock = self.fid_locks[fid as usize % PENDING_SCANS_LOCKS_COUNT]
                .lock()
                .unwrap();
            let ts_hash_result = self.get_earliest_ts_hash_from_db(&prefix);
            if ts_hash_result.is_ok() {
                let earliest_ts_hash = ts_hash_result.unwrap();
                self.set_earliest_ts_hash(fid, set, &earliest_ts_hash);
                Ok(earliest_ts_hash)
            } else {
                Err(ts_hash_result.unwrap_err())
            }
        };
    }

    pub fn process_event(&self, event: &mut HubEvent) {
        // Based on the contents of event body, add or remove messages
        match &event.body {
            Some(body) => match body {
                hub_event::Body::MergeMessageBody(merge_message_body) => {
                    if merge_message_body.message.is_some() {
                        self.add_message(merge_message_body.message.as_ref().unwrap());
                    }
                    for deleted_message in merge_message_body.deleted_messages.iter() {
                        self.remove_message(deleted_message);
                    }
                }
                hub_event::Body::RevokeMessageBody(delete_message_body) => {
                    if delete_message_body.message.is_some() {
                        self.remove_message(delete_message_body.message.as_ref().unwrap());
                    }
                }
                hub_event::Body::PruneMessageBody(prune_message_body) => {
                    if prune_message_body.message.is_some() {
                        self.remove_message(prune_message_body.message.as_ref().unwrap());
                    }
                }
                _ => {}
            },
            None => {}
        }
    }

    fn add_message(&self, message: &Message) {
        let fid = message.data.as_ref().unwrap().fid as u32;
        let set = type_to_set_postfix(
            MessageType::try_from(message.data.as_ref().unwrap().r#type).unwrap(),
        ) as u8;

        let current_earliest_result = self.get_earliest_ts_hash(fid, set);
        match current_earliest_result {
            Ok(result) => match result {
                Some(earliest_ts_hash) => {
                    let message_ts_hash =
                        make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash);
                    match message_ts_hash {
                        Ok(ts_hash) => {
                            if bytes_compare(earliest_ts_hash.deref(), &ts_hash) > 0 {
                                self.set_earliest_ts_hash(fid, set, &Some(ts_hash.to_vec()));
                            }
                        }
                        Err(_) => {}
                    }
                }
                None => {
                    let message_ts_hash =
                        make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash);
                    if message_ts_hash.is_ok() {
                        let ts_hash = message_ts_hash.unwrap();
                        self.set_earliest_ts_hash(fid, set, &Some(ts_hash.to_vec()));
                    }
                }
            },
            _ => {}
        }
    }

    fn remove_message(&self, message: &Message) {
        let fid = message.data.as_ref().unwrap().fid as u32;
        let set = type_to_set_postfix(
            MessageType::try_from(message.data.as_ref().unwrap().r#type).unwrap(),
        ) as u8;

        let current_earliest_result = self.get_earliest_ts_hash(fid, set);
        match current_earliest_result {
            Ok(result) => match result {
                Some(earliest_ts_hash) => {
                    let message_ts_hash =
                        make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash);
                    match message_ts_hash {
                        Ok(ts_hash) => {
                            if bytes_compare(earliest_ts_hash.deref(), &ts_hash) < 1 {
                                self.clear_earliest_ts_hash(fid, set);
                            }
                        }
                        Err(_) => {}
                    }
                }
                None => {}
            },
            _ => {}
        }
    }

    fn clear_earliest_ts_hash(&self, fid: u32, set: u8) {
        let prefix = make_message_primary_key(fid, set as u8, None);
        self.earliest_ts_hashes.write().unwrap().remove(&prefix);
    }

    fn set_earliest_ts_hash(&self, fid: u32, set: u8, value: &Option<Vec<u8>>) {
        let prefix = make_message_primary_key(fid, set as u8, None);
        self.earliest_ts_hashes
            .write()
            .unwrap()
            .insert(prefix, value.clone());
    }

    fn clear_cache(&self) {
        self.earliest_ts_hashes.write().unwrap().clear();
    }

    fn get_earliest_ts_hash_from_db(&self, prefix: &[u8]) -> Result<Option<Vec<u8>>, HubError> {
        let mut earliest_ts_hash: Option<Vec<u8>> = None;
        let res =
            self.db
                .for_each_iterator_by_prefix(prefix, &PageOptions::default(), |key, _value| {
                    if key.len() == PRIMARY_KEY_LENGTH {
                        let ts_hash = key.to_vec()[1 + FID_BYTES + 1..].to_vec();
                        earliest_ts_hash = Some(ts_hash);
                    }
                    // Finish the iteration, we only care about the first message
                    return Ok(true);
                });

        if res.is_err() {
            return Err(res.unwrap_err());
        }
        return Ok(earliest_ts_hash);
    }

    fn get_earliest_ts_hash_from_cache(&self, prefix: &Vec<u8>) -> Option<Option<Vec<u8>>> {
        let lock = self.earliest_ts_hashes.read();
        let guard = lock.unwrap();
        return guard.get(prefix).cloned();
    }
}

impl StorageCache {
    pub fn js_create_storage_cache(mut cx: FunctionContext) -> JsResult<JsBox<Arc<StorageCache>>> {
        let db = cx.argument::<JsBox<Arc<RocksDB>>>(0)?;
        return Ok(cx.boxed(Arc::new(StorageCache::new((**db).clone()))));
    }

    pub fn js_get_earliest_ts_hash(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let storage_cache = get_storage_cache(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let set = cx.argument::<JsNumber>(1).unwrap().value(&mut cx) as u8;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let result = storage_cache.get_earliest_ts_hash(fid, set);

            deferred.settle_with(&channel, move |mut cx| match result {
                Ok(Some(r)) => {
                    let mut js_buffer = cx.buffer(r.len())?;
                    js_buffer.as_mut_slice(&mut cx).copy_from_slice(&r);
                    Ok(js_buffer)
                }
                Ok(None) => Ok(cx.buffer(0)?.into()),
                Err(e) => hub_error_to_js_throw(&mut cx, e),
            });
        });
        Ok(promise)
    }

    pub fn js_clear_earliest_ts_hash(mut cx: FunctionContext) -> JsResult<JsBoolean> {
        let storage_cache = get_storage_cache(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let set = cx.argument::<JsNumber>(1).unwrap().value(&mut cx) as u8;

        storage_cache.clear_earliest_ts_hash(fid, set);

        Ok(cx.boolean(true))
    }

    pub fn js_clear_cache(mut cx: FunctionContext) -> JsResult<JsBoolean> {
        let storage_cache = get_storage_cache(&mut cx)?;

        storage_cache.clear_cache();

        Ok(cx.boolean(true))
    }
}
