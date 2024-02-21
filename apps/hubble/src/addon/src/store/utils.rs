use neon::{
    context::{Context, FunctionContext, TaskContext},
    object::Object,
    result::JsResult,
    types::{buffer::TypedArray, JsArray, JsBoolean, JsBuffer, JsNumber, JsObject},
};
use prost::Message as _;

use crate::{protos, store::PAGE_SIZE_MAX};

use super::{HubError, PageOptions};

/**
 * Helper function to cast a vec into a [u8; 24] for TsHash
 */
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

/**
 * Encode a list of messages into a JavaScript array of buffers, which are protobuf encoded messages.
 * The caller will have to decode them into Messages in JavaScript.
 */
pub fn encode_messages_to_js_array<'a>(
    cx: &mut TaskContext<'a>,
    messages: Vec<protos::Message>,
) -> JsResult<'a, JsArray> {
    println!("Encoding messages: {:?}", messages.len());
    let js_messages = JsArray::new(cx, messages.len() as u32);
    for (i, message) in messages.iter().enumerate() {
        let message_bytes = message.encode_to_vec();

        let mut js_buffer = cx.buffer(message_bytes.len())?;
        js_buffer.as_mut_slice(cx).copy_from_slice(&message_bytes);
        js_messages.set(cx, i as u32, js_buffer)?;
    }

    println!("Encoded messages finished: {:?}", js_messages);
    Ok(js_messages)
}

/**
* Extract the page options from a JavaScript object at the given index. Fills in default values
* if they are not provided.
*/
pub fn get_page_options(cx: &mut FunctionContext, at: i32) -> Result<PageOptions, HubError> {
    let js_object = cx.argument::<JsObject>(at).map_err(|_| HubError {
        code: "bad_request.invalid_param".to_string(),
        message: "page_options is not an object".to_string(),
    })?;
    println!("js_object: {:?}", js_object);

    let page_size = js_object
        .get_opt::<JsNumber, _, _>(cx, "page_size")?
        .map_or(PAGE_SIZE_MAX, |v| v.value(cx) as usize);

    let page_token = js_object
        .get_opt::<JsBuffer, _, _>(cx, "page_token")?
        .map_or(vec![], |v| v.as_slice(cx).to_vec());

    let reverse = js_object
        .get_opt::<JsBoolean, _, _>(cx, "reverse")?
        .map_or(false, |js_boolean| js_boolean.value(cx));

    Ok(PageOptions {
        page_size: Some(page_size),
        page_token: if page_token.is_empty() {
            None
        } else {
            Some(page_token)
        },
        reverse,
    })
}
