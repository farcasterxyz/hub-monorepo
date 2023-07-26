use base64::{engine::general_purpose as GP, Engine as _};
use neon::prelude::*;

use ed25519_dalek::{PublicKey, Signature, Verifier};

fn ed25519_verify(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let signature_b64 = cx.argument::<JsString>(0)?.value(&mut cx);
    let hash_b64 = cx.argument::<JsString>(1)?.value(&mut cx);
    let signer_b64 = cx.argument::<JsString>(2)?.value(&mut cx);

    // Decode the base64 strings
    let decoded_signature = match GP::STANDARD.decode(signature_b64) {
        Ok(result) => result,
        Err(_) => return Ok(cx.number(0)),
    };

    let decoded_message = match GP::STANDARD.decode(hash_b64) {
        Ok(result) => result,
        Err(_) => return Ok(cx.number(0)),
    };

    let decoded_public_key = match GP::STANDARD.decode(signer_b64) {
        Ok(result) => result,
        Err(_) => return Ok(cx.number(0)),
    };

    // Convert to the types expected by ed25519_dalek
    let signature = match Signature::from_bytes(&decoded_signature) {
        Ok(result) => result,
        Err(_) => return Ok(cx.number(0)),
    };
    let public_key = match PublicKey::from_bytes(&decoded_public_key) {
        Ok(result) => result,
        Err(_) => return Ok(cx.number(0)),
    };

    // Verify the signature
    match public_key.verify(&decoded_message, &signature) {
        Ok(_) => Ok(cx.number(1)),
        Err(_) => Ok(cx.number(0)),
    }
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("ed25519_verify", ed25519_verify)?;
    Ok(())
}
