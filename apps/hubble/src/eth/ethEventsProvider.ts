import {
  bytesToUtf8String,
  hexStringToBytes,
  HubAsyncResult,
  HubError,
  HubState,
  IdRegistryEvent,
  IdRegistryEventType,
  NameRegistryEvent,
  NameRegistryEventType,
  toFarcasterTime,
} from '@farcaster/hub-nodejs';
import {
  AbstractProvider,
  BaseContractMethod,
  Contract,
  ContractEventPayload,
  EventLog,
  JsonRpcProvider,
} from 'ethers';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import { IdRegistry, NameRegistry } from '~/eth/abis';
import { bytes32ToBytes, bytesToBytes32 } from '~/eth/utils';
import { HubInterface } from '~/hubble';
import { logger } from '~/utils/logger';

const log = logger.child({
  component: 'EthEventsProvider',
});

export class GoerliEthConstants {
  public static IdRegistryAddress = '0xda107a1caf36d198b12c16c7b6a1d1c795978c42';
  public static NameRegistryAddress = '0xe3be01d99baa8db9905b33a3ca391238234b79d1';
  public static FirstBlock = 7648795;
  public static ChunkSize = 10000;
}

type NameRegistryRenewEvent = Omit<NameRegistryEvent, 'to' | 'from'>;

/**
 * Class that follows the Ethereum chain to handle on-chain events from the ID Registry and Name Registry contracts.
 */
export class EthEventsProvider {
  private _hub: HubInterface;
  private _jsonRpcProvider: AbstractProvider;

  private _idRegistryContract: Contract;
  private _nameRegistryContract: Contract;
  private _firstBlock: number;
  private _chunkSize: number;

  private _numConfirmations: number;

  private _idEventsByBlock: Map<number, Array<IdRegistryEvent>>;
  private _nameEventsByBlock: Map<number, Array<NameRegistryEvent>>;
  private _renewEventsByBlock: Map<number, Array<NameRegistryRenewEvent>>;

  private _lastBlockNumber: number;

  // Whether the historical events have been synced. This is used to avoid syncing the events multiple times.
  private _isHistoricalSyncDone = false;

  constructor(
    hub: HubInterface,
    jsonRpcProvider: AbstractProvider,
    idRegistryContract: Contract,
    nameRegistryContract: Contract,
    firstBlock: number,
    chunkSize: number
  ) {
    this._hub = hub;
    this._jsonRpcProvider = jsonRpcProvider;
    this._idRegistryContract = idRegistryContract;
    this._nameRegistryContract = nameRegistryContract;
    this._firstBlock = firstBlock;
    this._chunkSize = chunkSize;

    // Number of blocks to wait before processing an event.
    // This is hardcoded to 6 for now, because that's the threshold beyond which blocks are unlikely to reorg anymore.
    // 6 blocks represents ~72 seconds on Goerli, so the delay is not too long.
    this._numConfirmations = 6;

    this._lastBlockNumber = 0;

    // Initialize the cache for the ID and Name Registry events. They will be processed after
    // numConfirmations blocks have been mined.
    this._nameEventsByBlock = new Map();
    this._idEventsByBlock = new Map();
    this._renewEventsByBlock = new Map();

    // Setup IdRegistry contract
    this._idRegistryContract.on('Register', (to: string, id: bigint, _recovery, _url, event: ContractEventPayload) => {
      this.cacheIdRegistryEvent(null, to, id, IdRegistryEventType.REGISTER, event.log);
    });
    this._idRegistryContract.on('Transfer', (from: string, to: string, id: bigint, event: ContractEventPayload) => {
      this.cacheIdRegistryEvent(from, to, id, IdRegistryEventType.TRANSFER, event.log);
    });

    // Setup NameRegistry contract
    this._nameRegistryContract.on(
      'Transfer',
      (from: string, to: string, tokenId: bigint, event: ContractEventPayload) => {
        this.cacheNameRegistryEvent(from, to, tokenId, event.log);
      }
    );

    this._nameRegistryContract.on('Renew', (tokenId: bigint, expiry: bigint, event: ContractEventPayload) => {
      this.cacheRenewEvent(tokenId, expiry, event.log);
    });

    // Set up block listener to confirm blocks
    this._jsonRpcProvider.on('block', (blockNumber: number) => this.handleNewBlock(blockNumber));
  }

  /**
   *
   * Build an Eth Events Provider for the ID Registry and Name Registry contracts.
   */
  public static build(
    hub: HubInterface,
    ethRpcUrl: string,
    idRegistryAddress: string,
    nameRegistryAddress: string,
    firstBlock: number,
    chunkSize: number
  ): EthEventsProvider {
    // Setup provider and the contracts
    const jsonRpcProvider = new JsonRpcProvider(ethRpcUrl);

    const idRegistryContract = new Contract(idRegistryAddress, IdRegistry.abi, jsonRpcProvider);
    const nameRegistryContract = new Contract(nameRegistryAddress, NameRegistry.abi, jsonRpcProvider);

    const provider = new EthEventsProvider(
      hub,
      jsonRpcProvider,
      idRegistryContract,
      nameRegistryContract,
      firstBlock,
      chunkSize
    );

    return provider;
  }

  public getLatestBlockNumber(): number {
    return this._lastBlockNumber;
  }

  public async start() {
    // Connect to Ethereum RPC
    await this.connectAndSyncHistoricalEvents();
  }

  public async stop() {
    this._idRegistryContract.removeAllListeners();
    this._nameRegistryContract.removeAllListeners();
    this._jsonRpcProvider.removeAllListeners();
    this._jsonRpcProvider._forEachSubscriber((s) => s.stop());

    // Wait for all async promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  /** Returns expiry for fname in ms from unix epoch */
  public async getFnameExpiry(fname: Uint8Array): HubAsyncResult<number> {
    const encodedFnameResult = bytesToBytes32(fname);

    if (encodedFnameResult.isErr()) {
      return err(encodedFnameResult.error);
    }

    // Safety: expiryOf exists on the contract's abi, but ethers won't infer it from the ABI though
    // it is supposed to  in v6 https://github.com/ethers-io/ethers.js/issues/1138
    const expiryOfMethod = this._nameRegistryContract['expiryOf'] as BaseContractMethod;

    const expiryResult: Result<bigint, HubError> = await ResultAsync.fromPromise(
      expiryOfMethod(encodedFnameResult.value),
      (err) => new HubError('unavailable.network_failure', err as Error)
    );

    return expiryResult.map((expiry) => Number(expiry) * 1000);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  /** Connect to Ethereum RPC */
  private async connectAndSyncHistoricalEvents() {
    const latestBlockResult = await ResultAsync.fromPromise(this._jsonRpcProvider.getBlock('latest'), (err) => err);
    if (latestBlockResult.isErr()) {
      log.error(
        { err: latestBlockResult.error },
        'failed to connect to ethereum node. Check your eth RPC URL (e.g. --eth-rpc-url)'
      );
      return;
    }

    const latestBlock = latestBlockResult.value;

    if (!latestBlock) {
      log.error('failed to get the latest block from the RPC provider');
      return;
    }

    log.info({ latestBlock: latestBlock.number }, 'connected to ethereum node');

    // Find how how much we need to sync
    let lastSyncedBlock = this._firstBlock;

    const hubState = await this._hub.getHubState();
    if (hubState.isOk()) {
      lastSyncedBlock = hubState.value.lastEthBlock;
    }

    log.info({ lastSyncedBlock }, 'last synced block');
    const toBlock = latestBlock.number;

    // Sync old Id events
    await this.syncHistoricalIdEvents(IdRegistryEventType.REGISTER, lastSyncedBlock, toBlock, this._chunkSize);
    await this.syncHistoricalIdEvents(IdRegistryEventType.TRANSFER, lastSyncedBlock, toBlock, this._chunkSize);

    // Sync old Name Transfer events
    await this.syncHistoricalNameEvents(NameRegistryEventType.TRANSFER, lastSyncedBlock, toBlock, this._chunkSize);

    // We don't need to sync historical Renew events because the expiry
    // is pulled when NameRegistryEvents are merged

    this._isHistoricalSyncDone = true;
  }

  /**
   * Retry events from a specific block number
   *
   * @param blockNumber
   */
  public async retryEventsFromBlock(blockNumber: number) {
    await this.syncHistoricalIdEvents(IdRegistryEventType.REGISTER, blockNumber, blockNumber, this._chunkSize);
    await this.syncHistoricalIdEvents(IdRegistryEventType.TRANSFER, blockNumber, blockNumber, this._chunkSize);

    // Sync old Name Transfer events
    await this.syncHistoricalNameEvents(NameRegistryEventType.TRANSFER, blockNumber, blockNumber, this._chunkSize);
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
    const typeString = type === IdRegistryEventType.REGISTER ? 'Register' : 'Transfer';

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

      // Fetch our batch of blocks
      let batchIdEvents = await ResultAsync.fromPromise(
        // Safety: queryFilter will always return EventLog as long as the ABI is valid
        this._idRegistryContract.queryFilter(typeString, Number(nextFromBlock), Number(nextToBlock)) as Promise<
          EventLog[]
        >,
        (e) => e
      );

      // Make sure the batch didn't error, and if it did, retry.
      if (batchIdEvents.isErr()) {
        // Query for the blocks again, in a last ditch effort
        const retryBatchIdEvents = await ResultAsync.fromPromise(
          // Safety: queryFilter will always return EventLog as long as the ABI is valid
          this._idRegistryContract.queryFilter(typeString, Number(nextFromBlock), Number(nextToBlock)) as Promise<
            EventLog[]
          >,
          (e) => e
        );

        // If our new query succeeded, update our variable and cache the blocks
        if (retryBatchIdEvents.isOk()) {
          batchIdEvents = retryBatchIdEvents;
        } else {
          // If we still hit an error, just log the error and return
          log.error({ err: batchIdEvents.error }, 'failed to get a batch of old ID events');
          return;
        }
      }

      // Loop through each event, get the right values, and cache it
      for (const event of batchIdEvents.value) {
        const toIndex = type === IdRegistryEventType.REGISTER ? 0 : 1;
        const idIndex = type === IdRegistryEventType.REGISTER ? 1 : 2;

        // Parsing can throw errors, so we'll just log them and continue
        try {
          const to: string = event.args.at(toIndex);
          const id = BigInt(event.args.at(idIndex));
          const from: string = type === IdRegistryEventType.REGISTER ? null : event.args.at(0);

          await this.cacheIdRegistryEvent(from, to, id, type, event);
        } catch (e) {
          log.error({ event }, 'failed to parse event args');
        }
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
    const typeString = type === NameRegistryEventType.TRANSFER ? 'Transfer' : 'Renew';

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

      let oldNameBatchEvents = await ResultAsync.fromPromise(
        // Safety: queryFilter will always return EventLog as long as the ABI is valid

        this._nameRegistryContract.queryFilter(typeString, Number(nextFromBlock), Number(nextToBlock)) as Promise<
          EventLog[]
        >,
        (e) => e
      );

      if (oldNameBatchEvents.isErr()) {
        const retryNameBatchEvents = await ResultAsync.fromPromise(
          // Safety: queryFilter will always return EventLog as long as the ABI is valid
          this._nameRegistryContract.queryFilter(typeString, Number(nextFromBlock), Number(nextToBlock)) as Promise<
            EventLog[]
          >,
          (e) => e
        );

        // If our new query succeeded, update our variable and cache the blocks
        if (retryNameBatchEvents.isOk()) {
          oldNameBatchEvents = retryNameBatchEvents;
        } else {
          // If we still hit an error, just log the error and return
          log.error({ err: oldNameBatchEvents.error }, 'failed to get old Name events');
          return;
        }
      }

      for (const event of oldNameBatchEvents.value) {
        if (type === NameRegistryEventType.TRANSFER) {
          // Handling: use try-catch + log since errors are expected and not important to surface
          try {
            const from: string = event.args.at(0);
            const to: string = event.args.at(1);
            const tokenId = BigInt(event.args.at(2));
            await this.cacheNameRegistryEvent(from, to, tokenId, event);
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
    const cachedBlocksSet = new Set([
      ...this._nameEventsByBlock.keys(),
      ...this._idEventsByBlock.keys(),
      ...this._renewEventsByBlock.keys(),
    ]);
    const cachedBlocks = Array.from(cachedBlocksSet);
    cachedBlocks.sort();

    for (const cachedBlock of cachedBlocks) {
      if (cachedBlock + this._numConfirmations <= blockNumber) {
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
      }
    }

    // Update the last synced block if all the historical events have been synced
    if (this._isHistoricalSyncDone) {
      const hubState = HubState.create({ lastEthBlock: blockNumber });
      await this._hub.putHubState(hubState);
    }

    this._lastBlockNumber = blockNumber;
  }

  private async cacheIdRegistryEvent(
    from: string | null,
    to: string,
    id: bigint,
    type: IdRegistryEventType,
    eventLog: EventLog
  ): HubAsyncResult<void> {
    const { blockNumber, blockHash, transactionHash, index } = eventLog;

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
    eventLog: EventLog
  ): HubAsyncResult<void> {
    const { blockNumber, blockHash, transactionHash, index } = eventLog;

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

  private async cacheRenewEvent(tokenId: bigint, expiry: bigint, eventLog: EventLog): HubAsyncResult<void> {
    const { blockHash, transactionHash, blockNumber, index } = eventLog;

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
