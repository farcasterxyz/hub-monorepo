use std::{borrow::Borrow, convert::TryInto, sync::Arc};

use crate::db::{RocksDB, RocksDbTransactionBatch};
use crate::protos::link_body::Target;
use crate::protos::message_data::Body;
use crate::protos::{message_data, LinkBody, Message, MessageData, MessageType};
use crate::store::{
    get_page_options, get_store, hub_error_to_js_throw, make_fid_key, make_user_key, message,
    HubError, IntoI32, IntoU8, MessagesPage, PageOptions, RootPrefix, Store, StoreDef,
    StoreEventHandler, UserPostfix, PAGE_SIZE_MAX, TS_HASH_LENGTH,
};
use crate::{protos, THREAD_POOL};
use neon::prelude::{JsPromise, JsString};
use neon::types::buffer::TypedArray;
use neon::{
    context::{Context, FunctionContext},
    result::JsResult,
    types::{JsBox, JsNumber},
};
use prost::Message as _;

use super::deferred_settle_messages;

/**
 * LinkStore persists Link Messages in RocksDB using a two-phase CRDT set to guarantee
 * eventual consistency.
 *
 * A Link is created by a user and points at a target (e.g. fid) and has a type (e.g. "follow").
 * Links are added with a LinkAdd and removed with a LinkRemove. Link messages can
 * collide if two messages have the same user fid, target, and type. Collisions are handled with
 * Last-Write-Wins + Remove-Wins rules as follows:
 *
 * 1. Highest timestamp wins
 * 2. Remove wins over Adds
 * 3. Highest lexicographic hash wins
 *
 * LinkMessages are stored ordinally in RocksDB indexed by a unique key `fid:tsHash`,
 * which makes truncating a user's earliest messages easy. Indices are built to look up
 * link adds in the adds set, link removes in the remove set and all links
 * for a given target. The key-value entries created by the Link Store are:
 *
 * 1. fid:tsHash -> link message
 * 2. fid:set:targetCastTsHash:linkType -> fid:tsHash (Set Index)
 * 3. linkTarget:linkType:targetCastTsHash -> fid:tsHash (Target Index)
 */
pub struct LinkStore {
    prune_size_limit: u32,
}

impl LinkStore {
    // Even though fid is 64 bits, we're only using 32 bits for now, to save 4 bytes per key.
    // This is fine until 4 billion users, after which we'll need to do a migration of this key in the DB.
    const FID_BYTE_SIZE: usize = 4;
    const LINK_TYPE_BYTE_SIZE: usize = 8;
    const POSTFIX_BYTE_SIZE: usize = 1;
    const ROOT_PREFIX_BYTE_SIZE: usize = 1;
    const ROOT_PREFIXED_FID_BYTE_SIZE: usize = 33;
    const TARGET_ID_BYTE_SIZE: usize = 4;

    pub fn new(
        db: Arc<RocksDB>,
        store_event_handler: Arc<StoreEventHandler>,
        prune_size_limit: u32,
    ) -> Store {
        Store::new_with_store_def(
            db,
            store_event_handler,
            Box::new(LinkStore { prune_size_limit }),
        )
    }

    pub fn create_link_store(mut cx: FunctionContext) -> JsResult<JsBox<Arc<Store>>> {
        let db_js_box = cx.argument::<JsBox<Arc<RocksDB>>>(0)?;
        let db = (**db_js_box.borrow()).clone();

        // Read the StoreEventHandler
        let store_event_handler_js_box = cx.argument::<JsBox<Arc<StoreEventHandler>>>(1)?;
        let store_event_handler = (**store_event_handler_js_box.borrow()).clone();

        // Read the prune size limit and prune time limit from the options
        let prune_size_limit = cx
            .argument::<JsNumber>(2)
            .map(|n| n.value(&mut cx) as u32)?;

        Ok(cx.boxed(Arc::new(LinkStore::new(
            db,
            store_event_handler,
            prune_size_limit,
        ))))
    }

    /// Finds a LinkAdd Message by checking the Adds Set index.
    /// Return the LinkAdd Model if it exists, none otherwise
    ///
    /// # Arguments
    /// * `store` - the Rust data store used to query for finding a LinkAdd message
    /// * `fid` - fid of the user who created the link add
    /// * `r#type` - type of link that was added
    /// * `target` - id of the fid being linked to
    pub fn get_link_add(
        store: &Store,
        fid: u32,
        r#type: String,
        target: Option<Target>,
    ) -> Result<Option<Message>, HubError> {
        let partial_message = protos::Message {
            data: Some(MessageData {
                fid: fid as u64,
                r#type: MessageType::LinkAdd.into(),
                body: Some(message_data::Body::LinkBody(LinkBody {
                    r#type,
                    target,
                    ..Default::default()
                })),
                ..Default::default()
            }),
            ..Default::default()
        };

        store.get_add(&partial_message)
    }

    pub fn get_link_adds_by_fid(
        store: &Store,
        fid: u32,
        r#type: String,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        store.get_adds_by_fid(
            fid,
            page_options,
            Some(|message: &Message| {
                message
                    .data
                    .as_ref()
                    .is_some_and(|data| match data.body.as_ref() {
                        Some(message_data::Body::LinkBody(body)) => {
                            r#type.is_empty() || body.r#type == r#type
                        }
                        _ => false,
                    })
            }),
        )
    }

    pub fn get_all_link_messages_by_fid(
        store: &Store,
        fid: u32,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        store.get_all_messages_by_fid(fid, page_options)
    }

    pub fn get_links_by_target(
        store: &Store,
        target: &Target,
        r#type: String,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        let prefix: Vec<u8> = LinkStore::links_by_target_key(target, 0, None)?;

        let mut message_keys = vec![];
        let mut last_key = vec![];

        store
            .db()
            .for_each_iterator_by_prefix_unbounded(&prefix, page_options, |key, value| {
                if r#type.is_empty() || value.eq(r#type.as_bytes()) {
                    let ts_hash_offset = prefix.len();
                    let fid_offset: usize = ts_hash_offset + TS_HASH_LENGTH;

                    let fid =
                        u32::from_be_bytes(key[fid_offset..fid_offset + 4].try_into().unwrap());
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
                }

                Ok(false)
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

    /// Finds a LinkRemove Message by checking the Remove Set index.
    /// Return the LinkRemove message if it exists, none otherwise
    ///
    /// # Arguments
    /// * `store` - the Rust data store used to query for finding a LinkAdd message
    /// * `fid` - fid of the user who created the link add
    /// * `r#type` - type of link that was added
    /// * `target` - id of the fid being linked to
    pub fn get_link_remove(
        store: &Store,
        fid: u32,
        r#type: String,
        target: Option<Target>,
    ) -> Result<Option<Message>, HubError> {
        let partial_message = protos::Message {
            data: Some(MessageData {
                fid: fid as u64,
                r#type: MessageType::LinkRemove.into(),
                body: Some(message_data::Body::LinkBody(LinkBody {
                    r#type,
                    target,
                    ..Default::default()
                })),
                ..Default::default()
            }),
            ..Default::default()
        };

        let r = store.get_remove(&partial_message);
        r
    }

    // Generates a unique key used to store a LinkCompactState message key in the store
    fn link_compact_state_add_key(fid: u32, link_type: &String) -> Result<Vec<u8>, HubError> {
        let mut key = Vec::with_capacity(
            Self::ROOT_PREFIXED_FID_BYTE_SIZE + Self::POSTFIX_BYTE_SIZE + Self::LINK_TYPE_BYTE_SIZE,
        );

        key.extend_from_slice(&make_user_key(fid));
        key.push(UserPostfix::LinkCompactStateMessage.as_u8());
        key.extend_from_slice(&link_type.as_bytes());

        Ok(key)
    }

    /// Generates a unique key used to store a LinkAdd message key in the LinksAdd Set index.
    /// Returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<targetKey?>:<type?>
    ///
    /// # Arguments
    /// * `fid` - farcaster id of the user who created the link
    /// * `link_body` - body of link that contains type of link created and target ID of the object
    ///                 being reacted to
    fn link_add_key(fid: u32, link_body: &LinkBody) -> Result<Vec<u8>, HubError> {
        if link_body.target.is_some()
            && (link_body.r#type.is_empty() || link_body.r#type.len() == 0)
        {
            return Err(HubError::validation_failure(
                "targetId provided without type",
            ));
        }

        if !link_body.r#type.is_empty()
            && (link_body.r#type.len() > Self::LINK_TYPE_BYTE_SIZE || link_body.r#type.len() == 0)
        {
            return Err(HubError::validation_failure(
                "link type invalid - non-empty link type found with invalid length",
            ));
        }

        let mut key = Vec::with_capacity(
            Self::ROOT_PREFIXED_FID_BYTE_SIZE
                + Self::POSTFIX_BYTE_SIZE
                + Self::LINK_TYPE_BYTE_SIZE
                + Self::TARGET_ID_BYTE_SIZE,
        );

        // TODO: does the fid and rtype need to be padded? Is it okay not the check their lengths?
        key.extend_from_slice(&make_user_key(fid));
        key.push(UserPostfix::LinkAdds.as_u8());
        key.extend_from_slice(&link_body.r#type.as_bytes());
        match link_body.target {
            None => {}
            Some(Target::TargetFid(fid)) => {
                key.extend_from_slice(&make_fid_key(fid as u32)[..Self::TARGET_ID_BYTE_SIZE])
            }
        }

        Ok(key)
    }

    /// Generates a unique key used to store a LinkRemove message key in the LinksRemove Set index.
    /// Returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<targetKey?>:<type?>
    ///
    /// # Arguments
    /// * `fid` - farcaster id of the user who created the link
    /// * `link_body` - body of link that contains type of link created and target ID of the object
    ///                 being reacted to
    fn link_remove_key(fid: u32, link_body: &LinkBody) -> Result<Vec<u8>, HubError> {
        if link_body.target.is_some()
            && (link_body.r#type.is_empty() || link_body.r#type.len() == 0)
        {
            return Err(HubError::validation_failure(
                "targetID provided without type",
            ));
        }

        if !link_body.r#type.is_empty()
            && (link_body.r#type.len() > Self::LINK_TYPE_BYTE_SIZE || link_body.r#type.len() == 0)
        {
            return Err(HubError::validation_failure(
                "link type invalid - non-empty link type found with invalid length",
            ));
        }

        let mut key = Vec::with_capacity(
            Self::ROOT_PREFIXED_FID_BYTE_SIZE
                + Self::POSTFIX_BYTE_SIZE
                + Self::LINK_TYPE_BYTE_SIZE
                + Self::TARGET_ID_BYTE_SIZE,
        );

        // TODO: does the fid and rtype need to be padded? Is it okay not the check their lengths?
        key.extend_from_slice(&make_user_key(fid));
        key.push(UserPostfix::LinkRemoves.as_u8());
        key.extend_from_slice(&link_body.r#type.as_bytes());
        match link_body.target {
            None => {}
            Some(Target::TargetFid(fid)) => {
                key.extend_from_slice(&make_fid_key(fid as u32)[..Self::TARGET_ID_BYTE_SIZE])
            }
        }

        Ok(key)
    }

    /// Generates a unique key used to store a LinkAdd Message in the LinksByTargetAndType index.
    /// Returns RocksDB index key of the form <RootPrefix>:<target_key>:<fid?>:<tsHash?>
    ///
    /// # Arguments
    /// * `target` - target ID of the object being reacted to (currently just cast id)
    /// * `fid` - the fid of the user who created the link
    /// * `ts_hash` - the timestamp hash of the link message
    fn links_by_target_key(
        target: &Target,
        fid: u32,
        ts_hash: Option<&[u8; TS_HASH_LENGTH]>,
    ) -> Result<Vec<u8>, HubError> {
        if fid != 0 && (ts_hash.is_none() || ts_hash.is_some_and(|tsh| tsh.len() == 0)) {
            return Err(HubError::validation_failure(
                "fid provided without timestamp hash",
            ));
        }

        if ts_hash.is_some() && fid == 0 {
            return Err(HubError::validation_failure(
                "timestamp hash provided without fid",
            ));
        }

        let mut key = Vec::with_capacity(
            Self::ROOT_PREFIX_BYTE_SIZE
                + Self::TARGET_ID_BYTE_SIZE
                + TS_HASH_LENGTH
                + Self::FID_BYTE_SIZE,
        );

        key.push(RootPrefix::LinksByTarget as u8);
        let Target::TargetFid(target_fid) = target;
        key.extend(make_fid_key(*target_fid as u32));

        match ts_hash {
            Some(timestamp_hash) => {
                key.extend_from_slice(timestamp_hash);
            }
            _ => {}
        }

        if fid > 0 {
            key.extend(make_fid_key(fid));
        }

        Ok(key)
    }

    fn secondary_index_key(
        &self,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(Vec<u8>, Vec<u8>), HubError> {
        message
            .data
            .as_ref()
            .ok_or(HubError::invalid_parameter("invalid message data"))
            .and_then(|data| {
                data.body
                    .as_ref()
                    .ok_or(HubError::invalid_parameter("invalid message data body"))
                    .and_then(|body| match body {
                        Body::LinkBody(link_body) => {
                            return link_body
                                .target
                                .as_ref()
                                .ok_or(HubError::invalid_parameter("target ID not specified"))
                                .and_then(|target| {
                                    LinkStore::links_by_target_key(
                                        target,
                                        data.fid as u32,
                                        Some(ts_hash),
                                    )
                                    .and_then(|target_key| {
                                        Ok((target_key, link_body.r#type.as_bytes().to_vec()))
                                    })
                                });
                        }
                        _ => Err(HubError::invalid_parameter("link body not specified")),
                    })
            })
    }

    pub fn js_get_link_adds_by_fid(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0)?.value(&mut cx) as u32;
        let link_type = cx.argument::<JsString>(1).map(|s| s.value(&mut cx))?;
        let page_options = get_page_options(&mut cx, 2)?;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let messages = Self::get_link_adds_by_fid(&store, fid, link_type, &page_options);

            deferred_settle_messages(deferred, &channel, messages);
        });

        Ok(promise)
    }

    pub fn js_get_link_removes_by_fid(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0)?.value(&mut cx) as u32;
        let link_type = cx.argument::<JsString>(1).map(|s| s.value(&mut cx))?;
        let page_options = get_page_options(&mut cx, 2)?;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let messages = Self::get_link_removes_by_fid(&store, fid, link_type, &page_options);

            deferred_settle_messages(deferred, &channel, messages);
        });

        Ok(promise)
    }

    pub fn get_link_removes_by_fid(
        store: &Store,
        fid: u32,
        r#type: String,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        store.get_removes_by_fid(
            fid,
            page_options,
            Some(|message: &Message| {
                message
                    .data
                    .as_ref()
                    .is_some_and(|data| match data.body.as_ref() {
                        Some(message_data::Body::LinkBody(body)) => {
                            r#type.is_empty() || body.r#type == r#type
                        }
                        _ => false,
                    })
            }),
        )
    }

    pub fn js_get_link_add(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let channel = cx.channel();

        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let link_type = cx.argument::<JsString>(1).map(|s| s.value(&mut cx))?;
        let target_fid = cx.argument::<JsNumber>(2).unwrap().value(&mut cx) as u32;

        // target fid must be specified
        if target_fid == 0 {
            return cx.throw_error("target fid is required");
        }

        let target = Some(crate::protos::link_body::Target::TargetFid(
            target_fid as u64,
        ));

        let result = match Self::get_link_add(&store, fid, link_type, target) {
            Ok(Some(message)) => message.encode_to_vec(),
            Ok(None) => cx.throw_error(format!(
                "{}/{} for {}",
                "not_found", "Link Add Message not found", fid
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

    pub fn js_get_link_remove(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let channel = cx.channel();

        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let link_type = cx.argument::<JsString>(1).map(|s| s.value(&mut cx))?;

        let target_fid = cx.argument::<JsNumber>(2).unwrap().value(&mut cx) as u32;

        // target fid must be specified
        if target_fid == 0 {
            return cx.throw_error("target_fid is required");
        }

        let target = Some(crate::protos::link_body::Target::TargetFid(
            target_fid as u64,
        ));

        let result = match Self::get_link_remove(&store, fid, link_type, target) {
            Ok(Some(message)) => message.encode_to_vec(),
            Ok(None) => cx.throw_error(format!(
                "{}/{} for {}",
                "not_found", "Link Remove Message not found", fid
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

    pub fn js_get_links_by_target(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let target_fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let link_type = cx.argument::<JsString>(1).map(|s| s.value(&mut cx))?;
        let page_options = get_page_options(&mut cx, 2)?;

        // target fid must be specified
        if target_fid == 0 {
            return cx.throw_error("target_fid is required");
        }

        let target = crate::protos::link_body::Target::TargetFid(target_fid as u64);

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let messages = Self::get_links_by_target(&store, &target, link_type, &page_options);

            deferred_settle_messages(deferred, &channel, messages);
        });

        Ok(promise)
    }

    pub fn js_get_all_link_messages_by_fid(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let page_options = get_page_options(&mut cx, 1)?;

        // fid must be specified
        if fid == 0 {
            return cx.throw_error("fid is required");
        }

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let messages = Self::get_all_link_messages_by_fid(&store, fid, &page_options);

            deferred_settle_messages(deferred, &channel, messages);
        });

        Ok(promise)
    }
}

impl StoreDef for LinkStore {
    fn postfix(&self) -> u8 {
        UserPostfix::LinkMessage.as_u8()
    }

    fn add_message_type(&self) -> u8 {
        MessageType::LinkAdd.into_u8()
    }

    fn remove_message_type(&self) -> u8 {
        MessageType::LinkRemove.into_u8()
    }

    fn compact_state_message_type(&self) -> u8 {
        MessageType::LinkCompactState.into_u8()
    }

    fn is_add_type(&self, message: &Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519 as i32
            && message.data.is_some()
            && message.data.as_ref().is_some_and(|data| {
                data.r#type == MessageType::LinkAdd.into_i32() && data.body.is_some()
            })
    }

    fn is_remove_type(&self, message: &Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519 as i32
            && message.data.is_some()
            && message.data.as_ref().is_some_and(|data| {
                data.r#type == MessageType::LinkRemove.into_i32() && data.body.is_some()
            })
    }

    fn is_compact_state_type(&self, message: &Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519 as i32
            && message.data.is_some()
            && message.data.as_ref().is_some_and(|data| {
                data.r#type == MessageType::LinkCompactState.into_i32() && data.body.is_some()
            })
    }

    fn build_secondary_indices(
        &self,
        txn: &mut RocksDbTransactionBatch,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        let (by_target_key, rtype) = self.secondary_index_key(ts_hash, message)?;

        txn.put(by_target_key, rtype);

        Ok(())
    }

    fn delete_secondary_indices(
        &self,
        txn: &mut RocksDbTransactionBatch,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        let (by_target_key, _) = self.secondary_index_key(ts_hash, message)?;

        txn.delete(by_target_key);

        Ok(())
    }

    fn find_merge_add_conflicts(&self, _db: &RocksDB, _message: &Message) -> Result<(), HubError> {
        // For links, there will be no additional conflict logic
        Ok(())
    }

    fn find_merge_remove_conflicts(
        &self,
        _db: &RocksDB,
        _message: &Message,
    ) -> Result<(), HubError> {
        // For links, there will be no additional conflict logic
        Ok(())
    }

    fn make_compact_state_add_key(&self, message: &Message) -> Result<Vec<u8>, HubError> {
        message
            .data
            .as_ref()
            .ok_or(HubError::invalid_parameter("invalid message data"))
            .and_then(|data| {
                data.body
                    .as_ref()
                    .ok_or(HubError::invalid_parameter("invalid message data body"))
                    .and_then(|body_option| match body_option {
                        Body::LinkCompactStateBody(link_compact_body) => {
                            Self::link_compact_state_add_key(
                                data.fid as u32,
                                &link_compact_body.r#type,
                            )
                        }
                        Body::LinkBody(link_body) => {
                            Self::link_compact_state_add_key(data.fid as u32, &link_body.r#type)
                        }
                        _ => Err(HubError::invalid_parameter(
                            "link_compact_body not specified",
                        )),
                    })
            })
    }

    fn make_add_key(&self, message: &Message) -> Result<Vec<u8>, HubError> {
        message
            .data
            .as_ref()
            .ok_or(HubError::invalid_parameter("invalid message data"))
            .and_then(|data| {
                data.body
                    .as_ref()
                    .ok_or(HubError::invalid_parameter("invalid message data body"))
                    .and_then(|body_option| match body_option {
                        Body::LinkBody(link_body) => Self::link_add_key(data.fid as u32, link_body),
                        _ => Err(HubError::invalid_parameter("link body not specified")),
                    })
            })
    }

    fn make_remove_key(&self, message: &Message) -> Result<Vec<u8>, HubError> {
        message
            .data
            .as_ref()
            .ok_or(HubError::invalid_parameter("invalid message data"))
            .and_then(|data| {
                data.body
                    .as_ref()
                    .ok_or(HubError::invalid_parameter("invalid message data body"))
                    .and_then(|body_option| match body_option {
                        Body::LinkBody(link_body) => {
                            Self::link_remove_key(data.fid as u32, link_body)
                        }
                        _ => Err(HubError::invalid_parameter("link body not specified")),
                    })
            })
    }

    fn get_prune_size_limit(&self) -> u32 {
        self.prune_size_limit
    }
}
