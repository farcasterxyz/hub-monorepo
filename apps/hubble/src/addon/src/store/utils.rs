use super::{HubError, MessagesPage, PageOptions, Store, FARCASTER_EPOCH};
use crate::{
    db::RocksDB,
    trie::merkle_trie::{MerkleTrie, NodeMetadata},
};
use neon::{
    context::{Context, FunctionContext, TaskContext},
    object::Object,
    result::{JsResult, Throw},
    types::{buffer::TypedArray, JsArray, JsBoolean, JsBox, JsBuffer, JsNumber, JsObject},
};
use prost::Message as _;
use std::{borrow::Borrow, sync::Arc};

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
    let js_messages = JsArray::new(cx, messages_page.messages.len());
    for (i, message) in messages_page.messages.iter().enumerate() {
        let message_bytes = message.encode_to_vec();

        let mut js_buffer = cx.buffer(message_bytes.len())?;
        js_buffer.as_mut_slice(cx).copy_from_slice(&message_bytes);
        js_messages.set(cx, i as u32, js_buffer)?;
    }

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

    Ok(js_object)
}

/** Encode the node metadata into a Js Object */
pub fn encode_node_metadata_to_js_object<'a>(
    tcx: &mut TaskContext<'a>,
    node_metadata: &NodeMetadata,
) -> JsResult<'a, JsObject> {
    let js_object = JsObject::new(tcx);

    let mut js_prefix = tcx.buffer(node_metadata.prefix.len())?;
    js_prefix
        .as_mut_slice(tcx)
        .copy_from_slice(&node_metadata.prefix);
    js_object.set(tcx, "prefix", js_prefix)?;

    let js_num_messages = tcx.number(node_metadata.num_messages as f64);
    js_object.set(tcx, "numMessages", js_num_messages)?;

    let js_hash = tcx.string(node_metadata.hash.clone());
    js_object.set(tcx, "hash", js_hash)?;

    // We can't return a map from rust to JS, so we return two arrays,
    // one with keys and one with values
    let js_keys = JsArray::new(tcx, node_metadata.children.len());
    let js_values = JsArray::new(tcx, node_metadata.children.len());
    for (i, (key, child_metadata)) in node_metadata.children.iter().enumerate() {
        let js_key = JsNumber::new(tcx, *key as f64);
        js_keys.set(tcx, i as u32, js_key)?;

        let js_child_metadata = encode_node_metadata_to_js_object(tcx, child_metadata)?;
        js_values.set(tcx, i as u32, js_child_metadata)?;
    }

    js_object.set(tcx, "childrenKeys", js_keys)?;
    js_object.set(tcx, "childrenValues", js_values)?;

    Ok(js_object)
}
/**
* Extract the page options from a JavaScript object at the given index. Fills in default values
* if they are not provided.
*/
pub fn get_page_options(cx: &mut FunctionContext, at: usize) -> Result<PageOptions, Throw> {
    let js_object = cx.argument::<JsObject>(at)?;

    let page_size = js_object
        .get_opt::<JsNumber, _, _>(cx, "pageSize")?
        .map(|v| v.value(cx) as usize);

    let page_token = js_object
        .get_opt::<JsBuffer, _, _>(cx, "pageToken")?
        .map_or(vec![], |v| v.as_slice(cx).to_vec());

    let reverse = js_object
        .get_opt::<JsBoolean, _, _>(cx, "reverse")?
        .map_or(false, |js_boolean| js_boolean.value(cx));

    Ok(PageOptions {
        page_size,
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
    let store_js_box = cx.this::<JsBox<Arc<Store>>>()?;
    Ok((**store_js_box.borrow()).clone())
}

/** Get the rust DB */
pub fn get_db(cx: &mut FunctionContext) -> Result<Arc<RocksDB>, Throw> {
    let db_js_box = cx.this::<JsBox<Arc<RocksDB>>>()?;
    Ok((**db_js_box.borrow()).clone())
}

/** Get the merkle trie object */
pub fn get_merkle_trie(cx: &mut FunctionContext) -> Result<Arc<MerkleTrie>, Throw> {
    let merkle_trie_js_box = cx.this::<JsBox<Arc<MerkleTrie>>>()?;
    Ok((**merkle_trie_js_box.borrow()).clone())
}

pub fn hub_error_to_js_throw<'a, T, U: Context<'a>>(cx: &mut U, e: HubError) -> Result<T, Throw> {
    cx.throw_error::<String, T>(format!("{}/{}", e.code, e.message))
}

pub fn to_farcaster_time(time_ms: u64) -> Result<u64, HubError> {
    if time_ms < FARCASTER_EPOCH {
        return Err(HubError {
            code: "bad_request.invalid_param".to_string(),
            message: format!("time_ms is before the farcaster epoch: {}", time_ms),
        });
    }

    let seconds_since_epoch = (time_ms - FARCASTER_EPOCH) / 1000;
    if seconds_since_epoch > u32::MAX as u64 {
        return Err(HubError {
            code: "bad_request.invalid_param".to_string(),
            message: format!("time too far in future: {}", time_ms),
        });
    }

    Ok(seconds_since_epoch as u64)
}

pub fn from_farcaster_time(time: u64) -> u64 {
    time * 1000 + FARCASTER_EPOCH
}

pub fn get_farcaster_time() -> Result<u64, HubError> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| HubError {
            code: "internal_error".to_string(),
            message: format!("failed to get time: {}", e),
        })?;
    Ok(to_farcaster_time(now.as_millis() as u64)?)
}

pub fn bytes_compare(a: &[u8], b: &[u8]) -> i8 {
    let len = a.len().min(b.len());
    for i in 0..len {
        if a[i] < b[i] {
            return -1;
        }
        if a[i] > b[i] {
            return 1;
        }
    }
    if a.len() < b.len() {
        -1
    } else if a.len() > b.len() {
        1
    } else {
        0
    }
}

/**
 * The hashes in the sync trie are 20 bytes (160 bits) long, so we use the first 20 bytes of the blake3 hash
 */
const BLAKE3_HASH_LEN: usize = 20;
pub fn blake3_20(input: &[u8]) -> Vec<u8> {
    let mut hasher = blake3::Hasher::new();
    hasher.update(input);
    hasher.finalize().as_bytes()[..BLAKE3_HASH_LEN].to_vec()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_increment_vec_u8() {
        let vec = vec![0, 0, 0];
        let result = increment_vec_u8(&vec);
        assert_eq!(result, vec![0, 0, 1]);

        let vec = vec![0, 0, 255];
        let result = increment_vec_u8(&vec);
        assert_eq!(result, vec![0, 1, 0]);

        let vec = vec![0, 255, 255];
        let result = increment_vec_u8(&vec);
        assert_eq!(result, vec![1, 0, 0]);

        let vec = vec![255, 255, 255];
        let result = increment_vec_u8(&vec);
        assert_eq!(result, vec![1, 0, 0, 0]);

        let vec = vec![255, 255, 255];
        let result = increment_vec_u8(&vec);
        assert_eq!(result, vec![1, 0, 0, 0]);
    }

    #[test]
    fn test_decrement_vec_u8() {
        let vec = vec![0, 0, 1];
        let result = decrement_vec_u8(&vec);
        assert_eq!(result, vec![0, 0, 0]);

        let vec = vec![0, 1, 0];
        let result = decrement_vec_u8(&vec);
        assert_eq!(result, vec![0, 0, 255]);

        let vec = vec![1, 0, 0];
        let result = decrement_vec_u8(&vec);
        assert_eq!(result, vec![0, 255, 255]);

        let vec = vec![1, 0, 0, 0];
        let result = decrement_vec_u8(&vec);
        assert_eq!(result, vec![0, 255, 255, 255]);
    }

    #[test]
    fn test_bytes_compare() {
        let a = vec![0, 0, 0];
        let b = vec![0, 0, 0];
        assert_eq!(bytes_compare(&a, &b), 0);

        let a = vec![0, 0, 0];
        let b = vec![0, 0, 1];
        assert_eq!(bytes_compare(&a, &b), -1);

        let a = vec![0, 0, 1];
        let b = vec![0, 0, 0];
        assert_eq!(bytes_compare(&a, &b), 1);
    }

    #[test]
    fn test_get_farcaster_time() {
        let time = get_farcaster_time().unwrap();
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        assert!(time <= now);
    }

    #[test]
    fn to_farcaster_time_test() {
        // It is an error to pass a time before the farcaster epoch
        let time = to_farcaster_time(0);
        assert!(time.is_err());

        let time = to_farcaster_time(FARCASTER_EPOCH - 1);
        assert!(time.is_err());

        let time = to_farcaster_time(FARCASTER_EPOCH).unwrap();
        assert_eq!(time, 0);

        let time = to_farcaster_time(FARCASTER_EPOCH + 1000).unwrap();
        assert_eq!(time, 1);
    }
}
