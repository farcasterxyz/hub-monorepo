pub use self::rocksdb::*;

mod compaction;
mod rocksdb;

#[cfg(test)]
mod tests {
    use std::env::temp_dir;
    use zstd::zstd_safe::WriteBuf;

    #[test]
    fn test_compaction_filter() {
        let tmp = temp_dir();
        let path = tmp.as_path().to_str().unwrap();
        let db = super::RocksDB::new(path);
        assert!(db.is_ok());

        let db = db.unwrap();
        let open_result = db.open();
        assert!(open_result.is_ok());

        for i in 0..1000 {
            // Insert 10 key-value pairs into the database.
            let key = format!("key{}", i);
            let value = format!("value{}", i);
            let put_result = db.put(key.as_bytes(), value.as_bytes());
            assert!(put_result.is_ok());

            // Retrieve the value for each key and assert that it is correct.
            let get_result = db.get(key.as_bytes());
            assert!(get_result.is_ok());
            let value = get_result.unwrap();
            assert!(value.is_some());

            let found = format!("value{}", i);
            assert_eq!(value.unwrap().as_slice(), found.as_bytes());
        }

        // Update keys
        for i in 0..1000 {
            // Insert 10 key-value pairs into the database.
            let key = format!("key{}", i);
            let value = rand::random::<u32>();
            let put_result = db.put(key.as_bytes(), value.to_be_bytes().as_slice());
            assert!(put_result.is_ok());

            // Retrieve the value for each key and assert that it is correct.
            let get_result = db.get(key.as_bytes());
            assert!(get_result.is_ok());
            let get_value = get_result.unwrap();
            assert!(get_value.is_some());

            assert_eq!(get_value.unwrap().as_slice(), &value.to_be_bytes());
        }

        // Perform a manual compaction to trigger the compaction filter.
        let mut compact_options = rocksdb::WaitForCompactOptions::default();
        compact_options.set_abort_on_pause(true);
        compact_options.set_timeout(1000);

        // let compact_result = rocksdb::DBCommon::wait_for_compact(&db.db, &compact_options);
        // assert!(compact_result.is_ok());
    }
}
