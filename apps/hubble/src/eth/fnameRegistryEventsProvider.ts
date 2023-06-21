import axios from 'axios';
import { logger } from '../utils/logger.js';
import { HubInterface } from '../hubble.js';
import { hexStringToBytes, UserNameProof, UserNameType, utf8StringToBytes } from '@farcaster/hub-nodejs';
import { Result } from 'neverthrow';

const DEFAULT_POLL_TIMEOUT_IN_MS = 10_000;

const log = logger.child({
  component: 'FNameRegistryEventsProvider',
});

export type FNameTransfer = {
  id: number;
  username: string;
  owner: string;
  server_signature: string;
  timestamp: number;
  from: number;
  to: number;
};

export interface FNameRegistryClientInterface {
  getTransfers(since: number): Promise<FNameTransfer[]>;
}

export class FNameRegistryClient implements FNameRegistryClientInterface {
  private url: string;
  constructor(url: string) {
    this.url = url;
  }

  public async getTransfers(since = 0): Promise<FNameTransfer[]> {
    const response = await axios.get(`${this.url}/transfers?since=${since}`);
    return response.data.transfers;
  }
}

export class FNameRegistryEventsProvider {
  private client: FNameRegistryClientInterface;
  private hub: HubInterface;
  private lastTransferTimestamp = 0;
  private resyncEvents: boolean;
  private pollTimeoutId: ReturnType<typeof setTimeout> | undefined;

  constructor(fnameRegistryClient: FNameRegistryClientInterface, hub: HubInterface, resyncEvents = false) {
    this.client = fnameRegistryClient;
    this.hub = hub;
    this.resyncEvents = resyncEvents;
  }

  public async start() {
    const result = await this.hub.getHubState();
    if (result.isErr()) {
      log.error(`Failed to get hub state: ${result.error}, defaulting to the beginning`);
      this.lastTransferTimestamp = 0;
    } else {
      this.lastTransferTimestamp = result.value.lastFnameProof;
    }
    if (this.resyncEvents) {
      log.error(`Resyncing fname events from the beginning`);
      this.lastTransferTimestamp = 0;
    }
    log.info(`Starting fname events provider from ${this.lastTransferTimestamp}`);
    return this.pollForNewEvents();
  }

  public async stop() {
    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId);
    }
  }

  private async pollForNewEvents() {
    await this.fetchAndMergeTransfers(this.lastTransferTimestamp);
    this.pollTimeoutId = setTimeout(this.pollForNewEvents.bind(this), DEFAULT_POLL_TIMEOUT_IN_MS);
  }

  private async fetchAndMergeTransfers(since: number) {
    let transfers = await this.client.getTransfers(since);
    let transfersCount = 0;
    while (transfers.length > 0) {
      transfersCount += transfers.length;
      await this.mergeTransfers(transfers);
      const lastTransfer = transfers[transfers.length - 1];
      if (!lastTransfer) {
        break;
      }
      this.lastTransferTimestamp = lastTransfer.timestamp;
      transfers = await this.client.getTransfers(lastTransfer.timestamp);
    }
    log.info(`Fetch ${transfersCount} upto ${this.lastTransferTimestamp}`);
    const result = await this.hub.getHubState();
    if (result.isOk()) {
      result.value.lastFnameProof = this.lastTransferTimestamp;
      await this.hub.putHubState(result.value);
    } else {
      log.error({ errCode: result.error.errCode }, `failed to get hub state: ${result.error.message}`);
    }
  }

  private async mergeTransfers(transfers: FNameTransfer[]) {
    for (const transfer of transfers) {
      const serialized = Result.combine([
        utf8StringToBytes(transfer.username),
        hexStringToBytes(transfer.owner),
        hexStringToBytes(transfer.server_signature),
      ]);
      if (serialized.isErr()) {
        log.error(`Failed to serialize username proof for ${transfer.username}: ${serialized.error}`);
        continue;
      }
      const [username, owner, signature] = serialized.value;
      const usernameProof = UserNameProof.create({
        timestamp: transfer.timestamp,
        name: username,
        owner: owner,
        signature: signature,
        fid: transfer.to,
        type: UserNameType.USERNAME_TYPE_FNAME,
      });
      await this.hub.submitUserNameProof(usernameProof, 'fname-registry');
    }
  }
}
