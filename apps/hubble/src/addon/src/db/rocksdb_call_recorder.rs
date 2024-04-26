use std::{
    borrow::Cow,
    collections::{hash_map, HashMap},
    io::{BufWriter, Read, Write},
    ops::Deref,
    sync::{Arc, Mutex, RwLock},
};

use blake3::Hash;

use super::{RocksDB, RocksDbTransactionBatch};

pub struct RocksDbCallRecorder {
    log_folder: String,
    stores: RwLock<HashMap<String, Arc<Store>>>,
}

struct Store {
    log_path: String,
    log_file: Mutex<BufWriter<std::fs::File>>,
}

impl RocksDbCallRecorder {
    pub fn new(log_folder: String) -> Self {
        std::fs::create_dir_all(&log_folder).unwrap();

        RocksDbCallRecorder {
            log_folder,
            stores: RwLock::new(HashMap::new()),
        }
    }

    pub fn record(&self, path: &str, call: FunctionCall) {
        let mut store = self.get_store(path);
        let mut file = store.log_file.lock().unwrap();
        call.write_to(&mut *file).unwrap();
    }

    fn get_store(&self, path: &str) -> Arc<Store> {
        {
            let read = self.stores.read().unwrap();
            if let Some(store) = read.get(path) {
                return store.clone();
            }
        }

        let mut stores = self.stores.write().unwrap();
        match stores.entry(path.to_string()) {
            hash_map::Entry::Occupied(o) => o.get().clone(),
            hash_map::Entry::Vacant(v) => {
                let log_path = match path.rfind("/") {
                    Some(pos) => format!("{}{}", self.log_folder, &path[pos..]),
                    None => format!("{}/{}", self.log_folder, path),
                };

                let file = std::fs::File::create(&log_path).unwrap();

                println!("CREATE new store for: {}", log_path);

                v.insert(Arc::new(Store {
                    log_path,
                    log_file: Mutex::new(BufWriter::with_capacity(2048, file)),
                }))
                .clone()
            }
        }
    }
}

#[derive(Debug)]
pub enum FunctionCall<'a> {
    Get {
        key: Cow<'a, [u8]>,
    },
    Put {
        key: Cow<'a, [u8]>,
        value: Cow<'a, [u8]>,
    },
    Delete {
        key: Cow<'a, [u8]>,
    },
    GetMany {
        keys: Cow<'a, Vec<Vec<u8>>>,
    },
    Commit(Cow<'a, RocksDbTransactionBatch>),
}

impl<'a> FunctionCall<'a> {
    pub fn apply(self, rocks: &mut RocksDB) {
        match self {
            FunctionCall::Get { key } => {
                let _ = std::hint::black_box(rocks.get(&key));
            }
            FunctionCall::Put { key, value } => {
                let _ = std::hint::black_box(rocks.put(&key, &value));
            }
            FunctionCall::Delete { key } => {
                let _ = std::hint::black_box(rocks.del(&key));
            }
            FunctionCall::GetMany { keys } => {
                let _ = std::hint::black_box(rocks.get_many(&keys));
            }
            FunctionCall::Commit(tx) => {
                let _ = std::hint::black_box(rocks.commit(tx.into_owned()));
            }
        }
    }

    pub fn write_to<W: Write>(&self, out: &mut W) -> Result<(), std::io::Error> {
        match self {
            FunctionCall::Get { key } => {
                out.write_all(&1u32.to_be_bytes())?;
                out.write_all(&(key.len() as u64).to_be_bytes())?;
                out.write_all(key)?;
            }
            FunctionCall::Put { key, value } => {
                out.write_all(&2u32.to_be_bytes())?;
                out.write_all(&(key.len() as u64).to_be_bytes())?;
                out.write_all(&(value.len() as u64).to_be_bytes())?;
                out.write_all(key)?;
                out.write_all(value)?;
            }
            FunctionCall::Delete { key } => {
                out.write_all(&3u32.to_be_bytes())?;
                out.write_all(&(key.len() as u64).to_be_bytes())?;
                out.write_all(key)?;
            }
            FunctionCall::GetMany { keys } => {
                out.write_all(&4u32.to_be_bytes())?;
                out.write_all(&(keys.len() as u64).to_be_bytes())?;

                for key in keys.iter() {
                    out.write_all(&(key.len() as u64).to_be_bytes())?;
                    out.write_all(key.as_slice())?;
                }
            }
            FunctionCall::Commit(tx) => {
                out.write_all(&5u32.to_be_bytes())?;

                out.write_all(&(tx.batch.len() as u64).to_be_bytes())?;
                for (key, value) in tx.batch.iter() {
                    out.write_all(&(key.len() as u64).to_be_bytes())?;
                    out.write_all(key)?;

                    match value {
                        Some(v) => {
                            out.write_all(&[1])?;
                            out.write_all(&(v.len() as u64).to_be_bytes())?;
                            out.write_all(v.as_slice())?;
                        }
                        None => {
                            out.write_all(&[0])?;
                        }
                    }
                }
            }
        }

        Ok(())
    }

    pub fn read_from<R: Read>(read: &mut R) -> Result<Self, std::io::Error> {
        let id = Self::read_u32(read)?;
        Ok(match id {
            1 => {
                let key_len = Self::read_usize(read)?;

                FunctionCall::Get {
                    key: Cow::Owned(Self::read_array(key_len, read)?),
                }
            }
            2 => {
                let key_len = Self::read_usize(read)?;
                let value_len = Self::read_usize(read)?;

                FunctionCall::Put {
                    key: Cow::Owned(Self::read_array(key_len, read)?),
                    value: Cow::Owned(Self::read_array(value_len, read)?),
                }
            }
            3 => {
                let key_len = Self::read_usize(read)?;

                FunctionCall::Delete {
                    key: Cow::Owned(Self::read_array(key_len, read)?),
                }
            }
            4 => {
                let key_count = Self::read_usize(read)?;
                let mut keys = Vec::with_capacity(key_count);

                for _ in 0..key_count {
                    let len = Self::read_usize(read)?;
                    keys.push(Self::read_array(len, read)?);
                }

                FunctionCall::GetMany {
                    keys: Cow::Owned(keys),
                }
            }
            5 => {
                let entry_count = Self::read_usize(read)?;
                let mut batch = HashMap::with_capacity(entry_count);

                for _ in 0..entry_count {
                    let key_len = Self::read_usize(read)?;
                    let key = Self::read_array(key_len, read)?;

                    let mut is_some = [0u8];
                    read.read_exact(&mut is_some)?;

                    let value = if is_some[0] == 1 {
                        let len = Self::read_usize(read)?;
                        Some(Self::read_array(len, read)?)
                    } else {
                        None
                    };

                    batch.insert(key, value);
                }

                FunctionCall::Commit(Cow::Owned(RocksDbTransactionBatch { batch }))
            }
            _ => {
                return Err(std::io::Error::new(
                    std::io::ErrorKind::InvalidData,
                    "Unexpected id for call type",
                ))
            }
        })
    }

    fn read_u32<R: Read>(read: &mut R) -> Result<u32, std::io::Error> {
        let mut buf = [0u8; 4];
        read.read_exact(&mut buf)?;
        Ok(u32::from_be_bytes(buf))
    }

    fn read_usize<R: Read>(read: &mut R) -> Result<usize, std::io::Error> {
        let mut buf = [0u8; 8];
        read.read_exact(&mut buf)?;
        Ok(u64::from_be_bytes(buf) as usize)
    }

    fn read_array<R: Read>(size: usize, read: &mut R) -> Result<Vec<u8>, std::io::Error> {
        let mut buf = Vec::with_capacity(size);
        buf.resize(size, 0u8);
        read.read_exact(&mut buf)?;
        Ok(buf)
    }
}

#[cfg(test)]
mod test {
    use std::io::BufReader;

    use super::FunctionCall;

    #[test]
    fn test() {
        let path =
            "/home/plorio/src/farcaster/hub-monorepo/apps/hubble/.rocks-logs/rocks.hub._default";
        let mut file = BufReader::new(std::fs::File::open(path).unwrap());

        let mut count = 0;

        loop {
            let Ok(read) = FunctionCall::read_from(&mut file) else { break };
            count += 1;
            let msg = match read {
                FunctionCall::Commit(_) => "commit",
                FunctionCall::Get { key } => "get",
                FunctionCall::Put { key, value } => "put",
                FunctionCall::Delete { key } => "delete",
                FunctionCall::GetMany { keys } => "get many",
            };

            println!("Got: {}", msg);
        }

        println!("Count: {}", count);
    }
}
