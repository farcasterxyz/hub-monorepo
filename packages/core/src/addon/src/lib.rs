use neon::{prelude::*, types::buffer::TypedArray};
use prost::Message;
use snapchain::core::validations::cast::{
    validate_cast_add_body, validate_cast_remove_body, validate_embed,
};
use snapchain::core::validations::error::ValidationError;
use snapchain::core::validations::link::{
    validate_link_body, validate_link_compact_state_body, validate_link_type,
};
use snapchain::core::validations::message::{
    validate_ens_name, validate_fname, validate_github_username, validate_message,
    validate_message_type, validate_twitter_username, validate_user_data_add_body,
    validate_user_location,
};
use snapchain::core::validations::reaction::{
    validate_network, validate_reaction_body, validate_reaction_type,
};
use snapchain::core::validations::verification::{validate_add_address, validate_remove_address};
use snapchain::proto::{CastAddBody, CastRemoveBody, Embed};
use snapchain::proto::{
    FarcasterNetwork, LinkBody, LinkCompactStateBody, ReactionBody, UserDataBody,
    VerificationAddAddressBody, VerificationRemoveBody,
};
use snapchain::version::version::EngineVersion;

fn validation_result_to_js_object(
    mut cx: FunctionContext,
    validation_error: Result<(), ValidationError>,
) -> JsResult<JsObject> {
    let obj = cx.empty_object();
    match validation_error {
        Ok(()) => {
            let ok = cx.boolean(true);
            obj.set(&mut cx, "ok", ok)?;
        }
        Err(e) => {
            let ok = cx.boolean(false);
            let error = cx.string(e.to_string());
            obj.set(&mut cx, "ok", ok)?;
            obj.set(&mut cx, "error", error)?;
        }
    }
    return Ok(obj);
}

fn js_validate_cast_add_body(mut cx: FunctionContext) -> JsResult<JsObject> {
    let cast_add_body_arg = cx.argument::<JsBuffer>(0)?;
    let allow_embeds_deprecated = cx.argument::<JsBoolean>(1)?.value(&mut cx);

    let bytes = cast_add_body_arg.as_slice(&cx);
    let cast_add_body = match CastAddBody::decode(bytes) {
        Ok(body) => body,
        Err(_) => return cx.throw_error("Failed to decode CastAddBody"),
    };

    validation_result_to_js_object(
        cx,
        validate_cast_add_body(&cast_add_body, allow_embeds_deprecated, true),
    )
}

fn js_validate_cast_remove_body(mut cx: FunctionContext) -> JsResult<JsObject> {
    let cast_remove_body_arg = cx.argument::<JsBuffer>(0)?;

    let bytes = cast_remove_body_arg.as_slice(&cx);
    let cast_remove_body = match CastRemoveBody::decode(bytes) {
        Ok(body) => body,
        Err(_) => return cx.throw_error("Failed to decode CastRemoveBody"),
    };

    validation_result_to_js_object(cx, validate_cast_remove_body(&cast_remove_body))
}

fn js_validate_embed(mut cx: FunctionContext) -> JsResult<JsObject> {
    let embed_arg = cx.argument::<JsBuffer>(0)?;

    let bytes = embed_arg.as_slice(&cx);
    let embed = match Embed::decode(bytes) {
        Ok(e) => e,
        Err(_) => return cx.throw_error("Failed to decode Embed"),
    };

    validation_result_to_js_object(cx, validate_embed(&embed))
}

fn js_validate_link_type(mut cx: FunctionContext) -> JsResult<JsObject> {
    let type_str = cx.argument::<JsString>(0)?.value(&mut cx);

    validation_result_to_js_object(cx, validate_link_type(&type_str))
}

fn js_validate_link_compact_state_body(mut cx: FunctionContext) -> JsResult<JsObject> {
    let body_buffer = cx.argument::<JsBuffer>(0)?;

    let bytes = body_buffer.as_slice(&cx);
    let link_compact_state_body = match LinkCompactStateBody::decode(bytes) {
        Ok(body) => body,
        Err(_) => return cx.throw_error("Failed to decode LinkCompactStateBody"),
    };

    validation_result_to_js_object(
        cx,
        validate_link_compact_state_body(&link_compact_state_body),
    )
}

fn js_validate_link_body(mut cx: FunctionContext) -> JsResult<JsObject> {
    let body_buffer = cx.argument::<JsBuffer>(0)?;

    let bytes = body_buffer.as_slice(&cx);
    let link_body = match LinkBody::decode(bytes) {
        Ok(body) => body,
        Err(_) => return cx.throw_error("Failed to decode LinkBody"),
    };

    validation_result_to_js_object(cx, validate_link_body(&link_body))
}

fn js_validate_reaction_type(mut cx: FunctionContext) -> JsResult<JsObject> {
    let type_num = cx.argument::<JsNumber>(0)?.value(&mut cx) as i32;

    validation_result_to_js_object(cx, validate_reaction_type(type_num))
}

fn js_validate_network(mut cx: FunctionContext) -> JsResult<JsObject> {
    let network = cx.argument::<JsNumber>(0)?.value(&mut cx) as i32;

    validation_result_to_js_object(cx, validate_network(network))
}

fn js_validate_reaction_body(mut cx: FunctionContext) -> JsResult<JsObject> {
    let body_buffer = cx.argument::<JsBuffer>(0)?;

    let bytes = body_buffer.as_slice(&cx);
    let reaction_body = match ReactionBody::decode(bytes) {
        Ok(body) => body,
        Err(_) => return cx.throw_error("Failed to decode ReactionBody"),
    };

    validation_result_to_js_object(cx, validate_reaction_body(&reaction_body))
}

fn js_validate_message_type(mut cx: FunctionContext) -> JsResult<JsObject> {
    let type_num = cx.argument::<JsNumber>(0)?.value(&mut cx) as i32;

    validation_result_to_js_object(cx, validate_message_type(type_num))
}

fn js_validate_message(mut cx: FunctionContext) -> JsResult<JsObject> {
    let message_buffer = cx.argument::<JsBuffer>(0)?;
    let network_num = cx.argument::<JsNumber>(1)?.value(&mut cx) as i32;

    let network = match FarcasterNetwork::try_from(network_num) {
        Ok(n) => n,
        Err(_) => return cx.throw_error("Invalid Farcaster network"),
    };

    let bytes = message_buffer.as_slice(&cx);
    let message = match Message::decode(bytes) {
        Ok(msg) => msg,
        Err(_) => return cx.throw_error("Failed to decode Message"),
    };

    validation_result_to_js_object(
        cx,
        validate_message(&message, network, true, EngineVersion::latest()),
    )
}

fn js_validate_user_data_add_body(mut cx: FunctionContext) -> JsResult<JsObject> {
    let body_buffer = cx.argument::<JsBuffer>(0)?;

    let bytes = body_buffer.as_slice(&cx);
    let body = match UserDataBody::decode(bytes) {
        Ok(b) => b,
        Err(_) => return cx.throw_error("Failed to decode UserDataBody"),
    };

    validation_result_to_js_object(
        cx,
        validate_user_data_add_body(&body, true, EngineVersion::latest()),
    )
}

fn js_validate_fname(mut cx: FunctionContext) -> JsResult<JsObject> {
    let fname = cx.argument::<JsString>(0)?.value(&mut cx);

    validation_result_to_js_object(cx, validate_fname(&fname))
}

fn js_validate_ens_name(mut cx: FunctionContext) -> JsResult<JsObject> {
    let ens_name = cx.argument::<JsString>(0)?.value(&mut cx);

    validation_result_to_js_object(cx, validate_ens_name(&ens_name))
}

fn js_validate_twitter_username(mut cx: FunctionContext) -> JsResult<JsObject> {
    let username = cx.argument::<JsString>(0)?.value(&mut cx);

    validation_result_to_js_object(cx, validate_twitter_username(&username))
}

fn js_validate_github_username(mut cx: FunctionContext) -> JsResult<JsObject> {
    let username = cx.argument::<JsString>(0)?.value(&mut cx);

    validation_result_to_js_object(cx, validate_github_username(&username))
}

fn js_validate_user_location(mut cx: FunctionContext) -> JsResult<JsObject> {
    let location = cx.argument::<JsString>(0)?.value(&mut cx);

    validation_result_to_js_object(cx, validate_user_location(&location))
}

fn js_validate_add_address(mut cx: FunctionContext) -> JsResult<JsObject> {
    let body_buffer = cx.argument::<JsBuffer>(0)?;
    let fid = cx.argument::<JsNumber>(1)?.value(&mut cx) as u64;
    let network_num = cx.argument::<JsNumber>(2)?.value(&mut cx) as i32;

    let network = match FarcasterNetwork::try_from(network_num) {
        Ok(n) => n,
        Err(_) => return cx.throw_error("Invalid Farcaster network"),
    };

    let bytes = body_buffer.as_slice(&cx);
    let body = match VerificationAddAddressBody::decode(bytes) {
        Ok(b) => b,
        Err(_) => return cx.throw_error("Failed to decode VerificationAddAddressBody"),
    };

    validation_result_to_js_object(cx, validate_add_address(&body, fid, network))
}

fn js_validate_remove_address(mut cx: FunctionContext) -> JsResult<JsObject> {
    let body_buffer = cx.argument::<JsBuffer>(0)?;

    let bytes = body_buffer.as_slice(&cx);
    let body = match VerificationRemoveBody::decode(bytes) {
        Ok(b) => b,
        Err(_) => return cx.throw_error("Failed to decode VerificationRemoveBody"),
    };

    validation_result_to_js_object(cx, validate_remove_address(&body))
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("validateCastAddBody", js_validate_cast_add_body)?;
    cx.export_function("validateCastRemoveBody", js_validate_cast_remove_body)?;
    cx.export_function("validateEmbed", js_validate_embed)?;

    cx.export_function("validateLinkType", js_validate_link_type)?;
    cx.export_function(
        "validateLinkCompactStateBody",
        js_validate_link_compact_state_body,
    )?;
    cx.export_function("validateLinkBody", js_validate_link_body)?;

    cx.export_function("validateNetwork", js_validate_network)?;
    cx.export_function("validateReactionBody", js_validate_reaction_body)?;
    cx.export_function("validateReactionType", js_validate_reaction_type)?;

    cx.export_function("validateMessageType", js_validate_message_type)?;
    cx.export_function("validateMessage", js_validate_message)?;
    cx.export_function("validateUserDataAddBody", js_validate_user_data_add_body)?;
    cx.export_function("validateFname", js_validate_fname)?;
    cx.export_function("validateEnsName", js_validate_ens_name)?;
    cx.export_function("validateTwitterUsername", js_validate_twitter_username)?;
    cx.export_function("validateGithubUsername", js_validate_github_username)?;
    cx.export_function("validateUserLocation", js_validate_user_location)?;

    cx.export_function("validateAddAddress", js_validate_add_address)?;
    cx.export_function("validateRemoveAddress", js_validate_remove_address)?;
    Ok(())
}
