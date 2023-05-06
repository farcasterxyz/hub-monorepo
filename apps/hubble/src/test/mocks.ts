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
import { HubInterface, HubSubmitSource } from '~/hubble';
import { GossipNode } from '~/network/p2p/gossipNode';
import RocksDB from '~/storage/db/rocksdb';
import Engine from '~/storage/engine';
import { AbstractProvider } from 'ethers';
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

  constructor() {
    // The Goerli networkID is 5
    super(5);
  }

  override async getLogs() {
    this.getLogsCount += 1;
    return [];
  }

  override async getBlockNumber() {
    return 1;
  }
}
