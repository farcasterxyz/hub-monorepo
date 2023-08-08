use ed25519_dalek::{PublicKey, Signature, Verifier};
use neon::{prelude::*, types::buffer::TypedArray};

fn ed25519_verify(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let signature_arg = cx.argument::<JsBuffer>(0)?;
    let hash_arg = cx.argument::<JsBuffer>(1)?;
    let signer_arg = cx.argument::<JsBuffer>(2)?;

    // Convert to the types expected by ed25519_dalek
    let signature = match Signature::from_bytes(&signature_arg.as_slice(&cx)) {
        Ok(result) => result,
        Err(_) => return Ok(cx.number(0)),
    };
    let public_key = match PublicKey::from_bytes(&signer_arg.as_slice(&cx)) {
        Ok(result) => result,
        Err(_) => return Ok(cx.number(0)),
    };

    // Verify the signature
    match public_key.verify(&hash_arg.as_slice(&cx), &signature) {
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
    cx.export_function("ed25519_verify", ed25519_verify)?;
    cx.export_function("blake3_20", blake3_20)?;
    Ok(())
}
