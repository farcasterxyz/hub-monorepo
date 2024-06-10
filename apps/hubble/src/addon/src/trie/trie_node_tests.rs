#[cfg(test)]
mod tests {
    use crate::{
        db::{RocksDB, RocksDbTransactionBatch},
        trie::trie_node::{TrieNode, TrieNodeType, TIMESTAMP_LENGTH},
    };
    use hex::FromHex as _;
    use std::{sync::Arc, vec};

    fn empty_hash() -> Vec<u8> {
        blake3::hash(b"").as_bytes()[0..20].to_vec()
    }

    fn traverse(node: &TrieNode) -> &TrieNode {
        let mut path = node;
        while path.children().len() == 1 {
            path = match path.children().values().next().unwrap() {
                TrieNodeType::Node(child) => child,
                _ => panic!("expected Node"),
            }
        }
        path
    }

    #[test]
    fn test_trie_node_insert() {
        // Create a new DB with a random temporary path
        let tmp_path = tempfile::tempdir()
            .unwrap()
            .path()
            .as_os_str()
            .to_string_lossy()
            .to_string();
        let db = Arc::new(RocksDB::new(&tmp_path).unwrap());
        db.open().unwrap();
        let mut txn = RocksDbTransactionBatch::new();

        // Create a new TrieNode
        let mut node = TrieNode::new();
        assert_eq!(node.items(), 0);
        assert_eq!(node.hash(), Vec::<u8>::new());

        // Can't insert keylengths < 10
        let key = (0..9).collect::<Vec<_>>();
        let r = node.insert(&db, &mut txn, vec![key], 0);
        assert_eq!(r.is_err(), true);
        assert_eq!(r.unwrap_err().code, "bad_request.invalid_param".to_string());
        assert_eq!(node.items(), 0);

        // Add a new key. [0, 1, 2, .... 20]
        let key = (0..=20).collect::<Vec<_>>();
        let r = node.insert(&db, &mut txn, vec![key.clone()], 0);
        assert_eq!(r.unwrap()[0], true);
        assert_eq!(node.items(), 1);
        assert_eq!(node.value(), None);

        // Make sure the key exists
        let r = node.exists(&db, &key, 0);
        assert_eq!(r.is_ok(), true);
        assert_eq!(r.unwrap(), true);

        // Traverse the node and get to the leaf to make sure value exists
        let mut path = &node;
        for i in 0..10 {
            assert_eq!(path.items(), 1, "i: {}", i);
            assert_eq!(path.children().len(), 1, "i: {}", i);
            path = match path.children().values().next().unwrap() {
                TrieNodeType::Node(child) => child,
                _ => panic!("expected Node"),
            }
        }
        // The 10th child should be a leaf
        assert_eq!(path.items(), 1);
        assert_eq!(path.is_leaf(), true);
        assert_eq!(path.value(), Some(key.clone()));
        assert_eq!(path.children().len(), 0);

        // Make sure the txn is correctly populated with all 11 entries (10 uncompacted nodes + 1 leaf node)
        assert_eq!(txn.batch.len(), 11);

        db.commit(txn).unwrap();
        let mut txn = RocksDbTransactionBatch::new();

        // Inserting the same item again it idempotent
        let prev_hash = node.hash();
        let r = node.insert(&db, &mut txn, vec![key.clone()], 0);
        assert_eq!(r.unwrap()[0], false);
        assert_eq!(node.items(), 1);
        assert_eq!(node.hash(), prev_hash);
        assert_eq!(txn.batch.len(), 0);

        // Traverse the node and get to the leaf to make sure value exists
        let mut path = &node;
        for i in 0..10 {
            assert_eq!(path.children().len(), 1, "i: {}", i);
            path = match path.children().values().next().unwrap() {
                TrieNodeType::Node(child) => child,
                _ => panic!("expected Node"),
            }
        }
        // The 10th child should be a leaf
        assert_eq!(path.is_leaf(), true);
        assert_eq!(path.value(), Some(key.clone()));

        // Now, create a new key with a different value at the 12th position. This should split the leaf node at that position
        let mut key2 = key.clone();
        let split_pos = 12;
        key2[split_pos] = 42; // Differs from the original key at the 12th position
        let prev_hash = node.hash();
        let r = node.insert(&db, &mut txn, vec![key2.clone()], 0);
        assert_eq!(r.unwrap()[0], true);
        assert_eq!(node.items(), 2);
        assert_ne!(node.hash(), prev_hash);

        let split_node = traverse(&node);
        assert_eq!(split_node.items(), 2);
        assert_eq!(split_node.children().len(), 2);

        // Check the 2 children and make sure they are leaf nodes
        let child_42 = match split_node.children().get(&42).unwrap() {
            TrieNodeType::Node(child) => child,
            _ => panic!("expected Node"),
        };
        assert_eq!(child_42.is_leaf(), true);
        assert_eq!(child_42.value(), Some(key2.clone()));

        let child_old = match split_node.children().get(&key[split_pos]).unwrap() {
            TrieNodeType::Node(child) => child,
            _ => panic!("expected Node"),
        };
        assert_eq!(child_old.is_leaf(), true);
        assert_eq!(child_old.value(), Some(key.clone()));

        // Add another key that splits at the 4th position, which is < timestamp length
        let mut key3 = key.clone();
        let split_pos = 4;
        key3[split_pos] = 84; // Differs from the original key at the 4th position
        let prev_hash = node.hash();
        let r = node.insert(&db, &mut txn, vec![key3.clone()], 0);
        assert_eq!(r.unwrap()[0], true);
        assert_eq!(node.items(), 3);
        assert_ne!(node.hash(), prev_hash);

        // Traverse to the first split
        let split_node = traverse(&node);
        assert_eq!(split_node.items(), 3);
        assert_eq!(split_node.children().len(), 2);

        // Check the 2 children
        let child_84 = match split_node.children().get(&84).unwrap() {
            TrieNodeType::Node(child) => child,
            _ => panic!("expected Node"),
        };
        assert_eq!(child_84.is_leaf(), false); // Not a leaf node because it is split at < timestamp length
        assert_eq!(child_84.items(), 1);
        assert_eq!(child_84.children().len(), 1);
        let child_84_leaf = traverse(&child_84);
        assert_eq!(child_84_leaf.is_leaf(), true);
        assert_eq!(child_84_leaf.value(), Some(key3.clone()));

        // The old child still exists
        let child_old = match split_node.children().get(&key[split_pos]).unwrap() {
            TrieNodeType::Node(child) => child,
            _ => panic!("expected Node"),
        };
        assert_eq!(child_old.is_leaf(), false); // Not a leaf node because it is split at < timestamp length
        assert_eq!(child_old.items(), 2); // Still contains the 2 old keys
        assert_eq!(child_old.children().len(), 1); // The new key is the only child, which will split later

        // Cleanup
        db.destroy().unwrap();
    }

    #[test]
    fn test_trie_node_insert_one_byte() {
        // Create a new DB with a random temporary path
        let tmp_path = tempfile::tempdir()
            .unwrap()
            .path()
            .as_os_str()
            .to_string_lossy()
            .to_string();
        let db = Arc::new(RocksDB::new(&tmp_path).unwrap());
        db.open().unwrap();
        let mut txn = RocksDbTransactionBatch::new();

        // Create a new TrieNode
        let mut node = TrieNode::new();
        assert_eq!(node.items(), 0);

        let key1 = (0..=20).collect::<Vec<_>>();
        let mut key2 = key1.clone();
        key2[20] = 42;

        let r = node.insert(&db, &mut txn, vec![key1.clone()], 0);
        assert_eq!(r.unwrap()[0], true);

        let r = node.insert(&db, &mut txn, vec![key2.clone()], 0);
        assert_eq!(r.unwrap()[0], true);

        // Check that both exists return true
        let r = node.exists(&db, &key1, 0);
        assert_eq!(r, Ok(true));

        let r = node.exists(&db, &key2, 0);
        assert_eq!(r, Ok(true));

        // Make sure both delete Ok
        let r = node.delete(&db, &mut txn, vec![key1.clone()], 0);
        assert_eq!(r.unwrap()[0], true);
        assert_eq!(node.items(), 1);

        let r = node.delete(&db, &mut txn, vec![key2.clone()], 0);
        assert_eq!(r.unwrap()[0], true);
        assert_eq!(node.items(), 0);
        assert_eq!(node.hash(), empty_hash());

        // Cleanup
        db.destroy().unwrap();
    }

    #[test]
    fn test_trie_node_delete() {
        // Create a new DB with a random temporary path
        let tmp_path = tempfile::tempdir()
            .unwrap()
            .path()
            .as_os_str()
            .to_string_lossy()
            .to_string();
        let db = Arc::new(RocksDB::new(&tmp_path).unwrap());
        db.open().unwrap();
        let mut txn = RocksDbTransactionBatch::new();

        // Create a new TrieNode
        let mut node = TrieNode::new();
        assert_eq!(node.items(), 0);

        // Add a new key. [0, 1, 2, .... 20]
        let key = (0..=20).collect::<Vec<_>>();
        let r = node.insert(&db, &mut txn, vec![key.clone()], 0);
        assert_eq!(r.unwrap()[0], true);

        // delete the key
        let r = node.delete(&db, &mut txn, vec![key.clone()], 0);
        assert_eq!(r.unwrap()[0], true);
        assert_eq!(node.items(), 0);
        assert_eq!(node.hash(), empty_hash());

        // Getting the item after it has been deleted should return false
        let r = node.exists(&db, &key, 0);
        assert_eq!(r, Ok(false));

        // Add 2 keys
        let split_pos = 14;
        let key1 = (0..=20).collect::<Vec<_>>();
        let mut key2 = key1.clone();
        key2[split_pos] = 42;

        let r = node.insert(&db, &mut txn, vec![key1.clone()], 0);
        assert_eq!(r.unwrap()[0], true);
        let hash1 = node.hash();

        let r = node.insert(&db, &mut txn, vec![key2.clone()], 0);
        assert_eq!(r.unwrap()[0], true);
        assert_ne!(node.hash(), hash1);

        // Delete the second key
        let r = node.delete(&db, &mut txn, vec![key2.clone()], 0);
        assert_eq!(r.unwrap()[0], true);

        // The first key should still exist
        let r = node.exists(&db, &key1, 0);
        assert_eq!(r, Ok(true));

        // But the second key should not, even though it has the same prefix
        let r = node.exists(&db, &key2, 0);
        assert_eq!(r, Ok(false));

        // The hash should be the same as before the 2nd key was added
        assert_eq!(node.hash(), hash1);

        // Delete the first key
        let r = node.delete(&db, &mut txn, vec![key1.clone()], 0);
        assert_eq!(r.unwrap()[0], true);
        assert_eq!(node.items(), 0);

        // Deleting one of 3 keys only compacts that branch of the trie

        let ids: Vec<Vec<u8>> = vec![
            format!("{:0>width$}010680", "0", width = TIMESTAMP_LENGTH * 2),
            format!("{:0>width$}010a10", "0", width = TIMESTAMP_LENGTH * 2),
            format!("{:0>width$}05d220", "0", width = TIMESTAMP_LENGTH * 2),
        ]
        .into_iter()
        .map(|id| Vec::from_hex(id).unwrap())
        .collect();

        let mut txn = RocksDbTransactionBatch::new();
        for id in ids.iter() {
            let r = node.insert(&db, &mut txn, vec![id.clone()], 0).unwrap();
            assert_eq!(r[0], true);
        }

        // Remove the first id
        let r = node.delete(&db, &mut txn, vec![ids[0].clone()], 0).unwrap();
        assert_eq!(r[0], true);

        // Expect the other 2 ids to still exist
        for id in ids.iter().skip(1) {
            let r = node.exists(&db, id, 0).unwrap();
            assert_eq!(r, true);
        }
        assert_eq!(node.items(), 2);

        // There is only 1 split node left
        let split_node = traverse(&node);
        assert_eq!(split_node.items(), 2);
        assert_eq!(split_node.children().len(), 2);

        // Delete both ids

        let r = node
            .delete(&db, &mut txn, vec![ids[1].clone(), ids[2].clone()], 0)
            .unwrap();
        assert_eq!(r, [true, true]);

        // Deleting from a deeper node should compact the trie at the split node
        let ids: Vec<Vec<u8>> = vec![
            "0030662167axxxx".to_string(),
            "0030662167bcdxxxx".to_string(),
            "0035059000xxxx".to_string(),
        ]
        .into_iter()
        .map(|id| id.into_bytes())
        .collect();

        let mut txn = RocksDbTransactionBatch::new();
        for id in ids.iter() {
            let r = node.insert(&db, &mut txn, vec![id.clone()], 0).unwrap();
            assert_eq!(r[0], true);
        }

        // Remove just the first ID
        let r = node.delete(&db, &mut txn, vec![ids[0].clone()], 0);
        assert_eq!(r.unwrap()[0], true);

        // The other 2 ids should still exist
        assert_eq!(node.items(), 2);
        for id in ids.iter().skip(1) {
            let r = node.exists(&db, id, 0).unwrap();
            assert_eq!(r, true);
        }

        // Ensure the branch is compacted
        let node1 = node.get_node_from_trie(&db, &ids[1][0..10], 0).unwrap();
        assert_eq!(node1.is_leaf(), true);
        assert_eq!(node1.value(), Some(ids[1].clone()));

        let node2 = node.get_node_from_trie(&db, &ids[2][0..10], 0).unwrap();
        assert_eq!(node2.is_leaf(), true);
        assert_eq!(node2.value(), Some(ids[2].clone()));

        // delete the other 2 ids
        for id in ids.iter().skip(1) {
            let r = node.delete(&db, &mut txn, vec![id.clone()], 0).unwrap();
            assert_eq!(r, [true]);
        }

        // Cleanup
        db.destroy().unwrap();
    }

    #[test]
    fn test_trie_node_hashes() {
        // Create a new DB with a random temporary path
        let tmp_path = tempfile::tempdir()
            .unwrap()
            .path()
            .as_os_str()
            .to_string_lossy()
            .to_string();
        let db = Arc::new(RocksDB::new(&tmp_path).unwrap());
        db.open().unwrap();

        // Create a new TrieNode
        let mut node = TrieNode::new();
        assert_eq!(node.items(), 0);
        assert_eq!(node.hash(), Vec::<u8>::new());

        let ids: Vec<Vec<u8>> = vec![
            format!("{:0>width$}010680", "0", width = TIMESTAMP_LENGTH * 2),
            format!("{:0>width$}010a10", "0", width = TIMESTAMP_LENGTH * 2),
            format!("{:0>width$}05d220", "0", width = TIMESTAMP_LENGTH * 2),
        ]
        .into_iter()
        .map(|id| Vec::from_hex(id).unwrap())
        .collect();

        // Add the ids in forward order
        let mut txn = RocksDbTransactionBatch::new();
        for id in ids.iter() {
            let r = node.insert(&db, &mut txn, vec![id.clone()], 0).unwrap();
            assert_eq!(r[0], true);
        }
        db.commit(txn).unwrap();
        let forward_hash = node.hash();

        // Delete the ids in forward order
        let mut txn = RocksDbTransactionBatch::new();
        for id in ids.iter() {
            let r = node.delete(&db, &mut txn, vec![id.clone()], 0).unwrap();
            assert_eq!(r, [true]);
        }
        db.commit(txn).unwrap();

        // Ad the ids in reverse order
        let mut txn = RocksDbTransactionBatch::new();
        for id in ids.iter().rev() {
            let r = node.insert(&db, &mut txn, vec![id.clone()], 0).unwrap();
            assert_eq!(r[0], true);
        }
        db.commit(txn).unwrap();
        assert_eq!(node.hash(), forward_hash);

        // Make sure that all the values are there
        let all_values = node.get_all_values(&db, &[]).unwrap();
        for id in ids.iter() {
            assert_eq!(all_values.contains(id), true);
        }

        // Unload the children
        node.unload_children();

        // Make sure that all the children are serialized
        node.children().values().for_each(|child| match child {
            TrieNodeType::Node(_) => panic!("Not serialized!"),
            TrieNodeType::Serialized(s) => {
                assert!(s.hash.is_some());
            }
        });

        // Now, calling get_all_values should still work because it should load the values from the DB
        let all_values = node.get_all_values(&db, &[]).unwrap();
        for id in ids.iter() {
            assert_eq!(all_values.contains(id), true);
        }

        // Cleanup
        db.destroy().unwrap();
    }

    #[test]
    fn test_batch_insert_delete() {
        // Create a new DB with a random temporary path
        let tmp_path = tempfile::tempdir()
            .unwrap()
            .path()
            .as_os_str()
            .to_string_lossy()
            .to_string();
        let db = Arc::new(RocksDB::new(&tmp_path).unwrap());
        db.open().unwrap();

        // Create a new TrieNode
        let mut node = TrieNode::new();
        assert_eq!(node.items(), 0);
        assert_eq!(node.hash(), Vec::<u8>::new());

        let ids: Vec<Vec<u8>> = vec![
            format!("{:0>width$}010680", "0", width = TIMESTAMP_LENGTH * 2),
            format!("{:0>width$}010a10", "0", width = TIMESTAMP_LENGTH * 2),
            format!("{:0>width$}05d220", "0", width = TIMESTAMP_LENGTH * 2),
        ]
        .into_iter()
        .map(|id| Vec::from_hex(id).unwrap())
        .collect();

        let mut txn = RocksDbTransactionBatch::new();
        let r = node.insert(&db, &mut txn, ids.clone(), 0).unwrap();
        assert_eq!(r, vec![true, true, true]);
        db.commit(txn).unwrap();

        assert_eq!(node.items(), ids.len());

        // Make sure that all the values are there
        let all_values = node.get_all_values(&db, &[]).unwrap();
        for id in ids.iter() {
            assert_eq!(all_values.contains(id), true);
        }

        // Inserting them again returns false
        let mut txn = RocksDbTransactionBatch::new();
        let r = node.insert(&db, &mut txn, ids.clone(), 0).unwrap();
        assert_eq!(r, vec![false, false, false]);

        // Inserting a subset of the ids returns true for the new ones
        let mut new_ids = ids.clone();
        new_ids.push(Vec::from_hex("0030662167aabbccddeeff").unwrap());

        let mut txn = RocksDbTransactionBatch::new();
        let r = node.insert(&db, &mut txn, new_ids.clone(), 0).unwrap();
        assert_eq!(r, vec![false, false, false, true]);

        assert_eq!(node.items(), new_ids.len());

        // Make sure that all the values are there
        let all_values = node.get_all_values(&db, &[]).unwrap();
        for id in new_ids.iter() {
            assert_eq!(all_values.contains(id), true);
        }

        // Deleting a single value works
        let mut txn = RocksDbTransactionBatch::new();
        let r = node
            .delete(&db, &mut txn, vec![new_ids[0].clone()], 0)
            .unwrap();
        assert_eq!(r, [true]);

        // Make sure that the value is no longer there
        assert_eq!(node.exists(&db, &ids[0], 0).unwrap(), false);

        // Deleting it again returns false
        let mut txn = RocksDbTransactionBatch::new();
        let r = node
            .delete(&db, &mut txn, vec![new_ids[0].clone()], 0)
            .unwrap();
        assert_eq!(r, [false]);

        // Deleting all the values works, even if one of the values is already deleted
        let mut txn = RocksDbTransactionBatch::new();
        let r = node.delete(&db, &mut txn, ids.clone(), 0).unwrap();
        assert_eq!(r, [false, true, true]);

        // Make sure that all the values are no longer there
        for id in ids.iter() {
            assert_eq!(node.exists(&db, id, 0).unwrap(), false);
        }

        // There's only 1 value left, which is the last value of new_ids
        assert_eq!(node.items(), 1);

        // Deleting all new_ids returns true only for the last one
        let mut txn = RocksDbTransactionBatch::new();
        let r = node.delete(&db, &mut txn, new_ids.clone(), 0).unwrap();
        assert_eq!(r, [false, false, false, true]);

        // Make sure that the last value is no longer there
        assert_eq!(node.exists(&db, &new_ids[3], 0).unwrap(), false);

        // There are no values left
        assert_eq!(node.items(), 0);

        // Cleanup
        db.destroy().unwrap();
    }

    #[test]
    fn test_random_batch_insert() {
        // Create 1000 random keys, each between 11 and 20 bytes long
        let mut keys = vec![];
        for _ in 0..1000 {
            let len = rand::random::<u8>() % 10 + 11;
            let key: Vec<u8> = (0..len).map(|_| rand::random::<u8>()).collect();
            keys.push(key);
        }

        // Create a new DB with a random temporary path
        let tmp_path = tempfile::tempdir()
            .unwrap()
            .path()
            .as_os_str()
            .to_string_lossy()
            .to_string();
        let db = Arc::new(RocksDB::new(&tmp_path).unwrap());
        db.open().unwrap();

        // Create a new TrieNode
        let mut node = TrieNode::new();
        assert_eq!(node.items(), 0);

        let mut txn = RocksDbTransactionBatch::new();
        let r = node.insert(&db, &mut txn, keys.clone(), 0).unwrap();
        assert_eq!(r.len(), keys.len());
        assert_eq!(r.iter().all(|x| *x), true);

        db.commit(txn).unwrap();

        assert_eq!(node.items(), keys.len());

        // Make sure that all the values are there
        assert_eq!(
            keys.iter().all(|key| node.exists(&db, key, 0).unwrap()),
            true
        );

        let hash_before = node.hash();

        // Delete all the items and create a new trie node
        db.clear().unwrap();
        let mut node = TrieNode::new();
        assert_eq!(node.items(), 0);

        // Add the keys again in batches of 100
        for chunk in keys.chunks(100) {
            let mut txn = RocksDbTransactionBatch::new();
            let r = node.insert(&db, &mut txn, chunk.to_vec(), 0).unwrap();
            assert_eq!(r.len(), chunk.len());
            assert_eq!(r.iter().all(|x| *x), true);
            db.commit(txn).unwrap();
        }

        assert_eq!(node.items(), keys.len());
        assert_eq!(node.hash(), hash_before); // Hashes should match

        // Delete all the items and create a new trie node
        db.clear().unwrap();
        let mut node = TrieNode::new();
        assert_eq!(node.items(), 0);

        // Add the keys again one by one
        for key in keys.iter() {
            let mut txn = RocksDbTransactionBatch::new();
            let r = node.insert(&db, &mut txn, vec![key.clone()], 0).unwrap();
            assert_eq!(r.len(), 1);
            assert_eq!(r[0], true);
            db.commit(txn).unwrap();
        }

        assert_eq!(node.items(), keys.len());
        assert_eq!(node.hash(), hash_before); // Hashes should match

        // Cleanup
        db.destroy().unwrap();
    }

    #[test]
    fn test_random_batch_delete() {
        // Create 1000 random keys, each between 11 and 20 bytes long
        let mut keys = vec![];
        for _ in 0..1000 {
            let len = rand::random::<u8>() % 10 + 11;
            let key: Vec<u8> = (0..len).map(|_| rand::random::<u8>()).collect();
            keys.push(key);
        }

        // Create a new DB with a random temporary path
        let tmp_path = tempfile::tempdir()
            .unwrap()
            .path()
            .as_os_str()
            .to_string_lossy()
            .to_string();
        let db = Arc::new(RocksDB::new(&tmp_path).unwrap());
        db.open().unwrap();

        // Create a new TrieNode
        let mut node = TrieNode::new();
        assert_eq!(node.items(), 0);

        let mut txn = RocksDbTransactionBatch::new();
        let r = node.insert(&db, &mut txn, keys.clone(), 0).unwrap();
        assert_eq!(r.len(), keys.len());
        assert_eq!(r.iter().all(|x| *x), true);

        db.commit(txn).unwrap();

        assert_eq!(node.items(), keys.len());

        // Deleting them all at once should work
        let mut txn = RocksDbTransactionBatch::new();
        let r = node.delete(&db, &mut txn, keys.clone(), 0).unwrap();
        assert_eq!(r.len(), keys.len());
        assert_eq!(r.iter().all(|x| *x), true);
        db.commit(txn).unwrap();
        assert_eq!(node.items(), 0);

        // Create a new TrieNode and insert them again
        let mut node = TrieNode::new();
        let mut txn = RocksDbTransactionBatch::new();
        node.insert(&db, &mut txn, keys.clone(), 0).unwrap();
        db.commit(txn).unwrap();
        assert_eq!(node.items(), keys.len());

        // Deleting them in batches of 100 should work
        let mut hashes = vec![];
        for (i, chunk) in keys.chunks(100).enumerate() {
            let mut txn = RocksDbTransactionBatch::new();
            let r = node.delete(&db, &mut txn, chunk.to_vec(), 0).unwrap();
            assert_eq!(r.len(), chunk.len());
            assert_eq!(r.iter().all(|x| *x), true);
            db.commit(txn).unwrap();

            assert_eq!(node.items(), keys.len() - (100 * (i + 1)));
            hashes.push(node.hash());
        }
        assert_eq!(node.items(), 0);

        // Create a new TrieNode and insert them again
        let mut node = TrieNode::new();
        let mut txn = RocksDbTransactionBatch::new();
        node.insert(&db, &mut txn, keys.clone(), 0).unwrap();
        db.commit(txn).unwrap();
        assert_eq!(node.items(), keys.len());

        // Deleting them one-by-one should work, and the hashes should match every 100 keys deleted
        for (i, key) in keys.iter().enumerate() {
            let mut txn = RocksDbTransactionBatch::new();
            let r = node.delete(&db, &mut txn, vec![key.clone()], 0).unwrap();
            assert_eq!(r, [true]);
            db.commit(txn).unwrap();

            assert_eq!(node.items(), keys.len() - (i + 1));

            if (i + 1) % 100 == 0 {
                assert_eq!(node.hash(), hashes[(i + 1) / 100 - 1]);
            }
        }

        // Create a new TrieNode and insert them again
        let mut node = TrieNode::new();
        let mut txn = RocksDbTransactionBatch::new();
        node.insert(&db, &mut txn, keys.clone(), 0).unwrap();
        db.commit(txn).unwrap();
        assert_eq!(node.items(), keys.len());

        // Deleting the first half of the keys should work
        let mut txn = RocksDbTransactionBatch::new();
        let r = node
            .delete(&db, &mut txn, keys[0..500].to_vec(), 0)
            .unwrap();
        assert_eq!(r.len(), 500);
        assert_eq!(r.iter().all(|x| *x), true);
        db.commit(txn).unwrap();
        assert_eq!(node.items(), 500);
        let hash_before = node.hash();

        // Create a new TrieNode and insert them again
        db.clear().unwrap();
        let mut node = TrieNode::new();
        let mut txn = RocksDbTransactionBatch::new();
        node.insert(&db, &mut txn, keys.clone(), 0).unwrap();
        db.commit(txn).unwrap();
        assert_eq!(node.items(), keys.len());

        // Deleting the first half, but in reverse order, should work and the hashes should match
        let mut txn = RocksDbTransactionBatch::new();
        let keys_reversed = keys[0..500].iter().rev().cloned().collect();
        let r = node.delete(&db, &mut txn, keys_reversed, 0).unwrap();
        assert_eq!(r.len(), 500);
        assert_eq!(r.iter().all(|x| *x), true);
        db.commit(txn).unwrap();
        assert_eq!(node.items(), 500);

        assert_eq!(node.hash(), hash_before);

        // Cleanup
        db.destroy().unwrap();
    }
}
