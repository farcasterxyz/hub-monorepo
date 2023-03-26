import { Wallet } from 'ethers';
import cron from 'node-cron';
import {
  EthersEip712Signer,
  getAuthMetadata,
  getInsecureHubRpcClient,
  HubRpcClient,
  makeCastAdd,
  makeReactionAdd,
  makeSignerAdd,
  NobleEd25519Signer,
  toFarcasterTime,
} from '@farcaster/utils';
import { logger } from '~/utils/logger';
import * as ed from '@noble/ed25519';
import { FarcasterNetwork, ReactionType } from '@farcaster/protobufs';
import { faker } from '@faker-js/faker';
import Server from '~/rpc/server';

const log = logger.child({
  component: 'PeriodicTestDataJob',
});

type SchedulerStatus = 'started' | 'stopped';

const DEFAULT_PERIODIC_JOB_CRON = '*/10 * * * * *'; // Every 10 seconds

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
    return this._cronTask ? 'started' : 'stopped';
  }

  async insertSignerAdds(client: HubRpcClient) {
    // Initialize the signer add messages for the test users
    for (const testUser of this._testDataUsers) {
      if (!testUser.mnemonic || !testUser.fid) {
        continue;
      }

      const wallet = Wallet.fromPhrase(testUser.mnemonic);
      const eip712Signer = new EthersEip712Signer(wallet);

      // Generate a new Ed25519 key pair which will become the Signer and store the private key securely
      const signerPrivateKey = ed.utils.randomPrivateKey();
      const ed25519Signer = new NobleEd25519Signer(signerPrivateKey);

      // Create a SignerAdd message that contains the public key of the signer
      const dataOptions = {
        fid: testUser.fid,
        network: FarcasterNetwork.TESTNET,
      };

      const signerAddResult = await makeSignerAdd(
        { signer: (await ed25519Signer.getSignerKey())._unsafeUnwrap() },
        dataOptions,
        eip712Signer
      );
      const signerAdd = signerAddResult._unsafeUnwrap();

      const { user, password } = this._server.auth;
      const result = await client.submitMessage(signerAdd, getAuthMetadata(user ?? '', password ?? ''));
      if (result.isErr()) {
        log.error({ error: result.error, dataOptions }, 'TestData: failed to submit SignerAdd message');
      }

      this._userEd25519KeyPairs.set(testUser.fid, ed25519Signer);
    }
  }

  async doJobs() {
    log.info('starting periodic test data job');

    const client = getInsecureHubRpcClient(`127.0.0.1:${this._server.listenPort}`);

    if (this._userEd25519KeyPairs.size === 0) {
      await this.insertSignerAdds(client);
    }

    const farcasterTimestamp = toFarcasterTime(Date.now())._unsafeUnwrap();
    const targetCastIds = [];

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
          { text: faker.lorem.sentence(12), embeds: ['http://www.farcaster.xyz'], mentions: [], mentionsPositions: [] },
          dataOptions,
          signer
        );

        const { user, password } = this._server.auth;
        const result = await client.submitMessage(castAdd._unsafeUnwrap(), getAuthMetadata(user ?? '', password ?? ''));
        if (result.isErr()) {
          log.error({ error: result.error, dataOptions }, 'TestData: failed to submit CastAdd message');
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

            const { user, password } = this._server.auth;
            const result = await client.submitMessage(
              reactionAdd._unsafeUnwrap(),
              getAuthMetadata(user ?? '', password ?? '')
            );
            if (result.isErr()) {
              log.error({ error: result.error, dataOptions }, 'TestData: failed to submit ReactionAdd message');
            }
          }
        }
      }
    }
  }
}
