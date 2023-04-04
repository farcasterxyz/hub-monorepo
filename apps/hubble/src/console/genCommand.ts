import {
  AdminRpcClient,
  Factories,
  getAuthMetadata,
  HubRpcClient,
  Metadata,
  FarcasterNetwork,
  Message,
} from '@farcaster/hub-nodejs';
import { ConsoleCommandInterface } from './console';

// We use console.log() in this file, so we disable the eslint rule. This is the REPL console, after all!
/* eslint-disable no-console */

export type SubmitStats = {
  numSuccess: number;
  numFail: number;
  errorMessage: string;
  totalDurationMs: number;
  messagesPerSecond: number;
};

export class GenCommand implements ConsoleCommandInterface {
  constructor(private readonly rpcClient: HubRpcClient, private readonly adminRpcClient: AdminRpcClient) {}

  commandName(): string {
    return 'gen';
  }
  shortHelp(): string {
    return 'Generate and Submit messages to the Hub';
  }
  help(): string {
    return `
    Usage: gen.submitMessages(numMessages = 100, network = FARCASTER_NETWORK_DEVNET)
        Generate 'numMessages' messages and submit them to the Hub using the RPC client and print
        perf stats.

    Note1: This command is async, so you'll have to await it.
    Note2: This will submit 2 additional messages to the Hub per Fid: an IdRegistryEvent and a SignerAddMessage

    `;
  }
  object() {
    return {
      submitMessages: async (
        numMessages = 100,
        network = FarcasterNetwork.DEVNET,
        username?: string | Metadata,
        password?: string
      ): Promise<string | SubmitStats> => {
        // Submit messages might need a username/password
        let metadata = new Metadata();
        if (username && typeof username !== 'string') {
          metadata = username;
        } else if (username && password) {
          metadata = getAuthMetadata(username, password);
        }

        // Generate a random number from 100_000 to 100_000_000 to use as an fid
        const fid = Math.floor(Math.random() * 100_000_000 + 100_000);

        const custodySigner = Factories.Eip712Signer.build();
        const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
        const signer = Factories.Ed25519Signer.build();
        const signerKey = (await signer.getSignerKey())._unsafeUnwrap();

        let numSuccess = 0;
        let numFail = 0;
        let errorMessage = '';

        const start = performance.now();

        const custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });
        const idResult = await this.adminRpcClient.submitIdRegistryEvent(custodyEvent, metadata);
        if (idResult.isOk()) {
          numSuccess++;
        } else {
          return `Failed to submit custody event for fid ${fid}: ${idResult.error}`;
        }

        const signerAdd = await Factories.SignerAddMessage.create(
          { data: { fid, network, signerAddBody: { signer: signerKey } } },
          { transient: { signer: custodySigner } }
        );

        const signerResult = await this.rpcClient.submitMessage(signerAdd, metadata);
        if (signerResult.isOk()) {
          numSuccess++;
        } else {
          return `Failed to submit signer add message for fid ${fid}: ${signerResult.error}`;
        }

        const submitBatch = async (batch: Message[]) => {
          const promises = [];
          for (const castAdd of batch) {
            promises.push(this.rpcClient.submitMessage(castAdd, metadata));
          }
          const results = await Promise.all(promises);

          let numSuccess = 0;
          let numFail = 0;
          let errorMessage = '';
          for (const r of results) {
            if (r.isOk()) {
              numSuccess++;
            } else {
              numFail++;
              errorMessage = `Failed to submit cast add message for fid ${fid}: ${r.error}`;
            }
          }
          return { numSuccess, numFail, errorMessage };
        };

        for (let i = 0; i < numMessages; i += 100) {
          const batch = [];
          for (let j = i; j < i + 100 && j < numMessages; j++) {
            batch.push(await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } }));
          }
          const result = await submitBatch(batch);

          numSuccess += result.numSuccess;
          numFail += result.numFail;
          errorMessage = result.errorMessage;

          console.log(`Submitted ${numFail + numSuccess} messages`);
        }

        const totalDuration = performance.now() - start;

        return {
          numSuccess,
          numFail,
          errorMessage,
          totalDurationMs: totalDuration,
          messagesPerSecond: numSuccess / (totalDuration / 1000),
        };
      },
    };
  }
}
