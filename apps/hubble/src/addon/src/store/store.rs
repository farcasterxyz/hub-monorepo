use neon::types::Finalize;

use crate::{protos::Message, store::make_ts_hash};

#[derive(Debug)]
pub struct HubError {
    pub code: String,
    pub message: String,
}

pub trait StoreDef {
    fn postfix() -> u64;
    fn is_add_type(&self, message: Message) -> bool;
    fn is_remove_type(&self, message: Message) -> bool;

    fn find_merge_add_conflicts(&self, message: Message) -> Result<(), HubError>;
    fn find_merge_remove_conflicts(&self, message: Message) -> Result<(), HubError>;

    fn make_add_key(&self, message: Message) -> Vec<u8>;
}

pub struct Store<T: StoreDef> {
    store_def: T,
}

impl<T: StoreDef> Finalize for Store<T> {}

impl<T: StoreDef> Store<T> {
    pub fn new_with_store_def(store_def: T) -> Store<T> {
        Store::<T> { store_def }
    }

    fn get_merge_conflicts(&self, message: Message) -> Result<u64, HubError> {
        // The JS code does validateAdd()/validateRemove() here, but that's not needed because we
        // already validated that the message has a data field and a body field in the is_add_type()
        let ts_hash = make_ts_hash(message.data.unwrap().timestamp, message.hash)?;

        if self.store_def.is_add_type(message) {
            self.store_def.find_merge_add_conflicts(message)?;
        } else {
            self.store_def.find_merge_remove_conflicts(message)?;
        }

        // TODO: Remove

        // Check if there is an add timestamp hash for this
        let add_key = self.store_def.make_add_key(message);
    }

    pub fn merge(&self, message: Message) -> Result<u64, HubError> {
        if !self.store_def.is_add_type(message) && !self.store_def.is_remove_type(message) {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "invalid message type".to_string(),
            });
        }

        // TODO: We're skipping the prune check.

        if self.store_def.is_add_type(message) {
            self.merge_add(message)
        } else {
            self.merge_remove(message)
        }
    }

    pub fn merge_add(&self, message: Message) -> Result<u64, HubError> {
        // Get the merge conflicts first
    }

    pub fn merge_remove(&self, message: Message) -> Result<u64, HubError> {
        todo!("merge_remove")
    }
}
