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

const log = logger.child({
  component: 'EthEventsProvider',
});

/**
 * Class that follows the Ethereum chain to handle on-chain events from the ID Registry and Name Registry contracts.
 */
export class EthEventsProvider {
  private _engine: Engine;
  private _jsonRpcProvider: providers.BaseProvider;

  private _idRegistryContract: Contract;
  private _nameRegistryContract: Contract;

  constructor(engine: Engine, networkUrl: string, IdRegistryAddress: string, NameRegistryAddress: string) {
    this._engine = engine;

    // Setup provider
    this._jsonRpcProvider = new providers.JsonRpcProvider(networkUrl);
    // this._jsonRpcProvider.on('block', (blockNumber: number) => this.handleNewBlock(blockNumber));

    // Setup IdRegistry contract
    this._idRegistryContract = new Contract(IdRegistryAddress, IdRegistry.abi, this._jsonRpcProvider);
    this._idRegistryContract.on('Register', (to: string, id: BigNumber, _, event: Event) => {
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

    // Cal Eth Node to check connection
    this.callEthNode();
  }

  /** Connect to Ethereum RPC */
  private async callEthNode() {
    this._jsonRpcProvider
      .getBlock('latest')
      .then((block: ethers.providers.Block) => {
        log.info({ latestBlock: block.number }, 'connected to ethereum node');
      })
      .catch((err: any) => {
        log.error({ err }, 'failed to connect to ethereum node');
      });

    // TODO: Sync old events
    this.syncOldEvents(IdRegistryEventType.IdRegistryRegister);
    this.syncOldEvents(IdRegistryEventType.IdRegistryTransfer);
  }

  private async syncOldEvents(type: IdRegistryEventType) {
    const typeString = type === IdRegistryEventType.IdRegistryRegister ? 'Register' : 'Transfer';

    const oldEvents = await this._idRegistryContract.queryFilter(typeString, -300);
    for (const event of oldEvents) {
      const toIndex = type === IdRegistryEventType.IdRegistryRegister ? 0 : 1;
      const idIndex = type === IdRegistryEventType.IdRegistryRegister ? 1 : 2;

      const to: string = event.args?.at(toIndex);
      const id: BigNumber = BigNumber.from(event.args?.at(idIndex));
      const from: string = type === IdRegistryEventType.IdRegistryRegister ? '' : event.args?.at(0);

      this.handleIdRegistryEvent(from, to, id, type, event);
    }
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

    const r = await this._engine.mergeIdRegistryEvent(new IdRegistryEventModel(idRegistryEvent));
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

    const r = await this._engine.mergeNameRegistryEvent(new NameRegistryEventModel(nameRegistryEvent));
    if (r.isErr()) {
      log.error({ err: r._unsafeUnwrap() }, 'NameRegistryEvent failed to merge');
    }
  }
}
