use crate::store::{increment_vec_u8, HubError, PageOptions};
use rocksdb::{IteratorMode, Options, WriteBatchWithTransaction};

pub struct RocksDB {
    pub db: rocksdb::TransactionDB,
    path: String,
}

pub struct IteratorOptions {
    pub opts: rocksdb::ReadOptions,
    pub reverse: bool,
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

    fn get_iterator_options(prefix: &[u8], page_options: &PageOptions) -> IteratorOptions {
        let mut lower_prefix;
        let mut upper_prefix;

        if page_options.reverse {
            lower_prefix = prefix.to_vec();
            if let Some(token) = &page_options.page_token {
                upper_prefix = prefix.to_vec();
                upper_prefix.extend_from_slice(token);
            } else {
                upper_prefix = increment_vec_u8(&prefix.to_vec());
            }
        } else {
            if let Some(token) = &page_options.page_token {
                lower_prefix = prefix.to_vec();
                lower_prefix.extend_from_slice(token);

                // move to the next key, since the page_token is the key of the last seen item
                lower_prefix = increment_vec_u8(&lower_prefix);
            } else {
                lower_prefix = prefix.to_vec();
            }

            let prefix_end = increment_vec_u8(&prefix.to_vec());
            upper_prefix = prefix_end.to_vec();
        }

        println!("lower_prefix: {:?}", lower_prefix);
        println!("upper_prefix: {:?}", upper_prefix);

        let mut opts = rocksdb::ReadOptions::default();
        opts.set_iterate_lower_bound(lower_prefix);
        opts.set_iterate_upper_bound(upper_prefix);

        IteratorOptions {
            opts,
            reverse: page_options.reverse,
        }
    }

    pub fn for_each_iterator_by_prefix<F>(
        &self,
        prefix: &[u8],
        page_options: &PageOptions,
        mut f: F,
    ) -> Result<(), HubError>
    where
        F: FnMut(&[u8], &[u8]) -> Result<bool, HubError>,
    {
        let iter_opts = RocksDB::get_iterator_options(prefix, page_options);
        let mut iter = self.db.raw_iterator_opt(iter_opts.opts);

        if iter_opts.reverse {
            iter.seek_to_last();
        } else {
            iter.seek_to_first();
        }

        while iter.valid() {
            if let Some((key, value)) = iter.item() {
                if !f(&key, &value)? {
                    break;
                }
            }

            if iter_opts.reverse {
                iter.prev();
            } else {
                iter.next();
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
