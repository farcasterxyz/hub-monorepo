import { validations } from "@farcaster/hub-nodejs";
import { rsValidationMethods } from "../../rustfunctions.js";
import { workerData, parentPort } from "worker_threads";
import { http, createPublicClient, fallback } from "viem";
import { optimism, mainnet } from "viem/chains";

export interface ValidationWorkerData {
  l2RpcUrl: string;
  ethMainnetRpcUrl: string;
}

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

// Wait for messages from the main thread and validate them, posting the result back
parentPort?.on("message", (data) => {
  (async () => {
    const { id, message } = data;
    const result = await validations.validateMessage(message, rsValidationMethods, publicClients);

    if (result.isErr()) {
      parentPort?.postMessage({ id, errCode: result.error.errCode, errMessage: result.error.message });
    } else {
      parentPort?.postMessage({ id, message: result.value });
    }
  })();
});
