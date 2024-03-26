use crate::{
    db::{RocksDB, RocksDbTransactionBatch},
    protos::DbTrieNode,
    store::{bytes_compare, HubError, RootPrefix},
};
use prost::Message as _;
use std::{collections::HashMap, sync::Arc};

pub const TIMESTAMP_LENGTH: usize = 10;

/// Represents a node in a MerkleTrie. Automatically updates the hashes when items are added,
/// and keeps track of the number of items in the subtree.
#[derive(Default)]
pub struct TrieNode {
    hash: Vec<u8>,
    items: usize,
    children: HashMap<u8, TrieNodeType>,
    key: Option<Vec<u8>>,
}

// An empty struct that represents a serialized trie node, which will need to be loaded from the db
struct SerializedTrieNode {
    hash: Option<Vec<u8>>,
}

impl SerializedTrieNode {
    fn new(hash: Option<Vec<u8>>) -> Self {
        SerializedTrieNode { hash }
    }
}

// An enum that represents the different types of trie nodes
pub enum TrieNodeType {
    Node(TrieNode),
    Serialized(SerializedTrieNode),
}

impl TrieNode {
    pub fn new() -> Self {
        TrieNode {
            hash: vec![],
            items: 0,
            children: HashMap::new(),
            key: None,
        }
    }

    fn make_primary_key(prefix: &[u8], child_char: Option<u8>) -> Vec<u8> {
        let mut key = Vec::with_capacity(1 + prefix.len() + 1);
        key.push(RootPrefix::SyncMerkleTrieNode as u8);
        key.extend_from_slice(prefix);
        if let Some(char) = child_char {
            key.push(char);
        }

        key
    }

    fn serialize(node: &TrieNode) -> Vec<u8> {
        let db_trie_node = DbTrieNode {
            key: node.key.as_ref().unwrap_or(&vec![]).clone(),
            child_chars: node.children.keys().map(|c| *c as u32).collect(),
            items: node.items as u32,
            hash: node.hash.clone(),
        };

        db_trie_node.encode_to_vec()
    }

    fn deserialize(serialized: &[u8]) -> Result<TrieNode, HubError> {
        let db_trie_node = DbTrieNode::decode(serialized).map_err(|e| HubError {
            code: "bad_request.invalid_param".to_string(),
            message: format!("Failed to decode trie node: {}", e),
        })?;

        let mut children = HashMap::new();
        for char in db_trie_node.child_chars {
            children.insert(
                char as u8,
                TrieNodeType::Serialized(SerializedTrieNode::new(None)),
            );
        }

        Ok(TrieNode {
            hash: db_trie_node.hash,
            items: db_trie_node.items as usize,
            children,
            key: Some(db_trie_node.key),
        })
    }
}

impl TrieNode {
    pub fn is_leaf(&self) -> bool {
        self.children.is_empty()
    }

    pub fn items(&self) -> usize {
        self.items
    }

    pub fn hash(&self) -> Vec<u8> {
        self.hash.clone()
    }

    pub fn value(&self) -> Option<Vec<u8>> {
        // Value is only defined for leaf nodes
        if self.is_leaf() {
            self.key.clone()
        } else {
            None
        }
    }

    pub fn children(&self) -> &HashMap<u8, TrieNodeType> {
        &self.children
    }

    pub fn get_node(
        &mut self,
        db: &Arc<RocksDB>,
        prefix: &[u8],
        current_index: usize,
    ) -> Option<&TrieNode> {
        if current_index == prefix.len() {
            return Some(self);
        }

        let char = prefix[current_index];
        if !self.children.contains_key(&char) {
            return None;
        }

        if let Ok(child) = self.get_or_load_child(db, &prefix[..current_index], char) {
            child.get_node(db, prefix, current_index + 1)
        } else {
            None
        }
    }

    /**
     * Inserts a value into the trie. Returns true if the value was inserted, false if it already existed.
     * Recursively traverses the trie by prefix and inserts the value at the end. Updates the hashes for
     * every node that was traversed.
     *
     * @param key - The key to insert
     * @param current_index - The index of the current character in the key (only used internally)
     * @returns true if the value was inserted, false if it already existed
     */
    pub fn insert(
        &mut self,
        db: &Arc<RocksDB>,
        txn: &mut RocksDbTransactionBatch,
        key: &Vec<u8>,
        current_index: usize,
    ) -> Result<bool, HubError> {
        if current_index >= key.len() {
            return Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: "Key length exceeded".to_string(),
            });
        }

        let char = key[current_index];

        // Do not compact the timestamp portion of the trie, since it is used to compare snapshots
        if current_index >= TIMESTAMP_LENGTH && self.is_leaf() && self.key.is_none() {
            // Reached a leaf node with no value, insert it

            self.key = Some(key.clone());
            self.items += 1;

            self.update_hash(db, &key[..current_index])?;

            return Ok(true);
        }

        if current_index >= TIMESTAMP_LENGTH && self.is_leaf() {
            // See if the key already exists
            if bytes_compare(self.key.as_ref().unwrap_or(&vec![]), key.as_slice()) == 0 {
                // Key already exists, do nothing
                return Ok(false);
            }

            //  If the key is different, and a value exists, then split the node
            self.split_leaf_node(db, txn, current_index)?;
        }

        if !self.children.contains_key(&char) {
            self.children
                .insert(char, TrieNodeType::Node(TrieNode::default()));
        }

        // Recurse into a non-leaf node and instruct it to insert the value
        let child = self.get_or_load_child(db, &key[..current_index], char)?;
        let result = child.insert(db, txn, key, current_index + 1)?;

        if result {
            self.items += 1;
            self.update_hash(db, &key[..current_index])?;

            self.put_to_txn(txn, &key[..current_index]);
        }

        Ok(result)
    }

    pub fn delete(
        &mut self,
        db: &Arc<RocksDB>,
        txn: &mut RocksDbTransactionBatch,
        key: &[u8],
        current_index: usize,
    ) -> Result<bool, HubError> {
        if current_index > key.len() {
            return Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: "Key length exceeded".to_string(),
            });
        }

        if self.is_leaf() {
            if bytes_compare(self.key.as_ref().unwrap_or(&vec![]), key) == 0 {
                self.key = None;
                self.items -= 1;

                self.delete_to_txn(txn, &key[..current_index]);

                return Ok(true);
            }

            return Ok(false);
        }

        let char = key[current_index];
        if !self.children.contains_key(&char) {
            return Ok(false);
        }

        let child = self.get_or_load_child(db, &key[..current_index], char)?;
        let result = child.delete(db, txn, key, current_index + 1)?;
        let child_items = child.items;

        if result {
            self.items -= 1;

            // Delete the child if it's empty. This is required to make sure the hash will be the same
            // as another trie that doesn't have this node in the first place.
            if child_items == 0 {
                self.children.remove(&char);

                if self.items == 0 {
                    // Delete this node
                    self.delete_to_txn(txn, &key[..current_index]);
                    self.update_hash(db, &key[..current_index])?;
                    return Ok(true);
                }
            }

            if self.items == 1 && self.children.len() == 1 && current_index >= TIMESTAMP_LENGTH {
                // Compact the trie by removing the child and moving the key up
                let char = *self.children.keys().next().unwrap();
                let child = self.get_or_load_child(db, &key[..current_index], char)?;

                if child.key.is_some() {
                    self.key = child.key.take();
                    self.children.remove(&char);

                    // Delete child
                    let child_prefix = Self::make_primary_key(&key[..current_index], Some(char));
                    self.delete_to_txn(txn, &child_prefix);
                }
            }

            self.update_hash(db, &key[..current_index])?;
            self.put_to_txn(txn, &key[..current_index]);
        }

        Ok(result)
    }

    pub fn exists(
        &mut self,
        db: &Arc<RocksDB>,
        key: &[u8],
        current_index: usize,
    ) -> Result<bool, HubError> {
        if current_index > key.len() {
            return Ok(false);
        }

        let char = key[current_index];

        if self.is_leaf() {
            return Ok(bytes_compare(self.key.as_ref().unwrap_or(&vec![]), key) == 0);
        }

        if !self.children.contains_key(&char) {
            return Ok(false);
        }

        let child = self.get_or_load_child(db, &key[..current_index], char)?;
        child.exists(db, key, current_index + 1)
    }

    /**
     *  Splits a leaf node into a non-leaf node by clearing its key/value and adding a child for
     *  the next char in its key
     */
    pub fn split_leaf_node(
        &mut self,
        db: &Arc<RocksDB>,
        txn: &mut RocksDbTransactionBatch,
        current_index: usize,
    ) -> Result<(), HubError> {
        let key = self.key.take().unwrap();
        let new_child_char = key[current_index];

        self.children
            .insert(new_child_char, TrieNodeType::Node(TrieNode::default()));

        if let Some(TrieNodeType::Node(new_child)) = self.children.get_mut(&new_child_char) {
            new_child.insert(db, txn, &key, current_index + 1)?;
        }

        let prefix = &key[..current_index];
        self.update_hash(db, prefix)?;
        self.put_to_txn(txn, prefix);

        Ok(())
    }

    fn get_or_load_child(
        &mut self,
        db: &Arc<RocksDB>,
        prefix: &[u8],
        char: u8,
    ) -> Result<&mut TrieNode, HubError> {
        use std::collections::hash_map::Entry;

        match self.children.entry(char) {
            Entry::Occupied(mut entry) => {
                if let TrieNodeType::Serialized(_) = entry.get_mut() {
                    let child_prefix = Self::make_primary_key(prefix, Some(char));
                    if let Some(serialized) = db.get(&child_prefix)? {
                        let child_node = TrieNode::deserialize(&serialized).unwrap();
                        *entry.get_mut() = TrieNodeType::Node(child_node);
                    } else {
                        return Err(HubError {
                            code: "bad_request.invalid_param".to_string(),
                            message: format!("Child {} at prefix {:?} was None", char, prefix),
                        });
                    }
                }
                match entry.into_mut() {
                    TrieNodeType::Node(node) => Ok(node),
                    _ => Err(HubError {
                        code: "bad_request.invalid_param".to_string(),
                        message: format!("Child {} is not a node", char),
                    }),
                }
            }
            Entry::Vacant(_) => Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: format!("Child {} at prefix {:?} not found", char, prefix),
            }),
        }
    }

    fn update_hash(&mut self, db: &Arc<RocksDB>, prefix: &[u8]) -> Result<(), HubError> {
        if self.is_leaf() {
            self.hash = blake3_20(&self.key.as_ref().unwrap_or(&vec![]));
        } else {
            // Sort the children by their "char" value
            let child_hashes = {
                let mut sorted_children: Vec<_> = self.children.iter_mut().collect();
                sorted_children.sort_by_key(|(char, _)| *char);

                sorted_children
                    .iter()
                    .map(|(char, child)| match child {
                        TrieNodeType::Node(node) => (**char, node.hash.clone()),
                        TrieNodeType::Serialized(serialized) => {
                            if serialized.hash.is_some() {
                                (**char, serialized.hash.as_ref().unwrap().clone())
                            } else {
                                (**char, vec![])
                            }
                        }
                    })
                    .collect::<Vec<_>>()
            };

            // If any of the child hashes are none, we load the child from the db
            let mut concat_hashes = vec![];
            for (char, hash) in child_hashes.iter() {
                if hash.is_empty() {
                    let child = self.get_or_load_child(db, prefix, *char)?;
                    concat_hashes.extend_from_slice(child.hash.as_slice());
                } else {
                    concat_hashes.extend_from_slice(hash.as_slice());
                }
            }

            self.hash = blake3_20(&concat_hashes);
        }

        Ok(())
    }

    fn put_to_txn(&self, txn: &mut RocksDbTransactionBatch, prefix: &[u8]) {
        let key = Self::make_primary_key(prefix, None);
        let serialized = Self::serialize(self);
        txn.put(key, serialized);
    }

    fn delete_to_txn(&self, txn: &mut RocksDbTransactionBatch, prefix: &[u8]) {
        let key = Self::make_primary_key(prefix, None);
        txn.delete(key);
    }

    pub fn print(&self, prefix: u8, depth: usize) -> Result<(), HubError> {
        let indent = "  ".repeat(depth);
        let key = self
            .key
            .as_ref()
            .map(|k| format!("{:?}", k))
            .unwrap_or("".to_string());

        println!(
            "{}{}{:?}: {}",
            indent,
            prefix,
            key,
            hex::encode(self.hash.as_slice())
        );

        for (char, child) in self.children.iter() {
            match child {
                TrieNodeType::Node(child_node) => child_node.print(*char, depth + 1)?,
                TrieNodeType::Serialized(_) => {
                    println!("{}  {} (serialized):", indent, *char as char);
                }
            }
        }

        Ok(())
    }
}

/**
 * The hashes in the sync trie are 20 bytes (160 bits) long, so we use the first 20 bytes of the blake3 hash
 */
fn blake3_20(input: &[u8]) -> Vec<u8> {
    let mut hasher = blake3::Hasher::new();
    hasher.update(input);
    hasher.finalize().as_bytes()[..20].to_vec()
}
