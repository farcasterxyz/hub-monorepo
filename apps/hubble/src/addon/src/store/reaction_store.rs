use crate::{
    db::RocksDbTransaction,
    protos::{self, reaction_body::Target, Message, MessageType},
};

use super::{
    make_cast_id_key, make_ts_hash, make_user_key,
    store::{Store, StoreDef},
    HubError, UserPostfix,
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
        message: &Message,
    ) -> Result<(), HubError> {
        let (by_target_key, rtype) = self.secondary_index_key(message)?;

        txn.put(&by_target_key, vec![rtype])?;

        Ok(())
    }

    fn delete_secondary_indicies(
        &self,
        txn: &RocksDbTransaction<'_>,
        message: &Message,
    ) -> Result<(), HubError> {
        let (by_target_key, _) = self.secondary_index_key(message)?;

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

    fn secondary_index_key(&self, message: &protos::Message) -> Result<(Vec<u8>, u8), HubError> {
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

        let by_target_key = ReactionStore::make_reaction_adds_key(
            message.data.as_ref().unwrap().fid as u32,
            reaction_body.r#type,
            Some(&target),
        );

        Ok((by_target_key, reaction_body.r#type as u8))
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
            key.extend_from_slice(&Self::make_target_key(target.unwrap()));
            // target, 28 bytes
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
