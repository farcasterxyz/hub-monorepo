use super::trie_node::{TrieNode, TIMESTAMP_LENGTH};
use crate::{
    db::{RocksDB, RocksDbTransactionBatch},
    logger::LOGGER,
    statsd::statsd,
    store::{encode_node_metadata_to_js_object, get_merkle_trie, hub_error_to_js_throw, HubError},
    THREAD_POOL,
};
use neon::object::Object as _;
use neon::{
    context::ModuleContext,
    result::NeonResult,
    types::{buffer::TypedArray as _, JsArray, JsObject},
};
use neon::{
    context::{Context as _, FunctionContext},
    result::JsResult,
    types::{Finalize, JsBox, JsBuffer, JsPromise, JsString},
};
use slog::{info, o};
use std::{
    borrow::Borrow,
    collections::HashMap,
    path::Path,
    sync::{atomic::AtomicBool, Arc, Mutex, RwLock},
};

pub const TRIE_DBPATH_PREFIX: &str = "trieDb";
const TRIE_UNLOAD_THRESHOLD: usize = 10_000;

#[derive(Debug)]
pub struct NodeMetadata {
    pub prefix: Vec<u8>,
    pub num_messages: usize,
    pub hash: String,
    pub children: HashMap<u8, NodeMetadata>,
}

pub struct TrieSnapshot {
    pub prefix: Vec<u8>,
    pub excluded_hashes: Vec<String>,
    pub num_messages: usize,
}

pub struct MerkleTrie {
    root: RwLock<Option<TrieNode>>,
    db: Arc<RocksDB>,
    logger: slog::Logger,
    db_owned: AtomicBool,
    txn_batch: Mutex<RocksDbTransactionBatch>,
}

// Implement Finalize so we can pass this struct between JS and Rust
impl Finalize for MerkleTrie {}

impl MerkleTrie {
    pub fn new(main_db_path: &str) -> Result<Self, HubError> {
        let path = Path::join(Path::new(main_db_path), Path::new(TRIE_DBPATH_PREFIX))
            .into_os_string()
            .into_string()
            .map_err(|os_str| {
                HubError::validation_failure(
                    format!("error with Merkle Trie path {:?}", os_str).as_str(),
                )
            })?;
        let db = Arc::new(RocksDB::new(path.as_str())?);

        let logger = LOGGER.new(o!("component" => "MerkleTrie"));
        Ok(MerkleTrie {
            root: RwLock::new(None),
            db,
            logger,
            db_owned: AtomicBool::new(true),
            txn_batch: Mutex::new(RocksDbTransactionBatch::new()),
        })
    }

    pub fn new_with_db(db: Arc<RocksDB>) -> Result<Self, HubError> {
        let logger = LOGGER.new(o!("component" => "MerkleTrie"));
        Ok(MerkleTrie {
            root: RwLock::new(None),
            db,
            logger,
            db_owned: AtomicBool::new(false),
            txn_batch: Mutex::new(RocksDbTransactionBatch::new()),
        })
    }

    fn create_empty_root(&self) {
        let root_key = TrieNode::make_primary_key(&[], None);
        let empty = TrieNode::new();
        let serialized = TrieNode::serialize(&empty);

        // Write the empty root node to the DB
        self.txn_batch.lock().unwrap().put(root_key, serialized);
        self.root.write().unwrap().replace(empty);
    }

    pub fn initialize(&self) -> Result<(), HubError> {
        // First open the DB
        if self.db_owned.load(std::sync::atomic::Ordering::Relaxed) {
            self.db.open()?;
        }

        // Then load the root node
        let root_key = TrieNode::make_primary_key(&[], None);
        if let Some(root_bytes) = self.db.get(&root_key)? {
            let root_node = TrieNode::deserialize(&root_bytes.as_slice())?;

            info!(self.logger, "Merkle Trie loaded from DB"; 
                "rootHash" => hex::encode(root_node.hash()), 
                "items" => root_node.items());
            // Replace the root node
            self.root.write().unwrap().replace(root_node);
        } else {
            info!(self.logger, "Merkle Trie initialized with empty root node");
            self.create_empty_root();
        }

        Ok(())
    }

    pub fn db(&self) -> Arc<RocksDB> {
        self.db.clone()
    }

    pub fn clear(&self) -> Result<(), HubError> {
        self.txn_batch.lock().unwrap().batch.clear();
        self.db.clear()?;

        self.create_empty_root();

        Ok(())
    }

    pub fn stop(&self) -> Result<(), HubError> {
        // Grab the root with a write lock
        let mut root = self.root.write().unwrap().take();
        if let Some(root) = root.as_mut() {
            // And write everything to disk
            self.unload_from_memory(root, true)?;
        }

        // Close
        if self.db_owned.load(std::sync::atomic::Ordering::Relaxed) {
            self.db.close()?;
        }

        Ok(())
    }

    /**
     *  Unload children from memory after every few ops, to prevent memory leaks.
     *  Note: We require a write-locked root node to perform this operation, which should
     *  be supplied by the caller.
     */
    fn unload_from_memory(&self, root: &mut TrieNode, force: bool) -> Result<(), HubError> {
        let mut txn_batch = self.txn_batch.lock().unwrap();
        if force || txn_batch.batch.len() > TRIE_UNLOAD_THRESHOLD {
            // Take the txn_batch out of the lock and replace it with a new one
            let pending_txn_batch =
                std::mem::replace(&mut *txn_batch, RocksDbTransactionBatch::new());

            statsd().gauge("merkle_trie.num_messages", root.items() as u64);
            info!(self.logger, "Unloading children from memory"; "force" => force, "pendingDbKeys" => pending_txn_batch.len());

            // Commit the txn_batch
            self.db.commit(pending_txn_batch)?;

            root.unload_children();
        }
        Ok(())
    }

    pub fn insert(&self, keys: Vec<Vec<u8>>) -> Result<Vec<bool>, HubError> {
        if keys.is_empty() {
            return Ok(Vec::new());
        }

        for key in keys.iter() {
            if key.len() < TIMESTAMP_LENGTH {
                return Err(HubError {
                    code: "bad_request.invalid_param".to_string(),
                    message: "Key length is too short".to_string(),
                });
            }
        }

        if let Some(root) = self.root.write().unwrap().as_mut() {
            let mut txn = RocksDbTransactionBatch::new();
            let results = root.insert(&self.db, &mut txn, keys, 0)?;

            self.txn_batch.lock().unwrap().merge(txn);
            self.unload_from_memory(root, false)?;

            Ok(results)
        } else {
            Err(HubError {
                code: "bad_request.internal_error".to_string(),
                message: format!("Merkle Trie not initialized for insert {:?}", keys),
            })
        }
    }

    pub fn delete(&self, keys: Vec<Vec<u8>>) -> Result<Vec<bool>, HubError> {
        if keys.is_empty() {
            return Ok(Vec::new());
        }

        for key in keys.iter() {
            if key.len() < TIMESTAMP_LENGTH {
                return Err(HubError {
                    code: "bad_request.invalid_param".to_string(),
                    message: "Key length is too short".to_string(),
                });
            }
        }

        if let Some(root) = self.root.write().unwrap().as_mut() {
            let mut txn = RocksDbTransactionBatch::new();
            let results = root.delete(&self.db, &mut txn, keys, 0)?;

            self.txn_batch.lock().unwrap().merge(txn);
            self.unload_from_memory(root, false)?;
            Ok(results)
        } else {
            Err(HubError {
                code: "bad_request.internal_error".to_string(),
                message: "Merkle Trie not initialized for delete".to_string(),
            })
        }
    }

    pub fn exists(&self, key: &Vec<u8>) -> Result<bool, HubError> {
        if let Some(root) = self.root.write().unwrap().as_mut() {
            root.exists(&self.db, &key, 0)
        } else {
            Err(HubError {
                code: "bad_request.internal_error".to_string(),
                message: "Merkle Trie not initialized for exists".to_string(),
            })
        }
    }

    pub fn items(&self) -> Result<usize, HubError> {
        if let Some(root) = self.root.read().unwrap().as_ref() {
            Ok(root.items())
        } else {
            Err(HubError {
                code: "bad_request.internal_error".to_string(),
                message: "Merkle Trie not initialized for items".to_string(),
            })
        }
    }

    pub fn get_node(&self, prefix: &[u8]) -> Option<TrieNode> {
        let node_key = TrieNode::make_primary_key(prefix, None);

        // We will first attempt to get it from the DB cache
        if let Some(Some(node_bytes)) = self.txn_batch.lock().unwrap().batch.get(&node_key) {
            if let Ok(node) = TrieNode::deserialize(&node_bytes) {
                return Some(node);
            }
        }

        // Else, get it directly from the DB
        if let Some(node_bytes) = self.db.get(&node_key).ok().flatten() {
            if let Ok(node) = TrieNode::deserialize(&node_bytes) {
                return Some(node);
            }
        }

        None
    }

    pub fn root_hash(&self) -> Result<Vec<u8>, HubError> {
        if let Some(root) = self.root.read().unwrap().as_ref() {
            Ok(root.hash())
        } else {
            Err(HubError {
                code: "bad_request.internal_error".to_string(),
                message: "Merkle Trie not initialized for root_hash".to_string(),
            })
        }
    }

    pub fn get_all_values(&self, prefix: &[u8]) -> Result<Vec<Vec<u8>>, HubError> {
        if let Some(root) = self.root.write().unwrap().as_mut() {
            if let Some(node) = root.get_node_from_trie(&self.db, prefix, 0) {
                node.get_all_values(&self.db, prefix)
            } else {
                Ok(Vec::new())
            }
        } else {
            Err(HubError {
                code: "bad_request.internal_error".to_string(),
                message: "Merkle Trie not initialized for get_all_values".to_string(),
            })
        }
    }

    pub fn get_snapshot(&self, prefix: &[u8]) -> Result<TrieSnapshot, HubError> {
        if let Some(root) = self.root.write().unwrap().as_mut() {
            let result = root.get_snapshot(&self.db, prefix, 0);

            result
        } else {
            Err(HubError {
                code: "bad_request.internal_error".to_string(),
                message: "Merkle Trie not initialized for get_snapshot".to_string(),
            })
        }
    }

    pub fn get_trie_node_metadata(&self, prefix: &[u8]) -> Result<NodeMetadata, HubError> {
        if let Some(node) = self.get_node(prefix) {
            let mut children = HashMap::new();

            for char in node.children().keys() {
                let mut child_prefix = prefix.to_vec();
                child_prefix.push(*char);

                let child_node = self.get_node(&child_prefix).ok_or(HubError {
                    code: "bad_request.internal_error".to_string(),
                    message: "Child Node not found".to_string(),
                })?;

                children.insert(
                    *char,
                    NodeMetadata {
                        prefix: child_prefix,
                        num_messages: child_node.items(),
                        hash: hex::encode(&child_node.hash()),
                        children: HashMap::new(),
                    },
                );
            }

            Ok(NodeMetadata {
                prefix: prefix.to_vec(),
                num_messages: node.items(),
                hash: hex::encode(&node.hash()),
                children,
            })
        } else {
            Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: "Node not found".to_string(),
            })
        }
    }
}

impl MerkleTrie {
    pub fn js_create_merkle_trie(mut cx: FunctionContext) -> JsResult<JsBox<Arc<MerkleTrie>>> {
        let db_path = cx.argument::<JsString>(0)?.value(&mut cx);
        let trie = match MerkleTrie::new(&db_path) {
            Ok(trie) => trie,
            Err(e) => return cx.throw_error::<String, _>(e.message),
        };

        Ok(cx.boxed(Arc::new(trie)))
    }

    pub fn js_create_merkle_trie_from_db(
        mut cx: FunctionContext,
    ) -> JsResult<JsBox<Arc<MerkleTrie>>> {
        let db = cx.argument::<JsBox<Arc<RocksDB>>>(0)?;
        let trie = match MerkleTrie::new_with_db((**db.borrow()).clone()) {
            Ok(trie) => trie,
            Err(e) => return cx.throw_error::<String, _>(e.message),
        };

        Ok(cx.boxed(Arc::new(trie)))
    }

    pub fn js_initialize(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let trie = get_merkle_trie(&mut cx)?;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        deferred.settle_with(&channel, move |mut cx| {
            if let Err(e) = trie.initialize() {
                return hub_error_to_js_throw(&mut cx, e);
            }

            Ok(cx.undefined())
        });

        Ok(promise)
    }

    pub fn js_get_db(mut cx: FunctionContext) -> JsResult<JsBox<Arc<RocksDB>>> {
        let trie = get_merkle_trie(&mut cx)?;
        let db = trie.db();

        Ok(cx.boxed(db))
    }

    pub fn js_clear(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let trie = get_merkle_trie(&mut cx)?;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        deferred.settle_with(&channel, move |mut cx| {
            if let Err(e) = trie.clear() {
                return hub_error_to_js_throw(&mut cx, e);
            }

            Ok(cx.undefined())
        });

        Ok(promise)
    }

    pub fn js_stop(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let trie = get_merkle_trie(&mut cx)?;
        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        deferred.settle_with(&channel, move |mut cx| {
            if let Err(e) = trie.stop() {
                return hub_error_to_js_throw(&mut cx, e);
            }
            Ok(cx.undefined())
        });

        Ok(promise)
    }

    pub fn js_batch_update(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let trie = get_merkle_trie(&mut cx)?;

        let inserts = cx.argument::<JsArray>(0)?;
        let deletes = cx.argument::<JsArray>(1)?;

        let insert_keys: Vec<Vec<u8>> = inserts
            .to_vec(&mut cx)?
            .iter()
            .map(|key| {
                key.downcast_or_throw::<JsBuffer, _>(&mut cx)
                    .unwrap()
                    .as_slice(&cx)
                    .to_vec()
            })
            .collect();

        let delete_keys: Vec<Vec<u8>> = deletes
            .to_vec(&mut cx)?
            .iter()
            .map(|key| {
                key.downcast_or_throw::<JsBuffer, _>(&mut cx)
                    .unwrap()
                    .as_slice(&cx)
                    .to_vec()
            })
            .collect();

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let insert_results = trie.insert(insert_keys);
            let delete_results = trie.delete(delete_keys);

            deferred.settle_with(&channel, move |mut cx| {
                // If either was an error, return the error
                if insert_results.is_err() || delete_results.is_err() {
                    return hub_error_to_js_throw(
                        &mut cx,
                        HubError {
                            code: "bad_request.internal_error".to_string(),
                            message: format!(
                                "Error in batch update: {:?} {:?}",
                                insert_results, delete_results
                            ),
                        },
                    );
                }

                let inserts = insert_results.unwrap();
                let deletes = delete_results.unwrap();

                let js_array = JsArray::new(&mut cx, inserts.len() + deletes.len());
                for (i, result) in inserts.into_iter().chain(deletes.into_iter()).enumerate() {
                    let val = cx.boolean(result);
                    js_array.set(&mut cx, i as u32, val)?;
                }

                Ok(js_array)
            });
        });

        Ok(promise)
    }

    pub fn js_insert(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let trie = get_merkle_trie(&mut cx)?;
        let key = cx.argument::<JsBuffer>(0)?.as_slice(&cx).to_vec();

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        let result = trie.insert(vec![key]);

        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(result) => Ok(cx.boolean(result[0])),
            Err(e) => hub_error_to_js_throw(&mut cx, e),
        });

        Ok(promise)
    }

    pub fn js_delete(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let trie = get_merkle_trie(&mut cx)?;
        let key = cx.argument::<JsBuffer>(0)?.as_slice(&cx).to_vec();

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        deferred.settle_with(&channel, move |mut cx| match trie.delete(vec![key]) {
            Ok(result) => Ok(cx.boolean(result[0])),
            Err(e) => hub_error_to_js_throw(&mut cx, e),
        });

        Ok(promise)
    }

    pub fn js_exists(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let trie = get_merkle_trie(&mut cx)?;
        let key = cx.argument::<JsBuffer>(0)?.as_slice(&cx).to_vec();

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        deferred.settle_with(&channel, move |mut cx| match trie.exists(&key) {
            Ok(exists) => Ok(cx.boolean(exists)),
            Err(e) => hub_error_to_js_throw(&mut cx, e),
        });

        Ok(promise)
    }

    pub fn js_get_snapshot(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let trie = get_merkle_trie(&mut cx)?;
        let prefix = cx.argument::<JsBuffer>(0)?.as_slice(&cx).to_vec();

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        deferred.settle_with(&channel, move |mut tcx| match trie.get_snapshot(&prefix) {
            Ok(snapshot) => {
                let js_object = JsObject::new(&mut tcx);

                let mut js_prefix = tcx.buffer(snapshot.prefix.len())?;
                js_prefix
                    .as_mut_slice(&mut tcx)
                    .copy_from_slice(&snapshot.prefix);
                js_object.set(&mut tcx, "prefix", js_prefix)?;

                let js_excluded_hashes = JsArray::new(&mut tcx, snapshot.excluded_hashes.len());
                for (i, excluded_hash) in snapshot.excluded_hashes.iter().enumerate() {
                    let js_excluded_hash = tcx.string(excluded_hash.to_string());
                    js_excluded_hashes.set(&mut tcx, i as u32, js_excluded_hash)?;
                }
                js_object.set(&mut tcx, "excludedHashes", js_excluded_hashes)?;

                let js_num_messages = tcx.number(snapshot.num_messages as f64);
                js_object.set(&mut tcx, "numMessages", js_num_messages)?;

                Ok(js_object)
            }
            Err(e) => hub_error_to_js_throw(&mut tcx, e),
        });

        Ok(promise)
    }

    pub fn js_get_trie_node_metadata(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let trie = get_merkle_trie(&mut cx)?;
        let prefix = cx.argument::<JsBuffer>(0)?.as_slice(&cx).to_vec();

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let result = trie.get_trie_node_metadata(&prefix);

            deferred.settle_with(&channel, move |mut tcx| match result {
                Ok(node_metadata) => {
                    let js_object = encode_node_metadata_to_js_object(&mut tcx, &node_metadata)?;
                    Ok(js_object)
                }
                Err(e) => hub_error_to_js_throw(&mut tcx, e),
            });
        });

        Ok(promise)
    }

    pub fn js_get_all_values(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let trie = get_merkle_trie(&mut cx)?;
        let prefix = cx.argument::<JsBuffer>(0)?.as_slice(&cx).to_vec();

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        THREAD_POOL.lock().unwrap().execute(move || {
            let result = trie.get_all_values(&prefix);

            deferred.settle_with(&channel, move |mut tcx| match result {
                Ok(values) => {
                    let js_array = JsArray::new(&mut tcx, values.len());
                    for (i, value) in values.iter().enumerate() {
                        let mut js_buffer = tcx.buffer(value.len())?;
                        js_buffer.as_mut_slice(&mut tcx).copy_from_slice(value);
                        js_array.set(&mut tcx, i as u32, js_buffer)?;
                    }

                    Ok(js_array)
                }
                Err(e) => hub_error_to_js_throw(&mut tcx, e),
            });
        });

        Ok(promise)
    }

    pub fn js_items(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let trie = get_merkle_trie(&mut cx)?;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        deferred.settle_with(&channel, move |mut cx| match trie.items() {
            Ok(items) => Ok(cx.number(items as f64)),
            Err(e) => hub_error_to_js_throw(&mut cx, e),
        });

        Ok(promise)
    }

    pub fn js_root_hash(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let trie = get_merkle_trie(&mut cx)?;
        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        deferred.settle_with(&channel, move |mut cx| match trie.root_hash() {
            Ok(root_hash) => {
                let mut js_buffer = cx.buffer(root_hash.len())?;
                js_buffer.as_mut_slice(&mut cx).copy_from_slice(&root_hash);
                Ok(js_buffer)
            }
            Err(e) => hub_error_to_js_throw(&mut cx, e),
        });

        Ok(promise)
    }

    pub fn js_unload_children(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let trie = get_merkle_trie(&mut cx)?;

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();

        deferred.settle_with(&channel, move |mut cx| {
            if let Some(root) = trie.root.write().unwrap().as_mut() {
                if let Err(e) = trie.unload_from_memory(root, true) {
                    return hub_error_to_js_throw(&mut cx, e);
                }
            }

            Ok(cx.undefined())
        });

        Ok(promise)
    }

    pub fn register_js_methods(cx: &mut ModuleContext) -> NeonResult<()> {
        cx.export_function("createMerkleTrie", Self::js_create_merkle_trie)?;
        cx.export_function(
            "createMerkleTrieFromDb",
            Self::js_create_merkle_trie_from_db,
        )?;
        cx.export_function("merkleTrieGetDb", Self::js_get_db)?;
        cx.export_function("merkleTrieInitialize", Self::js_initialize)?;
        cx.export_function("merkleTrieClear", Self::js_clear)?;
        cx.export_function("merkleTrieStop", Self::js_stop)?;
        cx.export_function("merkleTrieBatchUpdate", Self::js_batch_update)?;
        cx.export_function("merkleTrieInsert", Self::js_insert)?;
        cx.export_function("merkleTrieDelete", Self::js_delete)?;
        cx.export_function("merkleTrieExists", Self::js_exists)?;
        cx.export_function("merkleTrieGetSnapshot", Self::js_get_snapshot)?;
        cx.export_function(
            "merkleTrieGetTrieNodeMetadata",
            Self::js_get_trie_node_metadata,
        )?;
        cx.export_function("merkleTrieGetAllValues", Self::js_get_all_values)?;
        cx.export_function("merkleTrieItems", Self::js_items)?;
        cx.export_function("merkleTrieRootHash", Self::js_root_hash)?;
        cx.export_function("merkleTrieUnloadChildren", Self::js_unload_children)?;

        Ok(())
    }
}
