use prost::Message;

use crate::protos::{self, reaction_body};

use super::store::{Store, StoreDef};
use crate::protos::message_data;

pub struct ReactionStore {}

impl StoreDef for ReactionStore {
    fn postfix() -> u64 {
        // TODO: Import the UserPostfix enum
        3
    }
}

impl ReactionStore {
    pub fn new() -> Store<ReactionStore> {
        Store::<ReactionStore>::new_with_store_def(ReactionStore {})
    }

    pub fn makeAddKey(msg: protos::Message) -> Vec<u8> {
        match msg.data.unwrap().body.unwrap() {
            message_data::Body::ReactionBody(body) => match body.target.unwrap() {
                reaction_body::Target::TargetCastId(id) => id.fid,
                reaction_body::Target::TargetUrl(url) => url.url.as_bytes().to_vec(),
            },
            _ => panic!("Invalid message type"),
        }
    }
}
