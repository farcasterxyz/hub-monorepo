use super::{hub_error_to_js_throw, HubError, RootPrefix};
use crate::{db::RocksDbTransactionBatch, protos::HubEvent};
use neon::context::{Context, FunctionContext};
use neon::result::JsResult;
use neon::types::{Finalize, JsBox, JsNumber};
use prost::Message as _;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

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

// Needed to let the StoreEventHandler be owned by the JS runtime
impl Finalize for StoreEventHandler {}

impl StoreEventHandler {
    pub fn new(
        epoch: Option<u64>,
        last_timestamp: Option<u64>,
        last_seq: Option<u64>,
    ) -> Arc<Self> {
        Arc::new(StoreEventHandler {
            generator: Arc::new(Mutex::new(HubEventIdGenerator::new(
                Some(epoch.unwrap_or(FARCASTER_EPOCH)),
                last_timestamp,
                last_seq,
            ))),
        })
    }

    pub fn commit_transaction(
        &self,
        txn: &mut RocksDbTransactionBatch,
        raw_event: &mut HubEvent,
    ) -> Result<u64, HubError> {
        // Acquire the lock so we don't generate multiple IDs. This also serves as the commit lock
        let mut generator = self.generator.lock().unwrap();

        // Generate the event ID
        let event_id = generator.generate_id(None)?;
        raw_event.id = event_id;

        self.put_event_transaction(txn, &raw_event)?;

        // These two calls are made in the JS code
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
        txn: &mut RocksDbTransactionBatch,
        event: &HubEvent,
    ) -> Result<(), HubError> {
        let key = self.make_event_key(event.id);
        let value = event.encode_to_vec();

        txn.put(key, value);

        Ok(())
    }
}

impl StoreEventHandler {
    pub fn js_create_store_event_handler(
        mut cx: FunctionContext,
    ) -> JsResult<JsBox<Arc<StoreEventHandler>>> {
        // Read 3 optional arguments (u64)
        let epoch = match cx.argument_opt(0) {
            Some(arg) => match arg.downcast::<JsNumber, _>(&mut cx) {
                Ok(v) => Some(v.value(&mut cx) as u64),
                _ => None,
            },
            None => None,
        };

        let last_timestamp = match cx.argument_opt(1) {
            Some(arg) => match arg.downcast::<JsNumber, _>(&mut cx) {
                Ok(v) => Some(v.value(&mut cx) as u64),
                _ => None,
            },
            None => None,
        };

        let last_seq = match cx.argument_opt(2) {
            Some(arg) => match arg.downcast::<JsNumber, _>(&mut cx) {
                Ok(v) => Some(v.value(&mut cx) as u64),
                _ => None,
            },
            None => None,
        };

        Ok(cx.boxed(StoreEventHandler::new(epoch, last_timestamp, last_seq)))
    }

    pub fn js_get_next_event_id(mut cx: FunctionContext) -> JsResult<JsNumber> {
        let this = cx.this::<JsBox<Arc<StoreEventHandler>>>()?;

        // Read an optional timestamp (number) from the arguments
        let timestamp = match cx.argument_opt(0) {
            Some(arg) => match arg.downcast::<JsNumber, _>(&mut cx) {
                Ok(v) => Some(v.value(&mut cx) as u64),
                _ => None,
            },
            None => None,
        };

        let mut generator = this.generator.lock().unwrap();
        let event_id = match generator.generate_id(timestamp) {
            Ok(id) => id,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };
        Ok(cx.number(event_id as f64))
    }
}
