import { HubAsyncResult, HubError } from "@farcaster/hub-nodejs";
import semver from "semver";
import https from "https";
import { err, ok } from "neverthrow";
import { logger } from "../../utils/logger.js";
import vm from "vm";
import { APP_VERSION } from "../../hubble.js";

const log = logger.child({
  component: "NetworkConfig",
});

const NETWORK_CONFIG_LOCATION =
  "https://raw.githubusercontent.com/farcasterxyz/allowlist-mainnet/main/networkConfig.js";

export type NetworkConfig = {
  network: number;
  allowedPeers: string[] | undefined;
  deniedPeers: string[];
  minAppVersion: string;
};

export type NetworkConfigResult = {
  allowedPeerIds: string[] | undefined;
  deniedPeerIds: string[];
  shouldExit: boolean;
};

export async function fetchNetworkConfig(): HubAsyncResult<NetworkConfig> {
  return new Promise((resolve) => {
    https
      .get(NETWORK_CONFIG_LOCATION, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          const script = new vm.Script(data);
          // rome-ignore lint/suspicious/noExplicitAny: <explanation>
          const context: any = {};
          script.runInNewContext(context);

          // Access the config object
          const config = context["config"] as NetworkConfig;
          resolve(ok(config));
        });
      })
      .on("error", (error) => {
        log.error({ error, msg: error.message }, "Error fetching network config");
        resolve(err(new HubError("unavailable.network_failure", error)));
      });
  });
}

export function applyNetworkConfig(
  networkConfig: NetworkConfig,
  allowedPeerIds: string[] | undefined,
  deniedPeerIds: string[],
  currentNetwork: number,
): NetworkConfigResult {
  if (networkConfig.network !== currentNetwork) {
    log.error({ networkConfig, network: currentNetwork }, "network config mismatch");
    return { allowedPeerIds, deniedPeerIds, shouldExit: false };
  }

  // Refuse to start if we are below the minAppVersion
  const minAppVersion = networkConfig.minAppVersion;

  if (semver.valid(minAppVersion)) {
    if (semver.lt(APP_VERSION, minAppVersion)) {
      const errMsg = "Hubble version is too old too start. Please update your node.";
      log.fatal({ minAppVersion, ourVersion: APP_VERSION }, errMsg);
      return { allowedPeerIds, deniedPeerIds, shouldExit: true };
    }
  } else {
    log.error({ networkConfig }, "invalid minAppVersion");
  }

  let newPeerIdList: string[] | undefined = undefined;
  let newDeniedPeerIdList: string[] = [];

  if (networkConfig.allowedPeers) {
    // Add the network.allowedPeers to the list of allowed peers
    newPeerIdList = [...new Set([...(allowedPeerIds ?? []), ...networkConfig.allowedPeers])];
  } else {
    log.error({ networkConfig }, "network config does not contain 'allowedPeers'");
  }

  // Then remove the denied peers from this list
  if (networkConfig.deniedPeers) {
    newPeerIdList = newPeerIdList?.filter((peerId) => !networkConfig.deniedPeers.includes(peerId));
    newDeniedPeerIdList = [...new Set([...deniedPeerIds, ...networkConfig.deniedPeers])];
  } else {
    log.error({ networkConfig }, "network config does not contain 'deniedPeers'");
  }

  return { allowedPeerIds: newPeerIdList, deniedPeerIds: newDeniedPeerIdList, shouldExit: false };
}
