use std::sync::Arc;
use crate::db::{RocksDB, RocksDbTransactionBatch};
use crate::protos;
use crate::protos::{LinkBody, Message, MessageType};
use crate::protos::link_body::Target;
use crate::protos::message_data::Body;
use crate::store::{HubError, IntoI32, IntoU8, make_fid_key, make_ts_hash, make_user_key, Store, StoreDef, StoreEventHandler, TS_HASH_LENGTH, UserPostfix};
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
    const FID_BYTE_SIZE: usize = 33;
    const POSTFIX_BYTE_SIZE: usize = 1;
    const LINK_TYPE_BYTE_SIZE: usize = 8;
    const TARGET_ID_BYTE_SIZE: usize = 4;

    pub fn new(
        db: Arc<RocksDB>,
        store_event_handler: Arc<StoreEventHandler>,
        prune_size_limit: u32,
    ) -> Store {
        Store::new_with_store_def(
            db,
            store_event_handler,
            Box::new(LinkStore{prune_size_limit})
        )
    }

    fn link_add_key(fid: u32, link_body: &LinkBody) -> Result<Vec<u8>, HubError> {
        if link_body.target.is_some() && (link_body.r#type.is_empty() || link_body.r#type.len() == 0) {
            return Err(HubError::validation_failure("foo"));
        }

        if !link_body.r#type.is_empty()
            && (link_body.r#type.len() > Self::LINK_TYPE_BYTE_SIZE || link_body.r#type.len() == 0) {
            return Err(HubError::validation_failure(""));
        }

        let mut key = Vec::with_capacity(
            Self::FID_BYTE_SIZE + Self::POSTFIX_BYTE_SIZE + Self::LINK_TYPE_BYTE_SIZE + Self::TARGET_ID_BYTE_SIZE
        );

        key.extend_from_slice(&make_user_key(fid)[..Self::FID_BYTE_SIZE]);
        key.push(UserPostfix::LinkAdds.as_u8());
        key.extend_from_slice(&link_body.r#type.as_bytes()[..Self::LINK_TYPE_BYTE_SIZE]);
        match link_body.target {
            None => {}
            Some(Target::TargetFid(fid)) => {
                key.extend_from_slice(&make_fid_key(fid as u32)[..Self::TARGET_ID_BYTE_SIZE])
            }
        }

        Ok(key)
    }

    fn link_remove_key(fid: u32, link_body: &LinkBody) -> Result<Vec<u8>, HubError> {
        if link_body.target.is_some() && (link_body.r#type.is_empty() || link_body.r#type.len() == 0) {
            return Err(HubError::validation_failure(""));
        }

        if !link_body.r#type.is_empty()
            && (link_body.r#type.len() > Self::LINK_TYPE_BYTE_SIZE || link_body.r#type.len() == 0) {
            return Err(HubError::validation_failure(""));
        }

        let mut key = Vec::with_capacity(
            Self::FID_BYTE_SIZE + Self::POSTFIX_BYTE_SIZE + Self::LINK_TYPE_BYTE_SIZE + Self::TARGET_ID_BYTE_SIZE
        );

        key.extend_from_slice(&make_user_key(fid)[..Self::FID_BYTE_SIZE]);
        key.push(UserPostfix::LinkRemoves.as_u8());
        key.extend_from_slice(&link_body.r#type.as_bytes()[..Self::LINK_TYPE_BYTE_SIZE]);
        match link_body.target {
            None => {}
            Some(Target::TargetFid(fid)) => {
                key.extend_from_slice(&make_fid_key(fid as u32)[..Self::TARGET_ID_BYTE_SIZE])
            }
        }

        Ok(key)
    }

    fn secondary_index_key(
                           &self,
                           ts_hash: &[u8; TS_HASH_LENGTH],
                           message: &protos::Message,
    ) -> Result<(Vec<u8>, Vec<u8>), HubError> {
        Ok((vec![], vec![]))
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

    fn is_add_type(&self, message: &Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519 as i32
            && message.data.is_some()
            && message.data.as_ref().is_some_and(|data| {
            data.r#type == MessageType::LinkAdd.into_i32() &&
                data.body.is_some()
        })
    }

    fn is_remove_type(&self, message: &Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519 as i32
        && message.data.is_some()
            && message.data.as_ref().is_some_and(|data| {
            data.r#type == MessageType::LinkRemove.into_i32() &&
                data.body.is_some()
        })
    }

    fn build_secondary_indices(&self, txn: &mut RocksDbTransactionBatch, ts_hash: &[u8; TS_HASH_LENGTH], message: &Message) -> Result<(), HubError> {
        let (by_target_key, rtype) = self.secondary_index_key(ts_hash, message)?;

        txn.put(by_target_key, rtype);

        Ok(())
    }

    fn delete_secondary_indices(&self, _txn: &mut RocksDbTransactionBatch, _ts_hash: &[u8; TS_HASH_LENGTH], _message: &Message) -> Result<(), HubError> {
        todo!()
    }

    fn find_merge_add_conflicts(&self, _message: &Message) -> Result<(), HubError> {
        // For links, there will be no additional conflict logic
        Ok(())
    }

    fn find_merge_remove_conflicts(&self, _message: &Message) -> Result<(), HubError> {
        // For links, there will be no additional conflict logic
        Ok(())
    }

    fn make_add_key(&self, message: &Message) -> Result<Vec<u8>, HubError> {
        message
            .data
            .as_ref()
            .ok_or(HubError::invalid_parameter(""))
            .and_then(|data| {
                data.body.as_ref().ok_or(HubError::invalid_parameter(""))
                    .and_then(|body_option| match body_option {
                        Body::LinkBody(link_body) => {
                            Self::link_add_key(data.fid as u32, link_body)
                        },
                        _ => Err(HubError::invalid_parameter(""))
                    })
            })
    }

    fn make_remove_key(&self, message: &Message) -> Result<Vec<u8>, HubError> {
        message
            .data
            .as_ref()
            .ok_or(HubError::invalid_parameter(""))
            .and_then(|data| {
                data.body.as_ref().ok_or(HubError::invalid_parameter(""))
                    .and_then(|body_option| match body_option {
                        Body::LinkBody(link_body) => {
                            Self::link_remove_key(data.fid as u32, link_body)
                        },
                        _ => Err(HubError::invalid_parameter(""))
                    })
            })
    }

    fn get_prune_size_limit(&self) -> u32 {
        self.prune_size_limit
    }
}