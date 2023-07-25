use base64::{engine::general_purpose as GP, Engine as _};
use ed25519_dalek::{PublicKey, Signature, Verifier};
use std::ffi::CStr;
use std::os::raw::{c_char, c_int};

#[no_mangle]
pub extern "C" fn verify(
    signature: *const c_char,
    message: *const c_char,
    public_key: *const c_char,
) -> c_int {
    // Convert the raw pointers to a CStr
    let raw_signature = unsafe { CStr::from_ptr(signature).to_str().unwrap_or("") };
    let raw_message = unsafe { CStr::from_ptr(message).to_str().unwrap_or("") };
    let raw_public_key = unsafe { CStr::from_ptr(public_key).to_str().unwrap_or("") };

    // Decode the base64 inputs
    let decoded_signature = match GP::STANDARD.decode(raw_signature) {
        Ok(result) => result,
        Err(_) => return 0,
    };
    let decoded_message = match GP::STANDARD.decode(raw_message) {
        Ok(result) => result,
        Err(_) => return 0,
    };
    let decoded_public_key = match GP::STANDARD.decode(raw_public_key) {
        Ok(result) => result,
        Err(_) => return 0,
    };

    // Convert to the types expected by ed25519_dalek
    let signature = match Signature::from_bytes(&decoded_signature) {
        Ok(result) => result,
        Err(_) => return 0,
    };
    let public_key = match PublicKey::from_bytes(&decoded_public_key) {
        Ok(result) => result,
        Err(_) => return 0,
    };

    // Verify the signature
    match public_key.verify(&decoded_message, &signature) {
        Ok(_) => 1,
        Err(_) => 0,
    }
}
