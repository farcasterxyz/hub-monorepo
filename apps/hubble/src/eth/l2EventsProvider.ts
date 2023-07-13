import {
  bigIntToBytes,
  hexStringToBytes,
  HubAsyncResult,
  HubState,
  RentRegistryEvent,
  StorageAdminRegistryEvent,
  StorageRegistryEventType,
  storageRegistryEventTypeToJSON,
} from "@farcaster/hub-nodejs";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { StorageRegistry } from "./abis.js";
import { HubInterface } from "../hubble.js";
import { logger } from "../utils/logger.js";
import { optimismGoerli } from "viem/chains";
import { createPublicClient, http, Log, PublicClient } from "viem";
import { WatchContractEvent } from "./watchContractEvent.js";
import { WatchBlockNumber } from "./watchBlockNumber.js";

const log = logger.child({
  component: "L2EventsProvider",
});

export class OPGoerliEthConstants {
  public static StorageRegistryAddress = "0xa89cC9427335da6E8138517419FCB3c9c37d1604" as const;
  public static FirstBlock = 11183461;
  public static ChunkSize = 1000;
  public static chainId = BigInt(420); // OP Goerli
}

/**
 * Class that follows the Optimism chain to handle on-chain events from the Storage Registry contract.
 */
export class L2EventsProvider {
  private _hub: HubInterface;
  private _publicClient: PublicClient;

  private _firstBlock: number;
  private _chunkSize: number;
  private _resyncEvents: boolean;

  private _rentEventsByBlock: Map<number, Array<RentRegistryEvent>>;
  private _storageAdminEventsByBlock: Map<number, Array<StorageAdminRegistryEvent>>;
  private _retryDedupMap: Map<number, boolean>;

  private _lastBlockNumber: number;

  private _watchRentRegistryRent: WatchContractEvent<typeof StorageRegistry.abi, "Rent", true>;
  private _watchStorageAdminRegistrySetDeprecationTimestamp: WatchContractEvent<
    typeof StorageRegistry.abi,
    "SetDeprecationTimestamp",
    true
  >;
  private _watchStorageAdminRegistrySetGracePeriod: WatchContractEvent<
    typeof StorageRegistry.abi,
    "SetGracePeriod",
    true
  >;
  private _watchStorageAdminRegistrySetMaxUnits: WatchContractEvent<typeof StorageRegistry.abi, "SetMaxUnits", true>;
  private _watchStorageAdminRegistrySetPrice: WatchContractEvent<typeof StorageRegistry.abi, "SetPrice", true>;
  private _watchBlockNumber: WatchBlockNumber;

  // Whether the historical events have been synced. This is used to avoid syncing the events multiple times.
  private _isHistoricalSyncDone = false;

  // Number of blocks to wait before processing an event. This is hardcoded to
  // 6 for now, because that's the threshold beyond which blocks are unlikely
  // to reorg anymore. 6 blocks represents ~72 seconds on Goerli, so the delay
  // is not too long.
  static numConfirmations = 6;

  // Events are only processed after 6 blocks have been confirmed; poll less
  // frequently while ensuring events are available the moment they are
  // confirmed.
  static eventPollingInterval = (L2EventsProvider.numConfirmations - 2) * 12_000;
  static blockPollingInterval = 4_000;

  constructor(
    hub: HubInterface,
    publicClient: PublicClient,
    storageRegistryAddress: `0x${string}`,
    firstBlock: number,
    chunkSize: number,
    resyncEvents: boolean,
  ) {
    this._hub = hub;
    this._publicClient = publicClient;
    this._firstBlock = firstBlock;
    this._chunkSize = chunkSize;
    this._resyncEvents = resyncEvents;

    this._lastBlockNumber = 0;

    // Initialize the cache for the Storage Registry events. They will be processed after
    // numConfirmations blocks have been mined.
    this._rentEventsByBlock = new Map();
    this._storageAdminEventsByBlock = new Map();
    this._retryDedupMap = new Map();

    // Setup StorageRegistry contract
    this._watchRentRegistryRent = new WatchContractEvent(
      this._publicClient,
      {
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        eventName: "Rent",
        onLogs: this.processRentEvents.bind(this),
        pollingInterval: L2EventsProvider.eventPollingInterval,
        strict: true,
      },
      "StorageRegistry Rent",
    );

    this._watchStorageAdminRegistrySetDeprecationTimestamp = new WatchContractEvent(
      this._publicClient,
      {
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        eventName: "SetDeprecationTimestamp",
        onLogs: this.processStorageSetDeprecationTimestampEvents.bind(this),
        pollingInterval: L2EventsProvider.eventPollingInterval,
        strict: true,
      },
      "StorageRegistry SetDeprecationTimestamp",
    );

    this._watchStorageAdminRegistrySetGracePeriod = new WatchContractEvent(
      this._publicClient,
      {
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        eventName: "SetGracePeriod",
        onLogs: this.processStorageSetGracePeriodEvents.bind(this),
        pollingInterval: L2EventsProvider.eventPollingInterval,
        strict: true,
      },
      "StorageRegistry SetGracePeriod",
    );

    this._watchStorageAdminRegistrySetMaxUnits = new WatchContractEvent(
      this._publicClient,
      {
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        eventName: "SetMaxUnits",
        onLogs: this.processStorageSetMaxUnitsEvents.bind(this),
        pollingInterval: L2EventsProvider.eventPollingInterval,
        strict: true,
      },
      "StorageRegistry SetMaxUnits",
    );

    this._watchStorageAdminRegistrySetPrice = new WatchContractEvent(
      this._publicClient,
      {
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        eventName: "SetPrice",
        onLogs: this.processStorageSetPriceEvents.bind(this),
        pollingInterval: L2EventsProvider.eventPollingInterval,
        strict: true,
      },
      "StorageRegistry SetPrice",
    );

    this._watchBlockNumber = new WatchBlockNumber(this._publicClient, {
      pollingInterval: L2EventsProvider.blockPollingInterval,
      onBlockNumber: (blockNumber) => this.handleNewBlock(Number(blockNumber)),
      onError: (error) => {
        log.error(`Error watching new block numbers: ${error}`, { error });
      },
    });
  }

  /**
   *
   * Build an L2 Events Provider for the ID Registry and Name Registry contracts.
   */
  public static build(
    hub: HubInterface,
    l2RpcUrl: string,
    storageRegistryAddress: `0x${string}`,
    firstBlock: number,
    chunkSize: number,
    resyncEvents: boolean,
  ): L2EventsProvider {
    const publicClient = createPublicClient({
      chain: optimismGoerli,
      transport: http(l2RpcUrl, { retryCount: 10 }),
    });

    const provider = new L2EventsProvider(
      hub,
      publicClient,
      storageRegistryAddress,
      firstBlock,
      chunkSize,
      resyncEvents,
    );

    return provider;
  }

  public getLatestBlockNumber(): number {
    return this._lastBlockNumber;
  }

  public async start() {
    // Connect to L2 RPC
    await this.connectAndSyncHistoricalEvents();

    this._watchBlockNumber.start();
    this._watchRentRegistryRent.start();
    this._watchStorageAdminRegistrySetDeprecationTimestamp.start();
    this._watchStorageAdminRegistrySetGracePeriod.start();
    this._watchStorageAdminRegistrySetMaxUnits.start();
    this._watchStorageAdminRegistrySetPrice.start();
  }

  public async stop() {
    this._watchStorageAdminRegistrySetPrice.stop();
    this._watchStorageAdminRegistrySetMaxUnits.stop();
    this._watchStorageAdminRegistrySetGracePeriod.stop();
    this._watchStorageAdminRegistrySetDeprecationTimestamp.stop();
    this._watchRentRegistryRent.stop();
    this._watchBlockNumber.stop();

    // Wait for all async promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  /** Returns expiry for fid in ms from unix epoch */
  // public async getRentExpiry(fid: number): HubAsyncResult<number> {
  //   const fidBI = toBigInt(fid);

  //   this._storageStore.

  //   return expiryResult.map((expiry) => Number(expiry) * 1000);
  // }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async processRentEvents(logs: Log<bigint, number, undefined, true, typeof StorageRegistry.abi, "Rent">[]) {
    for (const event of logs) {
      const { blockNumber, blockHash, transactionHash, transactionIndex } = event;

      // Do nothing if the block is pending
      if (blockHash === null || blockNumber === null || transactionHash === null || transactionIndex === null) {
        continue;
      }

      // Handling: use try-catch + log since errors are expected and not important to surface
      try {
        await this.cacheRentRegistryEvent(
          event.args.payer,
          event.args.fid,
          event.args.units,
          StorageRegistryEventType.RENT,
          Number(blockNumber),
          blockHash,
          transactionHash,
          Number(transactionIndex),
        );
      } catch (e) {
        log.error(e);
        log.error({ event }, "failed to parse event args");
      }
    }
  }

  private async processStorageSetDeprecationTimestampEvents(
    logs: Log<bigint, number, undefined, true, typeof StorageRegistry.abi, "SetDeprecationTimestamp">[],
  ) {
    for (const event of logs) {
      const { blockNumber, blockHash, transactionHash, transactionIndex, address } = event;

      // Do nothing if the block is pending
      if (blockHash === null || blockNumber === null || transactionHash === null || transactionIndex === null) {
        continue;
      }

      // Handling: use try-catch + log since errors are expected and not important to surface
      try {
        await this.cacheStorageAdminRegistryEvent(
          event.args.oldTimestamp,
          event.args.newTimestamp,
          StorageRegistryEventType.SET_DEPRECATION_TIMESTAMP,
          address,
          Number(blockNumber),
          blockHash,
          transactionHash,
          Number(transactionIndex),
        );
      } catch (e) {
        log.error({ event }, "failed to parse event args");
      }
    }
  }

  private async processStorageSetGracePeriodEvents(
    logs: Log<bigint, number, undefined, true, typeof StorageRegistry.abi, "SetGracePeriod">[],
  ) {
    for (const event of logs) {
      const { blockNumber, blockHash, transactionHash, transactionIndex, address } = event;

      // Do nothing if the block is pending
      if (blockHash === null || blockNumber === null || transactionHash === null || transactionIndex === null) {
        continue;
      }

      // Handling: use try-catch + log since errors are expected and not important to surface
      try {
        await this.cacheStorageAdminRegistryEvent(
          event.args.oldPeriod,
          event.args.newPeriod,
          StorageRegistryEventType.SET_GRACE_PERIOD,
          address,
          Number(blockNumber),
          blockHash,
          transactionHash,
          Number(transactionIndex),
        );
      } catch (e) {
        log.error({ event }, "failed to parse event args");
      }
    }
  }

  private async processStorageSetMaxUnitsEvents(
    logs: Log<bigint, number, undefined, true, typeof StorageRegistry.abi, "SetMaxUnits">[],
  ) {
    for (const event of logs) {
      const { blockNumber, blockHash, transactionHash, transactionIndex, address } = event;

      // Do nothing if the block is pending
      if (blockHash === null || blockNumber === null || transactionHash === null || transactionIndex === null) {
        continue;
      }

      // Handling: use try-catch + log since errors are expected and not important to surface
      try {
        await this.cacheStorageAdminRegistryEvent(
          event.args.oldMax,
          event.args.newMax,
          StorageRegistryEventType.SET_MAX_UNITS,
          address,
          Number(blockNumber),
          blockHash,
          transactionHash,
          Number(transactionIndex),
        );
      } catch (e) {
        log.error({ event }, "failed to parse event args");
      }
    }
  }

  private async processStorageSetPriceEvents(
    logs: Log<bigint, number, undefined, true, typeof StorageRegistry.abi, "SetPrice">[],
  ) {
    for (const event of logs) {
      const { blockNumber, blockHash, transactionHash, transactionIndex, address } = event;

      // Do nothing if the block is pending
      if (blockHash === null || blockNumber === null || transactionHash === null || transactionIndex === null) {
        continue;
      }

      // Handling: use try-catch + log since errors are expected and not important to surface
      try {
        await this.cacheStorageAdminRegistryEvent(
          event.args.oldPrice,
          event.args.newPrice,
          StorageRegistryEventType.SET_PRICE,
          address,
          Number(blockNumber),
          blockHash,
          transactionHash,
          Number(transactionIndex),
        );
      } catch (e) {
        log.error({ event }, "failed to parse event args");
      }
    }
  }

  /** Connect to Ethereum RPC */
  private async connectAndSyncHistoricalEvents() {
    const latestBlockResult = await ResultAsync.fromPromise(this._publicClient.getBlockNumber(), (err) => err);
    if (latestBlockResult.isErr()) {
      log.error(
        { err: latestBlockResult.error },
        "failed to connect to optimism node. Check your eth RPC URL (e.g. --l2-rpc-url)",
      );
      return;
    }
    const latestBlock = Number(latestBlockResult.value);

    if (!latestBlock) {
      log.error("failed to get the latest block from the RPC provider");
      return;
    }

    log.info({ latestBlock: latestBlock }, "connected to ethereum node");

    // Find how how much we need to sync
    let lastSyncedBlock = this._firstBlock;

    const hubState = await this._hub.getHubState();
    if (hubState.isOk()) {
      lastSyncedBlock = hubState.value.lastEthBlock;
    }

    if (this._resyncEvents) {
      log.info(`Resyncing events from ${this._firstBlock} instead of ${lastSyncedBlock}`);
      lastSyncedBlock = this._firstBlock;
    }

    log.info({ lastSyncedBlock }, "last synced block");
    const toBlock = latestBlock;

    if (lastSyncedBlock < toBlock) {
      log.info({ fromBlock: lastSyncedBlock, toBlock }, "syncing events from missed blocks");

      // Sync old Rent events
      await this.syncHistoricalStorageEvents(StorageRegistryEventType.RENT, lastSyncedBlock, toBlock, this._chunkSize);

      // Sync old Storage Admin events
      await this.syncHistoricalStorageEvents(
        StorageRegistryEventType.SET_DEPRECATION_TIMESTAMP,
        lastSyncedBlock,
        toBlock,
        this._chunkSize,
      );
      await this.syncHistoricalStorageEvents(
        StorageRegistryEventType.SET_GRACE_PERIOD,
        lastSyncedBlock,
        toBlock,
        this._chunkSize,
      );
      await this.syncHistoricalStorageEvents(
        StorageRegistryEventType.SET_MAX_UNITS,
        lastSyncedBlock,
        toBlock,
        this._chunkSize,
      );
      await this.syncHistoricalStorageEvents(
        StorageRegistryEventType.SET_PRICE,
        lastSyncedBlock,
        toBlock,
        this._chunkSize,
      );
    }

    this._isHistoricalSyncDone = true;
  }

  /**
   * Retry events from a specific block number
   *
   * @param blockNumber
   */
  public async retryEventsFromBlock(blockNumber: number) {
    if (this._retryDedupMap.has(blockNumber)) {
      return;
    }
    this._retryDedupMap.set(blockNumber, true);

    // Sync old Storage events
    await this.syncHistoricalStorageEvents(StorageRegistryEventType.RENT, blockNumber, blockNumber + 1, 1);
    await this.syncHistoricalStorageEvents(
      StorageRegistryEventType.SET_DEPRECATION_TIMESTAMP,
      blockNumber,
      blockNumber + 1,
      1,
    );
    await this.syncHistoricalStorageEvents(StorageRegistryEventType.SET_GRACE_PERIOD, blockNumber, blockNumber + 1, 1);
    await this.syncHistoricalStorageEvents(StorageRegistryEventType.SET_MAX_UNITS, blockNumber, blockNumber + 1, 1);
    await this.syncHistoricalStorageEvents(StorageRegistryEventType.SET_PRICE, blockNumber, blockNumber + 1, 1);
  }

  /**
   * Sync old Storage events that may have happened before hub was started. We'll put them all
   * in the sync queue to be processed later, to make sure we don't process any unconfirmed events.
   */
  private async syncHistoricalStorageEvents(
    type: StorageRegistryEventType,
    fromBlock: number,
    toBlock: number,
    batchSize: number,
  ) {
    /*
     * Querying Blocks in Batches
     *
     * 1. Calculate difference between the first and last sync blocks (e.g. )
     * 2. Divide by batch size and round up to get runs, and iterate with for-loop
     * 3. Compute the fromBlock in each run as firstBlock + (loopIndex * batchSize)
     * 4. Compute the toBlock in each run as fromBlock + batchSize
     * 5. In every run after the first one, increment fromBlock by 1 to avoid duplication

     * To sync blocks from 7,648,795 to 8,418,326, the diff is 769,531
     * The run size for a 10k batch would be =  76.9531 ~= 77 runs
     * For the 1st run, fromBlock = 7,648,795 + (0 * 10,000) =  7,648,795
     * For the 1st run, toBlock = 7,648,795 + 10,000 =  7,658,795
     * For the 2nd run, fromBlock = 7,648,795 + (1 * 10,000) + 1 =  7,658,796
     * For the 2nd run, toBlock = 7,658,796 + 10,000 =  7,668,796
     */

    // Calculate amount of runs required based on batchSize, and round up to capture all blocks
    const numOfRuns = Math.ceil((toBlock - fromBlock) / batchSize);

    for (let i = 0; i < numOfRuns; i++) {
      let nextFromBlock = fromBlock + i * batchSize;
      const nextToBlock = nextFromBlock + batchSize;

      if (i > 0) {
        // If this isn't our first loop, we need to up the fromBlock by 1, or else we will be re-caching an already cached block.
        nextFromBlock += 1;
      }

      if (type === StorageRegistryEventType.RENT) {
        const filter = await this._publicClient.createContractEventFilter({
          address: OPGoerliEthConstants.StorageRegistryAddress,
          abi: StorageRegistry.abi,
          eventName: "Rent",
          fromBlock: BigInt(nextFromBlock),
          toBlock: BigInt(nextToBlock),
          strict: true,
        });

        const logs = await this._publicClient.getFilterLogs({ filter });
        await this.processRentEvents(logs);
      } else if (type === StorageRegistryEventType.SET_DEPRECATION_TIMESTAMP) {
        const filter = await this._publicClient.createContractEventFilter({
          address: OPGoerliEthConstants.StorageRegistryAddress,
          abi: StorageRegistry.abi,
          eventName: "SetDeprecationTimestamp",
          fromBlock: BigInt(nextFromBlock),
          toBlock: BigInt(nextToBlock),
          strict: true,
        });

        const logs = await this._publicClient.getFilterLogs({ filter });
        await this.processStorageSetDeprecationTimestampEvents(logs);
      } else if (type === StorageRegistryEventType.SET_GRACE_PERIOD) {
        const filter = await this._publicClient.createContractEventFilter({
          address: OPGoerliEthConstants.StorageRegistryAddress,
          abi: StorageRegistry.abi,
          eventName: "SetGracePeriod",
          fromBlock: BigInt(nextFromBlock),
          toBlock: BigInt(nextToBlock),
          strict: true,
        });

        const logs = await this._publicClient.getFilterLogs({ filter });
        await this.processStorageSetGracePeriodEvents(logs);
      } else if (type === StorageRegistryEventType.SET_MAX_UNITS) {
        const filter = await this._publicClient.createContractEventFilter({
          address: OPGoerliEthConstants.StorageRegistryAddress,
          abi: StorageRegistry.abi,
          eventName: "SetMaxUnits",
          fromBlock: BigInt(nextFromBlock),
          toBlock: BigInt(nextToBlock),
          strict: true,
        });

        const logs = await this._publicClient.getFilterLogs({ filter });
        await this.processStorageSetMaxUnitsEvents(logs);
      } else if (type === StorageRegistryEventType.SET_PRICE) {
        const filter = await this._publicClient.createContractEventFilter({
          address: OPGoerliEthConstants.StorageRegistryAddress,
          abi: StorageRegistry.abi,
          eventName: "SetPrice",
          fromBlock: BigInt(nextFromBlock),
          toBlock: BigInt(nextToBlock),
          strict: true,
        });

        const logs = await this._publicClient.getFilterLogs({ filter });
        await this.processStorageSetPriceEvents(logs);
      }
    }
  }

  /** Handle a new block. Processes all events in the cache that have now been confirmed */
  private async handleNewBlock(blockNumber: number) {
    log.info({ blockNumber }, `new block: ${blockNumber}`);

    // Get all blocks that have been confirmed into a single array and sort.
    const cachedBlocksSet = new Set([...this._rentEventsByBlock.keys(), ...this._storageAdminEventsByBlock.keys()]);
    const cachedBlocks = Array.from(cachedBlocksSet);
    cachedBlocks.sort();

    for (const cachedBlock of cachedBlocks) {
      if (cachedBlock + L2EventsProvider.numConfirmations <= blockNumber) {
        const rentEvents = this._rentEventsByBlock.get(cachedBlock);
        this._rentEventsByBlock.delete(cachedBlock);

        if (rentEvents) {
          for (const rentEvent of rentEvents) {
            await this._hub.submitRentRegistryEvent(rentEvent, "l2-provider");
          }
        }

        const storageAdminEvents = this._storageAdminEventsByBlock.get(cachedBlock);
        this._storageAdminEventsByBlock.delete(cachedBlock);

        if (storageAdminEvents) {
          for (const storageAdminEvent of storageAdminEvents) {
            await this._hub.submitStorageAdminRegistryEvent(storageAdminEvent, "l2-provider");
          }
        }

        this._retryDedupMap.delete(cachedBlock);
      }
    }

    // Update the last synced block if all the historical events have been synced
    if (this._isHistoricalSyncDone) {
      const hubState = HubState.create({ lastEthBlock: blockNumber });
      await this._hub.putHubState(hubState);
    }

    this._lastBlockNumber = blockNumber;
  }

  private async cacheRentRegistryEvent(
    payer: string,
    fid: bigint,
    units: bigint,
    type: StorageRegistryEventType,
    blockNumber: number,
    blockHash: string,
    transactionHash: string,
    index: number,
  ): HubAsyncResult<void> {
    const logEvent = log.child({ event: { fid, blockNumber } });

    const serialized = Result.combine([
      hexStringToBytes(blockHash),
      hexStringToBytes(transactionHash),
      payer && payer.length > 0 ? hexStringToBytes(payer) : ok(new Uint8Array()),
    ]);

    if (serialized.isErr()) {
      logEvent.error(
        { errCode: serialized.error.errCode },
        `cacheRentRegistryEvent error: ${serialized.error.message}`,
      );
      return err(serialized.error);
    }

    const [blockHashBytes, transactionHashBytes, payerBytes] = serialized.value;

    const rentRegistryEvent = RentRegistryEvent.create({
      blockNumber,
      blockHash: blockHashBytes,
      transactionHash: transactionHashBytes,
      logIndex: index,
      payer: payerBytes,
      fid: Number(fid),
      units: Number(units),
      type: StorageRegistryEventType.RENT,
    });

    // Add it to the cache
    let rentEvents = this._rentEventsByBlock.get(blockNumber);
    if (!rentEvents) {
      rentEvents = [];
      this._rentEventsByBlock.set(blockNumber, rentEvents);
    }
    rentEvents.push(rentRegistryEvent);

    logEvent.info(`cacheRentRegistryEvent: fid ${fid.toString()} rented ${units} units in block ${blockNumber}`);

    return ok(undefined);
  }

  private async cacheStorageAdminRegistryEvent(
    oldValue: bigint,
    newValue: bigint,
    type: StorageRegistryEventType,
    address: string,
    blockNumber: number,
    blockHash: string,
    transactionHash: string,
    index: number,
  ): HubAsyncResult<void> {
    const logEvent = log.child({ event: { type, blockNumber } });

    const serialized = Result.combine([
      hexStringToBytes(blockHash),
      hexStringToBytes(transactionHash),
      hexStringToBytes(address),
      bigIntToBytes(newValue),
    ]);

    if (serialized.isErr()) {
      logEvent.error(
        { errCode: serialized.error.errCode },
        `cacheStorageAdminRegistryEvent error: ${serialized.error.message}`,
      );
      return err(serialized.error);
    }

    const [blockHashBytes, transactionHashBytes, fromBytes, newValueBytes] = serialized.value;
    const block = await this._publicClient.getBlock({
      blockHash: blockHash as `0x${string}`,
    });
    const timestamp = Number(block.timestamp);

    const storageAdminRegistryEvent = StorageAdminRegistryEvent.create({
      blockNumber,
      blockHash: blockHashBytes,
      transactionHash: transactionHashBytes,
      logIndex: index,
      timestamp: timestamp,
      from: fromBytes,
      type: type,
      value: newValueBytes,
    });

    // Add it to the cache
    let storageAdminEvents = this._storageAdminEventsByBlock.get(blockNumber);
    if (!storageAdminEvents) {
      storageAdminEvents = [];
      this._storageAdminEventsByBlock.set(blockNumber, storageAdminEvents);
    }
    storageAdminEvents.push(storageAdminRegistryEvent);

    logEvent.info(
      `cacheStorageAdminRegistryEvent: address ${address} performed ${storageRegistryEventTypeToJSON(
        type,
      )} from ${oldValue.toString()} to ${newValue.toString()} in block ${blockNumber}`,
    );

    return ok(undefined);
  }
}
