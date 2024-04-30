use super::{
    deferred_settle_messages, hub_error_to_js_throw, make_cast_id_key, make_fid_key, make_user_key,
    message,
    store::{Store, StoreDef},
    utils::{get_page_options, get_store},
    HubError, IntoU8, MessagesPage, PageOptions, RootPrefix, StoreEventHandler, UserPostfix,
    PAGE_SIZE_MAX, TS_HASH_LENGTH,
};
use crate::{
    db::{RocksDB, RocksDbTransactionBatch},
    protos::{self, reaction_body::Target, Message, MessageType, ReactionBody, ReactionType},
};
use crate::{protos::message_data, THREAD_POOL};
use neon::{
    context::{Context, FunctionContext},
    result::JsResult,
    types::{buffer::TypedArray, JsBox, JsBuffer, JsNumber, JsPromise, JsString},
};
use prost::Message as _;
use std::{borrow::Borrow, convert::TryInto, sync::Arc};

pub struct ReactionStoreDef {
    prune_size_limit: u32,
}

impl StoreDef for ReactionStoreDef {
    fn postfix(&self) -> u8 {
        UserPostfix::ReactionMessage.as_u8()
    }

    fn add_message_type(&self) -> u8 {
        MessageType::ReactionAdd.into_u8()
    }

    fn remove_message_type(&self) -> u8 {
        MessageType::ReactionRemove as u8
    }

    fn is_add_type(&self, message: &protos::Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519 as i32
            && message.data.is_some()
            && message.data.as_ref().unwrap().r#type == MessageType::ReactionAdd as i32
            && message.data.as_ref().unwrap().body.is_some()
    }

    fn is_remove_type(&self, message: &protos::Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519 as i32
            && message.data.is_some()
            && message.data.as_ref().unwrap().r#type == MessageType::ReactionRemove as i32
            && message.data.as_ref().unwrap().body.is_some()
    }

    fn compact_state_message_type(&self) -> u8 {
        MessageType::None as u8
    }

    fn is_compact_state_type(&self, _message: &Message) -> bool {
        false
    }

    fn build_secondary_indices(
        &self,
        txn: &mut RocksDbTransactionBatch,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        let (by_target_key, rtype) = self.secondary_index_key(ts_hash, message)?;

        txn.put(by_target_key, vec![rtype]);

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

    fn find_merge_add_conflicts(
        &self,
        _db: &RocksDB,
        _message: &protos::Message,
    ) -> Result<(), HubError> {
        // For reactions, there will be no conflicts
        Ok(())
    }

    fn find_merge_remove_conflicts(
        &self,
        _db: &RocksDB,
        _message: &Message,
    ) -> Result<(), HubError> {
        // For reactions, there will be no conflicts
        Ok(())
    }

    fn make_add_key(&self, message: &protos::Message) -> Result<Vec<u8>, HubError> {
        let reaction_body = match message.data.as_ref().unwrap().body.as_ref().unwrap() {
            message_data::Body::ReactionBody(reaction_body) => reaction_body,
            _ => {
                return Err(HubError {
                    code: "bad_request.validation_failure".to_string(),
                    message: "Invalid reaction body".to_string(),
                })
            }
        };

        Self::make_reaction_adds_key(
            message.data.as_ref().unwrap().fid as u32,
            reaction_body.r#type,
            reaction_body.target.as_ref(),
        )
    }

    fn make_remove_key(&self, message: &protos::Message) -> Result<Vec<u8>, HubError> {
        let reaction_body = match message.data.as_ref().unwrap().body.as_ref().unwrap() {
            message_data::Body::ReactionBody(reaction_body) => reaction_body,
            _ => {
                return Err(HubError {
                    code: "bad_request.validation_failure".to_string(),
                    message: "Invalid reaction body".to_string(),
                })
            }
        };

        Self::make_reaction_removes_key(
            message.data.as_ref().unwrap().fid as u32,
            reaction_body.r#type,
            reaction_body.target.as_ref(),
        )
    }

    fn make_compact_state_add_key(&self, _message: &Message) -> Result<Vec<u8>, HubError> {
        Err(HubError {
            code: "bad_request.invalid_param".to_string(),
            message: "Reaction Store doesn't support compact state".to_string(),
        })
    }

    fn get_prune_size_limit(&self) -> u32 {
        self.prune_size_limit
    }
}

impl ReactionStoreDef {
    fn secondary_index_key(
        &self,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &protos::Message,
    ) -> Result<(Vec<u8>, u8), HubError> {
        // Make sure at least one of targetCastId or targetUrl is set
        let reaction_body = match message.data.as_ref().unwrap().body.as_ref().unwrap() {
            message_data::Body::ReactionBody(reaction_body) => reaction_body,
            _ => Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "Invalid reaction body".to_string(),
            })?,
        };
        let target = reaction_body.target.as_ref().ok_or(HubError {
            code: "bad_request.validation_failure".to_string(),
            message: "Invalid reaction body".to_string(),
        })?;

        let by_target_key = ReactionStoreDef::make_reactions_by_target_key(
            target,
            message.data.as_ref().unwrap().fid as u32,
            Some(ts_hash),
        );

        Ok((by_target_key, reaction_body.r#type as u8))
    }

    pub fn make_reactions_by_target_key(
        target: &Target,
        fid: u32,
        ts_hash: Option<&[u8; TS_HASH_LENGTH]>,
    ) -> Vec<u8> {
        let mut key = Vec::with_capacity(1 + 28 + 24 + 4);

        key.push(RootPrefix::ReactionsByTarget as u8); // ReactionsByTarget prefix, 1 byte
        key.extend_from_slice(&Self::make_target_key(target));
        if ts_hash.is_some() && ts_hash.unwrap().len() == TS_HASH_LENGTH {
            key.extend_from_slice(ts_hash.unwrap());
        }
        if fid > 0 {
            key.extend_from_slice(&make_fid_key(fid));
        }

        key
    }

    pub fn make_target_key(target: &Target) -> Vec<u8> {
        match target {
            Target::TargetUrl(url) => url.as_bytes().to_vec(),
            Target::TargetCastId(cast_id) => make_cast_id_key(cast_id),
        }
    }

    pub fn make_reaction_adds_key(
        fid: u32,
        r#type: i32,
        target: Option<&Target>,
    ) -> Result<Vec<u8>, HubError> {
        if target.is_some() && r#type == 0 {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "targetId provided without type".to_string(),
            });
        }
        let mut key = Vec::with_capacity(33 + 1 + 1 + 28);

        key.extend_from_slice(&make_user_key(fid));
        key.push(UserPostfix::ReactionAdds as u8); // ReactionAdds postfix, 1 byte
        if r#type > 0 {
            key.push(r#type as u8); // type, 1 byte
        }
        if target.is_some() {
            // target, 28 bytes
            key.extend_from_slice(&Self::make_target_key(target.unwrap()));
        }

        Ok(key)
    }

    pub fn make_reaction_removes_key(
        fid: u32,
        r#type: i32,
        target: Option<&Target>,
    ) -> Result<Vec<u8>, HubError> {
        if target.is_some() && r#type == 0 {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "targetId provided without type".to_string(),
            });
        }
        let mut key = Vec::with_capacity(33 + 1 + 1 + 28);

        key.extend_from_slice(&make_user_key(fid));
        key.push(UserPostfix::ReactionRemoves as u8); // ReactionRemoves postfix, 1 byte
        if r#type > 0 {
            key.push(r#type as u8); // type, 1 byte
        }
        if target.is_some() {
            key.extend_from_slice(&Self::make_target_key(target.unwrap()));
            // target, 28 bytes
        }

        Ok(key)
    }
}

pub struct ReactionStore {}

impl ReactionStore {
    pub fn new(
        db: Arc<RocksDB>,
        store_event_handler: Arc<StoreEventHandler>,
        prune_size_limit: u32,
    ) -> Store {
        Store::new_with_store_def(
            db,
            store_event_handler,
            Box::new(ReactionStoreDef { prune_size_limit }),
        )
    }

    pub fn get_reaction_add(
        store: &Store,
        fid: u32,
        r#type: i32,
        target: Option<Target>,
    ) -> Result<Option<protos::Message>, HubError> {
        let partial_message = protos::Message {
            data: Some(protos::MessageData {
                fid: fid as u64,
                r#type: MessageType::ReactionAdd.into(),
                body: Some(protos::message_data::Body::ReactionBody(ReactionBody {
                    r#type,
                    target: target.clone(),
                })),
                ..Default::default()
            }),
            ..Default::default()
        };

        store.get_add(&partial_message)
    }

    pub fn js_get_reaction_add(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let channel = cx.channel();

        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let reaction_type = cx.argument::<JsNumber>(1).unwrap().value(&mut cx) as i32;

        let target_cast_id_buffer = cx.argument::<JsBuffer>(2)?;
        let target_cast_id_bytes = target_cast_id_buffer.as_slice(&cx);
        let target_cast_id = if target_cast_id_bytes.len() > 0 {
            match protos::CastId::decode(target_cast_id_bytes) {
                Ok(cast_id) => Some(cast_id),
                Err(e) => return cx.throw_error(e.to_string()),
            }
        } else {
            None
        };

        let target_url = cx.argument::<JsString>(3).map(|s| s.value(&mut cx))?;

        // We need at least one of target_cast_id or target_url
        if target_cast_id.is_none() && target_url.is_empty() {
            return cx.throw_error("target_cast_id or target_url is required");
        }

        let target = if target_cast_id.is_some() {
            Some(Target::TargetCastId(target_cast_id.unwrap()))
        } else {
            Some(Target::TargetUrl(target_url))
        };

        let result = match Self::get_reaction_add(&store, fid, reaction_type, target) {
            Ok(Some(message)) => message.encode_to_vec(),
            Ok(None) => cx.throw_error(format!(
                "{}/{} for {}",
                "not_found", "reactionAddMessage not found", fid
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

    pub fn get_reaction_remove(
        store: &Store,
        fid: u32,
        r#type: i32,
        target: Option<Target>,
    ) -> Result<Option<protos::Message>, HubError> {
        let partial_message = protos::Message {
            data: Some(protos::MessageData {
                fid: fid as u64,
                r#type: MessageType::ReactionRemove.into(),
                body: Some(protos::message_data::Body::ReactionBody(ReactionBody {
                    r#type,
                    target: target.clone(),
                })),
                ..Default::default()
            }),
            ..Default::default()
        };

        let r = store.get_remove(&partial_message);
        // println!("got reaction remove: {:?}", r);

        r
    }

    pub fn js_get_reaction_remove(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let reaction_type = cx.argument::<JsNumber>(1).unwrap().value(&mut cx) as i32;

        let target_cast_id_buffer = cx.argument::<JsBuffer>(2)?;
        let target_cast_id_bytes = target_cast_id_buffer.as_slice(&cx);
        let target_cast_id = if target_cast_id_bytes.len() > 0 {
            match protos::CastId::decode(target_cast_id_bytes) {
                Ok(cast_id) => Some(cast_id),
                Err(e) => return cx.throw_error(e.to_string()),
            }
        } else {
            None
        };

        let target_url = cx.argument::<JsString>(3).map(|s| s.value(&mut cx))?;

        // We need at least one of target_cast_id or target_url
        if target_cast_id.is_none() && target_url.is_empty() {
            return cx.throw_error("target_cast_id or target_url is required");
        }

        let target = if target_cast_id.is_some() {
            Some(Target::TargetCastId(target_cast_id.unwrap()))
        } else {
            Some(Target::TargetUrl(target_url))
        };

        let result = match ReactionStore::get_reaction_remove(&store, fid, reaction_type, target) {
            Ok(Some(message)) => message.encode_to_vec(),
            Ok(None) => cx.throw_error(format!(
                "{}/{} for {}",
                "not_found", "reactionRemoveMessage not found", fid
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

    pub fn get_reaction_adds_by_fid(
        store: &Store,
        fid: u32,
        reaction_type: i32,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        store.get_adds_by_fid(
            fid,
            page_options,
            Some(|message: &Message| {
                if let Some(reaction_body) = &message.data.as_ref().unwrap().body {
                    if let protos::message_data::Body::ReactionBody(reaction_body) = reaction_body {
                        if reaction_type == 0 || reaction_body.r#type == reaction_type {
                            return true;
                        }
                    }
                }

                false
            }),
        )
    }

    pub fn create_reaction_store(mut cx: FunctionContext) -> JsResult<JsBox<Arc<Store>>> {
        let db_js_box = cx.argument::<JsBox<Arc<RocksDB>>>(0)?;
        let db = (**db_js_box.borrow()).clone();

        // Read the StoreEventHandler
        let store_event_handler_js_box = cx.argument::<JsBox<Arc<StoreEventHandler>>>(1)?;
        let store_event_handler = (**store_event_handler_js_box.borrow()).clone();

        // Read the prune size limit and prune time limit from the options
        let prune_size_limit = cx
            .argument::<JsNumber>(2)
            .map(|n| n.value(&mut cx) as u32)?;

        Ok(cx.boxed(Arc::new(ReactionStore::new(
            db,
            store_event_handler,
            prune_size_limit,
        ))))
    }

    pub fn js_get_reaction_adds_by_fid(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let reaction_type = cx.argument::<JsNumber>(1).unwrap().value(&mut cx) as i32;

        let page_options = get_page_options(&mut cx, 2)?;
        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let messages =
                ReactionStore::get_reaction_adds_by_fid(&store, fid, reaction_type, &page_options);

            deferred_settle_messages(deferred, &channel, messages);
        });

        Ok(promise)
    }

    pub fn get_reaction_removes_by_fid(
        store: &Store,
        fid: u32,
        reaction_type: i32,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        store.get_removes_by_fid(
            fid,
            page_options,
            Some(|message: &Message| {
                if let Some(reaction_body) = &message.data.as_ref().unwrap().body {
                    if let protos::message_data::Body::ReactionBody(reaction_body) = reaction_body {
                        if reaction_type == 0 || reaction_body.r#type == reaction_type {
                            return true;
                        }
                    }
                }

                false
            }),
        )
    }

    pub fn js_get_reaction_removes_by_fid(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let reaction_type = cx.argument::<JsNumber>(1).unwrap().value(&mut cx) as i32;

        let page_options = get_page_options(&mut cx, 2)?;
        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let messages = ReactionStore::get_reaction_removes_by_fid(
                &store,
                fid,
                reaction_type,
                &page_options,
            );

            deferred_settle_messages(deferred, &channel, messages);
        });

        Ok(promise)
    }

    pub fn get_reactions_by_target(
        store: &Store,
        target: &Target,
        reaction_type: i32,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        let prefix = ReactionStoreDef::make_reactions_by_target_key(target, 0, None);

        let mut message_keys = vec![];
        let mut last_key = vec![];

        store
            .db()
            .for_each_iterator_by_prefix(&prefix, page_options, |key, value| {
                if reaction_type == ReactionType::None as i32
                    || (value.len() == 1 && value[0] == reaction_type as u8)
                {
                    let ts_hash_offset = prefix.len();
                    let fid_offset = ts_hash_offset + TS_HASH_LENGTH;

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

    pub fn js_get_reactions_by_target(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let target_cast_id_buffer = cx.argument::<JsBuffer>(0)?;
        let target_cast_id_bytes = target_cast_id_buffer.as_slice(&cx);
        let target_cast_id = if target_cast_id_bytes.len() > 0 {
            match protos::CastId::decode(target_cast_id_bytes) {
                Ok(cast_id) => Some(cast_id),
                Err(e) => return cx.throw_error(e.to_string()),
            }
        } else {
            None
        };

        let target_url = cx.argument::<JsString>(1).map(|s| s.value(&mut cx))?;

        // We need at least one of target_cast_id or target_url
        if target_cast_id.is_none() && target_url.is_empty() {
            return cx.throw_error("target_cast_id or target_url is required");
        }

        let target = if target_cast_id.is_some() {
            Target::TargetCastId(target_cast_id.unwrap())
        } else {
            Target::TargetUrl(target_url)
        };

        let reaction_type = cx
            .argument::<JsNumber>(2)
            .map(|n| n.value(&mut cx) as i32)?;

        let page_options = get_page_options(&mut cx, 3)?;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let messages = ReactionStore::get_reactions_by_target(
                &store,
                &target,
                reaction_type,
                &page_options,
            );

            deferred_settle_messages(deferred, &channel, messages);
        });

        Ok(promise)
    }
}
