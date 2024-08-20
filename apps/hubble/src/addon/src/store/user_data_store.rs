use super::{
    bytes_compare, encode_messages_to_js_object, get_page_options, get_store,
    hub_error_to_js_throw, is_message_in_time_range, make_user_key,
    name_registry_events::{
        delete_username_proof_transaction, get_fname_proof_by_fid, get_username_proof,
        put_username_proof_transaction,
    },
    store::{Store, StoreDef},
    HubError, MessagesPage, PageOptions, StoreEventHandler, UserPostfix,
};
use crate::protos::{hub_event, message_data, HubEvent, HubEventType, UserDataBody};
use crate::{
    db::{RocksDB, RocksDbTransactionBatch},
    protos::{self, Message, MessageType},
};
use neon::types::{buffer::TypedArray, JsBox, JsBuffer};
use neon::{
    context::{Context, FunctionContext},
    result::JsResult,
    types::{JsNumber, JsPromise},
};
use prost::Message as _;
use std::{borrow::Borrow, sync::Arc};

pub struct UserDataStoreDef {
    prune_size_limit: u32,
}

impl StoreDef for UserDataStoreDef {
    fn postfix(&self) -> u8 {
        UserPostfix::UserDataMessage as u8
    }

    fn add_message_type(&self) -> u8 {
        MessageType::UserDataAdd as u8
    }

    fn remove_message_type(&self) -> u8 {
        MessageType::None as u8
    }

    fn is_add_type(&self, message: &Message) -> bool {
        message.signature_scheme == protos::SignatureScheme::Ed25519 as i32
            && message.data.is_some()
            && message.data.as_ref().unwrap().r#type == MessageType::UserDataAdd as i32
            && message.data.as_ref().unwrap().body.is_some()
    }

    fn is_remove_type(&self, _message: &Message) -> bool {
        false
    }

    fn compact_state_message_type(&self) -> u8 {
        MessageType::None as u8
    }

    fn is_compact_state_type(&self, _message: &Message) -> bool {
        false
    }

    fn find_merge_add_conflicts(&self, _db: &RocksDB, _message: &Message) -> Result<(), HubError> {
        // No conflicts
        Ok(())
    }

    fn find_merge_remove_conflicts(
        &self,
        _db: &RocksDB,
        _message: &Message,
    ) -> Result<(), HubError> {
        Err(HubError {
            code: "bad_request.invalid_param".to_string(),
            message: "UserDataStoree doesn't support merging removes".to_string(),
        })
    }

    fn make_add_key(&self, message: &Message) -> Result<Vec<u8>, HubError> {
        let user_data_body = match message.data.as_ref().unwrap().body.as_ref().unwrap() {
            message_data::Body::UserDataBody(body) => body,
            _ => {
                return Err(HubError {
                    code: "bad_request.invalid_param".to_string(),
                    message: "UserDataAdd message missing body".to_string(),
                })
            }
        };

        let key = Self::make_user_data_adds_key(
            message.data.as_ref().unwrap().fid as u32,
            user_data_body.r#type,
        );
        Ok(key)
    }

    fn make_remove_key(&self, _message: &Message) -> Result<Vec<u8>, HubError> {
        Err(HubError {
            code: "bad_request.invalid_param".to_string(),
            message: "removes not supported".to_string(),
        })
    }

    fn make_compact_state_add_key(&self, _message: &Message) -> Result<Vec<u8>, HubError> {
        Err(HubError {
            code: "bad_request.invalid_param".to_string(),
            message: "UserDataStore doesn't support compact state".to_string(),
        })
    }

    fn make_compact_state_prefix(&self, _fid: u32) -> Result<Vec<u8>, HubError> {
        Err(HubError {
            code: "bad_request.invalid_param".to_string(),
            message: "UserDataStore doesn't support compact state".to_string(),
        })
    }

    fn get_prune_size_limit(&self) -> u32 {
        self.prune_size_limit
    }
}

impl UserDataStoreDef {
    /**
     * Generates unique keys used to store or fetch UserDataAdd messages in the UserDataAdd set index
     *
     * @param fid farcaster id of the user who created the message
     * @param dataType type of data being added
     * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<dataType?>
     */
    fn make_user_data_adds_key(fid: u32, data_type: i32) -> Vec<u8> {
        let mut key = Vec::with_capacity(33 + 1 + 1);

        key.extend_from_slice(&make_user_key(fid));
        key.push(UserPostfix::UserDataAdds as u8);
        if data_type > 0 {
            key.push(data_type as u8);
        }

        key
    }
}

pub struct UserDataStore {}

impl UserDataStore {
    pub fn new(
        db: Arc<RocksDB>,
        store_event_handler: Arc<StoreEventHandler>,
        prune_size_limit: u32,
    ) -> Store {
        Store::new_with_store_def(
            db,
            store_event_handler,
            Box::new(UserDataStoreDef { prune_size_limit }),
        )
    }

    pub fn create_userdata_store(mut cx: FunctionContext) -> JsResult<JsBox<Arc<Store>>> {
        let db_js_box = cx.argument::<JsBox<Arc<RocksDB>>>(0)?;
        let db = (**db_js_box.borrow()).clone();

        // Read the StoreEventHandler
        let store_event_handler_js_box = cx.argument::<JsBox<Arc<StoreEventHandler>>>(1)?;
        let store_event_handler = (**store_event_handler_js_box.borrow()).clone();

        // Read the prune size limit and prune time limit from the options
        let prune_size_limit = cx
            .argument::<JsNumber>(2)
            .map(|n| n.value(&mut cx) as u32)?;

        Ok(cx.boxed(Arc::new(UserDataStore::new(
            db,
            store_event_handler,
            prune_size_limit,
        ))))
    }

    pub fn get_user_data_add(
        store: &Store,
        fid: u32,
        r#type: i32,
    ) -> Result<Option<protos::Message>, HubError> {
        let partial_message = protos::Message {
            data: Some(protos::MessageData {
                fid: fid as u64,
                r#type: MessageType::UserDataAdd as i32,
                body: Some(protos::message_data::Body::UserDataBody(UserDataBody {
                    r#type,
                    ..Default::default()
                })),
                ..Default::default()
            }),
            ..Default::default()
        };

        store.get_add(&partial_message)
    }

    pub fn js_get_userdata_add(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let channel = cx.channel();

        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0)?.value(&mut cx) as u32;
        let r#type = cx.argument::<JsNumber>(1)?.value(&mut cx) as i32;

        let result = match Self::get_user_data_add(&store, fid, r#type) {
            Ok(Some(message)) => message.encode_to_vec(),
            Ok(None) => cx.throw_error(format!(
                "{}/{}",
                "not_found", "NotFound: UserDataAdd message not found"
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

    pub fn get_user_data_adds_by_fid(
        store: &Store,
        fid: u32,
        page_options: &PageOptions,
        start_time: Option<u32>,
        stop_time: Option<u32>,
    ) -> Result<MessagesPage, HubError> {
        store.get_adds_by_fid(
            fid,
            page_options,
            Some(|message: &Message| {
                return is_message_in_time_range(start_time, stop_time, message);
            }),
        )
    }

    pub fn js_get_user_data_adds_by_fid(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let fid = cx.argument::<JsNumber>(0)?.value(&mut cx) as u32;
        let page_options = get_page_options(&mut cx, 1)?;
        let start_time = match cx.argument_opt(2) {
            Some(arg) => match arg.downcast::<JsNumber, _>(&mut cx) {
                Ok(v) => Some(v.value(&mut cx) as u32),
                _ => None,
            },
            None => None,
        };
        let stop_time = match cx.argument_opt(3) {
            Some(arg) => match arg.downcast::<JsNumber, _>(&mut cx) {
                Ok(v) => Some(v.value(&mut cx) as u32),
                _ => None,
            },
            None => None,
        };

        let messages = match Self::get_user_data_adds_by_fid(
            &store,
            fid,
            &page_options,
            start_time,
            stop_time,
        ) {
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

    pub fn get_username_proof(
        store: &Store,
        name: &[u8],
    ) -> Result<Option<protos::UserNameProof>, HubError> {
        get_username_proof(&store.db(), name)
    }

    pub fn js_get_username_proof(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;
        let name_buffer = cx.argument::<JsBuffer>(0)?;
        let name = name_buffer.as_slice(&mut cx);

        let result = match Self::get_username_proof(&store, &name) {
            Ok(Some(proof)) => match proof.fid {
                0 => cx.throw_error(format!(
                    "{}/{}",
                    "not_found", "NotFound: UserDataAdd message not found"
                ))?,
                _ => proof.encode_to_vec(),
            },
            Ok(None) => cx.throw_error(format!(
                "{}/{}",
                "not_found", "NotFound: UserDataAdd message not found"
            ))?,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let (deferred, promise) = cx.promise();
        let channel = cx.channel();
        deferred.settle_with(&channel, move |mut cx| {
            let mut js_buffer = cx.buffer(result.len())?;
            js_buffer.as_mut_slice(&mut cx).copy_from_slice(&result);
            Ok(js_buffer)
        });

        Ok(promise)
    }

    pub fn get_username_proof_by_fid(
        store: &Store,
        fid: u32,
    ) -> Result<Option<protos::UserNameProof>, HubError> {
        get_fname_proof_by_fid(&store.db(), fid)
    }

    pub fn js_get_username_proof_by_fid(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;
        let fid = cx.argument::<JsNumber>(0)?.value(&mut cx) as u32;

        let result = match Self::get_username_proof_by_fid(&store, fid) {
            Ok(Some(proof)) => proof.encode_to_vec(),
            Ok(None) => cx.throw_error(format!(
                "{}/{}",
                "not_found", "NotFound: UserDataAdd message not found"
            ))?,
            Err(e) => return hub_error_to_js_throw(&mut cx, e),
        };

        let (deferred, promise) = cx.promise();
        let channel = cx.channel();
        deferred.settle_with(&channel, move |mut cx| {
            let mut js_buffer = cx.buffer(result.len())?;
            js_buffer.as_mut_slice(&mut cx).copy_from_slice(&result);
            Ok(js_buffer)
        });

        Ok(promise)
    }

    pub fn merge_username_proof(
        store: &Store,
        username_proof: &protos::UserNameProof,
    ) -> Result<Vec<u8>, HubError> {
        let existing_proof = get_username_proof(&store.db(), &username_proof.name)?;
        let mut existing_fid: Option<u32> = None;

        if existing_proof.is_some() {
            let cmp =
                Self::username_proof_compare(existing_proof.as_ref().unwrap(), username_proof);

            if cmp == 0 {
                return Err(HubError {
                    code: "bad_request.duplicate".to_string(),
                    message: "username proof already exists".to_string(),
                });
            }
            if cmp > 0 {
                return Err(HubError {
                    code: "bad_request.conflict".to_string(),
                    message: "event conflicts with a more recent UserNameProof".to_string(),
                });
            }
            existing_fid = Some(existing_proof.as_ref().unwrap().fid as u32);
        }

        if existing_proof.is_none() && username_proof.fid == 0 {
            return Err(HubError {
                code: "bad_request.conflict".to_string(),
                message: "proof does not exist".to_string(),
            });
        }

        let mut txn = RocksDbTransactionBatch::new();
        if username_proof.fid == 0 {
            delete_username_proof_transaction(&mut txn, username_proof, existing_fid);
        } else {
            put_username_proof_transaction(&mut txn, username_proof);
        }

        let mut hub_event = HubEvent {
            r#type: HubEventType::MergeUsernameProof as i32,
            body: Some(hub_event::Body::MergeUsernameProofBody(
                protos::MergeUserNameProofBody {
                    username_proof: Some(username_proof.clone()),
                    deleted_username_proof: existing_proof,
                    username_proof_message: None,
                    deleted_username_proof_message: None,
                },
            )),
            id: 0,
        };
        let id = store
            .event_handler()
            .commit_transaction(&mut txn, &mut hub_event)?;

        store.db().commit(txn)?;

        hub_event.id = id;
        let hub_event_bytes = hub_event.encode_to_vec();

        Ok(hub_event_bytes)
    }

    pub fn js_merge_username_proof(mut cx: FunctionContext) -> JsResult<JsPromise> {
        let store = get_store(&mut cx)?;

        let username_proof_buffer = cx.argument::<JsBuffer>(0)?;
        let username_proof = protos::UserNameProof::decode(username_proof_buffer.as_slice(&mut cx));

        let result = if username_proof.is_err() {
            let e = username_proof.unwrap_err();
            Err(HubError {
                code: "bad_request.validation_failure".to_string(),
                message: e.to_string(),
            })
        } else {
            Self::merge_username_proof(store.as_ref(), &username_proof.unwrap())
        };

        let channel = cx.channel();
        let (deferred, promise) = cx.promise();
        deferred.settle_with(&channel, move |mut cx| match result {
            Ok(hub_event_bytes) => {
                let mut js_buffer = cx.buffer(hub_event_bytes.len())?;
                js_buffer
                    .as_mut_slice(&mut cx)
                    .copy_from_slice(&hub_event_bytes);
                Ok(js_buffer)
            }
            Err(e) => cx.throw_error(format!("{}/{}", e.code, e.message)),
        });
        // });

        Ok(promise)
    }

    fn username_proof_compare(a: &protos::UserNameProof, b: &protos::UserNameProof) -> i8 {
        if a.timestamp < b.timestamp {
            return -1;
        }
        if a.timestamp > b.timestamp {
            return 1;
        }

        bytes_compare(&a.signature, &b.signature)
    }
}
