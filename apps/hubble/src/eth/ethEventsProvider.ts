import {
  bytesToUtf8String,
  hexStringToBytes,
  HubAsyncResult,
  HubError,
  IdRegistryEvent,
  IdRegistryEventType,
  NameRegistryEvent,
  NameRegistryEventType,
  toFarcasterTime,
} from '@farcaster/hub-nodejs';
import { createPublicClient, http, Log, PublicClient } from 'viem';
import { goerli } from 'viem/chains';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import { IdRegistry, NameRegistry } from './abis.js';
import { bytes32ToBytes, bytesToBytes32 } from './utils.js';
import { HubInterface } from '../hubble.js';
import { logger } from '../utils/logger.js';
import { WatchContractEvent } from './watchContractEvent.js';
import { WatchBlockNumber } from './watchBlockNumber.js';

const log = logger.child({
  component: 'EthEventsProvider',
});

export class GoerliEthConstants {
  public static IdRegistryAddress = '0xda107a1caf36d198b12c16c7b6a1d1c795978c42' as const;
  public static NameRegistryAddress = '0xe3be01d99baa8db9905b33a3ca391238234b79d1' as const;
  public static FirstBlock = 7648795;
  public static ChunkSize = 10000;
}

type NameRegistryRenewEvent = Omit<NameRegistryEvent, 'to' | 'from'>;

/**
 * Class that follows the Ethereum chain to handle on-chain events from the ID
 * Registry and Name Registry contracts.
 */
export class EthEventsProvider {
  private _hub: HubInterface;
  private _publicClient: PublicClient;

  private _firstBlock: number;
  private _chunkSize: number;
  private _resyncEvents: boolean;

  private _idEventsByBlock: Map<number, Array<IdRegistryEvent>>;
  private _nameEventsByBlock: Map<number, Array<NameRegistryEvent>>;
  private _renewEventsByBlock: Map<number, Array<NameRegistryRenewEvent>>;
  private _retryDedupMap: Map<number, boolean>;

  private _lastBlockNumber: number;

  private _watchNameRegistryTransfers: WatchContractEvent<typeof NameRegistry.abi, 'Transfer', true>;
  private _watchNameRegistryRenews: WatchContractEvent<typeof NameRegistry.abi, 'Renew', true>;
  private _watchIdRegistryRegisters: WatchContractEvent<typeof IdRegistry.abi, 'Register', true>;
  private _watchIdRegistryTransfers: WatchContractEvent<typeof IdRegistry.abi, 'Transfer', true>;
  private _watchBlockNumber: WatchBlockNumber;

  // Whether the historical events have been synced. This is used to avoid
  // syncing the events multiple times.
  private _isHistoricalSyncDone = false;

  // Number of blocks to wait before processing an event. This is hardcoded to
  // 6 for now, because that's the threshold beyond which blocks are unlikely
  // to reorg anymore. 6 blocks represents ~72 seconds on Goerli, so the delay
  // is not too long.
  static numConfirmations = 6;

  // Events are only processed after 6 blocks have been confirmed; poll less
  // frequently while ensuring events are available the moment they are
  // confirmed.
  static eventPollingInterval = (EthEventsProvider.numConfirmations - 2) * 12_000;
  static blockPollingInterval = 4_000;

  constructor(
    hub: HubInterface,
    publicClient: PublicClient,
    idRegistryAddress: `0x${string}`,
    nameRegistryAddress: `0x${string}`,
    firstBlock: number,
    chunkSize: number,
    resyncEvents: boolean
  ) {
    this._hub = hub;
    this._publicClient = publicClient;
    this._firstBlock = firstBlock;
    this._chunkSize = chunkSize;
    this._resyncEvents = resyncEvents;

    this._lastBlockNumber = 0;

    // Initialize the cache for the ID and Name Registry events. They will be
    // processed after numConfirmations blocks have been mined.
    this._nameEventsByBlock = new Map();
    this._idEventsByBlock = new Map();
    this._renewEventsByBlock = new Map();
    this._retryDedupMap = new Map();

    // Setup IdRegistry contract
    this._watchIdRegistryRegisters = new WatchContractEvent(
      this._publicClient,
      {
        address: idRegistryAddress,
        abi: IdRegistry.abi,
        eventName: 'Register',
        onLogs: this.processIdRegisterEvents.bind(this),
        pollingInterval: EthEventsProvider.eventPollingInterval,
        strict: true,
      },
      'IdRegistry Register'
    );

    this._watchIdRegistryTransfers = new WatchContractEvent(
      this._publicClient,
      {
        address: idRegistryAddress,
        abi: IdRegistry.abi,
        eventName: 'Transfer',
        onLogs: this.processIdTransferEvents.bind(this),
        pollingInterval: EthEventsProvider.eventPollingInterval,
        strict: true,
      },
      'IdRegistry Transfer'
    );

    // Setup NameRegistry contract
    this._watchNameRegistryTransfers = new WatchContractEvent(
      this._publicClient,
      {
        address: nameRegistryAddress,
        abi: NameRegistry.abi,
        eventName: 'Transfer' as const,
        onLogs: this.processNameTransferEvents.bind(this),
        pollingInterval: EthEventsProvider.eventPollingInterval,
        strict: true,
      },
      'NameRegistry Transfer'
    );

    this._watchNameRegistryRenews = new WatchContractEvent(
      this._publicClient,
      {
        address: nameRegistryAddress,
        abi: NameRegistry.abi,
        eventName: 'Renew',
        onLogs: this.processNameRenewEvents.bind(this),
        pollingInterval: EthEventsProvider.eventPollingInterval,
        strict: true,
      },
      'NameRegistry Renew'
    );

    this._watchBlockNumber = new WatchBlockNumber(this._publicClient, {
      pollingInterval: EthEventsProvider.blockPollingInterval,
      onBlockNumber: (blockNumber) => this.handleNewBlock(Number(blockNumber)),
      onError: (error) => {
        log.error(`Error watching new block numbers: ${error}`, { error });
      },
    });
  }

  public static build(
    hub: HubInterface,
    ethRpcUrl: string,
    idRegistryAddress: `0x${string}`,
    nameRegistryAddress: `0x${string}`,
    firstBlock: number,
    chunkSize: number,
    resyncEvents: boolean
  ): EthEventsProvider {
    const publicClient = createPublicClient({
      chain: goerli,
      transport: http(ethRpcUrl, { retryCount: 10 }),
    });

    const provider = new EthEventsProvider(
      hub,
      publicClient,
      idRegistryAddress,
      nameRegistryAddress,
      firstBlock,
      chunkSize,
      resyncEvents
    );

    return provider;
  }

  public getLatestBlockNumber(): number {
    return this._lastBlockNumber;
  }

  public async start() {
    // Connect to Ethereum RPC
    await this.connectAndSyncHistoricalEvents();

    this._watchBlockNumber.start();
    this._watchNameRegistryTransfers.start();
    this._watchNameRegistryRenews.start();
    this._watchIdRegistryRegisters.start();
    this._watchIdRegistryTransfers.start();
  }

  public async stop() {
    this._watchNameRegistryTransfers.stop();
    this._watchNameRegistryRenews.stop();
    this._watchIdRegistryRegisters.stop();
    this._watchIdRegistryTransfers.stop();
    this._watchBlockNumber.stop();

    // Wait for all async promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  /** Returns expiry for fname in ms from unix epoch */
  public async getFnameExpiry(fname: Uint8Array): HubAsyncResult<number> {
    const encodedFnameResult = bytesToBytes32(fname);

    if (encodedFnameResult.isErr()) {
      return err(encodedFnameResult.error);
    }

    const expiryResult: Result<bigint, HubError> = await ResultAsync.fromPromise(
      this._publicClient.readContract({
        address: GoerliEthConstants.NameRegistryAddress,
        abi: NameRegistry.abi,
        functionName: 'expiryOf',
        args: [encodedFnameResult.value],
      }),
      (err) => new HubError('unavailable.network_failure', err as Error)
    );

    return expiryResult.map((expiry) => Number(expiry) * 1000);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  /** Connect to Ethereum RPC */
  private async connectAndSyncHistoricalEvents() {
    const latestBlockResult = await ResultAsync.fromPromise(this._publicClient.getBlockNumber(), (err) => err);
    if (latestBlockResult.isErr()) {
      log.error(
        { err: latestBlockResult.error },
        'failed to connect to ethereum node. Check your eth RPC URL (e.g. --eth-rpc-url)'
      );
      return;
    }

    const latestBlock = Number(latestBlockResult.value);

    if (!latestBlock) {
      log.error('failed to get the latest block from the RPC provider');
      return;
    }

    log.info({ latestBlock: latestBlock }, 'connected to ethereum node');

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
    const toBlock = latestBlock;

    if (lastSyncedBlock < toBlock) {
      log.info({ fromBlock: lastSyncedBlock, toBlock }, 'syncing events from missed blocks');

      // Sync old Id events
      await this.syncHistoricalIdEvents(IdRegistryEventType.REGISTER, lastSyncedBlock, toBlock, this._chunkSize);
      await this.syncHistoricalIdEvents(IdRegistryEventType.TRANSFER, lastSyncedBlock, toBlock, this._chunkSize);

      // Sync old Name Transfer events
      await this.syncHistoricalNameEvents(NameRegistryEventType.TRANSFER, lastSyncedBlock, toBlock, this._chunkSize);

      // We don't need to sync historical Renew events because the expiry
      // is pulled when NameRegistryEvents are merged
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
    await this.syncHistoricalIdEvents(IdRegistryEventType.REGISTER, blockNumber, blockNumber + 1, 1);
    await this.syncHistoricalIdEvents(IdRegistryEventType.TRANSFER, blockNumber, blockNumber + 1, 1);

    // Sync old Name Transfer events
    await this.syncHistoricalNameEvents(NameRegistryEventType.TRANSFER, blockNumber, blockNumber + 1, 1);
  }

  /**
   * Sync old Id events that may have happened before hub was started. We'll put them all
   * in the sync queue to be processed later, to make sure we don't process any unconfirmed events.
   */
  private async syncHistoricalIdEvents(
    type: IdRegistryEventType,
    fromBlock: number,
    toBlock: number,
    batchSize: number
  ) {
    /*
     * How querying blocks in batches works
     * We calculate the difference in blocks, for example, lets say we need to sync/cache 769,531 blocks (difference between the contracts FirstBlock, and the latest Goerli block at time of writing, 8418326)
     * After that, we divide our difference in blocks by the batchSize. For example, over 769,531 blocks, at a 10,000 block batchSize, we need to run our loop 76.9531 times, which obviously just rounds up to 77 loops
     * During this whole process, we're using a for(let i=0;) loop, which means to get the correct from block, we need to calculate new fromBlock's and toBlock's on every loop
     * fromBlock: FirstBlock + (loopIndex * batchSize) - Example w/ batchSize 10,000: Run 0 - FirstBlock + 0, Run 1 - FirstBlock + 10,000, Run 2 - FirstBlock + 20,000, etc....
     * toBlock: fromBlock + batchSize - Example w/ batchSize 10,000: Run 0: fromBlock + 10,000, Run 1 - fromBlock + 10,000, etc...
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

      if (type === IdRegistryEventType.REGISTER) {
        const filter = await this._publicClient.createContractEventFilter({
          address: GoerliEthConstants.IdRegistryAddress,
          abi: IdRegistry.abi,
          eventName: 'Register',
          fromBlock: BigInt(nextFromBlock),
          toBlock: BigInt(nextToBlock),
          strict: true,
        });

        const logs = await this._publicClient.getFilterLogs({ filter });
        await this.processIdRegisterEvents(logs);
      } else if (type === IdRegistryEventType.TRANSFER) {
        const filter = await this._publicClient.createContractEventFilter({
          address: GoerliEthConstants.IdRegistryAddress,
          abi: IdRegistry.abi,
          eventName: 'Transfer',
          fromBlock: BigInt(nextFromBlock),
          toBlock: BigInt(nextToBlock),
          strict: true,
        });

        const logs = await this._publicClient.getFilterLogs({ filter });
        await this.processIdTransferEvents(logs);
      }
    }
  }

  /**
   * Sync old Name events that may have happened before hub was started. We'll put them all
   * in the sync queue to be processed later, to make sure we don't process any unconfirmed events.
   */
  private async syncHistoricalNameEvents(
    type: NameRegistryEventType,
    fromBlock: number,
    toBlock: number,
    batchSize: number
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

      if (type === NameRegistryEventType.TRANSFER) {
        const filter = await this._publicClient.createContractEventFilter({
          address: GoerliEthConstants.NameRegistryAddress,
          abi: NameRegistry.abi,
          eventName: 'Transfer',
          fromBlock: BigInt(nextFromBlock),
          toBlock: BigInt(nextToBlock),
          strict: true,
        });

        const logs = await this._publicClient.getFilterLogs({ filter });
        await this.processNameTransferEvents(logs);
      }
    }
  }

  private async processIdTransferEvents(
    logs: Log<bigint, number, undefined, true, typeof IdRegistry.abi, 'Transfer'>[]
  ) {
    for (const event of logs) {
      const { blockNumber, blockHash, transactionHash, transactionIndex } = event;

      // Do nothing if the block is pending
      if (blockHash === null || blockNumber === null || transactionHash === null || transactionIndex === null) {
        continue;
      }

      // Handling: use try-catch + log since errors are expected and not important to surface
      try {
        await this.cacheIdRegistryEvent(
          event.args.from,
          event.args.to,
          event.args.id,
          IdRegistryEventType.TRANSFER,
          Number(blockNumber),
          blockHash,
          transactionHash,
          Number(transactionIndex)
        );
      } catch (e) {
        log.error({ event }, 'failed to parse event args');
      }
    }
  }

  private async processIdRegisterEvents(
    logs: Log<bigint, number, undefined, true, typeof IdRegistry.abi, 'Register'>[]
  ) {
    for (const event of logs) {
      const { blockNumber, blockHash, transactionHash, transactionIndex } = event;

      // Do nothing if the block is pending
      if (blockHash === null || blockNumber === null || transactionHash === null || transactionIndex === null) {
        continue;
      }

      // Handling: use try-catch + log since errors are expected and not important to surface
      try {
        await this.cacheIdRegistryEvent(
          null,
          event.args.to,
          event.args.id,
          IdRegistryEventType.REGISTER,
          Number(blockNumber),
          blockHash,
          transactionHash,
          Number(transactionIndex)
        );
      } catch (e) {
        log.error({ event }, 'failed to parse event args');
      }
    }
  }

  private async processNameTransferEvents(
    logs: Log<bigint, number, undefined, true, typeof NameRegistry.abi, 'Transfer'>[]
  ) {
    for (const event of logs) {
      const { blockNumber, blockHash, transactionHash, transactionIndex } = event;

      // Do nothing if the block is pending
      if (blockHash === null || blockNumber === null || transactionHash === null || transactionIndex === null) {
        continue;
      }

      // Handling: use try-catch + log since errors are expected and not important to surface
      try {
        await this.cacheNameRegistryEvent(
          event.args.from,
          event.args.to,
          event.args.tokenId,
          Number(blockNumber),
          blockHash,
          transactionHash,
          Number(transactionIndex)
        );
      } catch (e) {
        log.error({ event }, 'failed to parse event args');
      }
    }
  }

  private async processNameRenewEvents(logs: Log<bigint, number, undefined, true, typeof NameRegistry.abi, 'Renew'>[]) {
    for (const event of logs) {
      const { blockNumber, blockHash, transactionHash, transactionIndex } = event;

      // Do nothing if the block is pending
      if (blockHash === null || blockNumber === null || transactionHash === null || transactionIndex === null) {
        continue;
      }

      // Handling: use try-catch + log since errors are expected and not important to surface
      try {
        await this.cacheRenewEvent(
          event.args.tokenId,
          event.args.expiry,
          Number(blockNumber),
          blockHash,
          transactionHash,
          Number(transactionIndex)
        );
      } catch (e) {
        log.error({ event }, 'failed to parse event args');
      }
    }
  }

  /** Handle a new block. Processes all events in the cache that have now been confirmed */
  private async handleNewBlock(blockNumber: number) {
    log.info({ blockNumber }, `new block: ${blockNumber}`);

    // Get all blocks that have been confirmed into a single array and sort.
    const cachedBlocksSet = new Set([
      ...this._nameEventsByBlock.keys(),
      ...this._idEventsByBlock.keys(),
      ...this._renewEventsByBlock.keys(),
    ]);
    const cachedBlocks = Array.from(cachedBlocksSet);
    cachedBlocks.sort();

    for (const cachedBlock of cachedBlocks) {
      if (cachedBlock + EthEventsProvider.numConfirmations <= blockNumber) {
        const idEvents = this._idEventsByBlock.get(cachedBlock);
        this._idEventsByBlock.delete(cachedBlock);

        if (idEvents) {
          for (const idEvent of idEvents) {
            await this._hub.submitIdRegistryEvent(idEvent, 'eth-provider');
          }
        }

        const nameEvents = this._nameEventsByBlock.get(cachedBlock);
        this._nameEventsByBlock.delete(cachedBlock);

        if (nameEvents) {
          for (const nameEvent of nameEvents) {
            await this._hub.submitNameRegistryEvent(nameEvent, 'eth-provider');
          }
        }

        const renewEvents = this._renewEventsByBlock.get(cachedBlock);
        this._renewEventsByBlock.delete(cachedBlock);

        if (renewEvents) {
          for (const renewEvent of renewEvents) {
            const nameRegistryEvent = await this._hub.engine.getNameRegistryEvent(renewEvent['fname']);
            if (nameRegistryEvent.isErr()) {
              log.error(
                { blockNumber, errCode: nameRegistryEvent.error.errCode },
                `failed to get event for fname ${bytesToUtf8String(
                  renewEvent['fname']
                )._unsafeUnwrap()} from renew event: ${nameRegistryEvent.error.message}`
              );
              continue;
            }

            const updatedEvent: NameRegistryEvent = {
              ...nameRegistryEvent.value,
              ...renewEvent,
            };

            await this._hub.submitNameRegistryEvent(updatedEvent);
          }
        }

        this._retryDedupMap.delete(cachedBlock);
      }
    }

    // Update the last synced block if all the historical events have been synced
    if (this._isHistoricalSyncDone) {
      const hubState = await this._hub.getHubState();
      if (hubState.isOk()) {
        hubState.value.lastEthBlock = blockNumber;
        await this._hub.putHubState(hubState.value);
      } else {
        log.error({ errCode: hubState.error.errCode }, `failed to get hub state: ${hubState.error.message}`);
      }
    }

    this._lastBlockNumber = blockNumber;
  }

  private async cacheIdRegistryEvent(
    from: string | null,
    to: string,
    id: bigint,
    type: IdRegistryEventType,
    blockNumber: number,
    blockHash: string,
    transactionHash: string,
    index: number
  ): HubAsyncResult<void> {
    const logEvent = log.child({ event: { to, id: id.toString(), blockNumber } });

    const serialized = Result.combine([
      from && from.length > 0 ? hexStringToBytes(from) : ok(new Uint8Array()),
      hexStringToBytes(blockHash),
      hexStringToBytes(transactionHash),
      hexStringToBytes(to),
    ]);

    if (serialized.isErr()) {
      logEvent.error({ errCode: serialized.error.errCode }, `cacheIdRegistryEvent error: ${serialized.error.message}`);
      return err(serialized.error);
    }

    const [fromBytes, blockHashBytes, transactionHashBytes, toBytes] = serialized.value;

    // Construct the protobuf
    const idRegistryEvent = IdRegistryEvent.create({
      blockNumber,
      blockHash: blockHashBytes,
      logIndex: index,
      fid: Number(id),
      to: toBytes,
      transactionHash: transactionHashBytes,
      type,
      from: fromBytes,
    });

    // Add it to the cache
    let idEvents = this._idEventsByBlock.get(blockNumber);
    if (!idEvents) {
      idEvents = [];
      this._idEventsByBlock.set(blockNumber, idEvents);
    }
    idEvents.push(idRegistryEvent);

    log.info(
      { event: { to, id: id.toString(), blockNumber } },
      `cacheIdRegistryEvent: fid ${id.toString()} assigned to ${to} in block ${blockNumber}`
    );

    return ok(undefined);
  }

  private async cacheNameRegistryEvent(
    from: string,
    to: string,
    tokenId: bigint,
    blockNumber: number,
    blockHash: string,
    transactionHash: string,
    index: number
  ): HubAsyncResult<void> {
    const logEvent = log.child({ event: { to, blockNumber } });

    const serialized = Result.combine([
      hexStringToBytes(blockHash),
      hexStringToBytes(transactionHash),
      from && from.length > 0 ? hexStringToBytes(from) : ok(new Uint8Array()),
      hexStringToBytes(to),
      bytes32ToBytes(tokenId),
    ]);

    if (serialized.isErr()) {
      logEvent.error(
        { errCode: serialized.error.errCode },
        `cacheNameRegistryEvent error: ${serialized.error.message}`
      );
      return err(serialized.error);
    }

    const [blockHashBytes, transactionHashBytes, fromBytes, toBytes, fnameBytes] = serialized.value;

    const nameRegistryEvent = NameRegistryEvent.create({
      blockNumber,
      blockHash: blockHashBytes,
      transactionHash: transactionHashBytes,
      logIndex: index,
      fname: fnameBytes,
      from: fromBytes,
      to: toBytes,
      type: NameRegistryEventType.TRANSFER,
    });

    // Add it to the cache
    let nameEvents = this._nameEventsByBlock.get(blockNumber);
    if (!nameEvents) {
      nameEvents = [];
      this._nameEventsByBlock.set(blockNumber, nameEvents);
    }
    nameEvents.push(nameRegistryEvent);

    logEvent.info(`cacheNameRegistryEvent: token id ${tokenId.toString()} assigned to ${to} in block ${blockNumber}`);

    return ok(undefined);
  }

  private async cacheRenewEvent(
    tokenId: bigint,
    expiry: bigint,
    blockNumber: number,
    blockHash: string,
    transactionHash: string,
    index: number
  ): HubAsyncResult<void> {
    const logEvent = log.child({ event: { blockNumber } });

    const serialized = Result.combine([
      hexStringToBytes(blockHash),
      hexStringToBytes(transactionHash),
      bytes32ToBytes(tokenId),
      toFarcasterTime(Number(expiry)),
    ]);

    if (serialized.isErr()) {
      logEvent.error({ errCode: serialized.error.errCode }, `cacheRenewEvent error: ${serialized.error.message}`);
      return err(serialized.error);
    }

    const [blockHashBytes, transactionHashBytes, fnameBytes, farcasterTimeExpiry] = serialized.value;

    const renewEvent: NameRegistryRenewEvent = {
      blockNumber,
      blockHash: blockHashBytes,
      transactionHash: transactionHashBytes,
      logIndex: index,
      fname: fnameBytes,
      type: NameRegistryEventType.RENEW,
      expiry: farcasterTimeExpiry,
    };

    // Add it to the cache
    let renewEvents = this._renewEventsByBlock.get(blockNumber);
    if (!renewEvents) {
      renewEvents = [];
      this._renewEventsByBlock.set(blockNumber, renewEvents);
    }
    renewEvents.push(renewEvent);

    logEvent.info(`cacheRenewEvent: token id ${tokenId.toString()} renewed in block ${blockNumber}`);

    return ok(undefined);
  }
}
