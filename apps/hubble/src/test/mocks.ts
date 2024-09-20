import {
  ClientOptions,
  FarcasterNetwork,
  HubAsyncResult,
  HubError,
  HubRpcClient,
  HubState,
  Message,
  OnChainEvent,
  UserNameProof,
} from "@farcaster/hub-nodejs";
import { ok, ResultAsync } from "neverthrow";
import { HubInterface, HubSubmitSource } from "../hubble.js";
import { GossipNode } from "../network/p2p/gossipNode.js";
import RocksDB from "../storage/db/rocksdb.js";
import Engine from "../storage/engine/index.js";
import { PeerId } from "@libp2p/interface";
import {
  ContactInfoContent,
  HubResult,
  MessageBundle,
  ViemLocalEip712Signer,
  makeUserNameProofClaim,
} from "@farcaster/core";
import { getHubState, putHubState } from "../storage/db/hubState.js";
import {
  FNameRegistryClientInterface,
  FNameTransfer,
  FNameTransferRequest,
} from "../eth/fnameRegistryEventsProvider.js";
import { Address, PrivateKeyAccount, generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { bytesToHex } from "viem/utils";
import { Multiaddr } from "@multiformats/multiaddr";

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

  bootstrapAddrs(): Multiaddr[] {
    return [];
  }

  async submitMessageBundle(
    _creationTimeMs: number,
    messageBundle: MessageBundle,
    source?: HubSubmitSource | undefined,
    _peerId?: PeerId,
  ): Promise<HubResult<number>[]> {
    const results: HubResult<number>[] = [];
    for (const message of messageBundle.messages) {
      const result = await this.submitMessage(message, source);
      results.push(result);
    }

    return results;
  }

  identity = "mock";
  hubOperatorFid = 0;

  async submitMessage(message: Message, source?: HubSubmitSource): HubAsyncResult<number> {
    const result = await this.engine.mergeMessage(message);

    if (result.isOk() && source === "rpc" && this.gossipNode !== undefined) {
      void this.gossipNode.gossipMessage(message);
    }

    return result;
  }

  async validateMessage(message: Message): HubAsyncResult<Message> {
    return this.engine.validateMessage(message);
  }

  async submitUserNameProof(proof: UserNameProof): HubAsyncResult<number> {
    return this.engine.mergeUserNameProof(proof);
  }

  async submitOnChainEvent(event: OnChainEvent): HubAsyncResult<number> {
    return this.engine.mergeOnChainEvent(event);
  }

  async getHubState(): HubAsyncResult<HubState> {
    const result = await ResultAsync.fromPromise(getHubState(this.db), (e) => e as HubError);
    if (result.isErr() && result.error.errCode === "not_found") {
      const hubState = HubState.create({ lastL2Block: 0, lastFnameProof: 0 });
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

  async getHubRpcClient(_address: string, _options?: Partial<ClientOptions>): Promise<HubRpcClient | undefined> {
    return undefined;
  }

  async updateApplicationPeerScore(_peerId: String, _score: number) {
    return ok(undefined);
  }
}

export class MockFnameRegistryClient implements FNameRegistryClientInterface {
  private transfersToReturn: FNameTransfer[][] = [];
  private minimumSince = 0;
  private timesToThrow = 0;
  private account: PrivateKeyAccount;
  private signer: ViemLocalEip712Signer;
  private signerAddress: Address;

  constructor(account: PrivateKeyAccount = privateKeyToAccount(generatePrivateKey())) {
    this.account = account;
    this.signer = new ViemLocalEip712Signer(account);
    this.signerAddress = account.address;
  }

  setTransfersToReturn(transfers: FNameTransfer[][]) {
    this.transfersToReturn = transfers;
    this.transfersToReturn.flat(2).forEach(async (t) => {
      if (t.server_signature === "") {
        t.server_signature = bytesToHex(
          (
            await this.signer.signUserNameProofClaim(
              makeUserNameProofClaim({
                name: t.username,
                owner: t.owner,
                timestamp: t.timestamp,
              }),
            )
          )._unsafeUnwrap(),
        );
      }
    });
  }

  setMinimumSince(minimumSince: number) {
    this.minimumSince = minimumSince;
  }

  setSignerAddress(address: Address) {
    this.signerAddress = address;
  }

  throwOnce() {
    this.timesToThrow = 1;
  }

  async getTransfers(params: FNameTransferRequest): Promise<FNameTransfer[]> {
    if (this.timesToThrow > 0) {
      this.timesToThrow--;
      throw new Error("connection failed");
    }
    if (params.from_id) {
      expect(params.from_id).toBeGreaterThanOrEqual(this.minimumSince);
    }
    const transfers = this.transfersToReturn.shift();
    if (!transfers) {
      return Promise.resolve([]);
    }
    return Promise.resolve(transfers);
  }

  async getSigner(): Promise<string> {
    return this.signerAddress;
  }
}
