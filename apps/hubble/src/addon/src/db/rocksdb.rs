use crate::store::HubError;
use rocksdb::{Options, WriteBatchWithTransaction};

pub struct RocksDB {
    pub db: rocksdb::TransactionDB,
    path: String,
}

pub type RocksDbTransaction<'a> = rocksdb::Transaction<'a, rocksdb::TransactionDB>;

impl RocksDB {
    pub fn new(path: &str) -> Result<RocksDB, String> {
        // Create RocksDB options
        let mut opts = Options::default();
        opts.create_if_missing(true); // Creates a database if it does not exist

        let mut tx_db_opts = rocksdb::TransactionDBOptions::default();
        tx_db_opts.set_default_lock_timeout(5000); // 5 seconds

        // Open the database with multi-threaded support
        let db = rocksdb::TransactionDB::open(&opts, &tx_db_opts, path).unwrap();
        Ok(RocksDB {
            db,
            path: path.to_string(),
        })
    }

    pub fn get(&self, key: &[u8]) -> Result<Option<Vec<u8>>, HubError> {
        self.db.get(key).map_err(|e| HubError {
            code: "db.internal_error".to_string(),
            message: e.to_string(),
        })
    }

    pub fn put(&self, key: &[u8], value: &[u8]) -> Result<(), HubError> {
        self.db.put(key, value).map_err(|e| HubError {
            code: "db.internal_error".to_string(),
            message: e.to_string(),
        })
    }

    pub fn txn(&self) -> rocksdb::Transaction<'_, rocksdb::TransactionDB> {
        self.db.transaction()
    }

    pub fn for_each_iterator_by_prefix<F>(&self, prefix: &[u8], mut f: F) -> Result<(), HubError>
    where
        F: FnMut(&[u8], &[u8]) -> Result<bool, HubError>,
    {
        let mut iter = self.db.iterator(rocksdb::IteratorMode::From(
            prefix,
            rocksdb::Direction::Forward,
        ));
        for item in iter {
            let (key, value) = item.map_err(|e| HubError {
                code: "db.internal_error".to_string(),
                message: e.to_string(),
            })?;
            if key.starts_with(prefix) {
                if !f(&key, &value)? {
                    break;
                }
            } else {
                break;
            }
        }
        Ok(())
    }

    pub fn clear(&self) -> Result<u32, HubError> {
        let mut deleted;

        loop {
            // reset deleted count
            deleted = 0;

            // Iterate over all keys and delete them
            let txn = self.txn();

            for item in self.db.iterator(rocksdb::IteratorMode::Start) {
                if let Ok((key, _)) = item {
                    txn.delete(key).unwrap();
                    deleted += 1;
                }
            }
            txn.commit().map_err(|e| HubError {
                code: "db.internal_error".to_string(),
                message: e.to_string(),
            })?;

            // Check if we deleted anything
            if deleted == 0 {
                break;
            }
        }

        Ok(deleted)
    }
}
