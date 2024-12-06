use super::{
    get_message, hub_error_to_js_throw, make_fid_key, make_user_key, read_fid_key,
    store::{Store, StoreDef},
    utils::{self, encode_messages_to_js_object, get_page_options, get_store},
    HubError, IntoU8, MessagesPage, PageOptions, RootPrefix, StoreEventHandler, UserPostfix,
    TS_HASH_LENGTH,
};
use crate::protos::{
    hub_event, message_data::Body, HubEvent, HubEventType, MergeUserNameProofBody, UserNameType,
};
use crate::{
    db::{RocksDB, RocksDbTransactionBatch},
    protos::{self, Message, MessageType},
};
use neon::{
    context::{Context, FunctionContext},
    result::JsResult,
    types::{buffer::TypedArray, JsBox, JsBuffer, JsNumber, JsPromise},
};
use prost::Message as _;
use std::{borrow::Borrow as _, sync::Arc};

pub struct UsernameProofStoreDef {
    prune_size_limit: u32,
}

impl StoreDef for UsernameProofStoreDef {
    fn postfix(&self) -> u8 {
        UserPostfix::UsernameProofMessage.as_u8()
    }

    fn add_message_type(&self) -> u8 {
        MessageType::UsernameProof.into_u8()
    }

    fn make_add_key(&self, message: &Message) -> Result<Vec<u8>, HubError> {
        if message.data.is_none() {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "Message data is missing".to_string(),
            });
        }

        let data = message.data.as_ref().unwrap();
        if data.body.is_none() {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "Message body is missing".to_string(),
            });
        }

        let name = match &data.body {
            Some(Body::UsernameProofBody(body)) => &body.name,
            _ => {
                return Err(HubError {
                    code: "bad_request.validation_failure".to_string(),
                    message: "Message body is missing".to_string(),
                })
            }
        };

        Ok(Self::make_username_proof_by_fid_key(
            message.data.as_ref().unwrap().fid as u32,
            name,
        ))
    }

    fn remove_type_supported(&self) -> bool {
        false
    }

    fn compact_state_message_type(&self) -> u8 {
        MessageType::None as u8
    }

    fn is_compact_state_type(&self, _message: &Message) -> bool {
        false
    }

    fn make_remove_key(&self, _message: &Message) -> Result<Vec<u8>, HubError> {
        Err(HubError {
            code: "bad_request.validation_failure".to_string(),
            message: "Remove not supported".to_string(),
        })
    }

    fn make_compact_state_add_key(&self, _message: &Message) -> Result<Vec<u8>, HubError> {
        Err(HubError {
            code: "bad_request.invalid_param".to_string(),
            message: "Username Proof Store doesn't support compact state".to_string(),
        })
    }

    fn make_compact_state_prefix(&self, _fid: u32) -> Result<Vec<u8>, HubError> {
        Err(HubError {
            code: "bad_request.invalid_param".to_string(),
            message: "Username Proof Store doesn't support compact state".to_string(),
        })
    }

    fn is_add_type(&self, message: &Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519 as i32
            && message.data.is_some()
            && message.data.as_ref().unwrap().r#type == MessageType::UsernameProof.into_u8() as i32
            && message.data.as_ref().unwrap().body.is_some()
    }

    fn build_secondary_indices(
        &self,
        txn: &mut RocksDbTransactionBatch,
        _ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        if message.data.is_none() {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "Message data is missing".to_string(),
            });
        }

        let data = message.data.as_ref().unwrap();
        if let Some(Body::UsernameProofBody(body)) = &data.body {
            if body.name.len() == 0 {
                return Err(HubError {
                    code: "bad_request.invalid_param".to_string(),
                    message: "name empty".to_string(),
                });
            }

            let by_name_key = Self::make_username_proof_by_name_key(&body.name);
            txn.put(
                by_name_key,
                make_fid_key(message.data.as_ref().unwrap().fid as u32),
            );
            Ok(())
        } else {
            Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "Message body is missing or incorrect".to_string(),
            })
        }
    }

    fn delete_secondary_indices(
        &self,
        txn: &mut RocksDbTransactionBatch,
        _ts_hash: &[u8; TS_HASH_LENGTH],
        message: &Message,
    ) -> Result<(), HubError> {
        if message.data.is_none() {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "Message data is missing".to_string(),
            });
        }

        let data = message.data.as_ref().unwrap();
        if let Some(Body::UsernameProofBody(body)) = &data.body {
            if body.name.len() == 0 {
                return Err(HubError {
                    code: "bad_request.invalid_param".to_string(),
                    message: "name empty".to_string(),
                });
            }

            let by_name_key = Self::make_username_proof_by_name_key(&body.name);
            txn.delete(by_name_key);
            Ok(())
        } else {
            Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "Message data body is missing or incorrect".to_string(),
            })
        }
    }

    fn delete_remove_secondary_indices(
        &self,
        _txn: &mut RocksDbTransactionBatch,
        _message: &Message,
    ) -> Result<(), HubError> {
        Ok(())
    }

    fn get_merge_conflicts(
        &self,
        db: &RocksDB,
        message: &Message,
        ts_hash: &[u8; TS_HASH_LENGTH],
    ) -> Result<Vec<Message>, HubError> {
        if message.data.is_none() {
            return Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: "Message data is missing".to_string(),
            });
        }

        let data = message.data.as_ref().unwrap();
        let name = match &data.body {
            Some(Body::UsernameProofBody(body)) => &body.name,
            _ => {
                return Err(HubError {
                    code: "bad_request.validation_failure".to_string(),
                    message: "Message data body is missing".to_string(),
                })
            }
        };

        let mut conflicts = Vec::new();
        let by_name_key = Self::make_username_proof_by_name_key(name);

        let fid_result = db.get(by_name_key.as_slice());
        if let Ok(Some(fid_bytes)) = fid_result {
            let fid = read_fid_key(&fid_bytes);
            if fid > 0 {
                let existing_add_key = Self::make_username_proof_by_fid_key(fid, name);
                if let Ok(existing_message_ts_hash) = db.get(existing_add_key.as_slice()) {
                    if let Ok(Some(existing_message)) = get_message(
                        db,
                        fid,
                        self.postfix(),
                        &utils::vec_to_u8_24(&existing_message_ts_hash)?,
                    ) {
                        let message_compare = self.message_compare(
                            self.add_message_type(),
                            &existing_message_ts_hash.unwrap().to_vec(),
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
                                code: "bad_request.duplicate".to_string(),
                                message: "message has already been merged".to_string(),
                            });
                        }
                        conflicts.push(existing_message);
                    }
                }
            }
        }

        Ok(conflicts)
    }

    fn remove_message_type(&self) -> u8 {
        MessageType::None.into_u8()
    }

    fn is_remove_type(&self, _message: &Message) -> bool {
        false
    }

    fn find_merge_add_conflicts(&self, _db: &RocksDB, _message: &Message) -> Result<(), HubError> {
        Ok(())
    }

    fn find_merge_remove_conflicts(
        &self,
        _db: &RocksDB,
        _message: &Message,
    ) -> Result<(), HubError> {
        return Err(HubError {
            code: "bad_request.validation_failure".to_string(),
            message: "Username Proof store does not support removes".to_string(),
        });
    }

    fn get_prune_size_limit(&self) -> u32 {
        self.prune_size_limit
    }

    fn revoke_event_args(&self, message: &Message) -> HubEvent {
        let username_proof_body = match &message.data {
            Some(message_data) => match &message_data.body {
                Some(Body::UsernameProofBody(username_proof_body)) => {
                    Some(username_proof_body.clone())
                }
                _ => None,
            },
            _ => None,
        };

        HubEvent {
            r#type: HubEventType::MergeUsernameProof as i32,
            body: Some(hub_event::Body::MergeUsernameProofBody(
                MergeUserNameProofBody {
                    username_proof: None,
                    deleted_username_proof: username_proof_body,
                    username_proof_message: None,
                    deleted_username_proof_message: Some(message.clone()),
                },
            )),
            id: 0,
        }
    }

    fn merge_event_args(&self, message: &Message, merge_conflicts: Vec<Message>) -> HubEvent {
        let username_proof_body = match &message.data {
            Some(message_data) => match &message_data.body {
                Some(Body::UsernameProofBody(username_proof_body)) => {
                    Some(username_proof_body.clone())
                }
                _ => None,
            },
            _ => None,
        };

        let (deleted_proof_body, deleted_message) = if merge_conflicts.len() > 0 {
            match &merge_conflicts[0].data {
                Some(message_data) => match &message_data.body {
                    Some(Body::UsernameProofBody(username_proof_body)) => (
                        Some(username_proof_body.clone()),
                        Some(merge_conflicts[0].clone()),
                    ),
                    _ => (None, None),
                },
                _ => (None, None),
            }
        } else {
            (None, None)
        };

        HubEvent {
            r#type: HubEventType::MergeUsernameProof as i32,
            body: Some(hub_event::Body::MergeUsernameProofBody(
                MergeUserNameProofBody {
                    username_proof: username_proof_body,
                    deleted_username_proof: deleted_proof_body,
                    username_proof_message: Some(message.clone()),
                    deleted_username_proof_message: deleted_message,
                },
            )),
            id: 0,
        }
    }

    fn prune_event_args(&self, message: &Message) -> HubEvent {
        self.revoke_event_args(message)
    }
}

impl UsernameProofStoreDef {
    fn make_username_proof_by_name_key(name: &Vec<u8>) -> Vec<u8> {
        let mut key = Vec::with_capacity(1 + name.len());

        key.push(RootPrefix::UserNameProofByName as u8);
        key.extend(name);

        key
    }

    fn make_username_proof_by_fid_key(fid: u32, name: &Vec<u8>) -> Vec<u8> {
        let mut key = Vec::with_capacity(1 + 4 + 1 + name.len());

        key.extend_from_slice(&make_user_key(fid));
        key.push(UserPostfix::UserNameProofAdds.as_u8());
        key.extend(name);

        key
    }
}

pub struct UsernameProofStore {}

impl UsernameProofStore {
    pub fn new(
        db: Arc<RocksDB>,
        store_event_handler: Arc<StoreEventHandler>,
        prune_size_limit: u32,
    ) -> Store {
        Store::new_with_store_def(
            db,
            store_event_handler,
            Box::new(UsernameProofStoreDef { prune_size_limit }),
        )
    }

    pub fn get_username_proof(
        store: &Store,
        name: &Vec<u8>,
        name_type: u8,
    ) -> Result<Option<protos::Message>, HubError> {
        if name_type != UserNameType::UsernameTypeEnsL1 as u8
            && name_type != UserNameType::UsernameTypeBase as u8
        {
            return Err(HubError {
                code: "bad_request".to_string(),
                message: format!(
                    "Unsupported username type {}. Only ENS L1 and Base names are supported",
                    name_type as u8
                ),
            });
        }

        let by_name_key = UsernameProofStoreDef::make_username_proof_by_name_key(name);
        let fid_result = store.db().get(by_name_key.as_slice())?;
        if fid_result.is_none() {
            return Err(HubError {
                code: "not_found".to_string(),
                message: format!(
                    "NotFound: Username proof not found for name {}",
                    String::from_utf8_lossy(name)
                ),
            });
        }

        let fid = read_fid_key(&fid_result.unwrap());
        let partial_message = protos::Message {
            data: Some(protos::MessageData {
                fid: fid as u64,
                body: Some(protos::message_data::Body::UsernameProofBody(
                    protos::UserNameProof {
                        name: name.clone(),
                        ..Default::default()
                    },
                )),
                ..Default::default()
            }),
            ..Default::default()
        };

        store.get_add(&partial_message)
    }

    pub fn js_get_username_proof(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let channel = cx.channel();

        let store = get_store(&mut cx)?;

        let name = cx.argument::<JsBuffer>(0)?.as_slice(&cx).to_vec();
        let name_type = cx.argument::<JsNumber>(1)?.value(&mut cx) as u8;

        let result = match Self::get_username_proof(&store, &name, name_type) {
            Ok(Some(message)) => message.encode_to_vec(),
            Ok(None) => cx.throw_error(format!(
                "{}/{} for {}",
                "not_found",
                "NotFound: usernameproof not found for {}",
                String::from_utf8_lossy(&name)
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

    pub fn get_username_proofs_by_fid(
        store: &Store,
        fid: u32,
        page_options: &PageOptions,
    ) -> Result<MessagesPage, HubError> {
        store.get_adds_by_fid::<fn(&protos::Message) -> bool>(fid, page_options, None)
    }

    pub fn js_get_username_proofs_by_fid(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let channel = cx.channel();

        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0)?.value(&mut cx) as u32;
        let page_options = get_page_options(&mut cx, 1)?;

        let messages = match Self::get_username_proofs_by_fid(&store, fid, &page_options) {
            Ok(page) => page,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| {
            encode_messages_to_js_object(&mut cx, messages)
        });

        Ok(promise)
    }

    pub fn get_username_proof_by_fid_and_name(
        store: &Store,
        name: &Vec<u8>,
        fid: u32,
    ) -> Result<Option<protos::Message>, HubError> {
        let partial_message = protos::Message {
            data: Some(protos::MessageData {
                fid: fid as u64,
                body: Some(protos::message_data::Body::UsernameProofBody(
                    protos::UserNameProof {
                        name: name.clone(),
                        ..Default::default()
                    },
                )),
                ..Default::default()
            }),
            ..Default::default()
        };

        store.get_add(&partial_message)
    }

    pub fn js_get_username_proof_by_fid_and_name(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let channel = cx.channel();

        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0)?.value(&mut cx) as u32;
        let name = cx.argument::<JsBuffer>(1)?.as_slice(&cx).to_vec();

        let result = match Self::get_username_proof_by_fid_and_name(&store, &name, fid) {
            Ok(Some(message)) => message.encode_to_vec(),
            Ok(None) => cx.throw_error(format!(
                "{}/{} for {}",
                "not_found",
                "NotFound: username proof not found for {}",
                String::from_utf8_lossy(&name)
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

    pub fn create_username_proof_store(mut cx: FunctionContext) -> JsResult<JsBox<Arc<Store>>> {
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
