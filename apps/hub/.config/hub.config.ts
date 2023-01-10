/**
 * A default configuration file to start a Hub
 *
 * Update or uncomment config fields as needed.
 * Note: CLI options take precedence over the options specified in a config file
 */

const DEFAULT_GOSSIP_PORT = 13111;
const DEFAULT_RPC_PORT = 13112;

export const Config = {
  /** Path to a PeerId file */
  id: './.hub/default_id.protobuf',
  /** Network URL of the IdRegistry Contract */
  // networkUrl: '',
  /** Address of the IdRegistry Contract  */
  // firAddress: '',
  /** A list of MultiAddrs to use for bootstrapping */
  // bootstrapAddresses: [],
  /** An "allow list" of Peer Ids. Blocks all other connections */
  // allowedPeers: [],
  /** The IP address libp2p should listen on. */
  ip: '127.0.0.1',
  /** The IP address that libp2p should announce to peers */
  announceIp: '',
  /** Fetch the IP address from an external service? */
  fetchIp: false,
  /** The TCP port libp2p should listen on. */
  gossipPort: DEFAULT_GOSSIP_PORT,
  /** The RPC port to use. */
  rpcPort: DEFAULT_RPC_PORT,
  /** The name of the RocksDB instance */
  dbName: 'rocks.hub._default',
  /** Clear the RocksDB instance before starting */
  dbReset: false,
};
