import {
  type HubRpcClient,
  type UserNameProof,
  UserNameType,
  bytesToHexString,
  fromFarcasterTime,
} from "@farcaster/hub-nodejs";
import { type DB } from "./db";
import { Logger } from "pino";
import { ok, err, Result } from "neverthrow";

export class UsernameProofReconciliation {
  private readonly hubClient: HubRpcClient;
  private readonly db: DB;
  private readonly log: Logger;

  constructor(hubClient: HubRpcClient, db: DB, log: Logger) {
    this.hubClient = hubClient;
    this.db = db;
    this.log = log;
  }

  async reconcileUsernameProofsForFid(
    fid: number,
    onHubProof: (proof: UserNameProof, missingInDb: boolean) => Promise<void>,
    onDbProof?: (proof: UserNameProof, missingInHub: boolean) => Promise<void>,
    startTimestamp?: number,
    stopTimestamp?: number,
    types?: UserNameType[],
  ) {
    let startDate: Date | undefined;
    if (startTimestamp) {
      const startUnixTimestampResult = fromFarcasterTime(startTimestamp);
      if (startUnixTimestampResult.isErr()) {
        this.log.error({ fid, types, startTimestamp, stopTimestamp }, "Invalid time range provided to reconciliation");
        return;
      }

      startDate = new Date(startUnixTimestampResult.value);
    }

    let stopDate: Date | undefined;
    if (stopTimestamp) {
      const stopUnixTimestampResult = fromFarcasterTime(stopTimestamp);
      if (stopUnixTimestampResult.isErr()) {
        this.log.error({ fid, types, startTimestamp, stopTimestamp }, "Invalid time range provided to reconciliation");
        return;
      }

      stopDate = new Date(stopUnixTimestampResult.value);
    }

    for (const proofType of types ?? [
      UserNameType.USERNAME_TYPE_FNAME,
      UserNameType.USERNAME_TYPE_ENS_L1,
      UserNameType.USERNAME_TYPE_BASENAME,
    ]) {
      this.log.debug({ fid, proofType, startTimestamp, stopTimestamp }, "Reconciling username proofs for FID");
      await this.reconcileUsernameProofsOfTypeForFid(fid, proofType, onHubProof, onDbProof, startDate, stopDate);
    }
  }

  async reconcileUsernameProofsOfTypeForFid(
    fid: number,
    proofType: UserNameType,
    onHubProof: (proof: UserNameProof, missingInDb: boolean) => Promise<void>,
    onDbProof?: (proof: UserNameProof, missingInHub: boolean) => Promise<void>,
    startDate?: Date,
    stopDate?: Date,
  ): Promise<void> {
    const hubProofsByKey = new Map<string, UserNameProof>();

    // First, reconcile proofs that are in the hub but not in the database
    for await (const proofs of this.allHubUsernameProofsOfTypeForFid(fid, proofType, startDate, stopDate)) {
      const proofKeys = proofs.map((proof: UserNameProof) => this.getProofKey(proof));

      if (proofKeys.length === 0) {
        this.log.debug(
          { fid, proofType, startDate: startDate?.toISOString(), stopDate: stopDate?.toISOString() },
          "No username proofs found in hub",
        );
        continue;
      }

      const dbProofs = await this.dbProofsMatchingHubProofs(fid, proofType, startDate, stopDate, proofs);
      if (dbProofs.isErr()) {
        throw dbProofs.error;
      }

      const dbProofsByKey = new Map<string, UserNameProof>();
      for (const proof of dbProofs.value) {
        const key = this.getProofKey(proof);
        dbProofsByKey.set(key, proof);
      }

      for (const proof of proofs) {
        const proofKey = this.getProofKey(proof);
        hubProofsByKey.set(proofKey, proof);

        const dbProof = dbProofsByKey.get(proofKey);
        await onHubProof(proof, dbProof === undefined);
      }
    }

    // Next, reconcile proofs that are in the database but not in the hub
    if (onDbProof) {
      const dbProofs = await this.allActiveDbProofsOfTypeForFid(fid, proofType, startDate, stopDate);
      if (dbProofs.isErr()) {
        this.log.error(
          { fid, proofType, startDate: startDate?.toISOString(), stopDate: stopDate?.toISOString() },
          "Invalid time range provided to reconciliation",
        );
        return;
      }

      for (const dbProof of dbProofs.value) {
        const key = this.getProofKey(dbProof);
        await onDbProof(dbProof, !hubProofsByKey.has(key));
      }
    }
  }

  private async getProofsFromHub(
    fid: number,
    proofType: UserNameType,
    startDate?: Date,
    stopDate?: Date,
  ): Promise<Result<UserNameProof[], Error>> {
    const result = await this.hubClient.getUserNameProofsByFid({ fid });
    if (result.isErr()) {
      return err(new Error(`Unable to get username proofs for FID ${fid}`, { cause: result.error }));
    }

    let proofs = result.value.proofs.filter((proof) => proof.type === proofType);

    if (startDate || stopDate) {
      proofs = proofs.filter((proof) => {
        if (startDate !== undefined && proof.timestamp * 1000 < startDate.getTime()) return false;
        if (stopDate !== undefined && proof.timestamp * 1000 > stopDate.getTime()) return false;
        return true;
      });
    }

    return ok(proofs);
  }

  private async getProofsFromDb(
    fid: number,
    proofType: UserNameType,
    startDate?: Date,
    stopDate?: Date,
    hubProofs?: UserNameProof[],
  ): Promise<Result<UserNameProof[], Error>> {
    try {
      let query = this.db
        .selectFrom("usernames")
        .select(["username", "fid", "proofTimestamp", "custodyAddress", "type"])
        .where("fid", "=", fid)
        .where("type", "=", proofType)
        .where("deletedAt", "is", null);

      if (startDate) {
        query = query.where("proofTimestamp", ">", startDate);
      }
      if (stopDate) {
        query = query.where("proofTimestamp", "<", stopDate);
      }

      if (hubProofs) {
        query = query.where(
          "username",
          "in",
          hubProofs.map((p) => bytesToHexString(p.name)._unsafeUnwrap()),
        );
      }

      const results = await query.execute();

      const proofs = results.map((row) => ({
        name: Buffer.from(row.username),
        type: row.type,
        fid: row.fid,
        timestamp: Math.floor(row.proofTimestamp.getTime() / 1000),
        signature: Buffer.from([]),
        owner: row.custodyAddress ? Buffer.from(row.custodyAddress) : Buffer.from([]),
      }));

      const filteredProofs = proofType !== undefined ? proofs.filter((p) => p.type === proofType) : proofs;
      return ok(filteredProofs);
    } catch (e) {
      return err(new Error(`Failed to get username proofs from DB for FID ${fid}`, { cause: e }));
    }
  }

  private async *allHubUsernameProofsOfTypeForFid(
    fid: number,
    proofType: UserNameType,
    startDate?: Date,
    stopDate?: Date,
  ): AsyncGenerator<UserNameProof[]> {
    const hubProofsResult = await this.getProofsFromHub(fid, proofType, startDate, stopDate);
    if (hubProofsResult.isErr()) {
      throw hubProofsResult.error;
    }

    // Filter proofs by timestamp if provided
    const filteredProofs = hubProofsResult.value.filter((proof: UserNameProof) => {
      if (startDate && proof.timestamp * 1000 < startDate.getTime()) return false;
      if (stopDate && proof.timestamp * 1000 > stopDate.getTime()) return false;
      return true;
    });

    yield filteredProofs;
  }

  private async allActiveDbProofsOfTypeForFid(fid: number, proofType: UserNameType, startDate?: Date, stopDate?: Date) {
    return this.getProofsFromDb(fid, proofType, startDate, stopDate);
  }

  private async dbProofsMatchingHubProofs(
    fid: number,
    proofType: UserNameType,
    startDate?: Date,
    stopDate?: Date,
    hubProofs?: UserNameProof[],
  ) {
    return this.getProofsFromDb(fid, proofType, startDate, stopDate, hubProofs);
  }

  private getProofKey(proof: UserNameProof): string {
    // Only include identifying fields (name, owner, fid, type) - not timestamp
    const nameHex = bytesToHexString(proof.name)._unsafeUnwrap();
    const ownerHex = bytesToHexString(proof.owner)._unsafeUnwrap();
    return `${nameHex}-${proof.fid}-${ownerHex}-${proof.type}`;
  }
}
