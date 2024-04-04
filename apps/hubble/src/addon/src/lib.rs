use crate::{
    store::{CastStore, StoreEventHandler, UsernameProofStore, VerificationStore},
    trie::merkle_trie::MerkleTrie,
};
use db::RocksDB;
use ed25519_dalek::{Signature, Signer, SigningKey, VerifyingKey, EXPANDED_SECRET_KEY_LENGTH};
use neon::{prelude::*, types::buffer::TypedArray};
use std::{convert::TryInto, sync::Mutex};
use store::{LinkStore, ReactionStore, Store, UserDataStore};
use threadpool::ThreadPool;

mod db;
mod logger;
mod statsd;
mod store;
mod trie;

mod protos {
    include!(concat!("./", "/proto/protobufs.rs"));
}

fn ed25519_sign_message_hash(mut cx: FunctionContext) -> JsResult<JsBuffer> {
    let hash_arg = cx.argument::<JsBuffer>(0)?;
    let signing_key_arg = cx.argument::<JsBuffer>(1)?;

    let signing_key_bytes: [u8; EXPANDED_SECRET_KEY_LENGTH] =
        match signing_key_arg.as_slice(&cx).try_into() {
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

fn js_blake3_20(mut cx: FunctionContext) -> JsResult<JsBuffer> {
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
    cx.export_function("blake3_20", js_blake3_20)?;

    cx.export_function("createStatsdClient", statsd::js_create_statsd_client)?;

    cx.export_function("flushLogBuffer", logger::js_flush_log_buffer)?;
    cx.export_function("setLogLevel", logger::js_set_log_level)?;

    cx.export_function(
        "createStoreEventHandler",
        StoreEventHandler::js_create_store_event_handler,
    )?;
    cx.export_function("getNextEventId", StoreEventHandler::js_get_next_event_id)?;

    cx.export_function("createDb", RocksDB::js_create_db)?;
    cx.export_function("dbOpen", RocksDB::js_open)?;
    cx.export_function("dbApproximateSize", RocksDB::js_approximate_size)?;
    cx.export_function("dbClear", RocksDB::js_clear)?;
    cx.export_function("dbClose", RocksDB::js_close)?;
    cx.export_function("dbDestroy", RocksDB::js_destroy)?;
    cx.export_function("dbLocation", RocksDB::js_location)?;
    cx.export_function("dbGet", RocksDB::js_get)?;
    cx.export_function("dbGetMany", RocksDB::js_get_many)?;
    cx.export_function("dbPut", RocksDB::js_put)?;
    cx.export_function("dbDel", RocksDB::js_del)?;
    cx.export_function("dbCommit", RocksDB::js_commit_transaction)?;
    cx.export_function("dbSnapshotBackup", RocksDB::js_snapshot_backup)?;
    cx.export_function("dbCountKeysAtPrefix", RocksDB::js_count_keys_at_prefix)?;
    cx.export_function(
        "dbForEachIteratorByPrefix",
        RocksDB::js_for_each_iterator_by_prefix,
    )?;
    cx.export_function(
        "dbForEachIteratorByOpts",
        RocksDB::js_for_each_iterator_by_js_opts,
    )?;

    // Message
    cx.export_function("getMessage", Store::js_get_message)?;

    // Generic methods that can accept any store
    cx.export_function("merge", Store::js_merge)?;
    cx.export_function("revoke", Store::js_revoke)?;
    cx.export_function("pruneMessages", Store::js_prune_messages)?;
    cx.export_function("getAllMessagesByFid", Store::js_get_all_messages_by_fid)?;

    // LinkStore methods
    cx.export_function("createLinkStore", LinkStore::create_link_store)?;
    cx.export_function("getLinkAdd", LinkStore::js_get_link_add)?;
    cx.export_function("getLinkRemove", LinkStore::js_get_link_remove)?;
    cx.export_function("getLinksByTarget", LinkStore::js_get_links_by_target)?;
    cx.export_function("getLinkAddsByFid", LinkStore::js_get_link_adds_by_fid)?;
    cx.export_function("getLinkRemovesByFid", LinkStore::js_get_link_removes_by_fid)?;
    cx.export_function(
        "getAllLinkMessagesByFid",
        LinkStore::js_get_all_link_messages_by_fid,
    )?;

    // ReactionStore methods
    cx.export_function("createReactionStore", ReactionStore::create_reaction_store)?;
    cx.export_function("getReactionAdd", ReactionStore::js_get_reaction_add)?;
    cx.export_function("getReactionRemove", ReactionStore::js_get_reaction_remove)?;
    cx.export_function(
        "getReactionAddsByFid",
        ReactionStore::js_get_reaction_adds_by_fid,
    )?;
    cx.export_function(
        "getReactionRemovesByFid",
        ReactionStore::js_get_reaction_removes_by_fid,
    )?;
    cx.export_function(
        "getReactionsByTarget",
        ReactionStore::js_get_reactions_by_target,
    )?;

    // CastStore methods
    cx.export_function("createCastStore", CastStore::js_create_cast_store)?;
    cx.export_function("getCastAdd", CastStore::js_get_cast_add)?;
    cx.export_function("getCastRemove", CastStore::js_get_cast_remove)?;
    cx.export_function("getCastAddsByFid", CastStore::js_get_cast_adds_by_fid)?;
    cx.export_function("getCastRemovesByFid", CastStore::js_get_cast_removes_by_fid)?;
    cx.export_function("getCastsByParent", CastStore::js_get_casts_by_parent)?;
    cx.export_function("getCastsByMention", CastStore::js_get_casts_by_mention)?;

    // UserDataStore methods
    cx.export_function("createUserDataStore", UserDataStore::create_userdata_store)?;
    cx.export_function("getUserDataAdd", UserDataStore::js_get_userdata_add)?;
    cx.export_function(
        "getUserDataAddsByFid",
        UserDataStore::js_get_user_data_adds_by_fid,
    )?;
    cx.export_function("getUserNameProof", UserDataStore::js_get_username_proof)?;
    cx.export_function(
        "getUserNameProofByFid",
        UserDataStore::js_get_username_proof_by_fid,
    )?;
    cx.export_function("mergeUserNameProof", UserDataStore::js_merge_username_proof)?;

    // VerificationStore methods
    cx.export_function(
        "createVerificationStore",
        VerificationStore::create_verification_store,
    )?;
    cx.export_function(
        "getVerificationAdd",
        VerificationStore::js_get_verification_add,
    )?;
    cx.export_function(
        "getVerificationAddsByFid",
        VerificationStore::js_get_verification_adds_by_fid,
    )?;
    cx.export_function(
        "getVerificationRemove",
        VerificationStore::js_get_verification_remove,
    )?;
    cx.export_function(
        "getVerificationRemovesByFid",
        VerificationStore::js_get_verification_removes_by_fid,
    )?;
    cx.export_function(
        "migrateVerifications",
        VerificationStore::js_migrate_verifications,
    )?;

    // Username Proof methods
    cx.export_function(
        "createUsernameProofStore",
        UsernameProofStore::create_username_proof_store,
    )?;
    cx.export_function(
        "getUsernameProof",
        UsernameProofStore::js_get_username_proof,
    )?;
    cx.export_function(
        "getUsernameProofsByFid",
        UsernameProofStore::js_get_username_proofs_by_fid,
    )?;
    cx.export_function(
        "getUsernameProofByFidAndName",
        UsernameProofStore::js_get_username_proof_by_fid_and_name,
    )?;

    // Register Merkle Trie methods
    MerkleTrie::register_js_methods(&mut cx)?;

    Ok(())
}

// Threadpool for use in the store
use once_cell::sync::Lazy;
pub static THREAD_POOL: Lazy<Mutex<ThreadPool>> = Lazy::new(|| Mutex::new(ThreadPool::new(4)));
