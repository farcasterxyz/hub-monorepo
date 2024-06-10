import { UserNameProof, UsernameProofMessage, bytesToUtf8String } from "@farcaster/hub-nodejs";
import { DBTransaction } from "../db.js";
import { StoreMessageOperation, farcasterTimeToDate } from "../util.js";

export const processUserNameProofMessage = async (
  message: UsernameProofMessage,
  operation: StoreMessageOperation,
  trx: DBTransaction,
) => {
  const proof = message.data.usernameProofBody;
  if (operation === "merge") {
    await processUserNameProofAdd(proof, trx);
  } else {
    await processUserNameProofRemove(proof, trx);
  }
};

export const processUserNameProofAdd = async (proof: UserNameProof, trx: DBTransaction) => {
  const username = bytesToUtf8String(proof.name)._unsafeUnwrap();
  const timestamp = farcasterTimeToDate(proof.timestamp);

  // A removal can also be represented as a transfer to FID 0
  if (proof.fid === 0) {
    return processUserNameProofRemove(proof, trx);
  }

  await trx
    .insertInto("usernameProofs")
    .values({
      timestamp,
      fid: proof.fid,
      type: proof.type,
      username,
      signature: proof.signature,
      owner: proof.owner,
    })
    .onConflict((oc) =>
      oc
        .columns(["username", "timestamp"])
        .doUpdateSet({ owner: proof.owner, fid: proof.fid, deletedAt: null, updatedAt: new Date() }),
    )
    .execute();

  await trx.deleteFrom("fnames").where("username", "=", username).execute();

  await trx
    .insertInto("fnames")
    .values({
      registeredAt: timestamp,
      fid: proof.fid,
      type: proof.type,
      username,
      deletedAt: proof.fid === 0 ? timestamp : null, // Sending to FID 0 is treated as delete
    })
    .onConflict((oc) => oc.column("fid").doUpdateSet({ username, updatedAt: new Date() }))
    .execute();
};

export const processUserNameProofRemove = async (proof: UserNameProof, trx: DBTransaction) => {
  const username = bytesToUtf8String(proof.name)._unsafeUnwrap();
  const now = new Date();

  await trx
    .deleteFrom("usernameProofs")
    .where("username", "=", username)
    .where("timestamp", "=", farcasterTimeToDate(proof.timestamp))
    .where("fid", "=", proof.fid)
    .execute();

  await trx.deleteFrom("fnames").where("username", "=", username).where("fid", "=", proof.fid).execute();
};
