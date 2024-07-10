/**
 * A default configuration file to start a Hub
 *
 * Update or uncomment config fields as needed.
 * Note: CLI options take precedence over the options specified in a config file
 */
import { DEFAULT_DIAGNOSTIC_REPORT_URL } from "./utils/diagnosticReport.js";

const DEFAULT_GOSSIP_PORT = 2282;
const DEFAULT_RPC_PORT = 2283;
const DEFAULT_HTTP_API_PORT = 2281;
const DEFAULT_NETWORK = 3; // Farcaster Devnet
export const DEFAULT_CATCHUP_SYNC_SNAPSHOT_MESSAGE_LIMIT = 50_000_000;

export const Config = {
  /** Path to a PeerId file */
  id: "./.hub/default_id.protobuf",
  /** ETH mainnet RPC URL */
  // ethMainnetRpcUrl: '',
  /** FName Registry Server URL */
  // fnameServerUrl: '';
  /** Network URL of the StorageRegistry Contract */
  // l2RpcUrl: '',
  /** A list of MultiAddrs to use for bootstrapping */
  // bootstrap: [],
  /** An "allow list" of Peer Ids. Blocks all other connections */
  // allowedPeers: [
  //   '12D3KooWGNNs8uJkmJfThyrnESRBhfuNUAGeGrLb1PYssNnwQy11', // prod hub
  // ],
  // deniedPeers: [],
  /** The IP address libp2p should listen on. */
  ip: "0.0.0.0",
  /** The IP address that libp2p should announce to peers */
  // announceIp: '',
  /** The server name to announce to peers */
  // announceServerName: '',
  /** The TCP port libp2p should listen on. */
  gossipPort: DEFAULT_GOSSIP_PORT,
  /** The RPC port to use. */
  rpcPort: DEFAULT_RPC_PORT,
  /** The HTTP API port to use. */
  httpApiPort: DEFAULT_HTTP_API_PORT,
  /** RPC Auth, disabled by default */
  // rpcAuth: 'admin:password',
  /** Per-IP rate limiting for the RPC server*/
  rpcRateLimit: 20000,
  /** The name of the RocksDB instance */
  dbName: "rocks.hub._default",
  /** Rebuild the sync trie before starting */
  rebuildSyncTrie: false,
  /** Commit lock timeout in ms */
  commitLockTimeout: 500,
  /** Commit lock queue size */
  commitLockMaxPending: 1_000,
  /** Farcaster network */
  network: DEFAULT_NETWORK,
  /** Don't allow snapshot sync */
  // disableSnapshotSync: true,
  /** Catchup sync with snapshot
   * NOTE: Catchup sync using snapshot WILL RESET THE DATABASE
   */
  catchupSyncWithSnapshot: true,
  /**
   * Message limit - when exceeded, trigger catchup sync using snapshot
   * NOTE: Catchup sync using snapshot WILL RESET THE DATABASE
   */
  catchupSyncSnapshotMessageLimit: DEFAULT_CATCHUP_SYNC_SNAPSHOT_MESSAGE_LIMIT,
  /**
   * Opt-out of sending diagnostics data to the Farcaster foundation
   * Diagnostics are used to troubleshoot user issues and improve health of the network
   */
  optOutDiagnostics: false,
  /** The URL to send diagnostic reports to */
  diagnosticReportUrl: DEFAULT_DIAGNOSTIC_REPORT_URL,
  /** Start the admin server? */
  adminServerEnabled: false,
  /** The admin server bind host */
  adminServerHost: "127.0.0.1",
  /** StatsD server */
  // statsdMetricsServer: "127.0.0.1:8125",
  /** A list of addresses the node directly peers with, provided in MultiAddr format */
  directPeers: [],
  /** Disable progress bars and immediately print logs instead */
  // disableConsoleStatus: false,
  /** Enable backing up snapshots to S3 */
  // enableSnapshotToS3: false,
  /** S3 bucket name */
  // s3BucketName: '',
  connectToDbPeers: true,
};
