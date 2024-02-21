use neon::{
    context::{Context, FunctionContext, TaskContext},
    object::Object,
    result::JsResult,
    types::{buffer::TypedArray, JsArray},
};
use prost::Message;

use crate::protos;

use super::HubError;

pub fn vec_to_u8_24(vec: &Option<Vec<u8>>) -> Result<[u8; 24], HubError> {
    if let Some(vec) = vec {
        if vec.len() == 24 {
            let mut arr = [0u8; 24];
            arr.copy_from_slice(&vec);
            Ok(arr)
        } else {
            Err(HubError {
                code: "bad_request.internal_error".to_string(),
                message: format!("message_ts_hash is not 24 bytes: {:x?}", vec),
            })
        }
    } else {
        Err(HubError {
            code: "bad_request.internal_error".to_string(),
            message: "message_ts_hash is not 24 bytes: None".to_string(),
        })
    }
}

pub fn encode_messages_to_js_array<'a>(
    cx: &mut TaskContext<'a>,
    messages: Vec<protos::Message>,
) -> JsResult<'a, JsArray> {
    let js_messages = JsArray::new(cx, messages.len() as u32);
    for (i, message) in messages.iter().enumerate() {
        let message_bytes = message.encode_to_vec();

        let mut js_buffer = cx.buffer(message_bytes.len())?;
        js_buffer.as_mut_slice(cx).copy_from_slice(&message_bytes);
        js_messages.set(cx, i as u32, js_buffer)?;
    }
    Ok(js_messages)
}
