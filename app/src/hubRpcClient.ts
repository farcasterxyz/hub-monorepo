import { AddressInfo } from 'net';
import { Client } from 'undici';
import { logger } from '~/utils/logger';
import { addressInfoToString, ipMultiAddrStrFromAddressInfo } from '~/utils/p2p';

class HubRPCClient extends Client {
  private serverAddr: string;

  constructor(addressInfo: AddressInfo) {
    const multiAddrResult = ipMultiAddrStrFromAddressInfo(addressInfo);
    if (multiAddrResult.isErr()) {
      logger.warn({ component: 'gRPC Client', address: addressInfo }, 'Failed to parse address as multiaddr');
    }

    const addressString = addressInfoToString(addressInfo);
    super(addressString);

    this.serverAddr = `${multiAddrResult.unwrapOr('localhost')}/tcp/${addressInfo.port}`;
  }

  get serverMultiaddr() {
    return this.serverAddr;
  }
}

export default HubRPCClient;
