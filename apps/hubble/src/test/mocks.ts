import {
  FarcasterNetwork,
  HubAsyncResult,
  HubError,
  HubRpcClient,
  HubState,
  IdRegistryEvent,
  Message,
  NameRegistryEvent,
} from '@farcaster/hub-nodejs';
import { err, ok } from 'neverthrow';
import { HubInterface, HubSubmitSource } from '../hubble.js';
import { GossipNode } from '../network/p2p/gossipNode.js';
import RocksDB from '../storage/db/rocksdb.js';
import Engine from '../storage/engine/index.js';
import { AbstractProvider, Block, BlockTag, Network, Networkish, TransactionRequest } from 'ethers';
import { PeerId } from '@libp2p/interface-peer-id';
import { ContactInfoContent } from '@farcaster/core';

export class MockHub implements HubInterface {
  public db: RocksDB;
  public engine: Engine;
  public gossipNode: GossipNode | undefined;
  public gossipCount = 0;

  constructor(db: RocksDB, engine?: Engine, gossipNode?: GossipNode) {
    this.db = db;
    this.engine = engine ?? new Engine(db, FarcasterNetwork.TESTNET);
    this.gossipNode = gossipNode;
  }

  async submitMessage(message: Message, source?: HubSubmitSource): HubAsyncResult<number> {
    const result = await this.engine.mergeMessage(message);

    if (result.isOk() && source === 'rpc' && this.gossipNode !== undefined) {
      void this.gossipNode.gossipMessage(message);
    }

    return result;
  }

  async submitIdRegistryEvent(event: IdRegistryEvent): HubAsyncResult<number> {
    return this.engine.mergeIdRegistryEvent(event);
  }

  async submitNameRegistryEvent(event: NameRegistryEvent): HubAsyncResult<number> {
    return this.engine.mergeNameRegistryEvent(event);
  }

  async getHubState(): HubAsyncResult<HubState> {
    // return ResultAsync.fromPromise(HubState.get(this.db), (e) => e as HubError);
    return err(new HubError('unavailable', 'Not implemented'));
  }

  async putHubState(_hubState: HubState): HubAsyncResult<void> {
    // const txn = this.db.transaction();
    // HubStateModel.putTransaction(txn, hubState);
    // return await ResultAsync.fromPromise(this.db.commit(txn), (e) => e as HubError);
    return err(new HubError('unavailable', 'Not implemented'));
  }

  async gossipContactInfo(): HubAsyncResult<void> {
    this.gossipCount += 1;
    return ok(undefined);
  }

  async getRPCClientForPeer(_peerId: PeerId, _peer: ContactInfoContent): Promise<HubRpcClient | undefined> {
    return undefined;
  }
}

/** A Mock RPC provider */
export class MockRPCProvider extends AbstractProvider {
  public getLogsCount = 0;

  constructor(_network?: Networkish | undefined) {
    // The Goerli networkID is 5
    super(_network || 5);
  }

  override async getLogs() {
    this.getLogsCount += 1;
    return [];
  }

  override async getBlockNumber() {
    return 1;
  }

  override async _detectNetwork() {
    return Network.from('goerli');
  }

  override async resolveName(_: string) {
    return '0x0000000000000000000000000000000000000000';
  }

  override async getBlock(_block: BlockTag, _prefetchTx?: boolean | undefined) {
    return {
      number: 1,
    } as Block;
  }

  override async call(_tx: TransactionRequest) {
    return '0x0000000000000000000000000000000000000000';
  }

  override async getNetwork() {
    return Network.from('goerli');
  }
}

// A Mock Faulty RPC provider – fails every eighth call – too many fails slows
// the tests down, so keep it reasonable.
export class MockFaultyRPCProvider extends MockRPCProvider {
  private isWorking = 0;

  constructor() {
    super();
  }

  override async getLogs() {
    return await this.faultyCall(async () => await super.getLogs());
  }

  override async getBlockNumber() {
    return await this.faultyCall(async () => await super.getBlockNumber());
  }

  override async _detectNetwork() {
    return await this.faultyCall(async () => await super._detectNetwork());
  }

  override async resolveName(name: string) {
    return await super.resolveName(name);
  }

  override async getBlock(block: BlockTag, prefetchTx?: boolean | undefined) {
    return await this.faultyCall(async () => await super.getBlock(block, prefetchTx));
  }

  override async getNetwork() {
    return await this.faultyCall(async () => await super.getNetwork());
  }

  override async _getTransactionRequest(_request: TransactionRequest) {
    return super._getTransactionRequest(_request);
  }

  private async faultyCall<T>(fn: () => Promise<T>): Promise<T> {
    this.isWorking = (this.isWorking + 1) % 8;

    if (this.isWorking !== 7) {
      return await fn();
    }

    return await new Promise<T>((_, reject) =>
      reject({
        statusCode: 429,
        code: 'UNKNOWN_ERROR',
        error: {
          name: 'UNKNOWN_ERROR',
          message: 'mock decided to say no today',
        },
      })
    );
  }
}
