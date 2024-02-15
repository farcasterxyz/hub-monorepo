use crate::protos::{self, reaction_body::Target, MessageType};

use super::{
    make_cast_id_key, make_user_key,
    store::{Store, StoreDef},
    UserPostfix,
};
use crate::protos::message_data;

pub struct ReactionStore {}

impl StoreDef for ReactionStore {
    fn postfix() -> u64 {
        // TODO: Import the UserPostfix enum
        3
    }

    fn is_add_type(&self, message: protos::Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519.into()
            && message.data.is_some()
            && message.data.unwrap().r#type == MessageType::ReactionAdd.into()
            && message.data.unwrap().body.is_some()
    }

    fn is_remove_type(&self, message: protos::Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519.into()
            && message.data.is_some()
            && message.data.unwrap().r#type == MessageType::ReactionRemove.into()
            && message.data.unwrap().body.is_some()
    }

    fn find_merge_add_conflicts(
        &self,
        message: protos::Message,
    ) -> Result<(), super::store::HubError> {
        // For reactions, there will be no conflicts
        Ok(())
    }

    fn find_merge_remove_conflicts(
        &self,
        message: protos::Message,
    ) -> Result<(), super::store::HubError> {
        // For reactions, there will be no conflicts
        Ok(())
    }

    fn make_add_key(&self, message: protos::Message) -> Vec<u8> {
        let reaction_body = match message.data.unwrap().body.unwrap() {
            message_data::Body::ReactionBody(reaction_body) => reaction_body,
            _ => panic!("Invalid reaction body"),
        };

        ReactionStore::make_reaction_adds_key(
            message.data.unwrap().fid as u32,
            reaction_body.r#type,
            reaction_body.target,
        )
    }
}

impl ReactionStore {
    pub fn new() -> Store<ReactionStore> {
        Store::<ReactionStore>::new_with_store_def(ReactionStore {})
    }

    pub fn make_target_key(target: Target) -> Vec<u8> {
        match target {
            Target::TargetUrl(url) => url.as_bytes().to_vec(),
            Target::TargetCastId(cast_id) => make_cast_id_key(cast_id),
        }
    }

    pub fn make_reaction_adds_key(fid: u32, r#type: i32, target: Option<Target>) -> Vec<u8> {
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
}
