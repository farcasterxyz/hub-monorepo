import { type HubRpcClient, type UserNameProof, UserNameType, bytesToHexString } from "@farcaster/hub-nodejs";
import { type DB } from "./db";
import { Logger } from "pino";

export class UsernameProofReconciliation {
  private readonly hubClient: HubRpcClient;
  private readonly db: DB;
  private readonly log: Logger;

  constructor(hubClient: HubRpcClient, db: DB, log: Logger) {
    this.hubClient = hubClient;
    this.db = db;
    this.log = log;
  }

  async reconcileProofsForFid(
    fid: number,
    onProof: (proof: UserNameProof, missingInDb: boolean) => Promise<void>,
    proofType?: UserNameType,
    startTimestamp?: number,
    stopTimestamp?: number,
  ): Promise<void> {
    // Get proofs from hub
    const hubProofs = await this.getProofsFromHub(fid, proofType, startTimestamp, stopTimestamp);
    const dbProofs = await this.getProofsFromDb(fid, proofType, startTimestamp, stopTimestamp);

    // Create maps for efficient lookup
    const hubProofsMap = new Map<string, UserNameProof>();
    for (const proof of hubProofs) {
      const key = this.getProofKey(proof);
      hubProofsMap.set(key, proof);
    }

    const dbProofsMap = new Map<string, UserNameProof>();
    for (const proof of dbProofs) {
      const key = this.getProofKey(proof);
      dbProofsMap.set(key, proof);
    }

    // Process proofs that exist in hub
    for (const [key, hubProof] of hubProofsMap) {
      const missingInDb = !dbProofsMap.has(key);
      await onProof(hubProof, missingInDb);
    }
  }

  private async getProofsFromHub(
    fid: number,
    proofType?: UserNameType,
    startTimestamp?: number,
    stopTimestamp?: number,
  ): Promise<UserNameProof[]> {
    const result = await this.hubClient.getUserNameProofsByFid({ fid });
    if (result.isErr()) {
      this.log.error({ err: result.error }, "Failed to get username proofs from hub");
      throw result.error;
    }

    let proofs = result.value.proofs;

    // Filter by type if specified
    if (proofType !== undefined) {
      proofs = proofs.filter((proof) => proof.type === proofType);
    }

    // Filter by timestamp if specified
    if (startTimestamp !== undefined) {
      proofs = proofs.filter((proof) => proof.timestamp >= startTimestamp);
    }
    if (stopTimestamp !== undefined) {
      proofs = proofs.filter((proof) => proof.timestamp <= stopTimestamp);
    }

    return proofs;
  }

  private async getProofsFromDb(
    fid: number,
    proofType?: UserNameType,
    startTimestamp?: number,
    stopTimestamp?: number,
  ): Promise<UserNameProof[]> {
    let query = this.db
      .selectFrom("usernames")
      .select(["name", "fid", "proofTimestamp", "custodyAddress"])
      .where("fid", "=", fid)
      .where("deletedAt", "is", null);

    if (startTimestamp !== undefined) {
      query = query.where("proofTimestamp", ">=", new Date(startTimestamp * 1000));
    }
    if (stopTimestamp !== undefined) {
      query = query.where("proofTimestamp", "<=", new Date(stopTimestamp * 1000));
    }

    const results = await query.execute();

    // Convert DB rows to UserNameProof objects
    return results.map((row) => ({
      name: Buffer.from(row.name),
      type: UserNameType.USERNAME_TYPE_FNAME, // Default to fname since type isn't stored in DB
      fid: row.fid,
      timestamp: Math.floor(row.proofTimestamp.getTime() / 1000),
      signature: Buffer.from([]), // We don't store these in the DB
      owner: row.custodyAddress ? Buffer.from(row.custodyAddress) : Buffer.from([]),
    }));
  }

  private getProofKey(proof: UserNameProof): string {
    // Create a unique key combining name and timestamp
    const nameHex = bytesToHexString(proof.name)._unsafeUnwrap();
    return `${nameHex}-${proof.timestamp}`;
  }
}
