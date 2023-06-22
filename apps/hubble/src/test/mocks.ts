import {
  FarcasterNetwork,
  HubAsyncResult,
  HubError,
  HubRpcClient,
  HubState,
  IdRegistryEvent,
  Message,
  NameRegistryEvent,
  UserNameProof,
} from '@farcaster/hub-nodejs';
import { ok, ResultAsync } from 'neverthrow';
import { HubInterface, HubSubmitSource } from '../hubble.js';
import { GossipNode } from '../network/p2p/gossipNode.js';
import RocksDB from '../storage/db/rocksdb.js';
import Engine from '../storage/engine/index.js';
import { PeerId } from '@libp2p/interface-peer-id';
import { ContactInfoContent } from '@farcaster/core';
import { getHubState, putHubState } from '../storage/db/hubState.js';

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

  async submitUserNameProof(proof: UserNameProof): HubAsyncResult<number> {
    return this.engine.mergeUserNameProof(proof);
  }

  async getHubState(): HubAsyncResult<HubState> {
    const result = await ResultAsync.fromPromise(getHubState(this.db), (e) => e as HubError);
    if (result.isErr() && result.error.errCode === 'not_found') {
      const hubState = HubState.create({ lastEthBlock: 0, lastFnameProof: 0 });
      await putHubState(this.db, hubState);
      return ok(hubState);
    }
    return result;
  }

  async putHubState(hubState: HubState): HubAsyncResult<void> {
    return await ResultAsync.fromPromise(putHubState(this.db, hubState), (e) => e as HubError);
  }

  async gossipContactInfo(): HubAsyncResult<void> {
    this.gossipCount += 1;
    return ok(undefined);
  }

  async getRPCClientForPeer(_peerId: PeerId, _peer: ContactInfoContent): Promise<HubRpcClient | undefined> {
    return undefined;
  }
}
