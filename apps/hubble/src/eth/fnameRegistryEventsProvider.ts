import axios from 'axios';
import { logger } from '../utils/logger.js';
import { HubInterface } from '../hubble.js';
import { hexStringToBytes, UserNameProof, UserNameType, utf8StringToBytes } from '@farcaster/hub-nodejs';
import { Result } from 'neverthrow';

const log = logger.child({
  component: 'FNameRegistryEventsProvider',
});

export class FNameRegistryEventsProvider {
  private url: string;
  private hub: HubInterface;

  constructor(url: string, hub: HubInterface) {
    this.url = url;
    this.hub = hub;
  }

  public async start() {
    return this.syncHistoricalEvents();
  }

  private async syncHistoricalEvents() {
    const response = await axios.get(`${this.url}/transfers`);
    for (const transfer of response.data) {
      const serialized = Result.combine([
        utf8StringToBytes(transfer.username),
        hexStringToBytes(transfer.owner),
        hexStringToBytes(transfer.signature),
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
        type: UserNameType.USERNAME_TYPE_FNAME,
      });
      const res = await this.hub.submitUserNameProof(usernameProof, 'fname-registry');
      if (res.isErr()) {
        throw new Error(`Failed to submit username proof: ${res.error}`);
      }
    }
  }
}
