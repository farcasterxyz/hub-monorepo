use std::{borrow::Borrow, sync::Arc};

use neon::{context::FunctionContext, result::JsResult, types::JsPromise};
use prost::Message as _;

use neon::{prelude::*, types::buffer::TypedArray};

use crate::{
    db::RocksDbTransaction,
    protos::{self, reaction_body::Target, Message, MessageType},
};

use super::{
    make_cast_id_key, make_fid_key, make_user_key,
    store::{Store, StoreDef},
    HubError, RootPrefix, UserPostfix, TS_HASH_LENGTH,
};
use crate::protos::message_data;

pub struct ReactionStore {}

impl StoreDef for ReactionStore {
    fn postfix() -> u8 {
        UserPostfix::ReactionMessage as u8
    }

    fn add_message_type() -> u8 {
        MessageType::ReactionAdd as u8
    }

    fn remove_message_type() -> u8 {
        MessageType::ReactionRemove as u8
    }

    fn is_add_type(&self, message: &protos::Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519.into()
            && message.data.is_some()
            && message.data.as_ref().unwrap().r#type == MessageType::ReactionAdd.into()
            && message.data.as_ref().unwrap().body.is_some()
    }

    fn is_remove_type(&self, message: &protos::Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519.into()
            && message.data.is_some()
            && message.data.as_ref().unwrap().r#type == MessageType::ReactionRemove.into()
            && message.data.as_ref().unwrap().body.is_some()
    }

    fn find_merge_add_conflicts(
        &self,
        _message: &protos::Message,
    ) -> Result<(), super::store::HubError> {
        // For reactions, there will be no conflicts
        Ok(())
    }

    fn find_merge_remove_conflicts(
        &self,
        _message: &protos::Message,
    ) -> Result<(), super::store::HubError> {
        // For reactions, there will be no conflicts
        Ok(())
    }

    fn build_secondary_indicies(
        &self,
        txn: &RocksDbTransaction<'_>,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        let (by_target_key, rtype) = self.secondary_index_key(ts_hash, message)?;

        txn.put(&by_target_key, vec![rtype])?;

        Ok(())
    }

    fn delete_secondary_indicies(
        &self,
        txn: &RocksDbTransaction<'_>,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        let (by_target_key, _) = self.secondary_index_key(ts_hash, message)?;

        txn.delete(&by_target_key)?;

        Ok(())
    }

    fn make_add_key(&self, message: &protos::Message) -> Vec<u8> {
        let reaction_body = match message.data.as_ref().unwrap().body.as_ref().unwrap() {
            message_data::Body::ReactionBody(reaction_body) => reaction_body,
            _ => panic!("Invalid reaction body"),
        };

        ReactionStore::make_reaction_adds_key(
            message.data.as_ref().unwrap().fid as u32,
            reaction_body.r#type,
            reaction_body.target.as_ref(),
        )
    }

    fn make_remove_key(&self, message: &protos::Message) -> Vec<u8> {
        let reaction_body = match message.data.as_ref().unwrap().body.as_ref().unwrap() {
            message_data::Body::ReactionBody(reaction_body) => reaction_body,
            _ => panic!("Invalid reaction body"),
        };

        ReactionStore::make_reaction_removes_key(
            message.data.as_ref().unwrap().fid as u32,
            reaction_body.r#type,
            reaction_body.target.as_ref(),
        )
    }
}

impl ReactionStore {
    pub fn new() -> Store<ReactionStore> {
        Store::<ReactionStore>::new_with_store_def(ReactionStore {})
    }

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

        let by_target_key = ReactionStore::make_reactions_by_target_key(
            target,
            message.data.as_ref().unwrap().fid as u32,
            ts_hash,
        );

        Ok((by_target_key, reaction_body.r#type as u8))
    }

    pub fn make_reactions_by_target_key(
        target: &Target,
        fid: u32,
        ts_hash: &[u8; TS_HASH_LENGTH],
    ) -> Vec<u8> {
        let mut key = Vec::with_capacity(1 + 28 + 24 + 4);

        key.push(RootPrefix::ReactionsByTarget as u8); // ReactionsByTarget prefix, 1 byte
        key.extend_from_slice(&Self::make_target_key(target));
        if ts_hash.len() == TS_HASH_LENGTH {
            key.extend_from_slice(ts_hash);
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

    pub fn make_reaction_adds_key(fid: u32, r#type: i32, target: Option<&Target>) -> Vec<u8> {
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

        key
    }

    pub fn make_reaction_removes_key(fid: u32, r#type: i32, target: Option<&Target>) -> Vec<u8> {
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

        key
    }
}

impl ReactionStore {
    pub fn js_merge(mut cx: FunctionContext) -> JsResult<JsPromise> {
        // println!("js_merge");
        let store_js_box = cx
            .this()
            .downcast_or_throw::<JsBox<Arc<Store<ReactionStore>>>, _>(&mut cx)
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
}
