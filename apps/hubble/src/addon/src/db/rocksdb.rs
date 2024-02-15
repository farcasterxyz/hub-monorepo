use crate::store::HubError;
use rocksdb::Options;

pub struct RocksDB {
    db: rocksdb::TransactionDB,
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
        Ok(RocksDB { db })
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
}
