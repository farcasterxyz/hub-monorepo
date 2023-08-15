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

class GenMessages {
  startAtFid: number;
  numFIDs: number;
  numMessagesPerFID: number;
  network: FarcasterNetwork;
  metadata: Metadata;
  rpcClient: HubRpcClient;
  adminRpcClient: AdminRpcClient;

  allFiDs: number[] = [];

  numSuccessMessages = 0;
  numFailMessages = 0;
  numFailedFIDs = 0;

  batchSize = 5;
  concurrentFIDq = 0;

  startTime?: number;

  constructor(
    startAtFid: number,
    numFIDs: number,
    numMessagesPerFID: number,
    network: FarcasterNetwork,
    metadata: Metadata,
    rpcClient: HubRpcClient,
    adminRpcClient: AdminRpcClient,
  ) {
    this.startAtFid = startAtFid;
    this.numFIDs = numFIDs;
    this.numMessagesPerFID = numMessagesPerFID;
    this.network = network;
    this.metadata = metadata;

    this.rpcClient = rpcClient;
    this.adminRpcClient = adminRpcClient;
  }

  async generate() {
    // First, populate all the FIDs
    this.allFiDs = Array.from({ length: this.numFIDs }, (_, i) => i + this.startAtFid);

    this.startTime = Date.now();

    const genPromises = [];
    for (let i = 0; i < this.numFIDs; i++) {
      const fid = this.allFiDs[i] as number;
      genPromises.push(this.genForFid(fid));

      while (this.concurrentFIDq >= this.batchSize) {
        // Sleep for a while
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    await Promise.all(genPromises);
  }

  async genForFid(fid: number) {
    this.concurrentFIDq++;

    const custodySigner = Factories.Eip712Signer.build();
    const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
    const signer = Factories.Ed25519Signer.build();
    const signerKey = (await signer.getSignerKey())._unsafeUnwrap();

    const custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });
    const idResult = await this.adminRpcClient.submitIdRegistryEvent(custodyEvent, this.metadata);

    if (idResult.isOk()) {
      this.numSuccessMessages++;
    } else {
      console.log(`Failed to submit custody event for fid ${fid}: ${idResult.error}`);
    }

    const rentRegistryEvent = Factories.StorageRentOnChainEvent.build({
      fid,
      storageRentEventBody: Factories.StorageRentEventBody.build({ units: 2 }),
    });
    const rentResult = await this.adminRpcClient.submitOnChainEvent(rentRegistryEvent, this.metadata);

    if (rentResult.isOk()) {
      this.numSuccessMessages++;
    } else {
      console.log(`Failed to submit rent event for fid ${fid}: ${rentResult.error}`);
    }

    const signerAdd = await Factories.SignerAddMessage.create(
      { data: { fid, network: this.network, signerAddBody: { signer: signerKey } } },
      { transient: { signer: custodySigner } },
    );

    const signerResult = await this.rpcClient.submitMessage(signerAdd, this.metadata);
    if (signerResult.isOk()) {
      this.numSuccessMessages++;
    } else {
      console.log(`Failed to submit signer add message for fid ${fid}: ${signerResult.error}`);
    }

    // Generate messages and push them
    for (let i = 0; i < this.numMessagesPerFID / 2; i++) {
      const promises = [];

      const castAdd = await Factories.CastAddMessage.create(
        { data: { fid, network: this.network } },
        { transient: { signer } },
      );
      promises.push(this.rpcClient.submitMessage(castAdd, this.metadata));

      const reactionAdd = await Factories.ReactionAddMessage.create(
        { data: { fid, network: this.network, reactionBody: { targetCastId: { fid, hash: castAdd.hash } } } },
        { transient: { signer } },
      );
      promises.push(this.rpcClient.submitMessage(reactionAdd, this.metadata));

      await Promise.all(
        (
          await Promise.all(promises)
        ).map(async (result) => {
          if (result.isOk()) {
            this.numSuccessMessages++;
          } else {
            this.numFailMessages++;
            console.log(`Failed to submit message for fid ${fid}: ${result.error}`);

            // If there was an error, wait for a second before continuing
            // to avoid spamming the hub
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }),
      );
    }

    this.concurrentFIDq--;

    const duration = Date.now() - (this.startTime ?? 0);
    console.log(
      `Done with fid ${fid}. Success: ${this.numSuccessMessages}, Fail: ${this.numFailMessages}. Messages/s = ${
        this.numSuccessMessages / (duration / 1000)
      }`,
    );
  }
}

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
      ): Promise<SubmitStats> => {
        // Submit messages might need a username/password
        let metadata = new Metadata();
        if (username && typeof username !== "string") {
          metadata = username;
        } else if (username && password) {
          metadata = getAuthMetadata(username, password);
        }

        const genMessages = new GenMessages(
          startAtFid,
          numFIDs,
          numMessages,
          network,
          metadata,
          this.rpcClient,
          this.adminRpcClient,
        );
        await genMessages.generate();

        const totalDurationMs = Date.now() - (genMessages.startTime ?? 0);

        return {
          numSuccess: genMessages.numSuccessMessages,
          numFail: genMessages.numFailMessages,
          errorMessage: "",
          totalDurationMs,
          messagesPerSecond: genMessages.numSuccessMessages / (totalDurationMs / 1000),
        };
      },
    };
  }
}
