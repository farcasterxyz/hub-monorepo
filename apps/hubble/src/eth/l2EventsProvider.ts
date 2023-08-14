import {
  hexStringToBytes,
  HubAsyncResult,
  HubState,
  IdRegisterEventBody,
  IdRegisterEventType,
  OnChainEvent,
  OnChainEventType,
  onChainEventTypeToJSON,
  SignerEventBody,
  SignerEventType,
  SignerMigratedEventBody,
  StorageRentEventBody,
  toFarcasterTime,
} from "@farcaster/hub-nodejs";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { IdRegistryV2, KeyRegistry, StorageRegistry } from "./abis.js";
import { HubInterface } from "../hubble.js";
import { logger } from "../utils/logger.js";
import { optimismGoerli } from "viem/chains";
import { createPublicClient, fallback, http, Log, OnLogsParameter, PublicClient } from "viem";
import { WatchContractEvent } from "./watchContractEvent.js";
import { WatchBlockNumber } from "./watchBlockNumber.js";
import { ExtractAbiEvent } from "abitype";
import { onChainEventSorter } from "../storage/db/onChainEvent.js";
import { formatPercentage } from "../profile/profile.js";

const log = logger.child({
  component: "L2EventsProvider",
});

export class OptimismConstants {
  public static StorageRegistryAddress = "0x000000fC0a4Fccee0b30E360773F7888D1bD9FAA" as const;
  public static KeyRegistryAddress = "0x000000fc6548800fc8265d8eb7061d88cefb87c2" as const;
  public static IdRegistryAddress = "0x000000fc99489b8cd629291d97dbca62b81173c4" as const;
  public static FirstBlock = 108222360; // ~Aug 14 2023 8pm UTC, approx 1.5 weeks before planned migration
  public static ChunkSize = 1000;
  public static ChainId = 10; // OP mainnet
}

const RENT_EXPIRY_IN_SECONDS = 365 * 24 * 60 * 60; // One year

/**
 * Class that follows the Optimism chain to handle on-chain events from the Storage Registry contract.
 */
export class L2EventsProvider {
  private _hub: HubInterface;
  private _publicClient: PublicClient;

  private _firstBlock: number;
  private _chunkSize: number;
  private _chainId: number;
  private _rentExpiry: number;
  private _resyncEvents: boolean;

  private _onChainEventsByBlock: Map<number, Array<OnChainEvent>>;
  private _retryDedupMap: Map<number, boolean>;
  private _blockTimestampsCache: Map<string, number>;

  private _lastBlockNumber: number;

  private _watchStorageContractEvents: WatchContractEvent<typeof StorageRegistry.abi, string, true>;
  private _watchKeyRegistryContractEvents: WatchContractEvent<typeof KeyRegistry.abi, string, true>;
  private _watchIdRegistryContractEvents: WatchContractEvent<typeof IdRegistryV2.abi, string, true>;
  private _watchBlockNumber: WatchBlockNumber;

  // Whether the historical events have been synced. This is used to avoid syncing the events multiple times.
  private _isHistoricalSyncDone = false;

  // Number of blocks to wait before processing an event. This is hardcoded to
  // 6 for now, because that's the threshold beyond which blocks are unlikely
  // to reorg anymore. 6 blocks represents ~72 seconds on Goerli, so the delay
  // is not too long.
  static numConfirmations = 2;

  // Events are only processed after `numConfirmations` blocks have been confirmed; poll less
  // frequently while ensuring events are available the moment they are
  // confirmed.
  static eventPollingInterval = Math.max(L2EventsProvider.numConfirmations - 2, 1) * 10_000;
  static blockPollingInterval = 4_000;

  constructor(
    hub: HubInterface,
    publicClient: PublicClient,
    storageRegistryAddress: `0x${string}`,
    keyRegistryAddress: `0x${string}`,
    idRegistryAddress: `0x${string}`,
    firstBlock: number,
    chunkSize: number,
    chainId: number,
    resyncEvents: boolean,
    expiryOverride?: number,
  ) {
    this._hub = hub;
    this._publicClient = publicClient;
    this._firstBlock = firstBlock;
    this._chunkSize = chunkSize;
    this._chainId = chainId;
    this._resyncEvents = resyncEvents;
    this._rentExpiry = expiryOverride ?? RENT_EXPIRY_IN_SECONDS;

    this._lastBlockNumber = 0;

    // Initialize the cache for the Storage Registry events. They will be processed after
    // numConfirmations blocks have been mined.
    this._onChainEventsByBlock = new Map();
    this._retryDedupMap = new Map();
    this._blockTimestampsCache = new Map();

    // Setup StorageRegistry contract
    this._watchStorageContractEvents = new WatchContractEvent(
      this._publicClient,
      {
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        onLogs: this.processStorageEvents.bind(this),
        pollingInterval: L2EventsProvider.eventPollingInterval,
        strict: true,
      },
      "StorageRegistry",
    );

    this._watchKeyRegistryContractEvents = new WatchContractEvent(
      this._publicClient,
      {
        address: keyRegistryAddress,
        abi: KeyRegistry.abi,
        onLogs: this.processKeyRegistryEvents.bind(this),
        pollingInterval: L2EventsProvider.eventPollingInterval,
        strict: true,
      },
      "KeyRegistry",
    );

    this._watchIdRegistryContractEvents = new WatchContractEvent(
      this._publicClient,
      {
        address: idRegistryAddress,
        abi: IdRegistryV2.abi,
        onLogs: this.processIdRegistryEvents.bind(this),
        pollingInterval: L2EventsProvider.eventPollingInterval,
        strict: true,
      },
      "IdRegistry",
    );

    this._watchBlockNumber = new WatchBlockNumber(this._publicClient, {
      pollingInterval: L2EventsProvider.blockPollingInterval,
      onBlockNumber: (blockNumber) => this.handleNewBlock(Number(blockNumber)),
      onError: (error) => {
        log.error(`Error watching new block numbers: ${error}`, { error });
      },
    });

    if (expiryOverride) {
      log.warn(`Overriding rent expiry to ${expiryOverride} seconds`);
    }
  }

  /**
   *
   * Build an L2 Events Provider for the ID Registry and Name Registry contracts.
   */
  public static build(
    hub: HubInterface,
    l2RpcUrl: string,
    rankRpcs: boolean,
    storageRegistryAddress: `0x${string}`,
    keyRegistryAddress: `0x${string}`,
    idRegistryAddress: `0x${string}`,
    firstBlock: number,
    chunkSize: number,
    chainId: number,
    resyncEvents: boolean,
    expiryOverride?: number,
  ): L2EventsProvider {
    const l2RpcUrls = l2RpcUrl.split(",");
    const transports = l2RpcUrls.map((url) => http(url, { retryCount: 10 }));

    const publicClient = createPublicClient({
      chain: optimismGoerli,
      transport: fallback(transports, { rank: rankRpcs }),
    });

    const provider = new L2EventsProvider(
      hub,
      publicClient,
      storageRegistryAddress,
      keyRegistryAddress,
      idRegistryAddress,
      firstBlock,
      chunkSize,
      chainId,
      resyncEvents,
      expiryOverride,
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
    this._watchStorageContractEvents.start();
    this._watchKeyRegistryContractEvents.start();
    this._watchIdRegistryContractEvents.start();
  }

  public async stop() {
    this._watchStorageContractEvents.stop();
    this._watchKeyRegistryContractEvents.stop();
    this._watchIdRegistryContractEvents.stop();
    this._watchBlockNumber.stop();

    // Wait for all async promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async processStorageEvents(
    // rome-ignore lint/suspicious/noExplicitAny: workaround viem bug
    logs: OnLogsParameter<any, true, string>,
  ) {
    for (const event of logs) {
      const { blockNumber, blockHash, transactionHash, transactionIndex, address } = event;

      // Do nothing if the block is pending
      if (blockHash === null || blockNumber === null || transactionHash === null || transactionIndex === null) {
        continue;
      }

      // Handling: use try-catch + log since errors are expected and not important to surface
      try {
        if (event.eventName === "Rent") {
          // Fix when viem fixes https://github.com/wagmi-dev/viem/issues/938
          const rentEvent = event as Log<
            bigint,
            number,
            ExtractAbiEvent<typeof StorageRegistry.abi, "Rent">,
            true,
            typeof StorageRegistry.abi
          >;
          const blockTimestamp = await this._getBlockTimestamp(blockHash);
          const blockTimeAsFarcasterTime = toFarcasterTime(blockTimestamp * 1000);
          if (blockTimeAsFarcasterTime.isErr()) {
            log.error(blockTimeAsFarcasterTime.error, "failed to parse block timestamp");
            continue;
          }
          const expiry = blockTimeAsFarcasterTime.value + this._rentExpiry;
          const storageRentEventBody = StorageRentEventBody.create({
            payer: hexStringToBytes(rentEvent.args.payer)._unsafeUnwrap(),
            units: Number(rentEvent.args.units),
            expiry: expiry,
          });
          await this.cacheOnChainEvent(
            OnChainEventType.EVENT_TYPE_STORAGE_RENT,
            rentEvent.args.fid,
            blockNumber,
            blockHash,
            transactionHash,
            transactionIndex,
            undefined,
            undefined,
            undefined,
            storageRentEventBody,
          );
        }
      } catch (e) {
        log.error(e);
        log.error({ event }, "failed to parse event args");
      }
    }
  }

  private async processKeyRegistryEvents(
    // rome-ignore lint/suspicious/noExplicitAny: workaround viem bug
    logs: OnLogsParameter<any, true, string>,
  ) {
    for (const event of logs) {
      const { blockNumber, blockHash, transactionHash, transactionIndex } = event;

      // Do nothing if the block is pending
      if (blockHash === null || blockNumber === null || transactionHash === null || transactionIndex === null) {
        continue;
      }

      // Handling: use try-catch + log since errors are expected and not important to surface
      try {
        if (event.eventName === "Add") {
          const addEvent = event as Log<
            bigint,
            number,
            ExtractAbiEvent<typeof KeyRegistry.abi, "Add">,
            true,
            typeof KeyRegistry.abi
          >;
          const signerEventBody = SignerEventBody.create({
            eventType: SignerEventType.ADD,
            key: hexStringToBytes(addEvent.args.keyBytes)._unsafeUnwrap(),
            scheme: addEvent.args.scheme,
            metadata: hexStringToBytes(addEvent.args.metadata)._unsafeUnwrap(),
          });
          await this.cacheOnChainEvent(
            OnChainEventType.EVENT_TYPE_SIGNER,
            addEvent.args.fid,
            blockNumber,
            blockHash,
            transactionHash,
            transactionIndex,
            signerEventBody,
          );
        } else if (event.eventName === "Remove") {
          const removeEvent = event as Log<
            bigint,
            number,
            ExtractAbiEvent<typeof KeyRegistry.abi, "Remove">,
            true,
            typeof KeyRegistry.abi
          >;
          const signerEventBody = SignerEventBody.create({
            eventType: SignerEventType.REMOVE,
            key: hexStringToBytes(removeEvent.args.keyBytes)._unsafeUnwrap(),
          });
          await this.cacheOnChainEvent(
            OnChainEventType.EVENT_TYPE_SIGNER,
            removeEvent.args.fid,
            blockNumber,
            blockHash,
            transactionHash,
            transactionIndex,
            signerEventBody,
          );
        } else if (event.eventName === "AdminReset") {
          const resetEvent = event as Log<
            bigint,
            number,
            ExtractAbiEvent<typeof KeyRegistry.abi, "AdminReset">,
            true,
            typeof KeyRegistry.abi
          >;
          const signerEventBody = SignerEventBody.create({
            eventType: SignerEventType.ADMIN_RESET,
            key: hexStringToBytes(resetEvent.args.keyBytes)._unsafeUnwrap(),
          });
          await this.cacheOnChainEvent(
            OnChainEventType.EVENT_TYPE_SIGNER,
            resetEvent.args.fid,
            blockNumber,
            blockHash,
            transactionHash,
            transactionIndex,
            signerEventBody,
          );
        } else if (event.eventName === "Migrated") {
          const migratedEvent = event as Log<
            bigint,
            number,
            ExtractAbiEvent<typeof KeyRegistry.abi, "Migrated">,
            true,
            typeof KeyRegistry.abi
          >;
          await this.cacheOnChainEvent(
            OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED,
            0n,
            blockNumber,
            blockHash,
            transactionHash,
            transactionIndex,
            undefined,
            SignerMigratedEventBody.create({ migratedAt: Number(migratedEvent.args.keysMigratedAt) }),
          );
        }
      } catch (e) {
        log.error(e);
        log.error({ event }, "failed to parse signer event args");
      }
    }
  }

  private async processIdRegistryEvents(
    // rome-ignore lint/suspicious/noExplicitAny: workaround viem bug
    logs: OnLogsParameter<any, true, string>,
  ) {
    for (const event of logs) {
      const { blockNumber, blockHash, transactionHash, transactionIndex } = event;

      // Do nothing if the block is pending
      if (blockHash === null || blockNumber === null || transactionHash === null || transactionIndex === null) {
        continue;
      }

      // Handling: use try-catch + log since errors are expected and not important to surface
      try {
        if (event.eventName === "Register") {
          const registerEvent = event as Log<
            bigint,
            number,
            ExtractAbiEvent<typeof IdRegistryV2.abi, "Register">,
            true,
            typeof IdRegistryV2.abi
          >;
          const idRegisterEventBody = IdRegisterEventBody.create({
            eventType: IdRegisterEventType.REGISTER,
            to: hexStringToBytes(registerEvent.args.to)._unsafeUnwrap(),
            recoveryAddress: hexStringToBytes(registerEvent.args.recovery)._unsafeUnwrap(),
          });
          await this.cacheOnChainEvent(
            OnChainEventType.EVENT_TYPE_ID_REGISTER,
            registerEvent.args.id,
            blockNumber,
            blockHash,
            transactionHash,
            transactionIndex,
            undefined,
            undefined,
            idRegisterEventBody,
          );
        } else if (event.eventName === "Transfer") {
          const transferEvent = event as Log<
            bigint,
            number,
            ExtractAbiEvent<typeof IdRegistryV2.abi, "Transfer">,
            true,
            typeof IdRegistryV2.abi
          >;
          const idRegisterEventBody = IdRegisterEventBody.create({
            eventType: IdRegisterEventType.TRANSFER,
            to: hexStringToBytes(transferEvent.args.to)._unsafeUnwrap(),
            from: hexStringToBytes(transferEvent.args.from)._unsafeUnwrap(),
          });
          await this.cacheOnChainEvent(
            OnChainEventType.EVENT_TYPE_ID_REGISTER,
            0n,
            blockNumber,
            blockHash,
            transactionHash,
            transactionIndex,
            undefined,
            undefined,
            idRegisterEventBody,
          );
        } else if (event.eventName === "ChangeRecoveryAddress") {
          const transferEvent = event as Log<
            bigint,
            number,
            ExtractAbiEvent<typeof IdRegistryV2.abi, "ChangeRecoveryAddress">,
            true,
            typeof IdRegistryV2.abi
          >;
          const idRegisterEventBody = IdRegisterEventBody.create({
            eventType: IdRegisterEventType.CHANGE_RECOVERY,
            recoveryAddress: hexStringToBytes(transferEvent.args.recovery)._unsafeUnwrap(),
          });
          await this.cacheOnChainEvent(
            OnChainEventType.EVENT_TYPE_ID_REGISTER,
            transferEvent.args.id,
            blockNumber,
            blockHash,
            transactionHash,
            transactionIndex,
            undefined,
            undefined,
            idRegisterEventBody,
          );
        }
      } catch (e) {
        log.error(e);
        log.error({ event }, "failed to parse signer event args");
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

    log.info({ latestBlock: latestBlock }, "connected to optimism node");

    // Find how how much we need to sync
    let lastSyncedBlock = this._firstBlock;

    const hubState = await this._hub.getHubState();
    if (hubState.isOk() && hubState.value.lastL2Block) {
      lastSyncedBlock = hubState.value.lastL2Block;
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
      await this.syncHistoricalEvents(lastSyncedBlock, toBlock, this._chunkSize);
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

    // Sync old events
    await this.syncHistoricalEvents(blockNumber, blockNumber + 1, 1);
  }

  /**
   * Sync old Storage events that may have happened before hub was started. We'll put them all
   * in the sync queue to be processed later, to make sure we don't process any unconfirmed events.
   */
  private async syncHistoricalEvents(fromBlock: number, toBlock: number, batchSize: number) {
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
    const totalBlocks = toBlock - fromBlock;
    const numOfRuns = Math.ceil(totalBlocks / batchSize);

    for (let i = 0; i < numOfRuns; i++) {
      this._blockTimestampsCache.clear(); // Clear the cache for each block to avoid unbounded growth
      let nextFromBlock = fromBlock + i * batchSize;
      const nextToBlock = nextFromBlock + batchSize;

      if (i > 0) {
        // If this isn't our first loop, we need to up the fromBlock by 1, or else we will be re-caching an already cached block.
        nextFromBlock += 1;
      }
      log.info(
        { fromBlock: nextFromBlock, toBlock: nextToBlock },
        `syncing events (${formatPercentage((nextFromBlock - fromBlock) / totalBlocks)})`,
      );

      const idFilter = await this._publicClient.createContractEventFilter({
        address: OptimismConstants.IdRegistryAddress,
        abi: IdRegistryV2.abi,
        fromBlock: BigInt(nextFromBlock),
        toBlock: BigInt(nextToBlock),
        strict: true,
      });
      const idLogsPromise = this._publicClient.getFilterLogs({ filter: idFilter });

      const storageFilter = await this._publicClient.createContractEventFilter({
        address: OptimismConstants.StorageRegistryAddress,
        abi: StorageRegistry.abi,
        fromBlock: BigInt(nextFromBlock),
        toBlock: BigInt(nextToBlock),
        strict: true,
      });
      const storageLogsPromise = this._publicClient.getFilterLogs({
        filter: storageFilter,
      });

      const keyFilter = await this._publicClient.createContractEventFilter({
        address: OptimismConstants.KeyRegistryAddress,
        abi: KeyRegistry.abi,
        fromBlock: BigInt(nextFromBlock),
        toBlock: BigInt(nextToBlock),
        strict: true,
      });
      const keyLogsPromise = this._publicClient.getFilterLogs({ filter: keyFilter });

      await this.processIdRegistryEvents(await idLogsPromise);
      await this.processStorageEvents(await storageLogsPromise);
      await this.processKeyRegistryEvents(await keyLogsPromise);
    }
  }

  /** Handle a new block. Processes all events in the cache that have now been confirmed */
  private async handleNewBlock(blockNumber: number) {
    log.info({ blockNumber }, `new block: ${blockNumber}`);

    // Get all blocks that have been confirmed into a single array and sort.
    const cachedBlocksSet = new Set([...this._onChainEventsByBlock.keys()]);
    const cachedBlocks = Array.from(cachedBlocksSet);
    cachedBlocks.sort();

    for (const cachedBlock of cachedBlocks) {
      if (cachedBlock + L2EventsProvider.numConfirmations <= blockNumber) {
        const onChainEvents = this._onChainEventsByBlock.get(cachedBlock);
        this._onChainEventsByBlock.delete(cachedBlock);
        if (onChainEvents) {
          for (const onChainEvent of onChainEvents.sort(onChainEventSorter)) {
            await this._hub.submitOnChainEvent(onChainEvent, "l2-provider");
          }
        }

        this._retryDedupMap.delete(cachedBlock);
      }
    }

    // Update the last synced block if all the historical events have been synced
    if (this._isHistoricalSyncDone) {
      const hubState = await this._hub.getHubState();
      if (hubState.isOk()) {
        hubState.value.lastL2Block = blockNumber;
        await this._hub.putHubState(hubState.value);
      } else {
        log.error({ errCode: hubState.error.errCode }, `failed to get hub state: ${hubState.error.message}`);
      }
    }

    this._blockTimestampsCache.clear(); // Clear the cache periodically to avoid unbounded growth
    this._lastBlockNumber = blockNumber;
  }

  private async cacheOnChainEvent(
    type: OnChainEventType,
    fid: bigint,
    blockNumBigInt: bigint,
    blockHash: string,
    transactionHash: string,
    index: number,
    signerEventBody?: SignerEventBody,
    signerMigratedEventBody?: SignerMigratedEventBody,
    idRegisterEventBody?: IdRegisterEventBody,
    storageRentEventBody?: StorageRentEventBody,
  ): HubAsyncResult<void> {
    const blockNumber = Number(blockNumBigInt);
    const logEvent = log.child({ event: { type, blockNumber } });
    const serialized = Result.combine([hexStringToBytes(blockHash), hexStringToBytes(transactionHash)]);

    if (serialized.isErr()) {
      logEvent.error({ errCode: serialized.error.errCode }, `cacheOnChainEvent error: ${serialized.error.message}`);
      return err(serialized.error);
    }

    const [blockHashBytes, transactionHashBytes] = serialized.value;
    const timestamp = await this._getBlockTimestamp(blockHash);

    const onChainEvent = OnChainEvent.create({
      type,
      chainId: this._chainId,
      fid: Number(fid),
      blockNumber: Number(blockNumber),
      blockHash: blockHashBytes,
      blockTimestamp: timestamp,
      transactionHash: transactionHashBytes,
      logIndex: index,
      signerEventBody: signerEventBody,
      signerMigratedEventBody: signerMigratedEventBody,
      idRegisterEventBody: idRegisterEventBody,
      storageRentEventBody: storageRentEventBody,
    });

    // Add it to the cache
    let onChainEvents = this._onChainEventsByBlock.get(blockNumber);
    if (!onChainEvents) {
      onChainEvents = [];
      this._onChainEventsByBlock.set(blockNumber, onChainEvents);
    }
    onChainEvents.push(onChainEvent);

    logEvent.info(
      `cacheOnChainEvent: recorded ${onChainEventTypeToJSON(type)} for fid: ${fid} in block ${blockNumber}`,
    );

    return ok(undefined);
  }

  private async _getBlockTimestamp(blockHash: string): Promise<number> {
    const cachedTimestamp = this._blockTimestampsCache.get(blockHash);
    if (cachedTimestamp) {
      return cachedTimestamp;
    }
    const block = await this._publicClient.getBlock({
      blockHash: blockHash as `0x${string}`,
    });
    const timestamp = Number(block.timestamp);
    this._blockTimestampsCache.set(blockHash, timestamp);
    return timestamp;
  }
}
