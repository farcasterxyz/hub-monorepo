import axios from 'axios';
import { logger } from '../utils/logger.js';
import { HubInterface } from '../hubble.js';
import { eip712, hexStringToBytes, UserNameProof, UserNameType, utf8StringToBytes } from '@farcaster/hub-nodejs';
import { Result } from 'neverthrow';
import { bytesCompare } from '@farcaster/core';

const DEFAULT_POLL_TIMEOUT_IN_MS = 30_000;
const DEFAULT_READ_TIMEOUT_IN_MS = 10_000;

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
  getTransfers(fromId: number): Promise<FNameTransfer[]>;
  getSigner(): Promise<string>;
}

export class FNameRegistryClient implements FNameRegistryClientInterface {
  private url: string;
  constructor(url: string) {
    this.url = url;
  }

  public async getTransfers(fromId = 0): Promise<FNameTransfer[]> {
    const response = await axios.get(`${this.url}/transfers?from_id=${fromId}`, {
      timeout: DEFAULT_READ_TIMEOUT_IN_MS,
    });
    return response.data.transfers;
  }

  public async getSigner(): Promise<string> {
    const response = await axios.get(`${this.url}/signer`, {
      timeout: DEFAULT_READ_TIMEOUT_IN_MS,
    });
    return response.data.signer;
  }
}

export class FNameRegistryEventsProvider {
  private client: FNameRegistryClientInterface;
  private hub: HubInterface;
  private lastTransferId = 0;
  private resyncEvents: boolean;
  private pollTimeoutId: ReturnType<typeof setTimeout> | undefined;
  private signerAddress: Uint8Array;

  constructor(fnameRegistryClient: FNameRegistryClientInterface, hub: HubInterface, resyncEvents = false) {
    this.client = fnameRegistryClient;
    this.hub = hub;
    this.resyncEvents = resyncEvents;
    this.signerAddress = new Uint8Array();
  }

  public async start() {
    const result = await this.hub.getHubState();
    if (result.isErr()) {
      log.error(`Failed to get hub state: ${result.error}, defaulting to the beginning`);
      this.lastTransferId = 0;
    } else {
      this.lastTransferId = result.value.lastFnameProof;
    }
    if (this.resyncEvents) {
      log.error(`Resyncing fname events from the beginning`);
      this.lastTransferId = 0;
    }
    const rawAddress = await this.client.getSigner();
    const signerAddress = hexStringToBytes(rawAddress);
    if (signerAddress.isOk()) {
      this.signerAddress = signerAddress.value;
    }
    log.info(`Starting fname events provider from ${this.lastTransferId} using signer: ${rawAddress}`);
    return this.pollForNewEvents();
  }

  public async stop() {
    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId);
    }
  }

  private async pollForNewEvents() {
    await this.fetchAndMergeTransfers(this.lastTransferId);
    this.pollTimeoutId = setTimeout(this.pollForNewEvents.bind(this), DEFAULT_POLL_TIMEOUT_IN_MS);
  }

  private async fetchAndMergeTransfers(fromId: number) {
    this.lastTransferId = fromId;
    let transfers = await this.safeGetTransfers(fromId);
    let transfersCount = 0;
    while (transfers.length > 0) {
      transfersCount += transfers.length;
      await this.mergeTransfers(transfers);
      const lastTransfer = transfers[transfers.length - 1];
      if (!lastTransfer) {
        break;
      }
      this.lastTransferId = lastTransfer.id;
      transfers = await this.safeGetTransfers(this.lastTransferId);
    }
    log.info(`Fetched ${transfersCount} fname events upto ${this.lastTransferId}`);
    const result = await this.hub.getHubState();
    if (result.isOk()) {
      result.value.lastFnameProof = this.lastTransferId;
      await this.hub.putHubState(result.value);
    } else {
      log.error({ errCode: result.error.errCode }, `failed to get hub state: ${result.error.message}`);
    }
  }

  private async safeGetTransfers(fromId: number) {
    try {
      return await this.client.getTransfers(fromId);
    } catch (err) {
      log.error(err, `Failed to get transfers from ${fromId}`);
      return [];
    }
  }

  private async mergeTransfers(transfers: FNameTransfer[]) {
    if (this.signerAddress.length === 0) {
      log.warn(`No signer address, unable to merge name proofs`);
      return;
    }

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
      // TODO: Move the validation into the engine
      const recoveredAddress = eip712.verifyUserNameProof(
        {
          owner: transfer.owner,
          timestamp: transfer.timestamp,
          name: transfer.username,
        },
        signature
      );
      if (recoveredAddress.isOk() && bytesCompare(recoveredAddress.value, this.signerAddress) === 0) {
        await this.hub.submitUserNameProof(usernameProof, 'fname-registry');
      } else {
        log.warn(`Failed to verify username proof for ${transfer.username} id: ${transfer.id}`);
      }
    }
  }
}
