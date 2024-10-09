import { validations } from "@farcaster/hub-nodejs";
import { rsValidationMethods } from "../../rustfunctions.js";
import { workerData, parentPort, isMainThread } from "worker_threads";
import { http, createPublicClient, fallback } from "viem";
import { optimism, mainnet } from "viem/chains";
import { ValidationWorkerData, ValidationWorkerMessage } from "./index.js";
import inspector from "node:inspector";

const config = workerData as ValidationWorkerData;
const opMainnetRpcUrls = config.l2RpcUrl.split(",");
const opTransports = opMainnetRpcUrls.map((url) => http(url, { retryCount: 2 }));
const opClient = createPublicClient({
  chain: optimism,
  transport: fallback(opTransports, { rank: false }),
});

const ethMainnetRpcUrls = config.ethMainnetRpcUrl.split(",");
const transports = ethMainnetRpcUrls.map((url) => http(url, { retryCount: 2 }));
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: fallback(transports, { rank: false }),
});

const publicClients = {
  [optimism.id]: opClient,
  [mainnet.id]: mainnetClient,
};

if (!isMainThread) {
  if (process.execArgv[0]) {
    const [_, port] = process.execArgv[0].split("=");
    if (port === undefined) {
      console.log("missing port");
    } else {
      inspector.open(parseInt(port));
    }
  }
}

// Wait for messages from the main thread and validate them, posting the result back
parentPort?.on("message", (data) => {
  (async () => {
    const { id, message } = data;
    const result = await validations.validateMessage(message, rsValidationMethods, publicClients);

    if (result.isErr()) {
      const response: ValidationWorkerMessage = {
        id,
        errCode: result.error.errCode,
        errMessage: result.error.message,
      };
      parentPort?.postMessage(response);
    } else {
      const response: ValidationWorkerMessage = { id, message: result.value };
      parentPort?.postMessage(response);
    }
  })();
});
