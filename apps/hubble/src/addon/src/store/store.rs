use std::{
    convert::TryInto,
    fs::File,
    io::Write,
    sync::{Arc, Mutex},
};

use neon::types::Finalize;
use threadpool::ThreadPool;

use crate::{
    db::{RocksDB, RocksDbTransaction},
    protos::Message,
    store::make_ts_hash,
};

use super::{bytes_compare, get_message, put_message_transaction, TS_HASH_LENGTH};
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
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError>;
    fn delete_secondary_indicies(
        &self,
        txn: &RocksDbTransaction<'_>,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError>;

    fn find_merge_add_conflicts(&self, message: &Message) -> Result<(), HubError>;
    fn find_merge_remove_conflicts(&self, message: &Message) -> Result<(), HubError>;

    fn make_add_key(&self, message: &Message) -> Vec<u8>;
    fn make_remove_key(&self, message: &Message) -> Vec<u8>;
}

pub struct Store<T: StoreDef> {
    store_def: T,
    db: RocksDB,                                  // TODO: Move this out
    pub pool: Arc<Mutex<threadpool::ThreadPool>>, // TODO: Move this out
}

impl<T: StoreDef> Finalize for Store<T> {
    fn finalize<'a, C: neon::context::Context<'a>>(self, _cx: &mut C) {}
}

impl<T: StoreDef> Store<T> {
    pub fn new_with_store_def(store_def: T) -> Store<T> {
        Store::<T> {
            store_def,
            // TODO: This is a bad idea. RocksDB should be shared across all stores.
            db: RocksDB::new("/tmp/tmprocksdb").unwrap(),
            pool: Arc::new(Mutex::new(ThreadPool::new(4))),
        }
    }

    fn log(&self, message: &str) {
        // println!("{}", message);
    }

    fn put_add_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        put_message_transaction(txn, &message)?;

        let adds_key = self.store_def.make_add_key(message);

        // TODO: Test check for the postfix
        self.log(&format!(
            "put_add_transaction: {:x?}-{:x?}\n",
            adds_key, ts_hash
        ));
        txn.put(&adds_key, b"hello")?;

        self.store_def
            .build_secondary_indicies(txn, ts_hash, message)?;

        Ok(())
    }

    fn delete_add_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        self.store_def
            .delete_secondary_indicies(txn, ts_hash, message)?;

        let add_key = self.store_def.make_add_key(message);
        txn.delete(&add_key)?;

        Ok(())
    }

    fn delete_remove_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        message: &Message,
    ) -> Result<(), HubError> {
        let remove_key = self.store_def.make_remove_key(message);
        txn.delete(&remove_key)?;

        Ok(())
    }

    fn delete_many_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        messages: Vec<Message>,
    ) -> Result<(), HubError> {
        for message in &messages {
            if self.store_def.is_add_type(message) {
                let ts_hash =
                    make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;
                self.delete_add_transaction(txn, &ts_hash, message)?;
            }
            if self.store_def.is_remove_type(message) {
                self.delete_remove_transaction(txn, message)?;
            }
        }

        Ok(())
    }

    fn get_merge_conflicts(
        &self,
        message: &Message,
        ts_hash: &[u8; TS_HASH_LENGTH],
    ) -> Result<Vec<Message>, HubError> {
        // The JS code does validateAdd()/validateRemove() here, but that's not needed because we
        // already validated that the message has a data field and a body field in the is_add_type()

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

        self.log(&format!("get_add_key: {:x?} {:x?}\n", add_key, add_ts_hash));

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
                        message: format!("add_ts_hash is not 24 bytes: {:x?}", e),
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

        let ts_hash = make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;
        self.log(&format!("merge: {:x?}\n", ts_hash));

        // TODO: We're skipping the prune check.

        if self.store_def.is_add_type(message) {
            self.merge_add(&ts_hash, message)
        } else {
            self.merge_remove(&ts_hash, message)
        }
    }

    pub fn merge_add(
        &self,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<u64, HubError> {
        // Get the merge conflicts first
        let merge_conflicts = self.get_merge_conflicts(message, ts_hash)?;

        // start a transaction
        let txn = self.db.txn();
        // Delete all the merge conflicts
        self.delete_many_transaction(&txn, merge_conflicts)?;

        // Add ops to store the message by messageKey and index the the messageKey by set and by target
        self.put_add_transaction(&txn, &ts_hash, message)?;

        // Commit the transaction
        txn.commit()?;

        // TEMP
        let adds_key = self.store_def.make_add_key(message);
        // read from DB the same key
        let add_ts_hash = self.db.get(&adds_key)?;
        self.log(&format!(
            "merge_add_reread: {:x?} {:x?}\n",
            adds_key, add_ts_hash
        ));

        // TODO: Trigger the event handler

        Ok(0)
    }

    pub fn merge_remove(
        &self,
        ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<u64, HubError> {
        todo!("merge_remove")
    }

    fn message_compare(
        &self,
        a_type: u8,
        a_ts_hash: &Vec<u8>,
        b_type: u8,
        b_ts_hash: &Vec<u8>,
    ) -> i8 {
        self.log(&format!(
            "message_compare: {:x?} {:x?} {:x?} {:x?}\n",
            a_type, a_ts_hash, b_type, b_ts_hash
        ));

        // Compare timestamps (first 4 bytes of ts_hash)
        let ts_compare = bytes_compare(&a_ts_hash[0..4], &b_ts_hash[0..4]);
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
        bytes_compare(&a_ts_hash[4..24], &b_ts_hash[4..24])
    }
}
