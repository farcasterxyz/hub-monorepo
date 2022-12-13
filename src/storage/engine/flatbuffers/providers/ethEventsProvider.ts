import { Contract, providers, Event, BigNumber, ethers } from 'ethers';
import { IdRegistryEvent, IdRegistryEventT, IdRegistryEventType } from '~/utils/generated/id_registry_event_generated';
import { Builder, ByteBuffer } from 'flatbuffers';
import { IdRegistry, NameRegistry } from './abis';
import { arrayify } from 'ethers/lib/utils';
import Engine from '~/storage/engine/flatbuffers/';
import IdRegistryEventModel from '~/storage/flatbuffers/idRegistryEventModel';
import { logger } from '~/utils/logger';
import { NameRegistryEvent, NameRegistryEventT, NameRegistryEventType } from '~/utils/generated/nameregistry_generated';
import NameRegistryEventModel from '~/storage/flatbuffers/nameRegistryEventModel';
import { ResultAsync } from 'neverthrow';
import { HubState, HubStateT } from '~/utils/generated/hub_state_generated';
import HubStateModel from '~/storage/flatbuffers/hubStateModel';

const log = logger.child({
  component: 'EthEventsProvider',
});

export class GoreliEthConstants {
  public static IdRegistryAddress = '0xda107a1caf36d198b12c16c7b6a1d1c795978c42';
  public static NameRegistryAddress = '0xe3be01d99baa8db9905b33a3ca391238234b79d1';
  public static FirstBlock = 7648795;
}

/**
 * Class that follows the Ethereum chain to handle on-chain events from the ID Registry and Name Registry contracts.
 */
export class EthEventsProvider {
  private _engine: Engine;
  private _jsonRpcProvider: providers.BaseProvider;

  private _idRegistryContract: Contract;
  private _nameRegistryContract: Contract;

  private _numConfirmations: number;

  private _idEventsByBlock: Map<number, Array<IdRegistryEventModel>>;
  private _nameEventsByBlock: Map<number, Array<NameRegistryEventModel>>;

  constructor(
    engine: Engine,
    networkUrl: string,
    IdRegistryAddress: string,
    NameRegistryAddress: string,
    numConfirmations = 6
  ) {
    this._engine = engine;
    this._numConfirmations = numConfirmations;

    // Initialize the cache for the ID and Name Registry events. They will be processed after
    // numConfirmations blocks have been mined.
    this._nameEventsByBlock = new Map();
    this._idEventsByBlock = new Map();

    // Setup provider
    this._jsonRpcProvider = new providers.JsonRpcProvider(networkUrl);

    // Setup IdRegistry contract
    this._idRegistryContract = new Contract(IdRegistryAddress, IdRegistry.abi, this._jsonRpcProvider);
    this._idRegistryContract.on('Register', (to: string, id: BigNumber, _recovery, _url, event: Event) => {
      this.handleIdRegistryEvent('', to, id, IdRegistryEventType.IdRegistryRegister, event);
    });
    this._idRegistryContract.on('Transfer', (from: string, to: string, id: BigNumber, event: Event) => {
      this.handleIdRegistryEvent(from, to, id, IdRegistryEventType.IdRegistryTransfer, event);
    });

    // Setup NameRegistry contract
    this._nameRegistryContract = new Contract(NameRegistryAddress, NameRegistry.abi, this._jsonRpcProvider);
    this._nameRegistryContract.on('Transfer', (from: string, to: string, tokenId: BigNumber, event: Event) => {
      this.handleNameRegistryEvent(
        from,
        to,
        tokenId,
        NameRegistryEventType.NameRegistryTransfer,
        BigNumber.from(0),
        event
      );
    });
    this._nameRegistryContract.on('Renew', (tokenId: BigNumber, expiry: BigNumber, event: Event) => {
      this.handleNameRegistryEvent('', '', tokenId, NameRegistryEventType.NameRegistryRenew, expiry, event);
    });

    // Set up block listener to confirm blocks
    this._jsonRpcProvider.on('block', (blockNumber: number) => this.handleNewBlock(blockNumber));

    // Cal Eth Node to check connection
    this.callEthNode();
  }

  /** Connect to Ethereum RPC */
  private async callEthNode() {
    const latestBlockResult = await ResultAsync.fromPromise(this._jsonRpcProvider.getBlock('latest'), (err) => err);
    if (latestBlockResult.isErr()) {
      log.error({ err: latestBlockResult.error }, 'failed to connect to ethereum node');
      return;
    }

    const latestBlock = latestBlockResult.value;
    log.info({ latestBlock: latestBlock.number }, 'connected to ethereum node');

    // Find how how much we need to sync
    // Goreli block 7648795 is when Farcaster contracts were deployed
    let lastSyncedBlock = BigInt(GoreliEthConstants.FirstBlock);
    log.info({ lastSyncedBlock }, 'last synced block');
    const hubState = await this._engine.getHubState();
    if (hubState.isOk()) {
      lastSyncedBlock = hubState.value.lastEthBlock();
    }
    const numBlocksToSync = BigInt(latestBlock.number) - lastSyncedBlock;
    log.info({ numBlocksToSync }, 'number of blocks to sync');

    // Sync old Id events
    await this.syncOldIdEvents(IdRegistryEventType.IdRegistryRegister, numBlocksToSync);
    await this.syncOldIdEvents(IdRegistryEventType.IdRegistryTransfer, numBlocksToSync);

    // Sync old Name events
    await this.syncOldNameEvents(NameRegistryEventType.NameRegistryTransfer, numBlocksToSync);
    await this.syncOldNameEvents(NameRegistryEventType.NameRegistryRenew, numBlocksToSync);
  }

  /**
   * Sync old Id events that may have happened before hub was started. We'll put them all
   * in the sync queue to be processed later, to make sure we don't process any unconfirmed events.
   */
  private async syncOldIdEvents(type: IdRegistryEventType, numBlocksToSync: bigint) {
    const typeString = type === IdRegistryEventType.IdRegistryRegister ? 'Register' : 'Transfer';

    const oldIdEvents = await this._idRegistryContract.queryFilter(typeString, -1 * Number(numBlocksToSync));
    for (const event of oldIdEvents) {
      const toIndex = type === IdRegistryEventType.IdRegistryRegister ? 0 : 1;
      const idIndex = type === IdRegistryEventType.IdRegistryRegister ? 1 : 2;

      const to: string = event.args?.at(toIndex);
      const id: BigNumber = BigNumber.from(event.args?.at(idIndex));
      const from: string = type === IdRegistryEventType.IdRegistryRegister ? '' : event.args?.at(0);

      this.handleIdRegistryEvent(from, to, id, type, event);
    }
  }

  /**
   * Sync old Name events that may have happened before hub was started. We'll put them all
   * in the sync queue to be processed later, to make sure we don't process any unconfirmed events.
   */
  private async syncOldNameEvents(type: NameRegistryEventType, numBlocksToSync: bigint) {
    const typeString = type === NameRegistryEventType.NameRegistryTransfer ? 'Transfer' : 'Renew';

    const oldNameEvents = await this._nameRegistryContract.queryFilter(typeString, -1 * Number(numBlocksToSync));
    for (const event of oldNameEvents) {
      const from: string = type === NameRegistryEventType.NameRegistryTransfer ? event.args?.at(0) : '';
      const to: string = type === NameRegistryEventType.NameRegistryTransfer ? event.args?.at(1) : '';
      const tokenId: BigNumber =
        type === NameRegistryEventType.NameRegistryTransfer
          ? BigNumber.from(event.args?.at(2))
          : BigNumber.from(event.args?.at(0));
      const expiry: BigNumber =
        type === NameRegistryEventType.NameRegistryTransfer ? BigNumber.from(0) : event.args?.at(1);

      this.handleNameRegistryEvent(from, to, tokenId, type, expiry, event);
    }
  }

  /** Handle a new block. Processes all events in the cache that have now been confirmed */
  private async handleNewBlock(blockNumber: number) {
    // Get all blocks that have been confirmed into a single array and sort.
    const confirmedBlocksSet = new Set([...this._nameEventsByBlock.keys(), ...this._idEventsByBlock.keys()]);
    const confirmedBlocks = Array.from(confirmedBlocksSet);
    confirmedBlocks.sort();

    for (const confirmedBlock of confirmedBlocks) {
      if (confirmedBlock + this._numConfirmations <= blockNumber) {
        const idEvents = this._idEventsByBlock.get(confirmedBlock);
        this._idEventsByBlock.delete(confirmedBlock);

        if (idEvents) {
          for (const idEvent of idEvents) {
            await this.addIdRegistryEvent(idEvent);
          }
        }

        const nameEvents = this._nameEventsByBlock.get(confirmedBlock);
        this._nameEventsByBlock.delete(confirmedBlock);

        if (nameEvents) {
          for (const nameEvent of nameEvents) {
            await this.addNameRegistryEvent(nameEvent);
          }
        }
      }
    }

    // Update the last synced block
    const builder = new Builder(1);
    const hubStateT = new HubStateT(BigInt(blockNumber));
    builder.finish(hubStateT.pack(builder));
    const hubState = HubState.getRootAsHubState(new ByteBuffer(builder.asUint8Array()));
    this._engine.updateHubState(new HubStateModel(hubState));
  }

  private async handleIdRegistryEvent(
    from: string,
    to: string,
    id: BigNumber,
    type: IdRegistryEventType,
    event: Event
  ) {
    const { blockNumber, blockHash, transactionHash, logIndex } = event;
    log.info({ from, to, id: id.toString(), type, blockNumber, transactionHash }, 'IdRegistryEvent');

    let fromArray: number[] = [];
    if (from && from.length > 0) {
      fromArray = Array.from(arrayify(from));
    }

    const fid = Array.from(arrayify(id));

    // Construct the flatbuffer event
    const builder = new Builder(1);
    const eventT = new IdRegistryEventT(
      event.blockNumber,
      Array.from(arrayify(event.blockHash)),
      Array.from(arrayify(event.transactionHash)),
      event.logIndex,
      Array.from(arrayify(id)),
      Array.from(arrayify(to)),
      type,
      fromArray
    );
    builder.finish(eventT.pack(builder));

    const idRegistryEvent = IdRegistryEvent.getRootAsIdRegistryEvent(new ByteBuffer(builder.asUint8Array()));
    const idRegistryEventModel = new IdRegistryEventModel(idRegistryEvent);

    // Add it to the cache
    let idEvents = this._idEventsByBlock.get(blockNumber);
    if (!idEvents) {
      idEvents = [];
      this._idEventsByBlock.set(blockNumber, idEvents);
    }
    idEvents.push(idRegistryEventModel);
  }

  private async addIdRegistryEvent(idRegistryEventModel: IdRegistryEventModel) {
    const r = await this._engine.mergeIdRegistryEvent(idRegistryEventModel);
    if (r.isErr()) {
      log.error({ err: r._unsafeUnwrap() }, 'IdRegistryEvent failed to merge');
    }
  }

  private async handleNameRegistryEvent(
    from: string,
    to: string,
    tokenId: BigNumber,
    type: NameRegistryEventType,
    expiry: BigNumber,
    event: Event
  ) {
    const { blockNumber, transactionHash } = event;
    const fname = Array.from(arrayify(tokenId.toHexString()));
    log.info({ from, to, tokenId: tokenId.toString(), type, blockNumber, transactionHash }, 'NameRegistryEvent');

    let fromArray: number[] = [];
    if (from && from.length > 0) {
      fromArray = Array.from(arrayify(from));
    }

    // Construct the flatbuffer event
    const builder = new Builder(1);
    const eventT = new NameRegistryEventT(
      event.blockNumber,
      Array.from(arrayify(event.blockHash)),
      Array.from(arrayify(event.transactionHash)),
      event.logIndex,
      fname,
      fromArray,
      Array.from(arrayify(to)),
      type,
      Array.from(arrayify(expiry.toHexString()))
    );
    builder.finish(eventT.pack(builder));

    const nameRegistryEvent = NameRegistryEvent.getRootAsNameRegistryEvent(new ByteBuffer(builder.asUint8Array()));
    const nameRegistryEventModel = new NameRegistryEventModel(nameRegistryEvent);

    // Add it to the cache
    let nameEvents = this._nameEventsByBlock.get(blockNumber);
    if (!nameEvents) {
      nameEvents = [];
      this._nameEventsByBlock.set(blockNumber, nameEvents);
    }
    nameEvents.push(nameRegistryEventModel);
  }

  private async addNameRegistryEvent(nameRegistryEventModel: NameRegistryEventModel) {
    const r = await this._engine.mergeNameRegistryEvent(nameRegistryEventModel);
    if (r.isErr()) {
      log.error({ err: r._unsafeUnwrap() }, 'NameRegistryEvent failed to merge');
    }
  }
}
