use crate::db::multi_chunk_writer::MultiChunkWriter;
use crate::logger::LOGGER;
use crate::statsd::statsd;
use crate::store::{
    self, get_db, get_iterator_options, hub_error_to_js_throw, increment_vec_u8, HubError,
    PageOptions,
};
use crate::trie::merkle_trie::TRIE_DBPATH_PREFIX;
use crate::THREAD_POOL;
use chrono::NaiveDateTime;
use neon::context::{Context, FunctionContext};
use neon::handle::Handle;
use neon::object::Object;
use neon::result::JsResult;
use neon::types::buffer::TypedArray;
use neon::types::{
    Finalize, JsArray, JsBoolean, JsBox, JsBuffer, JsFunction, JsNumber, JsObject, JsPromise,
    JsString,
};
use rocksdb::{Options, TransactionDB, WriteBatch, WriteOptions, DB};
use slog::{info, o, Logger};
use std::borrow::Borrow;
use std::collections::HashMap;
use std::fs::{self};
use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock, RwLockReadGuard};
use tar::Builder;
use walkdir::WalkDir;

const DB_DIRECTORY: &str = ".rocks";

#[cfg(feature = "bench-rocksdb-record")]
lazy_static::lazy_static! {
    static ref CALL_RECORDER: Arc<super::rocksdb_call_recorder::RocksDbCallRecorder> = Arc::new(super::rocksdb_call_recorder::RocksDbCallRecorder::new(format!("{}-logs", DB_DIRECTORY)));
}

#[cfg(feature = "bench-rocksdb-record")]
use std::borrow::Cow;

/** Hold a transaction. List of key/value pairs that will be committed together */
#[derive(Clone, Debug)]
pub struct RocksDbTransactionBatch {
    pub batch: HashMap<Vec<u8>, Option<Vec<u8>>>,
}

impl RocksDbTransactionBatch {
    pub fn new() -> RocksDbTransactionBatch {
        RocksDbTransactionBatch {
            batch: HashMap::new(),
        }
    }

    pub fn put(&mut self, key: Vec<u8>, value: Vec<u8>) {
        self.batch.insert(key, Some(value));
    }

    pub fn delete(&mut self, key: Vec<u8>) {
        self.batch.insert(key, None);
    }

    pub fn merge(&mut self, other: RocksDbTransactionBatch) {
        for (key, value) in other.batch {
            self.batch.insert(key, value);
        }
    }

    pub fn len(&self) -> usize {
        self.batch.len()
    }
}

pub struct IteratorOptions {
    pub opts: rocksdb::ReadOptions,
    pub reverse: bool,
}

/** Iterator options passed in from JS */
pub struct JsIteratorOptions {
    pub reverse: bool,
    pub gte: Option<Vec<u8>>,
    pub gt: Option<Vec<u8>>,
    pub lt: Vec<u8>,
}

pub struct RocksDB {
    pub db: RwLock<Option<rocksdb::TransactionDB>>,
    pub path: String,
    logger: slog::Logger,
}

/** Needed to make sure neon can clean up the RocksDB at the end */
impl Finalize for RocksDB {}

impl std::fmt::Debug for RocksDB {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("RocksDB").field("path", &self.path).finish()
    }
}

impl RocksDB {
    pub fn new(path: &str) -> Result<RocksDB, HubError> {
        let logger = LOGGER.new(o!("component" => "RustRocksDB"));

        info!(logger, "Creating new RocksDB"; "path" => path);

        Ok(RocksDB {
            db: RwLock::new(None),
            path: path.to_string(),
            logger,
        })
    }

    pub fn open(&self) -> Result<(), HubError> {
        let mut db_lock = self.db.write().unwrap();

        // Create RocksDB options
        let mut opts = Options::default();
        opts.create_if_missing(true); // Creates a database if it does not exist

        let mut tx_db_opts = rocksdb::TransactionDBOptions::default();
        tx_db_opts.set_default_lock_timeout(5000); // 5 seconds

        // Open the database with multi-threaded support
        let db = rocksdb::TransactionDB::open(&opts, &tx_db_opts, &self.path)?;
        *db_lock = Some(db);

        // We put the db in a RwLock to make the compiler happy, but it is strictly not required.
        // We can use unsafe to replace the value directly, and this will work fine, and shave off
        // 100ns per db read/write operation.
        // eg:
        // unsafe {
        //     let db_ptr = &self.db as *const Option<TransactionDB> as *mut Option<TransactionDB>;
        //     std::ptr::replace(db_ptr, Some(db));
        // }

        info!(self.logger, "Opened database"; "path" => &self.path);

        Ok(())
    }

    pub fn location(&self) -> String {
        self.path.clone()
    }

    pub fn close(&self) -> Result<(), HubError> {
        let mut db_lock = self.db.write().unwrap();
        if db_lock.is_some() {
            let db = db_lock.take().unwrap();
            drop(db);
        }

        // See the comment in open(). We strictly don't need to use the RwLock here, but we do it
        // to make the compiler happy. We could use unsafe to replace the value directly, like this:
        // if self.db.is_some() {
        //     let db = unsafe {
        //         let db_ptr = &self.db as *const Option<TransactionDB> as *mut Option<TransactionDB>;
        //         std::ptr::replace(db_ptr, None)
        //     };

        //     // Strictly not needed, but writing so its clear we are dropping the DB here
        //     db.map(|db| drop(db));
        // }

        Ok(())
    }

    pub fn destroy(&self) -> Result<(), HubError> {
        self.close()?;
        let path = Path::new(&self.path);

        let result =
            rocksdb::DB::destroy(&rocksdb::Options::default(), path).map_err(|e| HubError {
                code: "db.internal_error".to_string(),
                message: e.to_string(),
            });

        // Also rm -rf the directory, ignore any errors
        let _ = fs::remove_dir_all(path);

        result
    }

    pub fn get(&self, key: &[u8]) -> Result<Option<Vec<u8>>, HubError> {
        let db = self.db();

        #[cfg(feature = "bench-rocksdb-record")]
        CALL_RECORDER.record(
            &self.path,
            super::rocksdb_call_recorder::FunctionCall::Get {
                key: Cow::Borrowed(key),
            },
        );

        db.as_ref().unwrap().get(key).map_err(|e| HubError {
            code: "db.internal_error".to_string(),
            message: e.to_string(),
        })
    }

    pub fn db(&self) -> RwLockReadGuard<'_, Option<TransactionDB>> {
        self.db.read().unwrap()
    }

    pub fn get_many(&self, keys: &Vec<Vec<u8>>) -> Result<Vec<Vec<u8>>, HubError> {
        let db = self.db();

        #[cfg(feature = "bench-rocksdb-record")]
        CALL_RECORDER.record(
            &self.path,
            super::rocksdb_call_recorder::FunctionCall::GetMany {
                keys: Cow::Borrowed(keys),
            },
        );

        let results = db.as_ref().unwrap().multi_get(keys);

        // If any of the results are Errors, return an error
        let results = results.into_iter().collect::<Result<Vec<_>, _>>()?;
        let results = results
            .into_iter()
            .map(|r| r.unwrap_or(vec![]))
            .collect::<Vec<_>>();

        Ok(results)
    }

    pub fn put(&self, key: &[u8], value: &[u8]) -> Result<(), HubError> {
        let db = self.db();

        #[cfg(feature = "bench-rocksdb-record")]
        CALL_RECORDER.record(
            &self.path,
            super::rocksdb_call_recorder::FunctionCall::Put {
                key: Cow::Borrowed(key),
                value: Cow::Borrowed(value),
            },
        );

        db.as_ref().unwrap().put(key, value).map_err(|e| HubError {
            code: "db.internal_error".to_string(),
            message: e.to_string(),
        })
    }

    pub fn del(&self, key: &[u8]) -> Result<(), HubError> {
        let db = self.db();

        #[cfg(feature = "bench-rocksdb-record")]
        CALL_RECORDER.record(
            &self.path,
            super::rocksdb_call_recorder::FunctionCall::Delete {
                key: Cow::Borrowed(key),
            },
        );

        db.as_ref().unwrap().delete(key).map_err(|e| HubError {
            code: "db.internal_error".to_string(),
            message: e.to_string(),
        })
    }

    pub fn txn(&self) -> RocksDbTransactionBatch {
        RocksDbTransactionBatch::new()
    }

    pub fn commit(&self, batch: RocksDbTransactionBatch) -> Result<(), HubError> {
        let db = self.db();
        if db.is_none() {
            return Err(HubError {
                code: "db.internal_error".to_string(),
                message: "Database is not open".to_string(),
            });
        }

        #[cfg(feature = "bench-rocksdb-record")]
        CALL_RECORDER.record(
            &self.path,
            super::rocksdb_call_recorder::FunctionCall::Commit(Cow::Borrowed(&batch)),
        );

        let txn = db.as_ref().unwrap().transaction();
        for (key, value) in batch.batch {
            if value.is_none() {
                // println!("rust txn is delete, key: {:?}", key);
                txn.delete(key)?;
            } else {
                // println!("rust txn is put, key: {:?}", key);
                txn.put(key, value.unwrap())?;
            }
        }

        statsd().incr("rust.db.commit");
        txn.commit().map_err(|e| HubError {
            code: "db.internal_error".to_string(),
            message: e.to_string(),
        })
    }

    fn get_iterator_options(prefix: &[u8], page_options: &PageOptions) -> IteratorOptions {
        // Handle the special case if the prefix is empty, then we want to iterate over the entire database
        if prefix.is_empty() {
            let mut opts = rocksdb::ReadOptions::default();

            if page_options.reverse {
                if page_options.page_token.is_none() {
                    opts.set_iterate_upper_bound(vec![255u8; 32]);
                } else {
                    // The upper bound is exclusive, so no need to increment the page_token
                    opts.set_iterate_upper_bound(page_options.page_token.clone().unwrap());
                }

                opts.set_iterate_lower_bound(vec![]);
            } else {
                if page_options.page_token.is_none() {
                    opts.set_iterate_lower_bound(vec![]);
                } else {
                    // lower_bound is always inclusive, so we need to increment the page_token
                    opts.set_iterate_lower_bound(increment_vec_u8(
                        &page_options.page_token.clone().unwrap(),
                    ));
                }

                opts.set_iterate_upper_bound(vec![255u8; 32]);
            }

            return IteratorOptions {
                opts,
                reverse: page_options.reverse,
            };
        }

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

        // println!("lower_prefix: {:?}", lower_prefix);
        // println!("upper_prefix: {:?}", upper_prefix);

        let mut opts = rocksdb::ReadOptions::default();
        opts.set_iterate_lower_bound(lower_prefix);
        opts.set_iterate_upper_bound(upper_prefix);

        IteratorOptions {
            opts,
            reverse: page_options.reverse,
        }
    }

    /**
     * Count the number of keys with a given prefix.
     */
    pub fn count_keys_at_prefix(&self, prefix: &[u8]) -> Result<u32, HubError> {
        let iter_opts = RocksDB::get_iterator_options(prefix, &PageOptions::default());

        let db = self.db();
        let mut iter = db.as_ref().unwrap().raw_iterator_opt(iter_opts.opts);

        let mut count = 0;
        iter.seek_to_first();
        while iter.valid() {
            count += 1;

            iter.next();
        }

        Ok(count)
    }

    /**
     * Iterate over all keys with a given prefix.
     * The callback function should return true to stop the iteration, or false to continue.
     */
    pub fn for_each_iterator_by_prefix<F>(
        &self,
        prefix: &[u8],
        page_options: &PageOptions,
        mut f: F,
    ) -> Result<bool, HubError>
    where
        F: FnMut(&[u8], &[u8]) -> Result<bool, HubError>,
    {
        let iter_opts = RocksDB::get_iterator_options(prefix, page_options);

        let db = self.db();
        let mut iter = db.as_ref().unwrap().raw_iterator_opt(iter_opts.opts);

        if iter_opts.reverse {
            iter.seek_to_last();
        } else {
            iter.seek_to_first();
        }

        let mut all_done = true;
        let mut count = 0;
        while iter.valid() {
            if let Some((key, value)) = iter.item() {
                if f(&key, &value)? {
                    all_done = false;
                    break;
                }
                if page_options.page_size.is_some() {
                    count += 1;
                    if count >= page_options.page_size.unwrap() {
                        all_done = false;
                        break;
                    }
                }
            }

            if iter_opts.reverse {
                iter.prev();
            } else {
                iter.next();
            }
        }

        Ok(all_done)
    }

    // Same as for_each_iterator_by_prefix above, but does not limit by page size. To be used in
    // cases where higher level callers are doing custom filtering
    pub fn for_each_iterator_by_prefix_unbounded<F>(
        &self,
        prefix: &[u8],
        page_options: &PageOptions,
        f: F,
    ) -> Result<bool, HubError>
    where
        F: FnMut(&[u8], &[u8]) -> Result<bool, HubError>,
    {
        let unbounded_page_options = PageOptions {
            page_size: None,
            page_token: page_options.page_token.clone(),
            reverse: page_options.reverse,
        };
        self.for_each_iterator_by_prefix(prefix, &unbounded_page_options, f)
    }

    /**
     * Iterate over all keys using the raw lower/upper bound options.
     * The callback function should return true to stop the iteration, or false to continue.
     */
    pub fn for_each_iterator_by_jsopts(
        &self,
        js_opts: JsIteratorOptions,
        mut f: impl FnMut(&[u8], &[u8]) -> Result<bool, HubError>,
    ) -> Result<bool, HubError> {
        // Can't have both gte and gt set
        if js_opts.gte.is_some() && js_opts.gt.is_some() {
            return Err(HubError {
                code: "db.invalid_iterator_options".to_string(),
                message: "gte and gt cannot be set at the same time".to_string(),
            });
        }

        // At least one of gte or gt must be set
        if js_opts.gte.is_none() && js_opts.gt.is_none() {
            return Err(HubError {
                code: "db.invalid_iterator_options".to_string(),
                message: "gte or gt must be set".to_string(),
            });
        }

        let (lower_bound, increment_first) = if let Some(gte) = js_opts.gte {
            (gte, false)
        } else {
            (js_opts.gt.unwrap(), true)
        };
        let upper_bound = js_opts.lt;
        let reverse = js_opts.reverse;

        let mut opts = rocksdb::ReadOptions::default();
        opts.set_iterate_lower_bound(lower_bound.clone());
        opts.set_iterate_upper_bound(upper_bound);

        let db = self.db();
        let mut iter = db.as_ref().unwrap().raw_iterator_opt(opts);

        if reverse {
            iter.seek_to_last();
        } else {
            iter.seek_to_first();
        }

        // If we are using gt, we need to increment the first key if it matches
        if increment_first
            && iter.valid()
            && iter.key().is_some()
            && iter.key().unwrap() == lower_bound
        {
            iter.next();
        }

        let mut all_done = true;
        while iter.valid() {
            if let Some((key, value)) = iter.item() {
                if f(&key, &value)? {
                    all_done = false;
                    break;
                }
            }

            if js_opts.reverse {
                iter.prev();
            } else {
                iter.next();
            }
        }

        Ok(all_done)
    }

    pub fn clear(&self) -> Result<u32, HubError> {
        let mut deleted;

        loop {
            // reset deleted count
            deleted = 0;

            // Iterate over all keys and delete them
            let mut txn = self.txn();
            let db = self.db();

            for item in db.as_ref().unwrap().iterator(rocksdb::IteratorMode::Start) {
                if let Ok((key, _)) = item {
                    txn.delete(key.to_vec());
                    deleted += 1;
                }
            }

            self.commit(txn)?;

            // Check if we deleted anything
            if deleted == 0 {
                break;
            }
        }

        Ok(deleted)
    }

    pub fn approximate_size(&self) -> u64 {
        WalkDir::new(self.location())
            .into_iter()
            .filter_map(Result::ok) // Filter out any Errs and unwrap the Ok values.
            .filter_map(|entry| fs::metadata(entry.path()).ok()) // Attempt to get metadata, filter out Errs.
            .filter(|metadata| metadata.is_file()) // Ensure we only consider files.
            .map(|metadata| metadata.len()) // Extract the file size.
            .sum() // Sum the sizes.
    }
}

impl RocksDB {
    pub fn js_create_db(mut cx: FunctionContext) -> JsResult<JsBox<Arc<RocksDB>>> {
        // First arg is the full system path as string
        let path = cx.argument::<JsString>(0)?.value(&mut cx);

        let db = RocksDB::new(&path);
        if db.is_err() {
            return hub_error_to_js_throw(&mut cx, db.err().unwrap());
        }

        Ok(cx.boxed(Arc::new(db.unwrap())))
    }

    pub fn js_open(mut cx: FunctionContext) -> JsResult<JsBoolean> {
        let db = get_db(&mut cx)?;
        let result = match db.open() {
            Ok(_) => true,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        Ok(cx.boolean(result))
    }

    pub fn js_approximate_size(mut cx: FunctionContext) -> JsResult<JsNumber> {
        let db = get_db(&mut cx)?;
        let result = db.approximate_size();

        Ok(cx.number(result as f64))
    }

    pub fn js_clear(mut cx: FunctionContext) -> JsResult<JsNumber> {
        let db = get_db(&mut cx)?;
        let result = match db.clear() {
            Ok(result) => result,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        Ok(cx.number(result))
    }

    pub fn js_close(mut cx: FunctionContext) -> JsResult<JsBoolean> {
        let db = get_db(&mut cx)?;
        let result = match db.close() {
            Ok(_) => true,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        Ok(cx.boolean(result))
    }

    pub fn js_destroy(mut cx: FunctionContext) -> JsResult<JsBoolean> {
        // return cx.throw_error::<String, _>(format!("Not implemented"));

        let db = get_db(&mut cx)?;

        if let Err(e) = db.destroy() {
            return hub_error_to_js_throw(&mut cx, e);
        }

        Ok(cx.boolean(true))
    }

    pub fn js_location(mut cx: FunctionContext) -> JsResult<JsString> {
        let db = get_db(&mut cx)?;

        Ok(cx.string(db.location()))
    }

    pub fn js_put(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let db = get_db(&mut cx)?;

        let key = cx.argument::<JsBuffer>(0)?.as_slice(&cx).to_vec();
        let value = cx.argument::<JsBuffer>(1)?.as_slice(&cx).to_vec();

        match db.put(&key, &value) {
            Ok(_) => (),
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| Ok(cx.undefined()));

        Ok(promise)
    }

    pub fn js_get(mut cx: FunctionContext) -> JsResult<JsBuffer> {
        let db = get_db(&mut cx)?;
        let key = cx.argument::<JsBuffer>(0)?.as_slice(&cx).to_vec();

        let value = match db.get(&key) {
            Ok(Some(value)) => value,
            Ok(None) => {
                return hub_error_to_js_throw(
                    &mut cx,
                    HubError {
                        code: "not_found".to_string(),
                        message: format!("NotFound: key not found: {:?}", key),
                    },
                )
            }
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let mut buffer = cx.buffer(value.len())?;
        let target = buffer.as_mut_slice(&mut cx);
        target.copy_from_slice(&value);
        Ok(buffer)
    }

    pub fn js_get_many(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let db = get_db(&mut cx)?;
        let keys = cx.argument::<JsArray>(0)?;
        let mut key_vec = Vec::new();

        for i in 0..keys.len(&mut cx) {
            let key = keys
                .get::<JsBuffer, _, u32>(&mut cx, i)?
                .downcast_or_throw::<JsBuffer, _>(&mut cx)?;
            key_vec.push(key.as_slice(&cx).to_vec());
        }

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let result = db.get_many(&key_vec);

            deferred.settle_with(&channel, move |mut cx| {
                let result = match result {
                    Ok(r) => r,
                    Err(e) => return hub_error_to_js_throw(&mut cx, e),
                };

                let js_array = JsArray::new(&mut cx, result.len());
                for (i, value) in result.iter().enumerate() {
                    let mut buffer = cx.buffer(value.len())?;
                    let target = buffer.as_mut_slice(&mut cx);
                    target.copy_from_slice(&value);
                    js_array.set(&mut cx, i as u32, buffer)?;
                }

                Ok(js_array)
            });
        });

        Ok(promise)
    }

    pub fn js_del(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let db = get_db(&mut cx)?;
        let key = cx.argument::<JsBuffer>(0)?.as_slice(&cx).to_vec();

        match db.del(&key) {
            Ok(_) => (),
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| Ok(cx.undefined()));

        Ok(promise)
    }

    pub fn js_commit_transaction(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let db = get_db(&mut cx)?;

        // We'll read an array of Objects, each with a key and value
        let batch = cx.argument::<JsArray>(0)?;
        let mut txn_batch = RocksDbTransactionBatch::new();

        for i in 0..batch.len(&mut cx) {
            let js_object = batch
                .get::<JsObject, _, _>(&mut cx, i as u32)?
                .downcast_or_throw::<JsObject, _>(&mut cx)?;

            let key = js_object
                .get::<JsBuffer, _, _>(&mut cx, "key")?
                .downcast_or_throw::<JsBuffer, _>(&mut cx)?
                .as_slice(&cx)
                .to_vec();
            let value = match js_object.get_opt::<JsBuffer, _, _>(&mut cx, "value")? {
                Some(value) => {
                    let value = value
                        .downcast_or_throw::<JsBuffer, _>(&mut cx)?
                        .as_slice(&cx)
                        .to_vec();
                    if value.is_empty() {
                        None
                    } else {
                        Some(value)
                    }
                }
                None => None,
            };

            if value.is_none() {
                txn_batch.delete(key);
            } else {
                txn_batch.put(key, value.unwrap());
            }
        }

        match db.commit(txn_batch) {
            Ok(_) => (),
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| Ok(cx.undefined()));

        Ok(promise)
    }

    // Define a new function that encapsulates the callback logic.
    fn call_js_callback<'a>(
        cx: &mut FunctionContext<'a>,
        callback: &Handle<JsFunction>,
        key: &[u8],
        value: &[u8],
    ) -> Result<bool, HubError> {
        let undefined = cx.undefined(); // pass as "this" to the JS function
        let mut callback_args = Vec::new();

        // Prepare the key buffer
        callback_args.push(cx.buffer(key.len())?);
        let key_buffer = callback_args[0].as_mut_slice(cx);
        key_buffer.copy_from_slice(key);

        // Prepare the value buffer
        callback_args.push(cx.buffer(value.len())?);
        let value_buffer = callback_args[1].as_mut_slice(cx);
        value_buffer.copy_from_slice(value);

        // Convert callback arguments to a format suitable for calling the JS function
        let callback_args = callback_args
            .into_iter()
            .map(|arg| arg.upcast())
            .collect::<Vec<_>>();

        // Call the JS callback function
        let result = callback
            .call(cx, undefined, callback_args)?
            .downcast_or_throw::<JsBoolean, _>(cx)?
            .value(cx);

        Ok(result)
    }

    pub fn js_count_keys_at_prefix(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let db = get_db(&mut cx)?;

        // Prefix
        let prefix = cx.argument::<JsBuffer>(0)?.as_slice(&cx).to_vec();

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        THREAD_POOL.lock().unwrap().execute(move || {
            let result = db.count_keys_at_prefix(&prefix);
            deferred.settle_with(&channel, move |mut cx| {
                let result = match result {
                    Ok(r) => r,
                    Err(e) => return hub_error_to_js_throw(&mut cx, e),
                };

                Ok(cx.number(result as f64))
            });
        });

        Ok(promise)
    }

    pub fn js_for_each_iterator_by_prefix(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let db = get_db(&mut cx)?;

        // Prefix
        let prefix = cx.argument::<JsBuffer>(0)?.as_slice(&cx).to_vec();

        // Page options
        let page_options = store::get_page_options(&mut cx, 1)?;

        // The argument is a callback function
        let callback = cx.argument::<JsFunction>(2)?;

        let result = db.for_each_iterator_by_prefix(&prefix, &page_options, |key, value| {
            // Use the extracted function here
            Self::call_js_callback(&mut cx, &callback, key, value)
        });

        if result.is_err() {
            return hub_error_to_js_throw(&mut cx, result.err().unwrap());
        }

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| Ok(cx.boolean(result.unwrap())));

        Ok(promise)
    }

    pub fn js_for_each_iterator_by_js_opts(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let db = get_db(&mut cx)?;

        // JS Iterator optionsoptions
        let js_opts = get_iterator_options(&mut cx, 0)?;

        // The argument is a callback function
        let callback = cx.argument::<JsFunction>(1)?;

        let result = db.for_each_iterator_by_jsopts(js_opts, |key, value| {
            // Use the extracted function here
            Self::call_js_callback(&mut cx, &callback, key, value)
        });

        if result.is_err() {
            return hub_error_to_js_throw(&mut cx, result.err().unwrap());
        }

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| Ok(cx.boolean(result.unwrap())));

        Ok(promise)
    }

    pub fn js_delete_all_keys_in_range(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let db = get_db(&mut cx)?;

        // JS Iterator optionsoptions
        let js_opts = get_iterator_options(&mut cx, 0)?;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            // Delete all keys in the range
            let result =
                db.for_each_iterator_by_jsopts(js_opts, |key, _| db.del(key).map(|_| false));

            deferred.settle_with(&channel, move |mut cx| match result {
                Ok(r) => Ok(cx.boolean(r)),
                Err(e) => return hub_error_to_js_throw(&mut cx, e),
            });
        });

        Ok(promise)
    }
}

impl RocksDB {
    fn create_tar_gzip(
        logger: &Logger,
        input_dir: &str,
        timestamp: NaiveDateTime,
    ) -> Result<String, HubError> {
        let base_name = Path::new(input_dir)
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or("rocks.hub._default".to_string());

        let chunked_output_dir = Path::new(DB_DIRECTORY)
            .join(format!(
                "{}-{}.tar.gz",
                base_name,
                timestamp.format("%Y-%m-%d-%s")
            ))
            .as_os_str()
            .to_str()
            .unwrap()
            .to_string();

        let start = std::time::SystemTime::now();
        info!(logger, "Creating chunked tar.gz snapshot for directory: {}",
            input_dir; o!("output_file_path" => &chunked_output_dir, "base_name" => &base_name));

        let mut multi_chunk_writer = MultiChunkWriter::new(
            PathBuf::from(chunked_output_dir.clone()),
            4 * 1024 * 1024 * 1024, // 4GB
        );

        let mut tar = Builder::new(&mut multi_chunk_writer);
        tar.append_dir_all(base_name, input_dir)?;
        tar.finish()?;
        drop(tar); // Needed so we can call multi_chunk_writer.finish() next
        multi_chunk_writer.finish()?;

        let metadata = fs::metadata(&chunked_output_dir)?;
        let time_taken = start.elapsed().expect("Time went backwards");
        info!(
            logger,
            "Created chunked tar.gz archive for snapshot: path = {}, size = {} bytes, time taken = {:?}",
            chunked_output_dir,
            metadata.len(),
            time_taken
        );

        Ok(chunked_output_dir)
    }

    fn snapshot_backup(
        main_db: Arc<RocksDB>,
        trie_db: Arc<RocksDB>,
        timestamp_ms: i64,
    ) -> Result<String, HubError> {
        let snapshot_logger = LOGGER.new(o! ("component" => "RocksDBSnapshotBackup"));
        let main_db_path = main_db.location();

        let timestamp = chrono::NaiveDateTime::from_timestamp_millis(timestamp_ms)
            .unwrap_or(chrono::Utc::now().naive_utc());

        let main_backup_path = Path::new(&format!(
            "{}-{}.backup",
            main_db_path,
            timestamp.format("%Y-%m-%d-%s")
        ))
        .join("rocks.hub._default");

        // rm -rf this path if it exists
        if main_backup_path.exists() {
            fs::remove_dir_all(&main_backup_path).map_err(|e| HubError {
                code: "db.internal_error".to_string(),
                message: e.to_string(),
            })?;
        }

        let triedb_backup_path = main_backup_path.join(TRIE_DBPATH_PREFIX);

        let main_backup_path = main_backup_path.into_os_string().into_string().unwrap();
        let triedb_backup_path = triedb_backup_path.into_os_string().into_string().unwrap();

        let start = std::time::SystemTime::now();
        info!(snapshot_logger, "Creating snapshot for main DB: {}", main_db_path;
        o!("output_file_path_main" => &main_backup_path, "output_file_path_trie" => &triedb_backup_path));

        let backup_main = DB::open_default(&main_backup_path)
            .map_err(|e| HubError::internal_db_error(&e.to_string()))?;
        // Prepare write options to disable WAL
        let mut write_opts = WriteOptions::default();
        write_opts.disable_wal(true);
        let mut write_batch = WriteBatch::default();

        let backup_trie = DB::open_default(&triedb_backup_path)
            .map_err(|e| HubError::internal_db_error(&e.to_string()))?;

        let logger = snapshot_logger.clone();
        let main_backup_thread = std::thread::spawn(move || {
            let main_db = main_db.db();
            let main_db_snapshot = main_db.as_ref().unwrap().snapshot();

            let iterator = main_db_snapshot.iterator(rocksdb::IteratorMode::Start);
            let mut count = 0;
            for item in iterator {
                let (key, value) = item.unwrap();
                write_batch.put(key, value);
                if write_batch.len() >= 10_000 {
                    backup_main.write_opt(write_batch, &write_opts).unwrap();
                    write_batch = WriteBatch::default();
                }

                count += 1;
                if count % 1_000_000 == 0 {
                    backup_main.flush().unwrap();
                    info!(
                        logger,
                        "mainDb Snapshot backup progress: {}M keys",
                        count / 1_000_000
                    );
                }
            }

            // write any leftover keys
            backup_main.write_opt(write_batch, &write_opts).unwrap();

            info!(logger, "mainDB Snapshot backup completed: {}", count);
            drop(main_db_snapshot);
            drop(backup_main);
        });

        let logger = snapshot_logger.clone();
        // Prepare write options to disable WAL
        let mut write_opts = WriteOptions::default();
        write_opts.disable_wal(true);
        let mut write_batch = WriteBatch::default();

        let trie_backup_thread = std::thread::spawn(move || {
            let trie_db = trie_db.db();
            let trie_db_snapshot = trie_db.as_ref().unwrap().snapshot();

            let iterator = trie_db_snapshot.iterator(rocksdb::IteratorMode::Start);
            let mut count = 0;
            for item in iterator {
                let (key, value) = item.unwrap();
                write_batch.put(key, value);
                if write_batch.len() >= 10_000 {
                    backup_trie.write_opt(write_batch, &write_opts).unwrap();
                    write_batch = WriteBatch::default();
                }

                count += 1;
                if count % 1_000_000 == 0 {
                    backup_trie.flush().unwrap();
                    info!(
                        logger,
                        "trieDb Snapshot backup progress: {}M keys",
                        count / 1_000_000
                    );
                }
            }

            // write any leftover keys
            backup_trie.write_opt(write_batch, &write_opts).unwrap();

            info!(logger, "trieDB Snapshot backup completed: {}", count);
            drop(trie_db_snapshot);
            drop(backup_trie);
        });

        main_backup_thread.join().unwrap();
        trie_backup_thread.join().unwrap();

        info!(
            snapshot_logger,
            "Full DB Snapshot Backup created: path = {}, time taken = {:?}",
            main_backup_path,
            start.elapsed().expect("Time went backwards")
        );

        let tar_gz_path = Self::create_tar_gzip(&snapshot_logger, &main_backup_path, timestamp)?;
        info!(
            snapshot_logger,
            "Full DB Snapshot Backup tar.gz created: path = {}", tar_gz_path,
        );

        // rm -rf the backup path
        fs::remove_dir_all(&main_backup_path).map_err(|e| HubError {
            code: "db.internal_error".to_string(),
            message: e.to_string(),
        })?;

        Ok(tar_gz_path)
    }

    pub fn js_snapshot_backup(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let main_db_handle = cx.argument::<JsBox<Arc<RocksDB>>>(0)?;
        let main_db = (**main_db_handle.borrow()).clone();
        let trie_db_handle = cx.argument::<JsBox<Arc<RocksDB>>>(1)?;
        let trie_db = (**trie_db_handle.borrow()).clone();

        let timestamp_ms = cx.argument::<JsNumber>(2)?.value(&mut cx) as i64;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        // Spawn a new thread to create the tarball
        std::thread::spawn(move || {
            let result = Self::snapshot_backup(main_db, trie_db, timestamp_ms);

            deferred.settle_with(&channel, move |mut tcx| match result {
                Ok(output_path) => Ok(tcx.string(output_path)),
                Err(e) => hub_error_to_js_throw(&mut tcx, e),
            });
        });

        Ok(promise)
    }
}

#[cfg(test)]
mod tests {
    use crate::db::RocksDbTransactionBatch;

    #[test]
    fn test_merge_rocksdb_transaction() {
        let mut txn1 = RocksDbTransactionBatch::new();

        let mut txn2 = RocksDbTransactionBatch::new();

        // Add some txns to txn2
        txn2.put(b"key1".to_vec(), b"value1".to_vec());
        txn2.put(b"key2".to_vec(), b"value2".to_vec());
        txn2.delete(b"key3".to_vec());

        // Merge txn2 into txn1
        txn1.merge(txn2);

        // Check that txn1 has all the keys from txn2
        assert_eq!(txn1.batch.len(), 3);
        assert_eq!(
            txn1.batch
                .get(&b"key1".to_vec())
                .unwrap()
                .as_ref()
                .unwrap()
                .clone(),
            b"value1".to_vec()
        );
        assert_eq!(
            txn1.batch
                .get(&b"key2".to_vec())
                .unwrap()
                .as_ref()
                .unwrap()
                .clone(),
            b"value2".to_vec()
        );
        assert_eq!(txn1.batch.get(&b"key3".to_vec()).unwrap().is_none(), true);

        // Add some more txns to txn3
        let mut txn3 = RocksDbTransactionBatch::new();
        txn3.put(b"key4".to_vec(), b"value4".to_vec());
        txn3.put(b"key5".to_vec(), b"value5".to_vec());

        // Merge txn3 into txn1
        txn1.merge(txn3);

        // Check that txn1 has all the keys from txn2 and txn3
        assert_eq!(txn1.batch.len(), 5);
        assert_eq!(
            txn1.batch
                .get(&b"key1".to_vec())
                .unwrap()
                .as_ref()
                .unwrap()
                .clone(),
            b"value1".to_vec()
        );
        assert_eq!(
            txn1.batch
                .get(&b"key4".to_vec())
                .unwrap()
                .as_ref()
                .unwrap()
                .clone(),
            b"value4".to_vec()
        );

        // Add some more txns to txn4 that overwrite existing keys
        let mut txn4 = RocksDbTransactionBatch::new();

        txn4.put(b"key1".to_vec(), b"value1_new".to_vec());
        txn4.put(b"key4".to_vec(), b"value4_new".to_vec());
        txn4.delete(b"key5".to_vec());

        // Merge txn4 into txn1
        txn1.merge(txn4);

        // Check that txn1 has all the keys from txn2 and txn3, and the overwritten keys from txn4
        assert_eq!(txn1.batch.len(), 5);
        assert_eq!(
            txn1.batch
                .get(&b"key1".to_vec())
                .unwrap()
                .as_ref()
                .unwrap()
                .clone(),
            b"value1_new".to_vec()
        );
        assert_eq!(
            txn1.batch
                .get(&b"key2".to_vec())
                .unwrap()
                .as_ref()
                .unwrap()
                .clone(),
            b"value2".to_vec()
        );
        assert_eq!(
            txn1.batch
                .get(&b"key4".to_vec())
                .unwrap()
                .as_ref()
                .unwrap()
                .clone(),
            b"value4_new".to_vec()
        );
        assert_eq!(txn1.batch.get(&b"key5".to_vec()).unwrap().is_none(), true);
    }

    #[test]
    fn test_count_keys_at_prefix() {
        let tmp_path = tempfile::tempdir()
            .unwrap()
            .path()
            .as_os_str()
            .to_string_lossy()
            .to_string();
        let db = crate::db::RocksDB::new(&tmp_path).unwrap();
        db.open().unwrap();

        // Add some keys
        db.put(b"key100", b"value1").unwrap();
        db.put(b"key101", b"value3").unwrap();
        db.put(b"key104", b"value4").unwrap();
        db.put(b"key200", b"value2").unwrap();

        // Count all keys
        let count = db.count_keys_at_prefix(b"key");
        assert_eq!(count.unwrap(), 4);

        // Count keys at prefix
        let count = db.count_keys_at_prefix(b"key1");
        assert_eq!(count.unwrap(), 3);

        // Count keys at prefix with a specific prefix that doesn't exist
        let count = db.count_keys_at_prefix(b"key11");
        assert_eq!(count.unwrap(), 0);

        // Count keys at prefix with a specific sub prefix
        let count = db.count_keys_at_prefix(b"key10");
        assert_eq!(count.unwrap(), 3);

        // Count keys at prefix with a specific prefix
        let count = db.count_keys_at_prefix(b"key200");
        assert_eq!(count.unwrap(), 1);

        // Count keys at prefix with a specific prefix that doesn't exist
        let count = db.count_keys_at_prefix(b"key201");
        assert_eq!(count.unwrap(), 0);

        // Cleanup
        db.destroy().unwrap();
    }
}
