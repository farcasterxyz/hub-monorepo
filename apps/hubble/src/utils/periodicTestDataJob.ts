import cron from "node-cron";
import {
  makeCastAdd,
  makeReactionAdd,
  NobleEd25519Signer,
  toFarcasterTime,
  getAuthMetadata,
  getInsecureHubRpcClient,
  FarcasterNetwork,
  ReactionType,
  CastAddBody,
  getAdminRpcClient,
  AdminRpcClient,
  Factories,
} from "@farcaster/hub-nodejs";
import { logger } from "../utils/logger.js";
import { ed25519 as ed } from "@noble/curves/ed25519";
import { faker } from "@faker-js/faker";
import Server from "../rpc/server.js";
import { Result } from "neverthrow";
import { ADMIN_SERVER_PORT } from "../rpc/adminServer.js";

const log = logger.child({
  component: "PeriodicTestDataJob",
});

type SchedulerStatus = "started" | "stopped";

const DEFAULT_PERIODIC_JOB_CRON = "*/30 * * * * *"; // Every 30 seconds

export type TestUser = {
  fid: number;
  mnemonic: string;
};

export class PeriodicTestDataJobScheduler {
  private _server: Server;
  private _cronTask?: cron.ScheduledTask;

  private _testDataUsers;
  private _userEd25519KeyPairs = new Map<number, NobleEd25519Signer>();

  constructor(_server: Server, _testDataUsers: TestUser[]) {
    this._server = _server;

    this._testDataUsers = _testDataUsers;
  }

  start(cronSchedule?: string) {
    this._cronTask = cron.schedule(cronSchedule ?? DEFAULT_PERIODIC_JOB_CRON, () => {
      return this.doJobs();
    });
  }

  stop() {
    if (this._cronTask) {
      return this._cronTask.stop();
    }
  }

  status(): SchedulerStatus {
    return this._cronTask ? "started" : "stopped";
  }

  async insertSignerAdds(adminClient: AdminRpcClient) {
    // Initialize the signer add messages for the test users
    for (const testUser of this._testDataUsers) {
      if (!testUser.mnemonic || !testUser.fid) {
        continue;
      }

      // Generate a new Ed25519 key pair which will become the Signer and store the private key securely
      const signerPrivateKey = ed.utils.randomPrivateKey();
      const ed25519Signer = new NobleEd25519Signer(signerPrivateKey);

      // Create a SignerAdd message that contains the public key of the signer
      const dataOptions = {
        fid: testUser.fid,
        network: FarcasterNetwork.TESTNET,
      };

      const signerAdd = await Factories.SignerOnChainEvent.build(
        { fid: testUser.fid },
        { transient: { signer: (await ed25519Signer.getSignerKey())._unsafeUnwrap() } },
      );

      const rpcUsers = this._server.auth;

      let user = "";
      let password = "";

      if (rpcUsers.size > 0) {
        user = rpcUsers.keys().next().value as string;
        password = rpcUsers.get(user)?.[0] as string;
      }

      const result = await adminClient.submitOnChainEvent(signerAdd, getAuthMetadata(user, password));
      if (result.isErr()) {
        log.error(
          { error: result.error, errMsg: result.error.message, dataOptions },
          "TestData: failed to submit SignerAdd message",
        );
      }

      this._userEd25519KeyPairs.set(testUser.fid, ed25519Signer);
    }
  }

  async doJobs() {
    log.info("starting periodic test data job");

    const client = getInsecureHubRpcClient(`127.0.0.1:${this._server.listenPort}`);
    const adminClient = await getAdminRpcClient(`127.0.0.1:${ADMIN_SERVER_PORT}`);

    if (this._userEd25519KeyPairs.size === 0) {
      await this.insertSignerAdds(adminClient);
    }

    const farcasterTimestamp = toFarcasterTime(Date.now())._unsafeUnwrap();
    const targetCastIds = [];

    const rpcUsers = this._server.auth;

    let rpcUsername = "";
    let rpcPassword = "";

    if (rpcUsers.size > 0) {
      rpcUsername = rpcUsers.keys().next().value as string;
      rpcPassword = rpcUsers.get(rpcUsername)?.[0] as string;
    }

    // Insert some casts
    for (const testUser of this._testDataUsers) {
      const dataOptions = {
        fid: testUser.fid,
        network: FarcasterNetwork.TESTNET,
        timestamp: farcasterTimestamp,
      };

      const signer = this._userEd25519KeyPairs.get(testUser.fid);
      if (signer) {
        const castAdd = await makeCastAdd(
          CastAddBody.create({
            text: faker.lorem.sentence(12),
            embeds: [{ url: "https://www.farcaster.xyz" }],
            mentions: [],
            mentionsPositions: [],
          }),
          dataOptions,
          signer,
        );

        const result = await client.submitMessage(castAdd._unsafeUnwrap(), getAuthMetadata(rpcUsername, rpcPassword));
        if (result.isErr()) {
          log.error(
            { error: result.error, errMsg: result.error.message, dataOptions },
            "TestData: failed to submit CastAdd message",
          );
        }
        targetCastIds.push({ fid: testUser.fid, hash: castAdd._unsafeUnwrap().hash });
      }
    }

    // Insert some replies and likes
    for (const testUser of this._testDataUsers) {
      const dataOptions = {
        fid: testUser.fid,
        network: FarcasterNetwork.TESTNET,
        timestamp: farcasterTimestamp,
      };

      const signer = this._userEd25519KeyPairs.get(testUser.fid);
      if (signer) {
        for (const targetCastId of targetCastIds) {
          // Don't self-like posts, it's not cool.
          if (targetCastId.fid !== testUser.fid) {
            const reactionAdd = await makeReactionAdd({ type: ReactionType.LIKE, targetCastId }, dataOptions, signer);

            const result = await client.submitMessage(
              reactionAdd._unsafeUnwrap(),
              getAuthMetadata(rpcUsername, rpcPassword),
            );
            if (result.isErr()) {
              log.error(
                { error: result.error, errMsg: result.error.message, dataOptions },
                "TestData: failed to submit ReactionAdd message",
              );
            }
          }
        }
      }
    }

    const closeResult = Result.fromThrowable(
      () => client.close(),
      (e) => e as Error,
    )();
    if (closeResult.isErr()) {
      log.warn({ error: closeResult.error }, "TestData: failed to close client");
    }
  }
}
