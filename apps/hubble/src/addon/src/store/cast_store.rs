use super::{
    bytes_compare, deferred_settle_messages, hub_error_to_js_throw, make_cast_id_key, make_fid_key,
    make_user_key, message,
    store::{Store, StoreDef},
    utils::{encode_messages_to_js_object, get_page_options, get_store},
    HubError, MessagesPage, PageOptions, RootPrefix, StoreEventHandler, UserPostfix, HASH_LENGTH,
    PAGE_SIZE_MAX, TRUE_VALUE, TS_HASH_LENGTH,
};
use crate::{
    db::{RocksDB, RocksDbTransactionBatch},
    protos::{self, Message, MessageType},
};
use crate::{
    protos::{message_data, CastRemoveBody},
    THREAD_POOL,
};
use neon::{
    context::{Context, FunctionContext},
    result::JsResult,
    types::{buffer::TypedArray, JsBox, JsBuffer, JsNumber, JsPromise, JsString},
};
use prost::Message as _;
use std::{borrow::Borrow, convert::TryInto, sync::Arc};

type Parent = protos::cast_add_body::Parent;

/**
 * CastStore persists Cast messages in RocksDB using a two-phase CRDT set to guarantee eventual
 * consistency.
 *
 * A Cast is created by a user and contains 320 characters of text and upto two embedded URLs.
 * Casts are added to the Store with a CastAdd and removed with a CastRemove. A CastAdd can be
 * a child to another CastAdd or arbitrary URI.
 *
 * Cast Messages collide if their tsHash (for CastAdds) or targetTsHash (for CastRemoves) are the
 * same for the same fid. Two CastAdds can never collide since any change to message content is
 * guaranteed to result in a unique hash value. CastRemoves can collide with CastAdds and with
 * each other, and such cases are handled with Remove-Wins and Last-Write-Wins rules as follows:
 *
 * 1. Remove wins over Adds
 * 2. Highest timestamp wins
 * 3. Highest lexicographic hash wins
 *
 * CastMessages are stored ordinally in RocksDB indexed by a unique key `fid:tsHash` which makes
 * truncating a user's earliest messages easy. Indices are built to lookup cast adds in the adds
 * set, cast removes in the removes set, cast adds that are the children of a cast add, and cast
 * adds that mention a specific user. The key-value entries created are:
 *
 * 1. fid:tsHash -> cast message
 * 2. fid:set:tsHash -> fid:tsHash (Add Set Index)
 * 3. fid:set:targetTsHash -> fid:tsHash (Remove Set Index)
 * 4. parentFid:parentTsHash:fid:tsHash -> fid:tsHash (Child Set Index)
 * 5. mentionFid:fid:tsHash -> fid:tsHash (Mentions Set Index)
 */
pub struct CastStoreDef {
    prune_size_limit: u32,
}

impl StoreDef for CastStoreDef {
    fn postfix(&self) -> u8 {
        UserPostfix::CastMessage as u8
    }

    fn add_message_type(&self) -> u8 {
        MessageType::CastAdd as u8
    }

    fn remove_message_type(&self) -> u8 {
        MessageType::CastRemove as u8
    }

    fn is_add_type(&self, message: &protos::Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519 as i32
            && message.data.is_some()
            && message.data.as_ref().unwrap().r#type == MessageType::CastAdd as i32
            && message.data.as_ref().unwrap().body.is_some()
    }

    fn is_remove_type(&self, message: &protos::Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519 as i32
            && message.data.is_some()
            && message.data.as_ref().unwrap().r#type == MessageType::CastRemove as i32
            && message.data.as_ref().unwrap().body.is_some()
    }

    fn find_merge_add_conflicts(
        &self,
        db: &RocksDB,
        message: &protos::Message,
    ) -> Result<(), super::store::HubError> {
        // Look up the remove tsHash for this cast
        let remove_key = self.make_remove_key(message)?;
        // If remove tsHash exists, fail because this cast has already been removed
        if let Ok(Some(_)) = db.get(&remove_key) {
            return Err(HubError {
                code: "bad_request.conflict".to_string(),
                message: "message conflicts with a CastRemove".to_string(),
            });
        }

        // Look up the add tsHash for this cast
        let add_key = self.make_add_key(message)?;
        // If add tsHash exists, no-op because this cast has already been added
        if let Ok(Some(_)) = db.get(&add_key) {
            return Err(HubError {
                code: "bad_request.duplicate".to_string(),
                message: "message has already been merged".to_string(),
            });
        }

        // No conflicts
        Ok(())
    }

    fn find_merge_remove_conflicts(
        &self,
        _db: &RocksDB,
        _message: &protos::Message,
    ) -> Result<(), super::store::HubError> {
        Ok(())
    }

    // RemoveWins + LWW, instead of default
    fn message_compare(
        &self,
        a_type: u8,
        a_ts_hash: &Vec<u8>,
        b_type: u8,
        b_ts_hash: &Vec<u8>,
    ) -> i8 {
        // Compare message types to enforce that RemoveWins in case of LWW ties.
        if (a_type == MessageType::CastRemove as u8) && (b_type == MessageType::CastAdd as u8) {
            return 1;
        } else if (a_type == MessageType::CastAdd as u8)
            && (b_type == MessageType::CastRemove as u8)
        {
            return -1;
        }

        // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
        let ts_compare = bytes_compare(&a_ts_hash[0..4], &b_ts_hash[0..4]);
        if ts_compare != 0 {
            return ts_compare;
        }

        // Compare the rest of the ts_hash to break ties
        bytes_compare(&a_ts_hash[4..24], &b_ts_hash[4..24])
    }

    fn build_secondary_indices(
        &self,
        txn: &mut RocksDbTransactionBatch,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        if let Ok(Some(by_parent_key)) = self.by_parent_secondary_index_key(ts_hash, message) {
            txn.put(by_parent_key, vec![TRUE_VALUE]);
        }
        if let Ok(Some(by_mention_keys)) = self.by_mention_secondary_index_key(ts_hash, message) {
            for by_mention_key in by_mention_keys {
                txn.put(by_mention_key, vec![TRUE_VALUE]);
            }
        }
        Ok(())
    }

    fn delete_secondary_indices(
        &self,
        txn: &mut RocksDbTransactionBatch,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        let by_parent_key = self.by_parent_secondary_index_key(ts_hash, message);

        if let Ok(Some(by_parent_key)) = by_parent_key {
            txn.delete(by_parent_key);
        }

        if let Ok(Some(by_mention_keys)) = self.by_mention_secondary_index_key(ts_hash, message) {
            for by_mention_key in by_mention_keys {
                txn.delete(by_mention_key);
            }
        }

        Ok(())
    }

    fn make_add_key(&self, message: &protos::Message) -> Result<Vec<u8>, HubError> {
        let hash = match message.data.as_ref().unwrap().body.as_ref() {
            Some(message_data::Body::CastAddBody(_)) => message.hash.as_ref(),
            Some(message_data::Body::CastRemoveBody(cast_remove_body)) => {
                cast_remove_body.target_hash.as_ref()
            }
            _ => {
                return Err(HubError {
                    code: "bad_request.validation_failure".to_string(),
                    message: "Invalid cast body for add key".to_string(),
                })
            }
        };
        Ok(Self::make_cast_adds_key(
            message.data.as_ref().unwrap().fid as u32,
            hash,
        ))
    }

    fn make_remove_key(&self, message: &protos::Message) -> Result<Vec<u8>, HubError> {
        let hash = match message.data.as_ref().unwrap().body.as_ref() {
            Some(message_data::Body::CastAddBody(_)) => message.hash.as_ref(),
            Some(message_data::Body::CastRemoveBody(cast_remove_body)) => {
                cast_remove_body.target_hash.as_ref()
            }
            _ => {
                return Err(HubError {
                    code: "bad_request.validation_failure".to_string(),
                    message: "Invalid cast body for remove key".to_string(),
                })
            }
        };

        Ok(Self::make_cast_removes_key(
            message.data.as_ref().unwrap().fid as u32,
            hash,
        ))
    }

    fn get_prune_size_limit(&self) -> u32 {
        self.prune_size_limit
    }
}

impl CastStoreDef {
    fn by_parent_secondary_index_key(
        &self,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &protos::Message,
    ) -> Result<Option<Vec<u8>>, HubError> {
        // For cast add, make sure at least one of parentCastId or parentUrl is set
        let cast_body = match message.data.as_ref().unwrap().body.as_ref().unwrap() {
            message_data::Body::CastAddBody(cast_add_body) => cast_add_body,
            message_data::Body::CastRemoveBody(_) => return Ok(None),
            _ => Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "Invalid cast body".to_string(),
            })?,
        };
        let parent = cast_body.parent.as_ref().ok_or(HubError {
            code: "bad_request.validation_failure".to_string(),
            message: "Invalid cast body".to_string(),
        })?;

        let by_parent_key = Self::make_cast_by_parent_key(
            parent,
            message.data.as_ref().unwrap().fid as u32,
            Some(ts_hash),
        );

        Ok(Some(by_parent_key))
    }

    // Generates unique keys used to store or fetch CastAdd messages in the byParentKey index
    pub fn make_cast_by_parent_key(
        parent: &Parent,
        fid: u32,
        ts_hash: Option<&[u8; TS_HASH_LENGTH]>,
    ) -> Vec<u8> {
        let mut key = Vec::with_capacity(1 + 28 + 24 + 4);

        key.push(RootPrefix::CastsByParent as u8); // CastsByParent prefix, 1 byte
        key.extend_from_slice(&Self::make_parent_key(parent));
        if ts_hash.is_some() && ts_hash.unwrap().len() == TS_HASH_LENGTH {
            key.extend_from_slice(ts_hash.unwrap());
        }
        if fid > 0 {
            key.extend_from_slice(&make_fid_key(fid));
        }

        key
    }

    pub fn make_parent_key(target: &Parent) -> Vec<u8> {
        match target {
            Parent::ParentUrl(url) => url.as_bytes().to_vec(),
            Parent::ParentCastId(cast_id) => make_cast_id_key(cast_id),
        }
    }

    fn by_mention_secondary_index_key(
        &self,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &protos::Message,
    ) -> Result<Option<Vec<Vec<u8>>>, HubError> {
        // For cast add, make sure at least one of parentCastId or parentUrl is set
        let cast_body = match message.data.as_ref().unwrap().body.as_ref().unwrap() {
            message_data::Body::CastAddBody(cast_add_body) => cast_add_body,
            message_data::Body::CastRemoveBody(_) => return Ok(None),
            _ => Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "Invalid cast body".to_string(),
            })?,
        };
        // Create a vector of mention keys
        if cast_body.mentions.is_empty() {
            return Ok(None);
        }
        let mut result = Vec::with_capacity(cast_body.mentions.len());
        for &mention in cast_body.mentions.iter() {
            let mention_key = Self::make_cast_by_mention_key(
                mention as u32,
                message.data.as_ref().unwrap().fid as u32,
                Some(ts_hash),
            );
            result.push(mention_key);
        }
        return Ok(Some(result));
    }

    // Generates unique keys used to store or fetch CastAdd messages in the adds set index
    pub fn make_cast_adds_key(fid: u32, hash: &Vec<u8>) -> Vec<u8> {
        let mut key = Vec::with_capacity(5 + 1 + 20);

        key.extend_from_slice(&make_user_key(fid));
        key.push(UserPostfix::CastAdds as u8); // CastAdds postfix, 1 byte
        if hash.len() == HASH_LENGTH {
            // hash, 20 bytes
            key.extend_from_slice(hash.as_slice());
        }
        key
    }

    // Generates unique keys used to store or fetch CastAdd messages in the byMention key index
    pub fn make_cast_by_mention_key(
        mention: u32,
        fid: u32,
        ts_hash: Option<&[u8; TS_HASH_LENGTH]>,
    ) -> Vec<u8> {
        let mut key = Vec::with_capacity(1 + 4 + 24 + 4);
        key.push(RootPrefix::CastsByMention as u8); // CastsByMention prefix, 1 byte
        key.extend_from_slice(&make_fid_key(mention));
        if ts_hash.is_some() && ts_hash.unwrap().len() == TS_HASH_LENGTH {
            key.extend_from_slice(ts_hash.unwrap());
        }
        if fid > 0 {
            key.extend_from_slice(&make_fid_key(fid));
        }
        key
    }

    // Generates unique keys used to store or fetch CastRemove messages in the removes set index
    pub fn make_cast_removes_key(fid: u32, hash: &Vec<u8>) -> Vec<u8> {
        let mut key = Vec::with_capacity(5 + 1 + 20);

        key.extend_from_slice(&make_user_key(fid));
        key.push(UserPostfix::CastRemoves as u8); // CastAdds postfix, 1 byte
        if hash.len() == HASH_LENGTH {
            // hash, 20 bytes
            key.extend_from_slice(hash.as_slice());
        }
        key
    }
}

pub struct CastStore {}

impl CastStore {
    pub fn new(
        db: Arc<RocksDB>,
        store_event_handler: Arc<StoreEventHandler>,
        prune_size_limit: u32,
    ) -> Store {
        Store::new_with_store_def(
            db,
            store_event_handler,
            Box::new(CastStoreDef { prune_size_limit }),
        )
    }

    pub fn get_cast_add(
        store: &Store,
        fid: u32,
        hash: Vec<u8>,
    ) -> Result<Option<protos::Message>, HubError> {
        let partial_message = protos::Message {
            data: Some(protos::MessageData {
                fid: fid as u64,
                r#type: MessageType::CastAdd.into(),
                body: Some(protos::message_data::Body::CastAddBody(
                    protos::CastAddBody {
                        ..Default::default()
                    },
                )),
                ..Default::default()
            }),
            hash,
            ..Default::default()
        };

        store.get_add(&partial_message)
    }

    pub fn js_get_cast_add(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let channel = cx.channel();

        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let hash_buffer = cx.argument::<JsBuffer>(1)?;
        let hash_bytes = hash_buffer.as_slice(&cx);

        let result = match Self::get_cast_add(&store, fid, hash_bytes.to_vec()) {
            Ok(Some(message)) => message.encode_to_vec(),
            Ok(None) => cx.throw_error(format!(
                "{}/{} for {}",
                "not_found", "castAddMessage not found", fid
            ))?,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| {
            let mut js_buffer = cx.buffer(result.len())?;
            js_buffer.as_mut_slice(&mut cx).copy_from_slice(&result);
            Ok(js_buffer)
        });

        Ok(promise)
    }

    pub fn get_cast_remove(
        store: &Store,
        fid: u32,
        hash: Vec<u8>,
    ) -> Result<Option<protos::Message>, HubError> {
        let partial_message = protos::Message {
            data: Some(protos::MessageData {
                fid: fid as u64,
                r#type: MessageType::CastRemove.into(),
                body: Some(protos::message_data::Body::CastRemoveBody(CastRemoveBody {
                    target_hash: hash.clone(),
                })),
                ..Default::default()
            }),
            ..Default::default()
        };

        store.get_remove(&partial_message)
    }

    pub fn js_get_cast_remove(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let hash_buffer = cx.argument::<JsBuffer>(1)?;
        let hash_bytes = hash_buffer.as_slice(&cx).to_vec();

        let result = match Self::get_cast_remove(&store, fid, hash_bytes) {
            Ok(Some(message)) => message.encode_to_vec(),
            Ok(None) => cx.throw_error(format!(
                "{}/{} for {}",
                "not_found", "CastRemoveMessage not found", fid
            ))?,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| {
            let mut js_buffer = cx.buffer(result.len())?;
            js_buffer.as_mut_slice(&mut cx).copy_from_slice(&result);
            Ok(js_buffer)
        });

        Ok(promise)
    }

    pub fn get_cast_adds_by_fid(
        store: &Store,
        fid: u32,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        store.get_adds_by_fid(fid, page_options, Some(|_: &Message| true))
    }

    pub fn js_create_cast_store(mut cx: FunctionContext) -> JsResult<JsBox<Arc<Store>>> {
        let db_js_box = cx.argument::<JsBox<Arc<RocksDB>>>(0)?;
        let db = (**db_js_box.borrow()).clone();

        // Read the StoreEventHandler
        let store_event_handler_js_box = cx.argument::<JsBox<Arc<StoreEventHandler>>>(1)?;
        let store_event_handler = (**store_event_handler_js_box.borrow()).clone();

        // Read the prune size limit and prune time limit from the options
        let prune_size_limit = cx
            .argument::<JsNumber>(2)
            .map(|n| n.value(&mut cx) as u32)?;

        Ok(cx.boxed(Arc::new(Self::new(
            db,
            store_event_handler,
            prune_size_limit,
        ))))
    }

    pub fn js_get_cast_adds_by_fid(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let page_options = get_page_options(&mut cx, 1)?;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let messages = Self::get_cast_adds_by_fid(&store, fid, &page_options);

            deferred_settle_messages(deferred, &channel, messages);
        });

        Ok(promise)
    }

    pub fn get_cast_removes_by_fid(
        store: &Store,
        fid: u32,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        store.get_removes_by_fid(fid, page_options, Some(|_: &Message| true))
    }

    pub fn js_get_cast_removes_by_fid(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let page_options = get_page_options(&mut cx, 1)?;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let messages = Self::get_cast_removes_by_fid(&store, fid, &page_options);
            deferred_settle_messages(deferred, &channel, messages);
        });

        Ok(promise)
    }

    pub fn get_casts_by_parent(
        store: &Store,
        parent: &Parent,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        let prefix = CastStoreDef::make_cast_by_parent_key(parent, 0, None);

        let mut message_keys = vec![];
        let mut last_key = vec![];

        store
            .db()
            .for_each_iterator_by_prefix_unbounded(&prefix, page_options, |key, _| {
                let ts_hash_offset = prefix.len();
                let fid_offset = ts_hash_offset + TS_HASH_LENGTH;

                let fid = u32::from_be_bytes(key[fid_offset..fid_offset + 4].try_into().unwrap());
                let ts_hash = key[ts_hash_offset..ts_hash_offset + TS_HASH_LENGTH]
                    .try_into()
                    .unwrap();
                let message_primary_key = crate::store::message::make_message_primary_key(
                    fid,
                    store.postfix(),
                    Some(&ts_hash),
                );

                message_keys.push(message_primary_key.to_vec());
                if message_keys.len() >= page_options.page_size.unwrap_or(PAGE_SIZE_MAX) {
                    last_key = key.to_vec();
                    return Ok(true); // Stop iterating
                }

                Ok(false) // Continue iterating
            })?;

        let messages = message::get_many_messages(store.db().borrow(), message_keys)?;
        let next_page_token = if last_key.len() > 0 {
            Some(last_key[prefix.len()..].to_vec())
        } else {
            None
        };

        Ok(MessagesPage {
            messages,
            next_page_token,
        })
    }

    pub fn js_get_casts_by_parent(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let parent_cast_id_buffer = cx.argument::<JsBuffer>(0)?;
        let parent_cast_id_bytes = parent_cast_id_buffer.as_slice(&cx);
        let parent_cast_id = if parent_cast_id_bytes.len() > 0 {
            match protos::CastId::decode(parent_cast_id_bytes) {
                Ok(cast_id) => Some(cast_id),
                Err(e) => return cx.throw_error(e.to_string()),
            }
        } else {
            None
        };

        let parent_url = cx.argument::<JsString>(1).map(|s| s.value(&mut cx))?;

        // We need at least one of target_cast_id or target_url
        if parent_cast_id.is_none() && parent_url.is_empty() {
            return cx.throw_error("parent_cast_id or parent_url is required");
        }

        let target = if parent_cast_id.is_some() {
            Parent::ParentCastId(parent_cast_id.unwrap())
        } else {
            Parent::ParentUrl(parent_url)
        };

        let page_options = get_page_options(&mut cx, 2)?;

        let messages = match Self::get_casts_by_parent(&store, &target, &page_options) {
            Ok(messages) => messages,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| {
            encode_messages_to_js_object(&mut cx, messages)
        });

        Ok(promise)
    }

    pub fn get_casts_by_mention(
        store: &Store,
        mention: u32,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        let prefix = CastStoreDef::make_cast_by_mention_key(mention, 0, None);

        let mut message_keys = vec![];
        let mut last_key = vec![];

        store
            .db()
            .for_each_iterator_by_prefix_unbounded(&prefix, page_options, |key, _| {
                let ts_hash_offset = prefix.len();
                let fid_offset = ts_hash_offset + TS_HASH_LENGTH;

                let fid = u32::from_be_bytes(key[fid_offset..fid_offset + 4].try_into().unwrap());
                let ts_hash = key[ts_hash_offset..ts_hash_offset + TS_HASH_LENGTH]
                    .try_into()
                    .unwrap();
                let message_primary_key = crate::store::message::make_message_primary_key(
                    fid,
                    store.postfix(),
                    Some(&ts_hash),
                );

                message_keys.push(message_primary_key.to_vec());
                if message_keys.len() >= page_options.page_size.unwrap_or(PAGE_SIZE_MAX) {
                    last_key = key.to_vec();
                    return Ok(true); // Stop iterating
                }

                Ok(false) // Continue iterating
            })?;

        let messages = message::get_many_messages(store.db().borrow(), message_keys)?;
        let next_page_token = if last_key.len() > 0 {
            Some(last_key[prefix.len()..].to_vec())
        } else {
            None
        };

        Ok(MessagesPage {
            messages,
            next_page_token,
        })
    }

    pub fn js_get_casts_by_mention(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let mention = cx.argument::<JsNumber>(0)?;
        let mention = mention.value(&mut cx) as u32;
        let page_options = get_page_options(&mut cx, 1)?;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let messages = Self::get_casts_by_mention(&store, mention, &page_options);

            deferred_settle_messages(deferred, &channel, messages);
        });

        Ok(promise)
    }
}
