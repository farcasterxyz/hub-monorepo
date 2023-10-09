import { UserDataAddMessage } from "@farcaster/hub-nodejs";
import { DBTransaction, execute } from "../db.js";
import { farcasterTimeToDate } from "../util.js";

export const processUserDataAdd = async (message: UserDataAddMessage, trx: DBTransaction) => {
  const now = new Date();

  await execute(
    trx
      .insertInto("userData")
      .values({
        timestamp: farcasterTimeToDate(message.data.timestamp),
        fid: message.data.fid,
        hash: message.hash,
        type: message.data.userDataBody.type,
        value: message.data.userDataBody.value,
      })
      .onConflict((oc) =>
        oc
          .columns(["fid", "type"])
          .doUpdateSet(({ ref }) => ({
            hash: ref("excluded.hash"),
            timestamp: ref("excluded.timestamp"),
            value: ref("excluded.value"),
            updatedAt: now,
          }))
          .where(({ or, eb, ref }) =>
            // Only update if a value has actually changed
            or([
              eb("excluded.hash", "!=", ref("userData.hash")),
              eb("excluded.timestamp", "!=", ref("userData.timestamp")),
              eb("excluded.value", "!=", ref("userData.value")),
              eb("excluded.updatedAt", "!=", ref("userData.updatedAt")),
            ]),
          ),
      ),
  );
};
