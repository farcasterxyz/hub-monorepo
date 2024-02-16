use std::sync::{Arc, Mutex};

use prost::Message;

use crate::{db::RocksDbTransaction, protos::HubEvent};

use std::time::{SystemTime, UNIX_EPOCH};

use super::{HubError, RootPrefix};

const TIMESTAMP_BITS: u32 = 41;
const SEQUENCE_BITS: u32 = 12;
pub const FARCASTER_EPOCH: u64 = 1609459200000;

fn make_event_id(timestamp: u64, seq: u64) -> u64 {
    let shifted_timestamp = timestamp << SEQUENCE_BITS;
    let padded_seq = seq & ((1 << SEQUENCE_BITS) - 1); // Ensures seq fits in SEQUENCE_BITS
    shifted_timestamp | padded_seq
}

struct HubEventIdGenerator {
    last_timestamp: u64, // ms since epoch
    last_seq: u64,
    epoch: u64,
}

impl HubEventIdGenerator {
    fn new(epoch: Option<u64>, last_timestamp: Option<u64>, last_seq: Option<u64>) -> Self {
        HubEventIdGenerator {
            epoch: epoch.unwrap_or(0),
            last_timestamp: last_timestamp.unwrap_or(0),
            last_seq: last_seq.unwrap_or(0),
        }
    }

    fn generate_id(&mut self, current_timestamp: Option<u64>) -> Result<u64, HubError> {
        let current_timestamp = current_timestamp.unwrap_or_else(|| {
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("Time went backwards")
                .as_millis() as u64
        }) - self.epoch;

        if current_timestamp == self.last_timestamp {
            self.last_seq += 1;
        } else {
            self.last_timestamp = current_timestamp;
            self.last_seq = 0;
        }

        if self.last_timestamp >= 2u64.pow(TIMESTAMP_BITS) {
            return Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: format!("timestamp > {} bits", TIMESTAMP_BITS),
            });
        }

        if self.last_seq >= 2u64.pow(SEQUENCE_BITS) {
            return Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: format!("sequence > {} bits", SEQUENCE_BITS),
            });
        }

        Ok(make_event_id(self.last_timestamp, self.last_seq))
    }
}

pub struct StoreEventHandler {
    generator: Arc<Mutex<HubEventIdGenerator>>,
}

impl StoreEventHandler {
    pub fn new() -> Self {
        StoreEventHandler {
            generator: Arc::new(Mutex::new(HubEventIdGenerator::new(
                Some(FARCASTER_EPOCH),
                None,
                None,
            ))),
        }
    }

    pub fn commit_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        raw_event: HubEvent,
    ) -> Result<u64, HubError> {
        // Acquire the lock so we don't generate multiple IDs. This also serves as the commmit lock
        let mut generator = self.generator.lock().unwrap();

        // Generate the event ID
        let event_id = generator.generate_id(None)?;
        let mut event = raw_event;
        event.id = event_id;

        self.put_event_transaction(txn, &event)?;

        // this._storageCache.processEvent(event);
        // this.broadcastEvent(event);

        Ok(event_id)
    }

    fn make_event_key(&self, event_id: u64) -> Vec<u8> {
        let mut key = Vec::with_capacity(1 + 8);

        key.push(RootPrefix::HubEvents as u8); // HubEvents prefix, 1 byte
        key.extend_from_slice(&event_id.to_be_bytes());

        key
    }

    fn put_event_transaction(
        &self,
        txn: &RocksDbTransaction<'_>,
        event: &HubEvent,
    ) -> Result<(), HubError> {
        let key = self.make_event_key(event.id);
        let value = event.encode_to_vec();

        txn.put(&key, &value)?;

        Ok(())
    }
}
