use crate::{
    db::{RocksDB, RocksDbTransactionBatch},
    protos::DbTrieNode,
    store::{blake3_20, bytes_compare, HubError, RootPrefix},
};
use prost::Message as _;
use std::collections::HashMap;

use super::merkle_trie::TrieSnapshot;

pub const TIMESTAMP_LENGTH: usize = 10;

// This value is mirrored in [rpc/server.ts], make sure to change it in both places
const MAX_VALUES_RETURNED_PER_CALL: usize = 1024;

/// Represents a node in a MerkleTrie. Automatically updates the hashes when items are added,
/// and keeps track of the number of items in the subtree.
#[derive(Default, Debug, Clone)]
pub struct TrieNode {
    hash: Vec<u8>,
    items: usize,
    children: HashMap<u8, TrieNodeType>,
    key: Option<Vec<u8>>,
}

// An empty struct that represents a serialized trie node, which will need to be loaded from the db
#[derive(Debug, Clone)]
pub struct SerializedTrieNode {
    pub hash: Option<Vec<u8>>,
}

impl SerializedTrieNode {
    fn new(hash: Option<Vec<u8>>) -> Self {
        SerializedTrieNode { hash }
    }
}

// An enum that represents the different types of trie nodes
#[derive(Debug, Clone)]
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

    pub(crate) fn make_primary_key(prefix: &[u8], child_char: Option<u8>) -> Vec<u8> {
        let mut key = Vec::with_capacity(1 + prefix.len() + 1);
        key.push(RootPrefix::SyncMerkleTrieNode as u8);
        key.extend_from_slice(prefix);
        if let Some(char) = child_char {
            key.push(char);
        }

        key
    }

    pub fn serialize(node: &TrieNode) -> Vec<u8> {
        let db_trie_node = DbTrieNode {
            key: node.key.as_ref().unwrap_or(&vec![]).clone(),
            child_chars: node.children.keys().map(|c| *c as u32).collect(),
            items: node.items as u32,
            hash: node.hash.clone(),
        };

        db_trie_node.encode_to_vec()
    }

    pub(crate) fn deserialize(serialized: &[u8]) -> Result<TrieNode, HubError> {
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

    #[cfg(test)]
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

    pub fn get_node_from_trie(
        &mut self,
        db: &RocksDB,
        prefix: &[u8],
        current_index: usize,
    ) -> Option<&mut TrieNode> {
        if current_index == prefix.len() {
            return Some(self);
        }

        let char = prefix[current_index];
        if !self.children.contains_key(&char) {
            return None;
        }

        if let Ok(child) = self.get_or_load_child(db, &prefix[..current_index], char) {
            child.get_node_from_trie(db, prefix, current_index + 1)
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
        db: &RocksDB,
        txn: &mut RocksDbTransactionBatch,
        mut keys: Vec<Vec<u8>>,
        current_index: usize,
    ) -> Result<Vec<bool>, HubError> {
        if keys.len() == 0 {
            return Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: "No keys to insert".to_string(),
            });
        }

        // Note that all the keys will have the same prefix, so we can get the [0]th one
        let prefix = keys[0][..current_index].to_vec();

        let mut results = keys.iter().map(|_| false).collect::<Vec<bool>>();

        // Vec to store the keys that were not inserted and their index
        let remaining_keys;

        // Do not compact the timestamp portion of the trie, since it is used to compare snapshots
        if current_index >= TIMESTAMP_LENGTH && self.is_leaf() {
            let mut inserted = false;
            if self.key.is_none() {
                let key = keys.pop().unwrap();
                // Reached a leaf node with no value, insert it
                self.key = Some(key);
                self.items += 1;

                self.update_hash(db, &prefix)?;
                self.put_to_txn(txn, &prefix);

                inserted = true;

                results[0] = true; // the first key was inserted successfully
            }

            if keys.is_empty() {
                return Ok(results);
            }

            // See if any of the keys already exists
            remaining_keys = keys
                .into_iter()
                .enumerate()
                .filter_map(|(i, key)| {
                    if bytes_compare(self.key.as_ref().unwrap_or(&vec![]), key.as_slice()) == 0 {
                        // Key already exists, do nothing
                        results[i] = false;
                        None
                    } else {
                        Some((i + if inserted { 1 } else { 0 }, key)) // If we already pop()ed the first key, the index is i + 1
                    }
                })
                .collect::<Vec<_>>();

            if remaining_keys.is_empty() {
                // Nothing new was inserted, return
                return Ok(results);
            }

            //  If the key is different, and a value exists, then split the node
            self.split_leaf_node(db, txn, current_index)?;
        } else {
            // If not a leaf, then we need to add all the keys
            remaining_keys = keys.into_iter().enumerate().collect::<Vec<_>>()
        };

        // Check if any of the remaining keys are invalid
        if remaining_keys
            .iter()
            .any(|(_, key)| current_index >= key.len())
        {
            return Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: "Key length exceeded".to_string(),
            });
        }

        // For the remaining keys, group them by the key[current_index] and insert them in bulk
        // at the next level
        let mut grouped_keys = HashMap::new();
        for (i, key) in remaining_keys.into_iter() {
            let char = key[current_index];
            let entry = grouped_keys.entry(char).or_insert_with(|| (vec![], vec![]));

            entry.0.push(i);
            entry.1.push(key);
        }

        let mut successes = 0;
        for (char, (is, keys)) in grouped_keys.into_iter() {
            if !self.children.contains_key(&char) {
                self.children
                    .insert(char, TrieNodeType::Node(TrieNode::default()));
            }

            // Recurse into a non-leaf node and instruct it to insert the value.
            let child = self.get_or_load_child(db, &prefix, char)?;
            let child_results = child.insert(db, txn, keys, current_index + 1)?;

            for (i, result) in is.into_iter().zip(child_results) {
                results[i] = result;
                if result {
                    successes += 1;
                }
            }
        }

        if successes > 0 {
            self.items += successes;

            self.update_hash(db, &prefix)?;
            self.put_to_txn(txn, &prefix);
        }

        Ok(results)
    }

    pub fn delete(
        &mut self,
        db: &RocksDB,
        txn: &mut RocksDbTransactionBatch,
        keys: Vec<Vec<u8>>,
        current_index: usize,
    ) -> Result<Vec<bool>, HubError> {
        let prefix = keys[0][..current_index].to_vec();
        let mut results = keys.iter().map(|_| false).collect::<Vec<bool>>();

        if self.is_leaf() {
            // If any of the keys match, then we delete the key
            for (i, key) in keys.iter().enumerate() {
                if bytes_compare(self.key.as_ref().unwrap_or(&vec![]), key) == 0 {
                    self.key = None;
                    self.items -= 1;

                    self.delete_to_txn(txn, &prefix);
                    self.update_hash(db, &prefix)?;

                    results[i] = true;
                    break;
                }
            }

            return Ok(results);
        }

        // Check if any of the remaining keys are invalid
        if keys.iter().any(|key| current_index >= key.len()) {
            return Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: "Key length exceeded".to_string(),
            });
        }

        // For the remaining keys, we group them by the key[current_index] and delete them in bulk
        // at the next level
        let mut grouped_keys = HashMap::new();
        for (i, key) in keys.into_iter().enumerate() {
            let char = key[current_index];
            grouped_keys
                .entry(char)
                .or_insert_with(|| vec![])
                .push((i, key));
        }

        let mut successes = 0;
        for (char, child_keys) in grouped_keys.into_iter() {
            if !self.children.contains_key(&char) {
                // There are no more nodes under this, so we can return false for all the keys
                for (i, _) in child_keys.into_iter() {
                    results[i] = false;
                }
                continue;
            }

            let child = self.get_or_load_child(db, &prefix, char)?;

            // Split the child_keys into the "i"s and the keys
            let mut is = vec![];
            let mut keys = vec![];
            for (i, key) in child_keys.into_iter() {
                is.push(i);
                keys.push(key);
            }

            let child_results = child.delete(db, txn, keys, current_index + 1)?;
            let child_items = child.items;

            // Delete the child if it's empty. This is required to make sure the hash will be the same
            // as another trie that doesn't have this node in the first place.
            if child_items == 0 {
                self.children.remove(&char);
            }

            for (i, result) in is.into_iter().zip(child_results) {
                results[i] = result;
                if result {
                    successes += 1;
                }
            }
        }

        if successes > 0 {
            self.items -= successes;

            if self.items == 0 {
                // Delete this node
                self.delete_to_txn(txn, &prefix);
                self.update_hash(db, &prefix)?;
                return Ok(results);
            }

            if self.items == 1 && self.children.len() == 1 && current_index >= TIMESTAMP_LENGTH {
                // Compact the trie by removing the child and moving the key up
                let char = *self.children.keys().next().unwrap();
                let child = self.get_or_load_child(db, &prefix, char)?;

                if child.key.is_some() {
                    self.key = child.key.take();
                    self.children.remove(&char);

                    // Delete child
                    let child_prefix = Self::make_primary_key(&prefix, Some(char));
                    self.delete_to_txn(txn, &child_prefix);
                }
            }

            self.update_hash(db, &prefix)?;
            self.put_to_txn(txn, &prefix);
        }

        Ok(results)
    }

    pub fn exists(
        &mut self,
        db: &RocksDB,
        key: &[u8],
        current_index: usize,
    ) -> Result<bool, HubError> {
        if self.is_leaf() {
            return Ok(bytes_compare(self.key.as_ref().unwrap_or(&vec![]), key) == 0);
        }

        if current_index >= key.len() {
            return Ok(false);
        }
        let char = key[current_index];

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
        db: &RocksDB,
        txn: &mut RocksDbTransactionBatch,
        current_index: usize,
    ) -> Result<(), HubError> {
        let key = self.key.take().unwrap();
        let prefix = key[..current_index].to_vec();

        let new_child_char = key[current_index];

        self.children
            .insert(new_child_char, TrieNodeType::Node(TrieNode::default()));

        if let Some(TrieNodeType::Node(new_child)) = self.children.get_mut(&new_child_char) {
            new_child.insert(db, txn, vec![key], current_index + 1)?;
        }

        self.update_hash(db, &prefix)?;
        self.put_to_txn(txn, &prefix);

        Ok(())
    }

    fn get_or_load_child(
        &mut self,
        db: &RocksDB,
        prefix: &[u8],
        char: u8,
    ) -> Result<&mut TrieNode, HubError> {
        use std::collections::hash_map::Entry;

        match self.children.entry(char) {
            Entry::Occupied(mut entry) => {
                if let TrieNodeType::Serialized(_) = entry.get_mut() {
                    let child_prefix = Self::make_primary_key(prefix, Some(char));

                    let child_node = db
                        .get(&child_prefix)?
                        .map(|b| TrieNode::deserialize(&b).unwrap())
                        .unwrap_or_default();

                    *entry.get_mut() = TrieNodeType::Node(child_node);
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

    fn update_hash(&mut self, db: &RocksDB, prefix: &[u8]) -> Result<(), HubError> {
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

    fn excluded_hash(
        &mut self,
        db: &RocksDB,
        prefix: &[u8],
        prefix_char: u8,
    ) -> Result<(usize, String), HubError> {
        let mut excluded_items = 0;
        let mut child_hashes = vec![];

        let mut sorted_children = self.children.keys().map(|c| *c).collect::<Vec<_>>();
        sorted_children.sort();

        for char in sorted_children {
            if char != prefix_char {
                let child_node = self.get_or_load_child(db, prefix, char)?;
                child_hashes.push(child_node.hash.clone());
                excluded_items += child_node.items;
            }
        }

        let hash = blake3_20(&child_hashes.concat());

        Ok((excluded_items, hex::encode(hash.as_slice())))
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

    pub fn unload_children(&mut self) {
        let mut serialized_children = HashMap::new();
        for (char, child) in self.children.iter_mut() {
            if let TrieNodeType::Node(child) = child {
                serialized_children.insert(
                    *char,
                    TrieNodeType::Serialized(SerializedTrieNode::new(Some(child.hash.clone()))),
                );
            }
        }
        self.children = serialized_children;
    }

    pub fn get_all_values(
        &mut self,
        db: &RocksDB,
        prefix: &[u8],
    ) -> Result<Vec<Vec<u8>>, HubError> {
        if self.is_leaf() {
            return Ok(vec![self.key.clone().unwrap_or(vec![])]);
        }

        let mut values = vec![];
        let mut sorted_children = self.children.iter().map(|(c, _)| *c).collect::<Vec<_>>();
        sorted_children.sort();

        for char in sorted_children {
            let child_node = self.get_or_load_child(db, prefix, char)?;

            let mut child_prefix = prefix.to_vec();
            child_prefix.push(char);
            values.extend(child_node.get_all_values(db, &child_prefix)?);

            if values.len() > MAX_VALUES_RETURNED_PER_CALL {
                break;
            }
        }

        Ok(values)
    }

    pub fn get_snapshot(
        &mut self,
        db: &RocksDB,
        prefix: &[u8],
        current_index: usize,
    ) -> Result<TrieSnapshot, HubError> {
        let mut excluded_hashes = vec![];
        let mut num_messages = 0;

        let mut current_node = self; // traverse from the current node
        for (i, char) in prefix.iter().enumerate().skip(current_index) {
            let current_prefix = prefix[0..i].to_vec();

            let (excluded_items, excluded_hash) =
                current_node.excluded_hash(db, &current_prefix, *char)?;

            excluded_hashes.push(excluded_hash);
            num_messages += excluded_items;

            if !current_node.children.contains_key(char) {
                return Ok(TrieSnapshot {
                    prefix: current_prefix,
                    excluded_hashes,
                    num_messages,
                });
            }

            current_node = current_node.get_or_load_child(db, &current_prefix, *char)?;
        }

        excluded_hashes.push(hex::encode(current_node.hash.as_slice()));

        Ok(TrieSnapshot {
            prefix: prefix.to_vec(),
            excluded_hashes,
            num_messages,
        })
    }

    // Keeping this around since it is useful for debugging
    // pub fn print(&self, prefix: u8, depth: usize) -> Result<(), HubError> {
    //     let indent = "  ".repeat(depth);
    //     let key = self
    //         .key
    //         .as_ref()
    //         .map(|k| format!("{:?}", k))
    //         .unwrap_or("".to_string());

    //     println!(
    //         "{}{}{:?}: {}",
    //         indent,
    //         prefix,
    //         key,
    //         hex::encode(self.hash.as_slice())
    //     );

    //     for (char, child) in self.children.iter() {
    //         match child {
    //             TrieNodeType::Node(child_node) => child_node.print(*char, depth + 1)?,
    //             TrieNodeType::Serialized(_) => {
    //                 println!("{}  {} (serialized):", indent, *char as char);
    //             }
    //         }
    //     }

    //     Ok(())
    // }
}
