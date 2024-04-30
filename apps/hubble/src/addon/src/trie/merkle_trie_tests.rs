#[cfg(test)]
mod tests {
    use crate::trie::merkle_trie::MerkleTrie;

    #[test]
    fn test_merkle_trie_get_node() {
        let tmp_path = tempfile::tempdir()
            .unwrap()
            .path()
            .as_os_str()
            .to_string_lossy()
            .to_string();

        let trie = MerkleTrie::new(&tmp_path).unwrap();
        trie.initialize().unwrap();

        let key1: Vec<_> = "0000482712".bytes().collect();
        println!("{:?}", key1);
        trie.insert(&key1).unwrap();

        let node = trie.get_node(&key1).unwrap();
        assert_eq!(node.value().unwrap(), key1);

        // Add another key
        let key2: Vec<_> = "0000482713".bytes().collect();
        trie.insert(&key2).unwrap();

        // The get node should still work for both keys
        let node = trie.get_node(&key1).unwrap();
        assert_eq!(node.value().unwrap(), key1);
        let node = trie.get_node(&key2).unwrap();
        assert_eq!(node.value().unwrap(), key2);

        // Getting the node with first 9 bytes should return the node with key1
        let common_node = trie.get_node(&key1[0..9].to_vec()).unwrap();
        assert_eq!(common_node.is_leaf(), false);
        assert_eq!(common_node.children().len(), 2);
        let mut children_keys: Vec<_> = common_node.children().keys().collect();
        children_keys.sort();

        assert_eq!(*children_keys[0], key1[9]);
        assert_eq!(*children_keys[1], key2[9]);

        // Get the metadata for the root node
        let root_metadata = trie.get_trie_node_metadata(&key1[0..1]).unwrap();
        assert_eq!(root_metadata.prefix, "0".bytes().collect::<Vec<_>>());
        assert_eq!(root_metadata.num_messages, 2);
        assert_eq!(root_metadata.children.len(), 1);

        let metadata = trie.get_trie_node_metadata(&key1[0..9]).unwrap();

        // Get the children
        let mut children = metadata
            .children
            .into_iter()
            .map(|(k, v)| (k, v))
            .collect::<Vec<_>>();
        children.sort_by(|a, b| a.0.cmp(&b.0));
        assert_eq!(children[0].0, key1[9]);
        assert_eq!(children[0].1.prefix, key1);
        assert_eq!(children[0].1.num_messages, 1);

        assert_eq!(children[1].0, key2[9]);
        assert_eq!(children[1].1.prefix, key2);
        assert_eq!(children[1].1.num_messages, 1);

        trie.stop().unwrap();

        // Clean up
        std::fs::remove_dir_all(&tmp_path).unwrap();
    }
}
