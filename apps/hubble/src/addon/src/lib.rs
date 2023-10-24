use std::convert::TryInto;

use ed25519_dalek::{Signature, Signer, SigningKey, EXPANDED_SECRET_KEY_LENGTH, VerifyingKey};
use neon::{prelude::*, types::buffer::TypedArray};

fn ed25519_sign_message_hash(mut cx: FunctionContext) -> JsResult<JsBuffer> {
  let hash_arg = cx.argument::<JsBuffer>(0)?;
  let signing_key_arg = cx.argument::<JsBuffer>(1)?;

  let signing_key_bytes: [u8; EXPANDED_SECRET_KEY_LENGTH] = match signing_key_arg.as_slice(&cx).try_into() {
      Ok(bytes) => bytes,
      Err(_) => return cx.throw_error("could not decode signing key"),
  };

  let signer = match SigningKey::from_keypair_bytes(&signing_key_bytes) {
    Ok(signer) => signer,
    Err(_) => return cx.throw_error("could not construct signing key"),
  };

  let signature = signer.sign(&hash_arg.as_slice(&cx)).to_bytes();
  let mut buffer = cx.buffer(signature.len())?;
  let target = buffer.as_mut_slice(&mut cx);
  target.copy_from_slice(&signature);
  Ok(buffer)
}

fn ed25519_verify(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let signature_arg = cx.argument::<JsBuffer>(0)?;
    let hash_arg = cx.argument::<JsBuffer>(1)?;
    let signer_arg = cx.argument::<JsBuffer>(2)?;

    // Convert to the types expected by ed25519_dalek 2.0
    let sig_bytes: [u8; 64] = match signature_arg.as_slice(&cx).try_into() {
        Ok(bytes) => bytes,
        Err(_) => return Ok(cx.number(0)),
    };
    let signature = Signature::from_bytes(&sig_bytes);

    let signer_bytes: [u8; 32] = match signer_arg.as_slice(&cx).try_into() {
        Ok(bytes) => bytes,
        Err(_) => return Ok(cx.number(0)),
    };
    let public_key = match VerifyingKey::from_bytes(&signer_bytes) {
        Ok(pk) => pk,
        Err(_) => return Ok(cx.number(0)),
    };

    // Verify the signature
    match public_key.verify_strict(&hash_arg.as_slice(&cx), &signature) {
        Ok(_) => Ok(cx.number(1)),
        Err(_) => Ok(cx.number(0)),
    }
}

fn blake3_20(mut cx: FunctionContext) -> JsResult<JsBuffer> {
    let input = cx.argument::<JsBuffer>(0)?;
    let mut hasher = blake3::Hasher::new();
    hasher.update(&input.as_slice(&cx));

    // Create a 20 byte buffer to hold the output
    let mut output = cx.buffer(20)?;

    // Fill the buffer with the output
    hasher.finalize_xof().fill(output.as_mut_slice(&mut cx));

    Ok(output)
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("ed25519_signMessageHash", ed25519_sign_message_hash)?;
    cx.export_function("ed25519_verify", ed25519_verify)?;
    cx.export_function("blake3_20", blake3_20)?;
    Ok(())
}
