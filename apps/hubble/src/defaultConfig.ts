/**
 * A default configuration file to start a Hub
 *
 * Update or uncomment config fields as needed.
 * Note: CLI options take precedence over the options specified in a config file
 */

const DEFAULT_GOSSIP_PORT = 2282;
const DEFAULT_RPC_PORT = 2283;
const DEFAULT_NETWORK = 3; // Farcaster Devnet

export const Config = {
  /** Path to a PeerId file */
  id: './.hub/default_id.protobuf',
  /** Network URL of the IdRegistry Contract */
  // ethRpcUrl: '',
  /** FName Registry Server URL */
  // fnameServerUrl: '';
  /** Address of the IdRegistry Contract  */
  // firAddress: '',
  /** A list of MultiAddrs to use for bootstrapping */
  // bootstrap: [],
  /** An "allow list" of Peer Ids. Blocks all other connections */
  // allowedPeers: [
  //   '12D3KooWGNNs8uJkmJfThyrnESRBhfuNUAGeGrLb1PYssNnwQy11', // prod hub
  //   '12D3KooWMDdQaMWCkQ8Gf3C6zdJdMEfFs8R2pw8YQw2HgoY8qhzA', // @adityapk00
  // ],
  /** The IP address libp2p should listen on. */
  ip: '0.0.0.0',
  /** The IP address that libp2p should announce to peers */
  // announceIp: '',
  /** The server name to announce to peers */
  // announceServerName: '',
  /** The TCP port libp2p should listen on. */
  gossipPort: DEFAULT_GOSSIP_PORT,
  /** The RPC port to use. */
  rpcPort: DEFAULT_RPC_PORT,
  /** RPC Auth, disabled by default */
  // rpcAuth: 'admin:password',
  /** Per-IP rate limiting for the RPC server*/
  rpcRateLimit: 20000,
  /** The name of the RocksDB instance */
  dbName: 'rocks.hub._default',
  /** Rebuild the sync trie before starting */
  rebuildSyncTrie: false,
  /** Commit lock timeout in ms */
  commitLockTimeout: 500,
  /** Commit lock queue size */
  commitLockMaxPending: 1_000,
  /** Farcaster network */
  network: DEFAULT_NETWORK,
  /** Start the admin server? */
  adminServerEnabled: false,
  /** The admin server bind host */
  adminServerHost: '127.0.0.1',
};
