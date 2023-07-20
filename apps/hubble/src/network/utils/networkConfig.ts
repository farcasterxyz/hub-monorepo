import { HubAsyncResult, HubError } from "@farcaster/hub-nodejs";
import https from "https";
import { err, ok } from "neverthrow";
import { logger } from "../../utils/logger.js";
import vm from "vm";

const log = logger.child({
  component: "NetworkConfig",
});

const NETWORK_CONFIG_LOCATION =
  "https://raw.githubusercontent.com/farcasterxyz/allowlist-mainnet/main/networkConfig.js";

export type NetworkConfig = {
  network: number;
  allowedPeers: string[];
  deniedPeers: string[];
  minAppVersion: string;
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
