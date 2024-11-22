import { ConnectionGater, MultiaddrConnection, PeerId } from "@libp2p/interface";
import { Multiaddr } from "@multiformats/multiaddr";
import { logger } from "../../utils/logger.js";

const log = logger.child({
  component: "ConnectionFilter",
});

/**
 * ConnectionFilter ensures that nodes only collect to peers in a specific allowlist.
 *
 * It implements the entire libp2p ConnectionGater interface to intercept calls at the lowest level
 * and prevent the connection.
 *
 * Note: arrow functions are used since libp2p's createLibp2p uses a "recursivePartial" on the
 * passed in object and class methods are not enumerated. Using arrow functions allows their
 * recursivePartial enumerator to parse the object (see `./gossipNode.ts`)
 */
export class ConnectionFilter implements ConnectionGater {
  private allowedPeers: string[] | undefined;
  private deniedPeers: string[];

  constructor(addrs: string[] | undefined, deniedPeers: string[] | undefined) {
    this.allowedPeers = addrs;
    this.deniedPeers = deniedPeers ?? [];
  }

  updateAllowedPeers(addrs: string[] | undefined) {
    this.allowedPeers = addrs;
  }

  updateDeniedPeers(addrs: string[]) {
    this.deniedPeers = addrs;
  }

  denyDialPeer = async (peerId: PeerId): Promise<boolean> => {
    const deny = this.shouldDeny(peerId.toString());
    if (deny) {
      log.info({ peerId, filter: "denyDialPeer" }, "denied a connection");
    }
    return deny;
  };

  denyDialMultiaddr = async (_multiaddr: Multiaddr): Promise<boolean> => {
    const peerId = _multiaddr.getPeerId();
    if (!peerId) {
      return true;
    }

    const deny = this.shouldDeny(peerId.toString());
    if (deny) {
      log.info({ peerId, filter: "denyDialMultiaddr" }, "denied a connection");
    }
    return deny;
  };

  denyInboundConnection = async (_maConn: MultiaddrConnection): Promise<boolean> => {
    /** PeerId may not be known yet, let it pass and other filters will catch it. */
    return false;
  };

  denyOutboundConnection = async (peerId: PeerId, _maConn: MultiaddrConnection): Promise<boolean> => {
    const deny = this.shouldDeny(peerId.toString());
    if (deny) {
      log.info({ peerId, filter: "denyOutboundConnection" }, "denied a connection");
    }
    return deny;
  };

  denyInboundEncryptedConnection = async (peerId: PeerId, _maConn: MultiaddrConnection): Promise<boolean> => {
    const deny = this.shouldDeny(peerId.toString());
    if (deny) {
      log.info({ peerId, filter: "denyInboundEncryptedConnection" }, "denied a connection");
    }
    return deny;
  };

  denyOutboundEncryptedConnection = async (peerId: PeerId, _maConn: MultiaddrConnection): Promise<boolean> => {
    const deny = this.shouldDeny(peerId.toString());
    if (deny) {
      log.info({ peerId, filter: "denyOutboundEncryptedConnection" }, "denied a connection");
    }
    return deny;
  };

  denyInboundUpgradedConnection = async (peerId: PeerId, _maConn: MultiaddrConnection): Promise<boolean> => {
    const deny = this.shouldDeny(peerId.toString());
    if (deny) {
      log.info({ peerId, filter: "denyInboundUpgradedConnection" }, "denied a connection");
    }
    return deny;
  };

  denyOutboundUpgradedConnection = async (peerId: PeerId, _maConn: MultiaddrConnection): Promise<boolean> => {
    const deny = this.shouldDeny(peerId.toString());
    if (deny) {
      log.info({ peerId, filter: "denyOutboundUpgradedConnection" }, "denied a connection");
    }
    return deny;
  };

  filterMultiaddrForPeer = async (peer: PeerId): Promise<boolean> => {
    return !this.shouldDeny(peer.toString());
  };

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private shouldDeny(peerId: string) {
    if (!peerId) return true;

    // Deny list is checked first
    if (this.deniedPeers.find((value) => value === peerId)) return true;

    // If the allowedPeers is undefined, that means we are running in "allow all" mode
    if (this.allowedPeers === undefined) return false;

    // Access-controlled mode. Check if the peerId is in the allow list
    const found = this.allowedPeers.find((value) => {
      return peerId && value === peerId;
    });
    return found === undefined;
  }
}
