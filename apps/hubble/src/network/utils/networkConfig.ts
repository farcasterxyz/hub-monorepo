import { HubAsyncResult, HubError } from "@farcaster/hub-nodejs";
import semver from "semver";
import https from "https";
import { Result, err, ok } from "neverthrow";
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
  storageRegistryAddress: `0x${string}` | undefined;
  keyRegistryAddress: `0x${string}` | undefined;
  idRegistryAddress: `0x${string}` | undefined;
  allowlistedImmunePeers: string[] | undefined;
  strictContactInfoValidation: boolean | undefined;
  strictNoSign: boolean | undefined;
  keyRegistryV2Address: `0x${string}` | undefined;
  idRegistryV2Address: `0x${string}` | undefined;
  solanaVerificationsEnabled: boolean | undefined;
};

export type NetworkConfigResult = {
  allowedPeerIds: string[] | undefined;
  deniedPeerIds: string[];
  allowlistedImmunePeers: string[] | undefined;
  strictContactInfoValidation: boolean | undefined;
  strictNoSign: boolean | undefined;
  shouldExit: boolean;
  solanaVerificationsEnabled: boolean | undefined;
};

export async function fetchNetworkConfig(): HubAsyncResult<NetworkConfig> {
  return new Promise((resolve) => {
    https
      .get(NETWORK_CONFIG_LOCATION, { timeout: 15 * 1000 }, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          const script = Result.fromThrowable(
            () => new vm.Script(data),
            (error) => error,
          )();

          if (script.isErr()) {
            log.error({ error: script.error, data }, "Error parsing network config");
            resolve(err(new HubError("unavailable.network_failure", script.error as Error)));
            return;
          }

          // biome-ignore lint/suspicious/noExplicitAny: context has to be "any"
          const context: any = {};

          const result = Result.fromThrowable(
            () => script.value.runInNewContext(context),
            (e) => e,
          )();
          if (result.isErr()) {
            log.error({ error: result.error, data }, "Error running network config");
            resolve(err(new HubError("unavailable.network_failure", result.error as Error)));
            return;
          }

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
  allowlistedImmunePeers: string[] | undefined,
  strictContactInfoValidation: boolean | undefined,
  strictNoSign: boolean | undefined,
  solanaVerificationsEnabled: boolean | undefined,
): NetworkConfigResult {
  if (networkConfig.network !== currentNetwork) {
    log.error({ networkConfig, network: currentNetwork }, "network config mismatch");
    return {
      allowedPeerIds,
      deniedPeerIds,
      allowlistedImmunePeers,
      strictContactInfoValidation,
      strictNoSign,
      shouldExit: false,
      solanaVerificationsEnabled,
    };
  }

  // Refuse to start if we are below the minAppVersion
  const minAppVersion = networkConfig.minAppVersion;

  if (semver.valid(minAppVersion)) {
    if (semver.lt(APP_VERSION, minAppVersion)) {
      const errMsg = "Hubble version is too old too start. Please update your node.";
      log.fatal({ minAppVersion, ourVersion: APP_VERSION }, errMsg);
      return {
        allowedPeerIds,
        deniedPeerIds,
        allowlistedImmunePeers,
        strictContactInfoValidation,
        strictNoSign,
        shouldExit: true,
        solanaVerificationsEnabled,
      };
    }
  } else {
    log.error({ networkConfig }, "invalid minAppVersion");
  }

  let newPeerIdList: string[] | undefined = allowedPeerIds;
  let newDeniedPeerIdList: string[] = [];

  if (networkConfig.allowedPeers) {
    // Add the network.allowedPeers to the list of allowed peers
    newPeerIdList = [...new Set([...(allowedPeerIds ?? []), ...networkConfig.allowedPeers])];
  } else {
    log.info({ networkConfig }, "network config does not contain 'allowedPeers'");
  }

  // Then remove the denied peers from this list
  if (networkConfig.deniedPeers) {
    newPeerIdList = newPeerIdList?.filter((peerId) => !networkConfig.deniedPeers.includes(peerId));
    newDeniedPeerIdList = [...new Set([...deniedPeerIds, ...networkConfig.deniedPeers])];
  } else {
    log.info({ networkConfig }, "network config does not contain 'deniedPeers'");
  }

  let newAllowlistedImmunePeers: string[] = [];
  if (networkConfig.allowlistedImmunePeers) {
    newAllowlistedImmunePeers = [
      ...new Set([...(allowlistedImmunePeers ?? []), ...networkConfig.allowlistedImmunePeers]),
    ];
  }

  return {
    allowedPeerIds: newPeerIdList,
    deniedPeerIds: newDeniedPeerIdList,
    allowlistedImmunePeers: newAllowlistedImmunePeers,
    strictContactInfoValidation: strictContactInfoValidation || !!networkConfig.strictContactInfoValidation,
    strictNoSign: strictNoSign || !!networkConfig.strictNoSign,
    shouldExit: false,
    solanaVerificationsEnabled: solanaVerificationsEnabled || networkConfig.solanaVerificationsEnabled,
  };
}
