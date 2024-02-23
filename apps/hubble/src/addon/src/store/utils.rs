use std::{borrow::Borrow, sync::Arc};

use neon::{
    context::{Context, FunctionContext, TaskContext},
    object::Object,
    result::{JsResult, Throw},
    types::{
        buffer::TypedArray, JsArray, JsBoolean, JsBox, JsBuffer, JsNumber, JsObject, JsUndefined,
    },
};
use prost::Message as _;

use crate::{db::RocksDB, store::PAGE_SIZE_MAX};

use super::{HubError, MessagesPage, PageOptions, Store};

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

/** Increment the bytes of a Vec<u8> as if it were a big-endian number */
pub fn increment_vec_u8(vec: &Vec<u8>) -> Vec<u8> {
    let mut result = vec.clone(); // Clone the input vector to create a new one for the result
    let mut carry = true; // Start with a carry to simulate the increment

    // Iterate over the result vector from the least significant byte (end) to the most significant byte (start)
    for byte in result.iter_mut().rev() {
        if carry {
            if *byte == 255 {
                *byte = 0; // Reset and carry over
            } else {
                *byte += 1; // Increment the current byte
                carry = false; // No carry over needed, stop the loop
                break;
            }
        }
    }

    // If after processing all bytes there's still a carry, it means the vector was all 255s
    // and needs to be extended to represent the overflow (e.g., [255, 255] -> [1, 0, 0])
    if carry {
        result.insert(0, 1);
    }

    result
}

/** Derement the bytes of a Vec<u8> as if it were a big-endian number */
pub fn decrement_vec_u8(vec: &Vec<u8>) -> Vec<u8> {
    let mut result = vec.clone(); // Clone the input vector to create a new one for the result
    let mut borrow = true; // Start with a borrow to simulate the decrement

    // Iterate over the result vector from the least significant byte (end) to the most significant byte (start)
    for byte in result.iter_mut().rev() {
        if borrow {
            if *byte == 0 {
                *byte = 255; // Reset and borrow over
            } else {
                *byte -= 1; // Decrement the current byte
                borrow = false; // No borrow over needed, stop the loop
                break;
            }
        }
    }

    // If after processing all bytes there's still a borrow, it means the vector was all 0s
    // and needs to be extended to represent the underflow (e.g., [0, 0] -> [255])
    if borrow {
        result.pop();
    }

    result
}

/**
 * Encode a list of messages into a JavaScript array of buffers, which are protobuf encoded messages.
 * The caller will have to decode them into Messages in JavaScript.
 */
pub fn encode_messages_to_js_object<'a>(
    cx: &mut TaskContext<'a>,
    messages_page: MessagesPage,
) -> JsResult<'a, JsObject> {
    println!("Encoding messages: {:?}", messages_page.messages.len());
    let js_messages = JsArray::new(cx, messages_page.messages.len() as u32);
    for (i, message) in messages_page.messages.iter().enumerate() {
        let message_bytes = message.encode_to_vec();

        let mut js_buffer = cx.buffer(message_bytes.len())?;
        js_buffer.as_mut_slice(cx).copy_from_slice(&message_bytes);
        js_messages.set(cx, i as u32, js_buffer)?;
    }

    println!("Encoded messages finished: {:?}", js_messages);

    // Create a JsObject to return the array of buffers
    let js_object = JsObject::new(cx);
    js_object.set(cx, "messageBytes", js_messages)?;

    // If there is a page token, add it to the object, else set it to undefined
    if let Some(page_token) = messages_page.next_page_token {
        let mut js_page_token = cx.buffer(page_token.len())?;
        js_page_token.as_mut_slice(cx).copy_from_slice(&page_token);
        js_object.set(cx, "nextPageToken", js_page_token)?;
    } else {
        let undefined_obj = cx.undefined();
        js_object.set(cx, "nextPageToken", undefined_obj)?;
    }

    println!("js_object: {:?}", js_object);

    Ok(js_object)
}

/**
* Extract the page options from a JavaScript object at the given index. Fills in default values
* if they are not provided.
*/
pub fn get_page_options(cx: &mut FunctionContext, at: i32) -> Result<PageOptions, Throw> {
    let js_object = cx.argument::<JsObject>(at)?;
    println!("js_object: {:?}", js_object);

    let page_size = js_object
        .get_opt::<JsNumber, _, _>(cx, "pageSize")?
        .map_or(PAGE_SIZE_MAX, |v| v.value(cx) as usize);

    let page_token = js_object
        .get_opt::<JsBuffer, _, _>(cx, "pageToken")?
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

/** Get the store object from the context */
pub fn get_store(cx: &mut FunctionContext) -> Result<Arc<Store>, Throw> {
    let store_js_box = cx.this().downcast_or_throw::<JsBox<Arc<Store>>, _>(cx)?;
    Ok((**store_js_box.borrow()).clone())
}

pub fn get_db(cx: &mut FunctionContext) -> Result<Arc<RocksDB>, Throw> {
    let db_js_box = cx.this().downcast_or_throw::<JsBox<Arc<RocksDB>>, _>(cx)?;
    Ok((**db_js_box.borrow()).clone())
}

pub fn hub_error_to_js_throw<'a, T, U: Context<'a>>(cx: &mut U, e: HubError) -> Result<T, Throw> {
    cx.throw_error::<String, T>(format!("{}/{}", e.code, e.message))
}
