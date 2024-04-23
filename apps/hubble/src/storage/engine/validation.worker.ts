import { validations } from "@farcaster/hub-nodejs";
import { rsValidationMethods } from "../../rustfunctions.js";
import { workerData, parentPort } from "worker_threads";
import { http, createPublicClient, fallback, HttpTransport } from "viem";
import { optimism, mainnet } from "viem/chains";
import { ValidationWorkerData, ValidationWorkerMessage } from "./index.js";

const config = workerData as ValidationWorkerData;
const opMainnetRpcUrls = config.l2RpcUrl.split(",");
const opTransports = opMainnetRpcUrls.map((url) => http(url));
const opClient = createPublicClient({
  chain: optimism,
  transport: opTransports[0] as HttpTransport,
});

const ethMainnetRpcUrls = config.ethMainnetRpcUrl.split(",");
const transports = ethMainnetRpcUrls.map((url) => http(url));
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: transports[0] as HttpTransport,
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
