import { MessageType, VerificationAddAddressMessage, VerificationRemoveMessage } from "@farcaster/hub-nodejs";
import { Selectable, sql } from "kysely";
import { buildAddRemoveMessageProcessor } from "../messageProcessor.js";
import { VerificationRow, executeTakeFirst, executeTakeFirstOrThrow } from "../db.js";
import { bytesToHex, farcasterTimeToDate } from "../util.js";

const { processAdd: processAddEthereum, processRemove } = buildAddRemoveMessageProcessor<
  VerificationAddAddressMessage,
  VerificationRemoveMessage,
  Selectable<VerificationRow>
>({
  conflictRule: "last-write-wins",
  addMessageType: MessageType.VERIFICATION_ADD_ETH_ADDRESS,
  removeMessageType: MessageType.VERIFICATION_REMOVE,
  withConflictId(message) {
    const ethAddress =
      message.data.type === MessageType.VERIFICATION_ADD_ETH_ADDRESS
        ? message.data.verificationAddAddressBody.address
        : message.data.verificationRemoveBody.address;

    return ({ eb, and }) => {
      return and([eb(sql<string>`body ->> 'address'`, "=", bytesToHex(ethAddress)), eb("fid", "=", message.data.fid)]);
    };
  },
  async getDerivedRow(message, trx) {
    const ethAddress =
      message.data.type === MessageType.VERIFICATION_ADD_ETH_ADDRESS
        ? message.data.verificationAddAddressBody.address
        : message.data.verificationRemoveBody.address;

    return await executeTakeFirst(
      trx
        .selectFrom("verifications")
        .select(["deletedAt"])
        .where("fid", "=", message.data.fid)
        .where("signerAddress", "=", ethAddress),
    );
  },
  async deleteDerivedRow(message, trx) {
    const {
      data: { fid, verificationRemoveBody },
    } = message;

    return await executeTakeFirstOrThrow(
      trx
        .updateTable("verifications")
        .where("fid", "=", fid)
        .where("signerAddress", "=", verificationRemoveBody?.address)
        .set({ deletedAt: new Date() })
        .returningAll(),
    );
  },
  async mergeDerivedRow(message, deleted, trx) {
    const {
      data: { fid, verificationAddAddressBody: verificationAddBody },
    } = message;

    const timestamp = farcasterTimeToDate(message.data.timestamp);

    const updatedProps = {
      timestamp,
      hash: message.hash,
      signerAddress: verificationAddBody.address,
      blockHash: verificationAddBody.blockHash,
      signature: verificationAddBody.claimSignature,
    };

    // Upsert the verification, if it's shadowed by a remove, mark it as deleted
    return await executeTakeFirstOrThrow(
      trx
        .insertInto("verifications")
        .values({
          deletedAt: deleted ? new Date() : null,
          fid,
          ...updatedProps,
        })
        .onConflict((oc) =>
          oc.columns(["signerAddress", "fid"]).doUpdateSet({
            updatedAt: new Date(),
            deletedAt: deleted ? (eb) => eb.fn.coalesce("verifications.deletedAt", "excluded.deletedAt") : null,
            ...updatedProps,
          }),
        )
        .returningAll(),
    );
  },
  async onAdd({ data: verification, isCreate, trx }) {
    // No-op
  },
  async onRemove({ data: verification, trx }) {
    // No-op
  },
});

// TODO: implement processAdd support for Solana in separate PR
export { processAddEthereum as processVerificationAddEthAddress, processRemove as processVerificationRemove };
