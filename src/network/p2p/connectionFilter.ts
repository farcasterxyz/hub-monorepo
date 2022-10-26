import { ConnectionGater, MultiaddrConnection } from '@libp2p/interface-connection';
import { PeerId } from '@libp2p/interface-peer-id';
import { Multiaddr } from '@multiformats/multiaddr';
import { logger } from '~/utils/logger';

/**
 * Implementes the libp2p ConnectionGater interface
 *
 * These APIs are called in a particular sequence for each inbound/outbound connection.
 * We just want to intercept at the lowest possible point which is why every API here is implemented.
 *
 * Note - arrow functions are used here because libp2p's createLibp2p (see `src/network/node.ts`)
 * uses a "recursivePartial" on the passed in object and class methods are not enumerated.
 * Using arrow functions allows their recursivePartial enumerator to parse the object.
 */
export class ConnectionFilter implements ConnectionGater {
  private allowedPeers: string[];

  constructor(addrs: string[]) {
    this.allowedPeers = addrs;
  }

  denyDialPeer = async (peerId: PeerId): Promise<boolean> => {
    const deny = await this.shouldDeny(peerId.toString());
    if (deny) {
      logger.info(`ConnectionFilter denyDialPeer: denied a connection with ${peerId}`);
    }
    return deny;
  };

  denyDialMultiaddr = async (peerId: PeerId, _multiaddr: Multiaddr): Promise<boolean> => {
    const deny = await this.shouldDeny(peerId.toString());
    if (deny) {
      logger.info(`ConnectionFilter denyDialMultiaddr: denied a connection with ${peerId}`);
    }
    return deny;
  };

  denyInboundConnection = async (_maConn: MultiaddrConnection): Promise<boolean> => {
    /**
     * A PeerId is not always known on incepeint connections.
     * Don't filter incepient connections, later filters will catch it.
     */
    return false;
  };

  denyOutboundConnection = async (peerId: PeerId, _maConn: MultiaddrConnection): Promise<boolean> => {
    const deny = await this.shouldDeny(peerId.toString());
    if (deny) {
      logger.info(`ConnectionFilter denyOutboundConnection: denied a connection with ${peerId}`);
    }
    return deny;
  };

  denyInboundEncryptedConnection = async (peerId: PeerId, _maConn: MultiaddrConnection): Promise<boolean> => {
    const deny = await this.shouldDeny(peerId.toString());
    if (deny) {
      logger.info(`ConnectionFilter denyInboundEncryptedConnection: denied a connection with ${peerId}`);
    }
    return deny;
  };

  denyOutboundEncryptedConnection = async (peerId: PeerId, _maConn: MultiaddrConnection): Promise<boolean> => {
    const deny = await this.shouldDeny(peerId.toString());
    if (deny) {
      logger.info(`ConnectionFilter denyOutboundEncryptedConnection: denied a connection with ${peerId}`);
    }
    return deny;
  };

  denyInboundUpgradedConnection = async (peerId: PeerId, _maConn: MultiaddrConnection): Promise<boolean> => {
    const deny = await this.shouldDeny(peerId.toString());
    if (deny) {
      logger.info(`ConnectionFilter denyInboundUpgradedConnection: denied a connection with ${peerId}`);
    }
    return deny;
  };

  denyOutboundUpgradedConnection = async (peerId: PeerId, _maConn: MultiaddrConnection): Promise<boolean> => {
    const deny = await this.shouldDeny(peerId.toString());
    if (deny) {
      logger.info(`ConnectionFilter denyOutboundUpgradedConnection: denied a connection with ${peerId}`);
    }
    return deny;
  };

  filterMultiaddrForPeer = async (peer: PeerId): Promise<boolean> => {
    const deny = await this.shouldDeny(peer.toString());
    return !deny;
  };

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private shouldDeny(peerId: string | null) {
    if (!peerId) return Promise.resolve(true);
    const found = this.allowedPeers.find((value) => {
      return peerId && value === peerId;
    });
    return Promise.resolve(found === undefined);
  }
}
