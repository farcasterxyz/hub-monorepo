import * as protobufs from '@farcaster/protobufs';
import { bigNumberToBytes, hexStringToBytes, HubAsyncResult } from '@farcaster/protoutils';
import { BigNumber, Contract, Event, providers } from 'ethers';
import { err, ok, ResultAsync } from 'neverthrow';
import { IdRegistry, NameRegistry } from '~/eth/abis';
import { bytes32ToBytes } from '~/eth/utils';
import { logger } from '~/utils/logger';

const log = logger.child({
  component: 'EthEventsProvider',
});

export class GoerliEthConstants {
  public static IdRegistryAddress = '0xda107a1caf36d198b12c16c7b6a1d1c795978c42';
  public static NameRegistryAddress = '0xe3be01d99baa8db9905b33a3ca391238234b79d1';
  public static FirstBlock = 7648795;
}

/**
 * Class that follows the Ethereum chain to handle on-chain events from the ID Registry and Name Registry contracts.
 */
export class EthEventsProvider {
  // private _hub: HubInterface;
  private _jsonRpcProvider: providers.BaseProvider;

  private _idRegistryContract: Contract;
  private _nameRegistryContract: Contract;

  private _numConfirmations: number;

  private _idEventsByBlock: Map<number, Array<protobufs.IdRegistryEvent>>;
  private _nameEventsByBlock: Map<number, Array<protobufs.NameRegistryEvent>>;

  private _lastBlockNumber: number;

  // Whether the historical events have been synced. This is used to avoid syncing the events multiple times.
  private _isHistoricalSyncDone = false;

  constructor(
    // hub: HubInterface,
    jsonRpcProvider: providers.BaseProvider,
    idRegistryContract: Contract,
    nameRegistryContract: Contract
  ) {
    // this._hub = hub;
    this._jsonRpcProvider = jsonRpcProvider;
    this._idRegistryContract = idRegistryContract;
    this._nameRegistryContract = nameRegistryContract;

    // Number of blocks to wait before processing an event.
    // This is hardcoded to 6 for now, because that's the threshold beyond which blocks are unlikely to reorg anymore.
    // 6 blocks represents ~72 seconds on Goerli, so the delay is not too long.
    this._numConfirmations = 6;

    this._lastBlockNumber = 0;

    // Initialize the cache for the ID and Name Registry events. They will be processed after
    // numConfirmations blocks have been mined.
    this._nameEventsByBlock = new Map();
    this._idEventsByBlock = new Map();

    // Setup IdRegistry contract
    this._idRegistryContract.on('Register', (to: string, id: BigNumber, _recovery, _url, event: Event) => {
      this.cacheIdRegistryEvent(null, to, id, protobufs.IdRegistryEventType.ID_REGISTRY_EVENT_TYPE_REGISTER, event);
    });
    this._idRegistryContract.on('Transfer', (from: string, to: string, id: BigNumber, event: Event) => {
      this.cacheIdRegistryEvent(from, to, id, protobufs.IdRegistryEventType.ID_REGISTRY_EVENT_TYPE_TRANSFER, event);
    });

    // Setup NameRegistry contract
    this._nameRegistryContract.on('Transfer', (from: string, to: string, tokenId: BigNumber, event: Event) => {
      this.cacheNameRegistryEvent(
        from,
        to,
        tokenId,
        protobufs.NameRegistryEventType.NAME_REGISTRY_EVENT_TYPE_TRANSFER,
        event
      );
    });

    // TODO: handle Renew events separately from Transfer events
    // this._nameRegistryContract.on('Renew', (tokenId: BigNumber, expiry: BigNumber, event: Event) => {
    //   this.cacheNameRegistryEvent('', '', tokenId, flatbuffers.NameRegistryEventType.NameRegistryRenew, expiry, event);
    // });

    // Set up block listener to confirm blocks
    this._jsonRpcProvider.on('block', (blockNumber: number) => this.handleNewBlock(blockNumber));
  }

  /**
   *
   * Setup a Eth Events Provider with Goerli testnet, which is currently used for Production Farcaster Hubs.
   */
  public static makeWithGoerli(
    // hub: HubInterface,
    ethRpcUrl: string,
    IdRegistryAddress: string,
    NameRegistryAddress: string
  ): EthEventsProvider {
    // Setup provider and the contracts
    const jsonRpcProvider = new providers.JsonRpcProvider(ethRpcUrl);

    const idRegistryContract = new Contract(IdRegistryAddress, IdRegistry.abi, jsonRpcProvider);
    const nameRegistryContract = new Contract(NameRegistryAddress, NameRegistry.abi, jsonRpcProvider);

    const provider = new EthEventsProvider(jsonRpcProvider, idRegistryContract, nameRegistryContract);

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

    // Clear all polling, including the bootstrap polling. We need to reach inside the provider to do this,
    // because the provider does not expose a way to stop the bootstrap polling.
    // This can happen if the test runs quickly, where the bootstrap polling is still running when the test ends.
    clearTimeout(this._jsonRpcProvider._bootstrapPoll);
    this._jsonRpcProvider.polling = false;

    // Wait for all async promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));
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
    log.info({ latestBlock: latestBlock.number }, 'connected to ethereum node');

    // Find how how much we need to sync
    const lastSyncedBlock = BigInt(GoerliEthConstants.FirstBlock);

    // const hubState = await this._hub.getHubState();
    // if (hubState.isOk()) {
    //   lastSyncedBlock = hubState.value.lastEthBlock();
    // }

    log.info({ lastSyncedBlock }, 'last synced block');
    const toBlock = BigInt(latestBlock.number);

    // Sync old Id events
    await this.syncHistoricalIdEvents(
      protobufs.IdRegistryEventType.ID_REGISTRY_EVENT_TYPE_REGISTER,
      lastSyncedBlock,
      toBlock
    );
    await this.syncHistoricalIdEvents(
      protobufs.IdRegistryEventType.ID_REGISTRY_EVENT_TYPE_TRANSFER,
      lastSyncedBlock,
      toBlock
    );

    // Sync old Name events
    await this.syncHistoricalNameEvents(
      protobufs.NameRegistryEventType.NAME_REGISTRY_EVENT_TYPE_TRANSFER,
      lastSyncedBlock,
      toBlock
    );
    // await this.syncHistoricalNameEvents(flatbuffers.NameRegistryEventType.NameRegistryRenew, lastSyncedBlock, toBlock);

    this._isHistoricalSyncDone = true;
  }

  /**
   * Sync old Id events that may have happened before hub was started. We'll put them all
   * in the sync queue to be processed later, to make sure we don't process any unconfirmed events.
   */
  private async syncHistoricalIdEvents(type: protobufs.IdRegistryEventType, fromBlock: bigint, toBlock: bigint) {
    const typeString = type === protobufs.IdRegistryEventType.ID_REGISTRY_EVENT_TYPE_REGISTER ? 'Register' : 'Transfer';

    const oldIdEvents = await ResultAsync.fromPromise(
      this._idRegistryContract.queryFilter(typeString, Number(fromBlock), Number(toBlock)),
      (e) => e
    );
    if (oldIdEvents.isErr()) {
      log.error({ err: oldIdEvents.error }, 'failed to get old Id events');
      return;
    }

    for (const event of oldIdEvents.value) {
      const toIndex = type === protobufs.IdRegistryEventType.ID_REGISTRY_EVENT_TYPE_REGISTER ? 0 : 1;
      const idIndex = type === protobufs.IdRegistryEventType.ID_REGISTRY_EVENT_TYPE_REGISTER ? 1 : 2;

      // Parsing can throw errors, so we'll just log them and continue
      try {
        const to: string = event.args?.at(toIndex);
        const id: BigNumber = BigNumber.from(event.args?.at(idIndex));
        const from: string =
          type === protobufs.IdRegistryEventType.ID_REGISTRY_EVENT_TYPE_REGISTER ? null : event.args?.at(0);

        await this.cacheIdRegistryEvent(from, to, id, type, event);
      } catch (e) {
        log.error({ event }, 'failed to parse event args');
      }
    }
  }

  /**
   * Sync old Name events that may have happened before hub was started. We'll put them all
   * in the sync queue to be processed later, to make sure we don't process any unconfirmed events.
   */
  private async syncHistoricalNameEvents(type: protobufs.NameRegistryEventType, fromBlock: bigint, toBlock: bigint) {
    const typeString =
      type === protobufs.NameRegistryEventType.NAME_REGISTRY_EVENT_TYPE_TRANSFER ? 'Transfer' : 'Renew';

    const oldNameEvents = await ResultAsync.fromPromise(
      this._nameRegistryContract.queryFilter(typeString, Number(fromBlock), Number(toBlock)),
      (e) => e
    );

    if (oldNameEvents.isErr()) {
      log.error({ err: oldNameEvents.error }, 'failed to get old Name events');
      return;
    }

    for (const event of oldNameEvents.value) {
      if (type === protobufs.NameRegistryEventType.NAME_REGISTRY_EVENT_TYPE_TRANSFER) {
        try {
          const from: string = event.args?.at(0);
          const to: string = event.args?.at(1);
          const tokenId: BigNumber = BigNumber.from(event.args?.at(2));
          await this.cacheNameRegistryEvent(from, to, tokenId, type, event);
        } catch (e) {
          log.error({ event }, 'failed to parse event args');
        }
      } else if (type === protobufs.NameRegistryEventType.NAME_REGISTRY_EVENT_TYPE_RENEW) {
        // TODO: create NameRegistryEvent using attributes of Renew events and previous Transfer event
      }
    }
  }

  /** Handle a new block. Processes all events in the cache that have now been confirmed */
  private async handleNewBlock(blockNumber: number) {
    log.info({ blockNumber }, 'new block');

    // Get all blocks that have been confirmed into a single array and sort.
    const cachedBlocksSet = new Set([...this._nameEventsByBlock.keys(), ...this._idEventsByBlock.keys()]);
    const cachedBlocks = Array.from(cachedBlocksSet);
    cachedBlocks.sort();

    for (const cachedBlock of cachedBlocks) {
      if (cachedBlock + this._numConfirmations <= blockNumber) {
        const idEvents = this._idEventsByBlock.get(cachedBlock);
        this._idEventsByBlock.delete(cachedBlock);

        if (idEvents) {
          for (const idEvent of idEvents) {
            log.info(idEvent);
            // await this._hub.submitIdRegistryEvent(idEvent, 'eth-provider');
          }
        }

        const nameEvents = this._nameEventsByBlock.get(cachedBlock);
        this._nameEventsByBlock.delete(cachedBlock);

        if (nameEvents) {
          for (const nameEvent of nameEvents) {
            log.info(nameEvent);
            // await this._hub.submitNameRegistryEvent(nameEvent, 'eth-provider');
          }
        }
      }
    }

    // Update the last synced block if all the historical events have been synced
    // if (this._isHistoricalSyncDone) {
    //   const builder = new Builder(1);
    //   const hubStateT = new flatbuffers.HubStateT(BigInt(blockNumber));
    //   builder.finish(hubStateT.pack(builder));
    //   const hubState = flatbuffers.HubState.getRootAsHubState(new ByteBuffer(builder.asUint8Array()));
    //   await this._hub.putHubState(new HubStateModel(hubState));
    // }

    this._lastBlockNumber = blockNumber;
  }

  private async cacheIdRegistryEvent(
    from: string | null,
    to: string,
    id: BigNumber,
    type: protobufs.IdRegistryEventType,
    event: Event
  ): HubAsyncResult<void> {
    const { blockNumber, blockHash, transactionHash, logIndex } = event;
    log.info({ from, to, id: id.toString(), type, blockNumber, transactionHash }, 'cacheIdRegistryEvent');

    // Convert id registry datatypes to bytes
    const fromBytes = from && from.length > 0 ? hexStringToBytes(from) : ok(undefined);
    if (fromBytes.isErr()) {
      return err(fromBytes.error);
    }

    const blockHashBytes = hexStringToBytes(blockHash);
    if (blockHashBytes.isErr()) {
      return err(blockHashBytes.error);
    }

    const transactionHashBytes = hexStringToBytes(transactionHash);
    if (transactionHashBytes.isErr()) {
      return err(transactionHashBytes.error);
    }

    const toBytes = hexStringToBytes(to);
    if (toBytes.isErr()) {
      return err(toBytes.error);
    }

    // Construct the protobuf
    const idRegistryEvent = protobufs.IdRegistryEvent.create({
      blockNumber,
      blockHash: blockHashBytes.value,
      logIndex,
      fid: id.toNumber(),
      to: toBytes.value,
      type,
      ...(fromBytes.value ? { from: fromBytes.value } : {}), // Ugh typescript
    });

    // Add it to the cache
    let idEvents = this._idEventsByBlock.get(blockNumber);
    if (!idEvents) {
      idEvents = [];
      this._idEventsByBlock.set(blockNumber, idEvents);
    }
    idEvents.push(idRegistryEvent);

    return ok(undefined);
  }

  private async cacheNameRegistryEvent(
    from: string,
    to: string,
    tokenId: BigNumber,
    type: protobufs.NameRegistryEventType,
    event: Event
  ): HubAsyncResult<void> {
    const { blockNumber, blockHash, transactionHash, logIndex } = event;
    log.info({ from, to, tokenId: tokenId.toString(), type, blockNumber, transactionHash }, 'cacheNameRegistryEvent');

    // Convert name registry datatypes to little endian byte arrays
    const blockHashBytes = hexStringToBytes(blockHash);
    if (blockHashBytes.isErr()) {
      return err(blockHashBytes.error);
    }

    const transactionHashBytes = hexStringToBytes(transactionHash);
    if (transactionHashBytes.isErr()) {
      return err(transactionHashBytes.error);
    }

    const fromBytes = from.length > 0 ? hexStringToBytes(from) : ok(undefined);
    if (fromBytes.isErr()) {
      return err(fromBytes.error);
    }

    const toBytes = hexStringToBytes(to);
    if (toBytes.isErr()) {
      return err(toBytes.error);
    }

    const fnameBytes = bytes32ToBytes(tokenId);
    if (fnameBytes.isErr()) {
      return err(fnameBytes.error);
    }

    const expiryBytes = bigNumberToBytes(expiry);
    if (expiryBytes.isErr()) {
      return err(expiryBytes.error);
    }

    // Construct the flatbuffer event
    const builder = new Builder(1);
    const eventT = new flatbuffers.NameRegistryEventT(
      blockNumber,
      Array.from(blockHashBytes.value),
      Array.from(transactionHashBytes.value),
      logIndex,
      Array.from(fnameBytes.value),
      fromBytes.value ? Array.from(fromBytes.value) : undefined,
      Array.from(toBytes.value),
      type,
      Array.from(expiryBytes.value)
    );
    builder.finish(eventT.pack(builder));

    const nameRegistryEvent = flatbuffers.NameRegistryEvent.getRootAsNameRegistryEvent(
      new ByteBuffer(builder.asUint8Array())
    );
    const nameRegistryEventModel = new NameRegistryEventModel(nameRegistryEvent);

    // Add it to the cache
    let nameEvents = this._nameEventsByBlock.get(blockNumber);
    if (!nameEvents) {
      nameEvents = [];
      this._nameEventsByBlock.set(blockNumber, nameEvents);
    }
    nameEvents.push(nameRegistryEventModel);

    return ok(undefined);
  }
}
