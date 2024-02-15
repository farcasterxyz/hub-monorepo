use std::convert::TryInto;

use neon::types::Finalize;

use crate::{
    db::{RocksDB, RocksDbTransaction},
    protos::Message,
    store::make_ts_hash,
};

use super::{bytes_compare, get_message, put_message_transaction};
use rocksdb;

#[derive(Debug)]
pub struct HubError {
    pub code: String,
    pub message: String,
}

impl From<rocksdb::Error> for HubError {
    fn from(e: rocksdb::Error) -> HubError {
        HubError {
            code: "db.internal_error".to_string(),
            message: e.to_string(),
        }
    }
}

pub trait StoreDef {
    fn postfix() -> u8;
    fn add_message_type() -> u8;
    fn remove_message_type() -> u8;

    fn is_add_type(&self, message: &Message) -> bool;
    fn is_remove_type(&self, message: &Message) -> bool;

    fn build_secondary_indicies(
        &self,
        txn: &RocksDbTransaction<'_>,
        message: &Message,
    ) -> Result<(), HubError>;
    fn delete_secondary_indicies(
        &self,
        txn: &RocksDbTransaction<'_>,
        message: &Message,
    ) -> Result<(), HubError>;

    fn find_merge_add_conflicts(&self, message: &Message) -> Result<(), HubError>;
    fn find_merge_remove_conflicts(&self, message: &Message) -> Result<(), HubError>;

    fn make_add_key(&self, message: &Message) -> Vec<u8>;
    fn make_remove_key(&self, message: &Message) -> Vec<u8>;
}

pub struct Store<T: StoreDef> {
    store_def: T,
    db: RocksDB,
}

impl<T: StoreDef> Finalize for Store<T> {}

impl<T: StoreDef> Store<T> {
    pub fn new_with_store_def(store_def: T) -> Store<T> {
        Store::<T> {
            store_def,
            // TODO: This is a bad idea. RocksDB should be shared across all stores.
            db: RocksDB::new("/tmp/tmprocksdb").unwrap(),
        }
    }

    fn put_add_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        message: &Message,
    ) -> Result<(), HubError> {
        let ts_hash = make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;

        put_message_transaction(txn, &message)?;

        let adds_key = self.store_def.make_add_key(message);

        // TODO: Test check for the postfix
        txn.put(&adds_key, ts_hash)?;

        self.store_def.build_secondary_indicies(txn, message)?;

        Ok(())
    }

    fn delete_add_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        message: &Message,
    ) -> Result<(), HubError> {
        let ts_hash = make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;
        self.store_def.delete_secondary_indicies(txn, message)?;

        let add_key = self.store_def.make_add_key(message);
        txn.delete(&add_key);

        Ok(())
    }

    fn delete_remove_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        message: &Message,
    ) -> Result<(), HubError> {
        let ts_hash = make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;

        let remove_key = self.store_def.make_remove_key(message);
        txn.delete(&remove_key);

        Ok(())
    }

    fn delete_many_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        messages: Vec<Message>,
    ) -> Result<(), HubError> {
        for message in &messages {
            if self.store_def.is_add_type(message) {
                self.delete_add_transaction(txn, message)?;
            }
            if self.store_def.is_remove_type(message) {
                self.delete_remove_transaction(txn, message)?;
            }
        }

        Ok(())
    }

    fn get_merge_conflicts(&self, message: &Message) -> Result<Vec<Message>, HubError> {
        // The JS code does validateAdd()/validateRemove() here, but that's not needed because we
        // already validated that the message has a data field and a body field in the is_add_type()
        let ts_hash = make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;

        if self.store_def.is_add_type(message) {
            self.store_def.find_merge_add_conflicts(message)?;
        } else {
            self.store_def.find_merge_remove_conflicts(message)?;
        }

        let mut conflicts = vec![];
        // TODO: Remove

        // Check if there is an add timestamp hash for this
        let add_key = self.store_def.make_add_key(message);
        let add_ts_hash = self.db.get(&add_key)?;

        if add_ts_hash.is_some() {
            let add_compare = self.message_compare(
                T::add_message_type(),
                &add_ts_hash.clone().unwrap(),
                message.data.as_ref().unwrap().r#type as u8,
                &ts_hash.to_vec(),
            );

            if add_compare > 0 {
                return Err(HubError {
                    code: "bad_request.conflict".to_string(),
                    message: "message conflicts with a more recent add".to_string(),
                });
            }
            if add_compare == 0 {
                return Err(HubError {
                    code: "bad_request.duplicate".to_string(),
                    message: "message has already been merged".to_string(),
                });
            }

            // If the existing add has a lower order than the new message, retrieve the full
            // Add message and delete it as part of the RocksDB transaction
            let existing_add = get_message(
                &self.db,
                message.data.as_ref().unwrap().fid as u32,
                T::postfix(),
                add_ts_hash
                    .clone()
                    .unwrap()
                    .try_into()
                    .map_err(|e: Vec<u8>| HubError {
                        code: "bad_request.internal_error".to_string(),
                        message: "add_ts_hash is not 24 bytes".to_string(),
                    })?, // Convert Vec<u8> to [u8; 24]
            )?
            .ok_or_else(|| HubError {
                code: "bad_request.internal_error".to_string(),
                message: format!("The message for the {:x?} not found", add_ts_hash.unwrap()),
            })?;
            conflicts.push(existing_add);
        }

        Ok(conflicts)
    }

    pub fn merge(&self, message: &Message) -> Result<u64, HubError> {
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

    pub fn merge_add(&self, message: &Message) -> Result<u64, HubError> {
        // Get the merge conflicts first
        let merge_conflicts = self.get_merge_conflicts(message)?;

        // start a transaction
        let txn = self.db.txn();
        // Delete all the merge conflicts
        self.delete_many_transaction(&txn, merge_conflicts)?;

        // Add ops to store the message by messageKey and index the the messageKey by set and by target
        self.put_add_transaction(&txn, message)?;

        // Commit the transaction
        txn.commit()?;

        // TODO: Trigger the event handler

        Ok(0)
    }

    pub fn merge_remove(&self, message: &Message) -> Result<u64, HubError> {
        todo!("merge_remove")
    }

    fn message_compare(
        &self,
        a_type: u8,
        a_ts_hash: &Vec<u8>,
        b_type: u8,
        b_ts_hash: &Vec<u8>,
    ) -> i8 {
        // Compare timestamps (first 4 bytes of ts_hash)
        let ts_compare = bytes_compare(a_ts_hash[0..4].to_vec(), b_ts_hash[0..4].to_vec());
        if ts_compare != 0 {
            return ts_compare;
        }

        if a_type == T::remove_message_type() && b_type == T::add_message_type() {
            return 1;
        }
        if a_type == T::add_message_type() && b_type == T::remove_message_type() {
            return -1;
        }

        // Compare the rest of the ts_hash to break ties
        bytes_compare(a_ts_hash[4..24].to_vec(), b_ts_hash[4..24].to_vec())
    }
}
