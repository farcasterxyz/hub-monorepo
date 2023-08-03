import {
  AdminRpcClient,
  Factories,
  getAuthMetadata,
  HubRpcClient,
  FarcasterNetwork,
  Message,
  Metadata,
} from "@farcaster/hub-nodejs";
import { ConsoleCommandInterface } from "./console.js";

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
    return "gen";
  }
  shortHelp(): string {
    return "Generate and Submit messages to the Hub";
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
        startAtFid = 100_000,
        numFIDs = 1,
        numMessages = 100,
        network = FarcasterNetwork.DEVNET,
        username?: string | Metadata,
        password?: string,
      ): Promise<string | SubmitStats> => {
        // Submit messages might need a username/password
        let metadata = new Metadata();
        if (username && typeof username !== "string") {
          metadata = username;
        } else if (username && password) {
          metadata = getAuthMetadata(username, password);
        }

        const start = performance.now();
        let numSuccess = 0;
        let numFail = 0;
        let errorMessage = "";

        for (let i = 0; i < numFIDs; i++) {
          // Generate a random number from 100_000 to 100_000_000 to use as an fid
          const fid = i + startAtFid; // Start at 100_000 to avoid collisions with the testnet

          const custodySigner = Factories.Eip712Signer.build();
          const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
          const signer = Factories.Ed25519Signer.build();
          const signerKey = (await signer.getSignerKey())._unsafeUnwrap();

          const custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });
          const idResult = await this.adminRpcClient.submitIdRegistryEvent(custodyEvent, metadata);

          if (idResult.isOk()) {
            numSuccess++;
          } else {
            return `Failed to submit custody event for fid ${fid}: ${idResult.error}`;
          }

          const rentRegistryEvent = Factories.StorageRentOnChainEvent.build({
            fid,
            storageRentEventBody: Factories.StorageRentEventBody.build({ units: 2 }),
          });
          const rentResult = await this.adminRpcClient.submitOnChainEvent(rentRegistryEvent, metadata);

          if (rentResult.isOk()) {
            numSuccess++;
          } else {
            return `Failed to submit rent event for fid ${fid}: ${rentResult.error}`;
          }

          const signerAdd = await Factories.SignerAddMessage.create(
            { data: { fid, network, signerAddBody: { signer: signerKey } } },
            { transient: { signer: custodySigner } },
          );

          const signerResult = await this.rpcClient.submitMessage(signerAdd, metadata);
          if (signerResult.isOk()) {
            numSuccess++;
          } else {
            return `Failed to submit signer add message for fid ${fid}: ${signerResult.error}`;
          }

          const submitBatch = async (batch: Message[]) => {
            const promises = [];
            for (const msg of batch) {
              promises.push(this.rpcClient.submitMessage(msg, metadata));
            }
            const results = await Promise.all(promises);

            let numSuccess = 0;
            let numFail = 0;
            let errorMessage = "";
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

          const batch = [];
          for (let i = 0; i < numMessages / 2; i++) {
            const castAdd = await Factories.CastAddMessage.create(
              { data: { fid, network } },
              { transient: { signer } },
            );
            const reactionAdd = await Factories.ReactionAddMessage.create(
              { data: { fid, network, reactionBody: { targetCastId: { fid, hash: castAdd.hash } } } },
              { transient: { signer } },
            );

            batch.push(castAdd);
            batch.push(reactionAdd);
          }
          const result = await submitBatch(batch);

          numSuccess += result.numSuccess;
          numFail += result.numFail;
          errorMessage = result.errorMessage;

          const duration = performance.now() - start;
          console.log(
            `Submitted ${numFail} + ${numSuccess} total messages. Messages per Second = ${
              numSuccess / (duration / 1000)
            }  Done with fid ${fid}`,
          );
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
