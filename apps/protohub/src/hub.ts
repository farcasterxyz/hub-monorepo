import * as protobufs from '@farcaster/protobufs';
import { HubAsyncResult } from '@farcaster/protoutils';

export type HubSubmitSource = 'gossip' | 'rpc' | 'eth-provider';

export const APP_VERSION = process.env['npm_package_version'] ?? '1.0.0';
export const APP_NICKNAME = 'Farcaster Hub';

export interface HubInterface {
  submitMessage(message: protobufs.Message, source?: HubSubmitSource): HubAsyncResult<void>;
  submitIdRegistryEvent(event: protobufs.IdRegistryEvent, source?: HubSubmitSource): HubAsyncResult<void>;
  submitNameRegistryEvent(event: protobufs.NameRegistryEvent, source?: HubSubmitSource): HubAsyncResult<void>;
  getHubState(): HubAsyncResult<protobufs.HubState>;
  putHubState(hubState: protobufs.HubState): HubAsyncResult<void>;
}
