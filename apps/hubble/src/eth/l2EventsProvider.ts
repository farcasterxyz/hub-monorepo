import {
  bigIntToBytes,
  hexStringToBytes,
  HubAsyncResult,
  HubState,
  RentRegistryEvent,
  StorageAdminRegistryEvent,
  StorageRegistryEventType,
} from '@farcaster/hub-nodejs';
import { AbstractProvider, Contract, ContractEventPayload, EthersError, EventLog } from 'ethers';
import { Err, err, Ok, ok, Result, ResultAsync } from 'neverthrow';
import { StorageRegistry } from './abis.js';
import { HubInterface } from '../hubble.js';
import { logger } from '../utils/logger.js';

const log = logger.child({
  component: 'L2EventsProvider',
});

export class OPGoerliEthConstants {
  public static StorageRegistryAddress = '0x0000000000000000000000000000000000000000';
  public static FirstBlock = 7648795;
  public static ChunkSize = 10000;
  public static chainId = BigInt(420); // OP Goerli
}

/**
 * Class that follows the Optimism chain to handle on-chain events from the Storage Registry contract.
 */
export class L2EventsProvider {
  private _hub: HubInterface;
  private _jsonRpcProvider: AbstractProvider;

  private _storageRegistryContract: Contract;
  private _firstBlock: number;
  private _chunkSize: number;
  private _resyncEvents: boolean;

  private _numConfirmations: number;

  private _rentEventsByBlock: Map<number, Array<RentRegistryEvent>>;
  private _storageAdminEventsByBlock: Map<number, Array<StorageAdminRegistryEvent>>;
  private _retryDedupMap: Map<number, boolean>;

  private _lastBlockNumber: number;
  private _ethersPromiseCacheDelayMS: number;

  // Whether the historical events have been synced. This is used to avoid syncing the events multiple times.
  private _isHistoricalSyncDone = false;

  constructor(
    hub: HubInterface,
    jsonRpcProvider: AbstractProvider,
    storageRegistryContract: Contract,
    firstBlock: number,
    chunkSize: number,
    resyncEvents: boolean,
    ethersPromiseCacheDelayMS = 250
  ) {
    this._hub = hub;
    this._jsonRpcProvider = jsonRpcProvider;
    this._storageRegistryContract = storageRegistryContract;
    this._firstBlock = firstBlock;
    this._chunkSize = chunkSize;
    this._resyncEvents = resyncEvents;
    this._ethersPromiseCacheDelayMS = ethersPromiseCacheDelayMS;

    // Number of blocks to wait before processing an event.
    // This is hardcoded to 6 for now, because that's the threshold beyond which blocks are unlikely to reorg anymore.
    // 6 blocks represents ~72 seconds on Goerli, so the delay is not too long.
    this._numConfirmations = 6;

    this._lastBlockNumber = 0;

    // Initialize the cache for the Storage Registry events. They will be processed after
    // numConfirmations blocks have been mined.
    this._rentEventsByBlock = new Map();
    this._storageAdminEventsByBlock = new Map();
    this._retryDedupMap = new Map();

    // Setup StorageRegistry contract
    this._storageRegistryContract.on(
      'Rent',
      (payer: string, fid: bigint, units: bigint, event: ContractEventPayload) => {
        this.cacheRentRegistryEvent(payer, fid, units, StorageRegistryEventType.RENT, event.log);
      }
    );
    // this._storageRegistryContract.on(
    //   'SetDeprecationTimestamp',
    //   (oldTimestamp: bigint, newTimestamp: bigint, event: ContractEventPayload) => {
    //     this.cacheStorageAdminRegistryEvent(
    //       oldTimestamp,
    //       newTimestamp,
    //       StorageRegistryEventType.SET_DEPRECATION_TIMESTAMP,
    //       event.log
    //     );
    //   }
    // );
    // this._storageRegistryContract.on(
    //   'SetGracePeriod',
    //   (oldPeriod: bigint, newPeriod: bigint, event: ContractEventPayload) => {
    //     this.cacheStorageAdminRegistryEvent(oldPeriod, newPeriod, StorageRegistryEventType.SET_GRACE_PERIOD, event.log);
    //   }
    // );
    // this._storageRegistryContract.on('SetMaxUnits', (oldMax: bigint, newMax: bigint, event: ContractEventPayload) => {
    //   this.cacheStorageAdminRegistryEvent(oldMax, newMax, StorageRegistryEventType.SET_MAX_UNITS, event.log);
    // });
    // this._storageRegistryContract.on('SetPrice', (oldPrice: bigint, newPrice: bigint, event: ContractEventPayload) => {
    //   this.cacheStorageAdminRegistryEvent(oldPrice, newPrice, StorageRegistryEventType.SET_PRICE, event.log);
    // });

    // Set up block listener to confirm blocks
    this._jsonRpcProvider.on('block', (blockNumber: number) => this.handleNewBlock(blockNumber));
  }

  /**
   *
   * Build an L2 Events Provider for the ID Registry and Name Registry contracts.
   */
  public static build(
    hub: HubInterface,
    rpcProvider: AbstractProvider,
    storageRegistry: string | Contract,
    firstBlock: number,
    chunkSize: number,
    resyncEvents: boolean,
    ethersPromiseCacheDelayMS = 250
  ): L2EventsProvider {
    const storageRegistryContract = (storageRegistry as Contract).target
      ? (storageRegistry as Contract)
      : new Contract(storageRegistry as string, StorageRegistry.abi, rpcProvider);

    const provider = new L2EventsProvider(
      hub,
      rpcProvider,
      storageRegistryContract,
      firstBlock,
      chunkSize,
      resyncEvents,
      ethersPromiseCacheDelayMS
    );

    return provider;
  }

  public getLatestBlockNumber(): number {
    return this._lastBlockNumber;
  }

  public async start() {
    // Connect to L2 RPC
    await this.connectAndSyncHistoricalEvents();
  }

  public async stop() {
    this._storageRegistryContract.removeAllListeners();
    this._jsonRpcProvider.removeAllListeners();
    this._jsonRpcProvider._forEachSubscriber((s) => s.stop());

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

  /** Connect to Ethereum RPC */
  private async connectAndSyncHistoricalEvents() {
    const latestBlockResult = await this.executeCallAsPromiseWithRetry(
      () => this._jsonRpcProvider.getBlock('latest'),
      (err) => err
    );
    if (latestBlockResult.isErr()) {
      log.error(
        { err: latestBlockResult.error },
        'failed to connect to optimism node. Check your eth RPC URL (e.g. --l2-rpc-url)'
      );
      return;
    }

    const network = await this.executeCallAsPromiseWithRetry(
      () => this._jsonRpcProvider.getNetwork(),
      (err) => err
    );

    if (network.isErr() || network.value.chainId !== OPGoerliEthConstants.chainId) {
      log.error({ err: network.isErr() ? network.error : `Wrong network ${network.value.chainId}` }, 'Bad network');
      return;
    }

    const latestBlock = latestBlockResult.value;

    if (!latestBlock) {
      log.error('failed to get the latest block from the RPC provider');
      return;
    }

    log.info({ latestBlock: latestBlock.number, network: network.value.chainId }, 'connected to optimism node');

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

    log.info({ lastSyncedBlock }, 'last synced block');
    const toBlock = latestBlock.number;

    // Sync old Rent events
    await this.syncHistoricalRentEvents(StorageRegistryEventType.RENT, lastSyncedBlock, toBlock, this._chunkSize);

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

    // Sync old Rent events
    await this.syncHistoricalRentEvents(StorageRegistryEventType.RENT, blockNumber, blockNumber + 1, 1);
  }

  /**
   * Sync old Rent events that may have happened before hub was started. We'll put them all
   * in the sync queue to be processed later, to make sure we don't process any unconfirmed events.
   */
  private async syncHistoricalRentEvents(
    type: StorageRegistryEventType,
    fromBlock: number,
    toBlock: number,
    batchSize: number
  ) {
    if (type !== StorageRegistryEventType.RENT) throw new Error('unsupported event type');

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

      const oldRentBatchEvents = await this.executeCallAsPromiseWithRetry(
        // Safety: queryFilter will always return EventLog as long as the ABI is valid
        () =>
          this._storageRegistryContract.queryFilter('Rent', Number(nextFromBlock), Number(nextToBlock)) as Promise<
            EventLog[]
          >,
        (e) => e
      );

      if (oldRentBatchEvents.isErr()) {
        // If we still hit an error, just log the error and return
        log.error({ err: oldRentBatchEvents.error }, 'failed to get old Rent events');
        return;
      }

      for (const event of oldRentBatchEvents.value) {
        if (type === StorageRegistryEventType.RENT) {
          // Handling: use try-catch + log since errors are expected and not important to surface
          try {
            const payer: string = event.args.at(0);
            const fid = BigInt(event.args.at(1));
            const units = BigInt(event.args.at(2));
            await this.cacheRentRegistryEvent(payer, fid, units, StorageRegistryEventType.RENT, event);
          } catch (e) {
            log.error({ event }, 'failed to parse event args');
          }
        }
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
      if (cachedBlock + this._numConfirmations <= blockNumber) {
        const rentEvents = this._rentEventsByBlock.get(cachedBlock);
        this._rentEventsByBlock.delete(cachedBlock);

        if (rentEvents) {
          for (const rentEvent of rentEvents) {
            await this._hub.submitRentRegistryEvent(rentEvent, 'l2-provider');
          }
        }

        const storageAdminEvents = this._storageAdminEventsByBlock.get(cachedBlock);
        this._storageAdminEventsByBlock.delete(cachedBlock);

        if (storageAdminEvents) {
          for (const storageAdminEvent of storageAdminEvents) {
            await this._hub.submitStorageAdminRegistryEvent(storageAdminEvent, 'l2-provider');
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
    eventLog: EventLog
  ): HubAsyncResult<void> {
    const { blockNumber, blockHash, transactionHash, index } = eventLog;

    const logEvent = log.child({ event: { fid, blockNumber } });

    const serialized = Result.combine([
      hexStringToBytes(blockHash),
      hexStringToBytes(transactionHash),
      payer && payer.length > 0 ? hexStringToBytes(payer) : ok(new Uint8Array()),
      bigIntToBytes(fid),
      bigIntToBytes(units),
    ]);

    if (serialized.isErr()) {
      logEvent.error(
        { errCode: serialized.error.errCode },
        `cacheRentRegistryEvent error: ${serialized.error.message}`
      );
      return err(serialized.error);
    }

    const [blockHashBytes, transactionHashBytes, payerBytes, fidBytes, unitsBytes] = serialized.value;

    const rentRegistryEvent = RentRegistryEvent.create({
      blockNumber,
      blockHash: blockHashBytes,
      transactionHash: transactionHashBytes,
      logIndex: index,
      payer: payerBytes,
      fid: Buffer.from(fidBytes).readIntBE(0, 8),
      units: Buffer.from(unitsBytes).readIntBE(0, 8),
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

  private async executeCallAsPromiseWithRetry<T, E>(
    call: () => Promise<T>,
    errorFn: (e: unknown) => E,
    attempt = 1
  ): Promise<Result<T, E>> {
    const result = await ResultAsync.fromPromise(call(), (err) => err);

    if (result.isErr()) {
      const err = result.error as EthersError;
      if (err && err.code)
        switch (err.code) {
          // non-request-specific ethers errors:
          case 'UNKNOWN_ERROR':
          case 'BAD_DATA':
          case 'SERVER_ERROR':
          case 'NETWORK_ERROR':
          case 'TIMEOUT':
          case 'OFFCHAIN_FAULT':
            if (attempt !== 3) {
              const logger = log.child({ event: { rpcError: err.code } });
              logger.warn(`l2RPCError: RPC returned response ${err.message}, retrying (attempt ${attempt}).`);

              // delay is required because ethers caches results from promises for 250ms, also exponential backoff
              await new Promise<void>((resolve) =>
                setTimeout(() => {
                  resolve();
                }, this._ethersPromiseCacheDelayMS * Math.pow(attempt, attempt) + 1)
              );

              return await this.executeCallAsPromiseWithRetry(call, errorFn, attempt + 1);
            }
            break;
        }

      return new Err(errorFn(result.error));
    }

    return new Ok(result.value);
  }
}
