/**
 * A default configuration file to start a Hub
 *
 * Update or uncomment config fields as needed.
 * Note: CLI options take precedence over the options specified in a config file
 */

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
  /** The TCP port libp2p should listen on. */
  gossipPort: 0,
  /** The RPC port to use. */
  rpcPort: 0,
  /** Enable/Disable simple sync */
  simpleSync: true,
  /** The name of the RocksDB instance */
  dbName: 'rocks.hub._default',
  /** Clear the RocksDB instance before starting */
  dbReset: false,
};
