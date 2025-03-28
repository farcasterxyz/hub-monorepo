use neon::{prelude::*, types::buffer::TypedArray};
use prost::{DecodeError, EncodeError, Message};
use snapchain::core::validations::cast::{
    validate_cast_add_body, validate_cast_remove_body, validate_embed, validate_parent,
};
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
use snapchain::proto::casts_by_parent_request::Parent;
use snapchain::proto::{
    self, FarcasterNetwork, LinkBody, LinkCompactStateBody, ReactionBody, UserDataBody,
    VerificationAddAddressBody, VerificationRemoveBody,
};
use snapchain::proto::{embed, CastAddBody, CastRemoveBody, CastType, Embed};

fn js_validate_cast_add_body(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let cast_add_body_arg = cx.argument::<JsBuffer>(0)?;
    let allow_embeds_deprecated = cx.argument::<JsBoolean>(1)?.value(&mut cx);

    let bytes = cast_add_body_arg.as_slice(&cx);
    let cast_add_body = match CastAddBody::decode(bytes) {
        Ok(body) => body,
        Err(_) => return cx.throw_error("Failed to decode CastAddBody"),
    };

    match validate_cast_add_body(&cast_add_body, allow_embeds_deprecated) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(e) => Ok(cx.boolean(false)),
    }
}

fn js_validate_cast_remove_body(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let cast_remove_body_arg = cx.argument::<JsBuffer>(0)?;

    let bytes = cast_remove_body_arg.as_slice(&cx);
    let cast_remove_body = match CastRemoveBody::decode(bytes) {
        Ok(body) => body,
        Err(_) => return cx.throw_error("Failed to decode CastRemoveBody"),
    };

    match validate_cast_remove_body(&cast_remove_body) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(e) => Ok(cx.boolean(false)),
    }
}

fn js_validate_embed(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let embed_arg = cx.argument::<JsBuffer>(0)?;

    let bytes = embed_arg.as_slice(&cx);
    let embed = match Embed::decode(bytes) {
        Ok(e) => e,
        Err(_) => return cx.throw_error("Failed to decode Embed"),
    };

    match validate_embed(&embed) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(e) => Ok(cx.boolean(false)),
    }
}

fn js_validate_link_type(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let type_str = cx.argument::<JsString>(0)?.value(&mut cx);

    match validate_link_type(&type_str) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_link_compact_state_body(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let body_buffer = cx.argument::<JsBuffer>(0)?;

    let bytes = body_buffer.as_slice(&cx);
    let link_compact_state_body = match LinkCompactStateBody::decode(bytes) {
        Ok(body) => body,
        Err(_) => return cx.throw_error("Failed to decode LinkCompactStateBody"),
    };

    match validate_link_compact_state_body(&link_compact_state_body) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_link_body(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let body_buffer = cx.argument::<JsBuffer>(0)?;

    let bytes = body_buffer.as_slice(&cx);
    let link_body = match LinkBody::decode(bytes) {
        Ok(body) => body,
        Err(_) => return cx.throw_error("Failed to decode LinkBody"),
    };

    match validate_link_body(&link_body) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_reaction_type(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let type_num = cx.argument::<JsNumber>(0)?.value(&mut cx) as i32;

    match validate_reaction_type(type_num) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_network(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let network = cx.argument::<JsNumber>(0)?.value(&mut cx) as i32;

    match validate_network(network) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_reaction_body(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let body_buffer = cx.argument::<JsBuffer>(0)?;

    let bytes = body_buffer.as_slice(&cx);
    let reaction_body = match ReactionBody::decode(bytes) {
        Ok(body) => body,
        Err(_) => return cx.throw_error("Failed to decode ReactionBody"),
    };

    match validate_reaction_body(&reaction_body) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_message_type(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let type_num = cx.argument::<JsNumber>(0)?.value(&mut cx) as i32;

    match validate_message_type(type_num) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_message(mut cx: FunctionContext) -> JsResult<JsBoolean> {
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

    match validate_message(&message, network) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_user_data_add_body(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let body_buffer = cx.argument::<JsBuffer>(0)?;

    let bytes = body_buffer.as_slice(&cx);
    let body = match UserDataBody::decode(bytes) {
        Ok(b) => b,
        Err(_) => return cx.throw_error("Failed to decode UserDataBody"),
    };

    match validate_user_data_add_body(&body) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_fname(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let fname = cx.argument::<JsString>(0)?.value(&mut cx);

    match validate_fname(&fname) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_ens_name(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let ens_name = cx.argument::<JsString>(0)?.value(&mut cx);

    match validate_ens_name(&ens_name) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_twitter_username(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let username = cx.argument::<JsString>(0)?.value(&mut cx);

    match validate_twitter_username(&username) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_github_username(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let username = cx.argument::<JsString>(0)?.value(&mut cx);

    match validate_github_username(&username) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_user_location(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let location = cx.argument::<JsString>(0)?.value(&mut cx);

    match validate_user_location(&location) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_add_address(mut cx: FunctionContext) -> JsResult<JsBoolean> {
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

    match validate_add_address(&body, fid, network) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
}

fn js_validate_remove_address(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let body_buffer = cx.argument::<JsBuffer>(0)?;

    let bytes = body_buffer.as_slice(&cx);
    let body = match VerificationRemoveBody::decode(bytes) {
        Ok(b) => b,
        Err(_) => return cx.throw_error("Failed to decode VerificationRemoveBody"),
    };

    match validate_remove_address(&body) {
        Ok(()) => Ok(cx.boolean(true)),
        Err(_) => Ok(cx.boolean(false)),
    }
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
