use std::io::BufReader;
use std::path::Path;
use std::{fs, io};

use addon::db::rocksdb_call_recorder::FunctionCall;
use addon::db::RocksDB;

fn main() {
    #[cfg(feature = "bench-rocksdb-record")]
    panic!("compiled to record benchmark data inside of benchmark");

    let log_file =
        "/home/plorio/src/farcaster/hub-monorepo/apps/hubble/backups/1-2-logs/rocks.hub._default";
    let state_dir =
        "/home/plorio/src/farcaster/hub-monorepo/apps/hubble/backups/1-state/rocks.hub._default";

    let temp_state_dir = "/home/plorio/src/farcaster/hub-monorepo/apps/hubble/temp_dir";

    let mut file = BufReader::new(fs::File::open(log_file).unwrap());

    /* prep rocks db state directory */
    {
        let _ = fs::remove_dir_all(temp_state_dir);
        fs::create_dir(temp_state_dir).unwrap();
        copy_dir_all(state_dir, temp_state_dir).unwrap();
    }

    let mut rocks = RocksDB::new(&temp_state_dir).unwrap();
    rocks.open().unwrap();

    let mut count = 0;

    loop {
        let Ok(read) = FunctionCall::read_from(&mut file) else { break };
        count += 1;
        read.apply(&mut rocks);

        if count % 10_000 == 0 {
            println!("completed: {}", count);
        }
    }

    println!("Count: {}", count);
}

/* from: https://stackoverflow.com/questions/26958489/how-to-copy-a-folder-recursively-in-rust */
fn copy_dir_all(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> io::Result<()> {
    fs::create_dir_all(&dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}
