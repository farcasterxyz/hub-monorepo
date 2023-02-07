import * as protobufs from '@farcaster/protobufs';
import { Factories, HubRpcClient } from '@farcaster/utils';
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
  constructor(private readonly rpcClient: HubRpcClient) {}

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
        network = protobufs.FarcasterNetwork.FARCASTER_NETWORK_DEVNET
      ): Promise<string | SubmitStats> => {
        const fid = Factories.Fid.build();
        const custodySigner = Factories.Eip712Signer.build();
        const signer = Factories.Ed25519Signer.build();

        let numSuccess = 0;
        let numFail = 0;
        let errorMessage = '';

        const start = performance.now();

        const custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySigner.signerKey });
        const idResult = await this.rpcClient.submitIdRegistryEvent(custodyEvent);
        if (idResult.isOk()) {
          numSuccess++;
        } else {
          return `Failed to submit custody event for fid ${fid}: ${idResult.error}`;
        }

        const signerAdd = await Factories.SignerAddMessage.create(
          { data: { fid, network, signerBody: { signer: signer.signerKey } } },
          { transient: { signer: custodySigner } }
        );

        const signerResult = await this.rpcClient.submitMessage(signerAdd);
        if (signerResult.isOk()) {
          numSuccess++;
        } else {
          return `Failed to submit signer add message for fid ${fid}: ${signerResult.error}`;
        }

        for (let i = 0; i < numMessages; i++) {
          const castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
          const r = await this.rpcClient.submitMessage(castAdd);
          if (r.isOk()) {
            numSuccess++;
          } else {
            numFail++;
            errorMessage = `Failed to submit cast add message for fid ${fid}: ${r.error}`;
          }

          if (i > 0 && i % 100 === 0) {
            console.log(`Submitted ${i} messages`);
          }
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
