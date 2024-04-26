use super::{
    get_message, hub_error_to_js_throw, make_fid_key, make_ts_hash, make_user_key, message_decode,
    read_fid_key,
    store::{Store, StoreDef},
    utils::{self, encode_messages_to_js_object, get_page_options, get_store},
    HubError, MessagesPage, PageOptions, RootPrefix, StoreEventHandler, UserPostfix, FID_BYTES,
    TS_HASH_LENGTH,
};
use crate::{
    db::{RocksDB, RocksDbTransactionBatch},
    protos::{self, Message, MessageType},
};
use crate::{
    protos::{message_data, Protocol},
    store::delete_message_transaction,
};
use neon::{
    context::{Context, FunctionContext},
    object::Object,
    result::JsResult,
    types::{buffer::TypedArray, JsBox, JsBuffer, JsNumber, JsPromise},
};
use prost::Message as _;
use slog::info;
use std::{borrow::Borrow, sync::Arc};

pub struct VerificationStoreDef {
    prune_size_limit: u32,
}

impl StoreDef for VerificationStoreDef {
    fn postfix(&self) -> u8 {
        UserPostfix::VerificationMessage as u8
    }

    fn add_message_type(&self) -> u8 {
        MessageType::VerificationAddEthAddress as u8
    }

    fn remove_message_type(&self) -> u8 {
        MessageType::VerificationRemove as u8
    }

    fn compact_state_message_type(&self) -> u8 {
        MessageType::None as u8
    }

    fn is_compact_state_type(&self, _message: &Message) -> bool {
        false
    }

    fn is_add_type(&self, message: &protos::Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519 as i32
            && message.data.is_some()
            && message.data.as_ref().unwrap().r#type
                == MessageType::VerificationAddEthAddress as i32
            && message.data.as_ref().unwrap().body.is_some()
            && match message.data.as_ref().unwrap().body.as_ref().unwrap() {
                message_data::Body::VerificationAddAddressBody(body) => {
                    body.protocol == Protocol::Ethereum as i32
                        || body.protocol == Protocol::Solana as i32
                }
                _ => false,
            }
    }

    fn is_remove_type(&self, message: &protos::Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519 as i32
            && message.data.is_some()
            && message.data.as_ref().unwrap().r#type == MessageType::VerificationRemove as i32
            && message.data.as_ref().unwrap().body.is_some()
            && match message.data.as_ref().unwrap().body.as_ref().unwrap() {
                message_data::Body::VerificationRemoveBody(body) => {
                    body.protocol == Protocol::Ethereum as i32
                        || body.protocol == Protocol::Solana as i32
                }
                _ => false,
            }
    }

    fn find_merge_add_conflicts(
        &self,
        _db: &RocksDB,
        _message: &protos::Message,
    ) -> Result<(), super::store::HubError> {
        // For verifications, there will be no conflicts
        Ok(())
    }

    fn find_merge_remove_conflicts(
        &self,
        _db: &RocksDB,
        _message: &protos::Message,
    ) -> Result<(), super::store::HubError> {
        // For verifications, there will be no conflicts
        Ok(())
    }

    fn build_secondary_indices(
        &self,
        txn: &mut RocksDbTransactionBatch,
        _ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        let address = match message.data.as_ref().unwrap().body.as_ref().unwrap() {
            message_data::Body::VerificationAddAddressBody(body) => &body.address,
            _ => {
                return Err(HubError {
                    code: "bad_request.invalid_param".to_string(),
                    message: "address empty".to_string(),
                })
            }
        };

        if address.is_empty() {
            return Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: "address empty".to_string(),
            });
        }

        // Puts the fid into the byAddress index
        let by_address_key = Self::make_verification_by_address_key(address);
        txn.put(
            by_address_key,
            make_fid_key(message.data.as_ref().unwrap().fid as u32),
        );

        Ok(())
    }

    fn delete_secondary_indices(
        &self,
        txn: &mut RocksDbTransactionBatch,
        _ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        let address = match message.data.as_ref().unwrap().body.as_ref().unwrap() {
            message_data::Body::VerificationAddAddressBody(body) => &body.address,
            _ => {
                return Err(HubError {
                    code: "bad_request.invalid_param".to_string(),
                    message: "address empty".to_string(),
                })
            }
        };

        if address.is_empty() {
            return Err(HubError {
                code: "bad_request.invalid_param".to_string(),
                message: "address empty".to_string(),
            });
        }

        // Delete the message key from byAddress index
        let by_address_key = Self::make_verification_by_address_key(address);
        txn.delete(by_address_key);

        Ok(())
    }

    fn make_add_key(&self, message: &protos::Message) -> Result<Vec<u8>, HubError> {
        let address = match message.data.as_ref().unwrap().body.as_ref().unwrap() {
            message_data::Body::VerificationAddAddressBody(body) => &body.address,
            message_data::Body::VerificationRemoveBody(body) => &body.address,
            _ => {
                return Err(HubError {
                    code: "bad_request.validation_failure".to_string(),
                    message: "Invalid verification body".to_string(),
                })
            }
        };

        Ok(Self::make_verification_adds_key(
            message.data.as_ref().unwrap().fid as u32,
            address,
        ))
    }

    fn make_remove_key(&self, message: &protos::Message) -> Result<Vec<u8>, HubError> {
        let address = match message.data.as_ref().unwrap().body.as_ref().unwrap() {
            message_data::Body::VerificationAddAddressBody(body) => &body.address,
            message_data::Body::VerificationRemoveBody(body) => &body.address,
            _ => {
                return Err(HubError {
                    code: "bad_request.validation_failure".to_string(),
                    message: "Invalid verification body".to_string(),
                })
            }
        };

        Ok(Self::make_verification_removes_key(
            message.data.as_ref().unwrap().fid as u32,
            address,
        ))
    }

    fn make_compact_state_add_key(&self, _message: &Message) -> Result<Vec<u8>, HubError> {
        Err(HubError {
            code: "bad_request.invalid_param".to_string(),
            message: "Verification Store doesn't support compact state".to_string(),
        })
    }

    fn get_prune_size_limit(&self) -> u32 {
        self.prune_size_limit
    }

    // Verifications store overrides and adds to the default implementation of merge_conflicts
    fn get_merge_conflicts(
        &self,
        db: &RocksDB,
        message: &Message,
        ts_hash: &[u8; TS_HASH_LENGTH],
    ) -> Result<Vec<Message>, HubError> {
        // First, call the default implementation to get the default merge conflicts
        let mut conflicts = Self::get_default_merge_conflicts(self, db, message, ts_hash)?;

        if self.is_remove_type(message) {
            return Ok(conflicts);
        }

        // For adds, we also need to check for conflicts across all fids (by eth address)
        let address = match message.data.as_ref().unwrap().body.as_ref().unwrap() {
            message_data::Body::VerificationAddAddressBody(body) => &body.address,
            _ => {
                return Err(HubError {
                    code: "bad_request.validation_failure".to_string(),
                    message: "Invalid verification body".to_string(),
                })
            }
        };

        let by_address_key = Self::make_verification_by_address_key(address);
        let fid_result = match db.get(&by_address_key) {
            Ok(Some(fid)) => Ok(fid),
            _ => Err(HubError {
                code: "not_found".to_string(),
                message: "verification not found".to_string(),
            }),
        };

        if fid_result.is_ok() {
            let fid = read_fid_key(fid_result.unwrap().as_ref());

            if fid > 0 && fid != message.data.as_ref().unwrap().fid as u32 {
                let existing_add_key = Self::make_verification_adds_key(fid, address);
                if let Ok(Some(existing_ts_hash)) = db.get(&existing_add_key) {
                    let ts_hash =
                        make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash)?;

                    let message_compare = self.message_compare(
                        self.add_message_type(),
                        &existing_ts_hash.to_vec(),
                        self.add_message_type(),
                        &ts_hash.to_vec(),
                    );

                    if message_compare > 0 {
                        return Err(HubError {
                            code: "bad_request.conflict".to_string(),
                            message: "message conflicts with a more recent add".to_string(),
                        });
                    }

                    if message_compare == 0 {
                        return Err(HubError {
                            code: "bad_request.conflict".to_string(),
                            message: "message has already been merged".to_string(),
                        });
                    }

                    let existing_message = get_message(
                        db,
                        fid,
                        self.postfix(),
                        &utils::vec_to_u8_24(&Some(existing_ts_hash))?,
                    )?;
                    if existing_message.is_some() {
                        conflicts.push(existing_message.unwrap());
                    }
                }
            }
        }

        Ok(conflicts)
    }
}

impl VerificationStoreDef {
    pub fn make_verification_by_address_key(address: &[u8]) -> Vec<u8> {
        let mut key = Vec::with_capacity(1 + address.len());

        key.push(RootPrefix::VerificationByAddress as u8);
        key.extend_from_slice(address);
        key
    }

    pub fn make_verification_adds_key(fid: u32, address: &[u8]) -> Vec<u8> {
        let mut key = Vec::with_capacity(33 + 1 + address.len());
        key.extend_from_slice(&make_user_key(fid));
        key.push(UserPostfix::VerificationAdds as u8);
        key.extend_from_slice(address);
        key
    }

    pub fn make_verification_removes_key(fid: u32, address: &[u8]) -> Vec<u8> {
        let mut key = Vec::with_capacity(33 + 1 + address.len());
        key.extend_from_slice(&make_user_key(fid));
        key.push(UserPostfix::VerificationRemoves as u8);
        key.extend_from_slice(address);
        key
    }
}

pub struct VerificationStore {}

impl VerificationStore {
    pub fn new(
        db: Arc<RocksDB>,
        store_event_handler: Arc<StoreEventHandler>,
        prune_size_limit: u32,
    ) -> Store {
        Store::new_with_store_def(
            db,
            store_event_handler,
            Box::new(VerificationStoreDef { prune_size_limit }),
        )
    }

    pub fn get_verification_add(
        store: &Store,
        fid: u32,
        address: &[u8],
    ) -> Result<Option<protos::Message>, HubError> {
        let partial_message = protos::Message {
            data: Some(protos::MessageData {
                fid: fid as u64,
                r#type: MessageType::VerificationAddEthAddress.into(),
                body: Some(protos::message_data::Body::VerificationAddAddressBody(
                    protos::VerificationAddAddressBody {
                        address: address.to_vec(),
                        ..Default::default()
                    },
                )),
                ..Default::default()
            }),
            ..Default::default()
        };

        store.get_add(&partial_message)
    }

    pub fn js_get_verification_add(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let channel = cx.channel();

        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let address = cx.argument::<JsBuffer>(1)?.as_slice(&cx).to_vec();

        let result = match Self::get_verification_add(&store, fid, &address) {
            Ok(Some(message)) => message.encode_to_vec(),
            Ok(None) => cx.throw_error(format!(
                "{}/{} for {}",
                "not_found", "NotFound: verificationAddMessage not found", fid
            ))?,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| {
            let mut js_buffer = cx.buffer(result.len())?;
            js_buffer.as_mut_slice(&mut cx).copy_from_slice(&result);
            Ok(js_buffer)
        });

        Ok(promise)
    }

    pub fn get_verification_remove(
        store: &Store,
        fid: u32,
        address: &[u8],
    ) -> Result<Option<protos::Message>, HubError> {
        let partial_message = protos::Message {
            data: Some(protos::MessageData {
                fid: fid as u64,
                r#type: MessageType::VerificationRemove.into(),
                body: Some(protos::message_data::Body::VerificationRemoveBody(
                    protos::VerificationRemoveBody {
                        address: address.to_vec(),
                        ..Default::default()
                    },
                )),
                ..Default::default()
            }),
            ..Default::default()
        };

        store.get_remove(&partial_message)
    }

    pub fn js_get_verification_remove(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let address = cx.argument::<JsBuffer>(1)?.as_slice(&cx).to_vec();

        let result = match Self::get_verification_remove(&store, fid, &address) {
            Ok(Some(message)) => message.encode_to_vec(),
            Ok(None) => cx.throw_error(format!(
                "{}/{} for {}",
                "not_found", "verificationRemoveMessage not found", fid
            ))?,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| {
            let mut js_buffer = cx.buffer(result.len())?;
            js_buffer.as_mut_slice(&mut cx).copy_from_slice(&result);
            Ok(js_buffer)
        });

        Ok(promise)
    }

    pub fn get_verification_adds_by_fid(
        store: &Store,
        fid: u32,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        store.get_adds_by_fid(fid, page_options, Some(|_message: &Message| true))
    }

    pub fn js_get_verification_adds_by_fid(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let page_options = get_page_options(&mut cx, 1)?;

        let messages = match Self::get_verification_adds_by_fid(&store, fid, &page_options) {
            Ok(messages) => messages,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| {
            encode_messages_to_js_object(&mut cx, messages)
        });

        Ok(promise)
    }

    pub fn get_verification_removes_by_fid(
        store: &Store,
        fid: u32,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        store.get_removes_by_fid(fid, page_options, Some(|_message: &Message| true))
    }

    pub fn js_get_verification_removes_by_fid(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0).unwrap().value(&mut cx) as u32;
        let page_options = get_page_options(&mut cx, 1)?;

        let messages = match Self::get_verification_removes_by_fid(&store, fid, &page_options) {
            Ok(messages) => messages,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| {
            encode_messages_to_js_object(&mut cx, messages)
        });

        Ok(promise)
    }

    pub fn migrate_verifications(store: &Store) -> Result<(u32, u32), HubError> {
        let mut verifications_count = 0;
        let mut duplicates_count = 0;

        store
            .db()
            .for_each_iterator_by_prefix(
                &[RootPrefix::User as u8],
                &PageOptions::default(),
                |key, value| {
                    let postfix = key[1 + FID_BYTES];
                    if postfix != store.postfix() {
                        return Ok(false); // Ignore non-verification messages
                    }

                    let message = match message_decode(value) {
                        Ok(message) => message,
                        Err(_) => return Ok(false), // Ignore invalid messages
                    };

                    if !store.store_def().is_add_type(&message) {
                        return Ok(false); // Ignore non-add messages
                    }

                    let fid = message.data.as_ref().unwrap().fid as u32;
                    let verification_add =
                        match message.data.as_ref().unwrap().body.as_ref().unwrap() {
                            message_data::Body::VerificationAddAddressBody(body) => body,
                            _ => return Ok(false), // Ignore invalid messages
                        };
                    let address = &verification_add.address;

                    let mut txn = store.db().txn();
                    let by_address_key =
                        VerificationStoreDef::make_verification_by_address_key(address);
                    let existing_fid_res = match store.db().get(&by_address_key) {
                        Ok(Some(existing_fid)) => Ok(existing_fid),
                        _ => Err(HubError {
                            code: "not_found".to_string(),
                            message: "verification not found".to_string(),
                        }),
                    };

                    if existing_fid_res.is_ok() {
                        let existing_fid = read_fid_key(&existing_fid_res.unwrap());
                        let existing_message =
                            match Self::get_verification_add(store, existing_fid, address) {
                                Ok(Some(message)) => message,
                                _ => {
                                    return Err(HubError {
                                        code: "not_found".to_string(),
                                        message: "verification not found".to_string(),
                                    })
                                }
                            };

                        let ts_hash =
                            make_ts_hash(message.data.as_ref().unwrap().timestamp, &message.hash);
                        let existing_ts_hash = make_ts_hash(
                            existing_message.data.as_ref().unwrap().timestamp,
                            &existing_message.hash,
                        );

                        if ts_hash.is_err() || existing_ts_hash.is_err() {
                            return Err(HubError {
                                code: "bad_request".to_string(),
                                message: "failed to make tsHash".to_string(),
                            });
                        }

                        let message_compare = store.store_def().message_compare(
                            store.store_def().add_message_type(),
                            &existing_ts_hash.unwrap().to_vec(),
                            store.store_def().add_message_type(),
                            &ts_hash.unwrap().to_vec(),
                        );

                        if message_compare == 0 {
                            info!(
                                store.logger(),
                                "Unexpected duplicate during migration: {} {:x?}", fid, address
                            );
                        } else if message_compare > 0 {
                            info!(
                                store.logger(),
                                "Deleting duplicate verification for fid: {} {:x?}", fid, address
                            );

                            delete_message_transaction(&mut txn, &message)?;
                            txn.put(by_address_key, make_fid_key(existing_fid));
                            duplicates_count += 1;
                        } else {
                            info!(
                                store.logger(),
                                "Deleting duplicate verification for fid: {} {:x?}",
                                existing_fid,
                                address
                            );

                            delete_message_transaction(&mut txn, &existing_message)?;
                            txn.put(by_address_key, make_fid_key(fid));
                            duplicates_count += 1;
                        }
                    } else {
                        txn.put(by_address_key, make_fid_key(fid));
                    }

                    verifications_count += 1;
                    store.db().commit(txn)?;

                    Ok(false) // Continue iterating
                },
            )
            .unwrap();

        Ok((verifications_count, duplicates_count))
    }

    pub fn js_migrate_verifications(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let (verifications_count, duplicates_count) = match Self::migrate_verifications(&store) {
            Ok((verifications_count, duplicates_count)) => (verifications_count, duplicates_count),
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut tcx| {
            let js_object = tcx.empty_object();

            let val = tcx.number(verifications_count);
            js_object.set(&mut tcx, "total", val)?;

            let val = tcx.number(duplicates_count);
            js_object.set(&mut tcx, "duplicates", val)?;

            Ok(js_object)
        });

        Ok(promise)
    }

    pub fn create_verification_store(mut cx: FunctionContext) -> JsResult<JsBox<Arc<Store>>> {
        let db_js_box = cx.argument::<JsBox<Arc<RocksDB>>>(0)?;
        let db = (**db_js_box.borrow()).clone();

        let store_event_handler_js_box = cx.argument::<JsBox<Arc<StoreEventHandler>>>(1)?;
        let store_event_handler = (**store_event_handler_js_box.borrow()).clone();

        let prune_size_limit = cx
            .argument::<JsNumber>(2)
            .map(|n| n.value(&mut cx) as u32)?;

        Ok(cx.boxed(Arc::new(Self::new(
            db,
            store_event_handler,
            prune_size_limit,
        ))))
    }
}
