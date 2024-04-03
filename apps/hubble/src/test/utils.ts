import {
  DeployContractParameters,
  HttpTransport,
  HttpTransportConfig,
  UrlRequiredError,
  createTestClient,
  createTransport,
  createWalletClient,
  custom,
  RpcRequestError,
  HttpRequestError,
} from "viem";
import { Chain, localhost } from "viem/chains";
import { createPublicClient, http, fallback } from "viem";
import { Abi } from "abitype";
import { accounts, localHttpUrl } from "./constants.js";
import { StorageRegistry } from "../eth/abis.js";
import { DeepPartial } from "fishery";
import { rpc, RpcRequest, RpcResponse } from "viem/utils";
import { schedule } from "node-cron";

export const anvilChain = {
  ...localhost,
  id: 31337,
  rpcUrls: {
    default: {
      http: [localHttpUrl],
    },
    public: {
      http: [localHttpUrl],
    },
  },
} satisfies Chain;

const provider = {
  // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
  on: (message: string, listener: (...args: any[]) => null) => {
    if (message === "accountsChanged") {
      // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
      listener([accounts[0].address] as any);
    }
  },
  removeListener: () => null,
  // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
  request: async ({ method, params }: any) => {
    if (method === "eth_requestAccounts") {
      return [accounts[0].address];
    }
    if (method === "personal_sign") {
      method = "eth_sign";
      params = [params[1], params[0]];
    }
    if (method === "wallet_watchAsset") {
      return true;
    }
    if (method === "wallet_addEthereumChain") return null;
    if (method === "wallet_switchEthereumChain") {
      return null;
    }
    if (method === "wallet_getPermissions" || method === "wallet_requestPermissions")
      return [
        {
          invoker: "https://example.com",
          parentCapability: "eth_accounts",
          caveats: [
            {
              type: "filterResponse",
              value: ["0x0c54fccd2e384b4bb6f2e405bf5cbc15a017aafb"],
            },
          ],
        },
      ];

    const transport = http(localHttpUrl)({ chain: anvilChain });
    const result = await transport.request({
      method,
      params,
    });
    return result;
  },
};

export const httpClient = createPublicClient({
  chain: anvilChain,
  pollingInterval: 1_000,
  transport: http(localHttpUrl),
});

export const publicClient = createPublicClient({
  chain: anvilChain,
  pollingInterval: 1_000,
  transport: fallback([http(localHttpUrl)]),
});

function rateLimitedHttpTransport(url: string, config: HttpTransportConfig = {}): HttpTransport {
  const { fetchOptions, key = "http", name = "Rate-Limited HTTP JSON-RPC", retryDelay } = config;
  return ({ chain, retryCount: retryCount_, timeout: timeout_ }) => {
    const retryCount: number = config.retryCount ?? retryCount_ ?? 0;
    const timeout = timeout_ ?? config.timeout ?? 10_000;
    const url_: string = url || chain?.rpcUrls.public.http[0] || chain?.rpcUrls.default.http[0] || "";
    if (!url_ || url_.length === 0) throw new UrlRequiredError();
    let count = 0;
    return createTransport(
      {
        key,
        name,
        async request({ method, params }) {
          const body = { method, params };

          if (count > 0) {
            throw new HttpRequestError({
              body,
              url: url_,
              status: 429,
            });
          }
          count++;
          const fn = async (body: RpcRequest): Promise<RpcResponse[]> => [
            await rpc.http(url_, {
              body: body ?? {},
              fetchOptions: fetchOptions ?? {},
              timeout,
            }),
          ];

          const response = await fn(body);
          const [{ error, result }] = response ? response : [{ error: null, result: null }];
          if (error)
            throw new RpcRequestError({
              body,
              error,
              url: url_,
            });
          return result;
        },
        retryCount,
        retryDelay: retryDelay ?? 150,
        timeout,
        type: "http",
      },
      {
        url,
      },
    );
  };
}

export const rateLimitedClient = createPublicClient({
  chain: anvilChain,
  pollingInterval: 1_000,
  transport: fallback([rateLimitedHttpTransport(localHttpUrl)]),
});

export const testClient = createTestClient({
  chain: anvilChain,
  mode: "anvil",
  transport: http(localHttpUrl),
});

export const walletClient = createWalletClient({
  chain: anvilChain,
  transport: custom(provider),
});

export const walletClientWithAccount = createWalletClient({
  account: accounts[0].address,
  chain: anvilChain,
  transport: custom(provider),
});

export const walletClientWithAccount2 = createWalletClient({
  account: accounts[1].address,
  chain: anvilChain,
  transport: custom(provider),
});

export const deploy = async <TAbi extends Abi | readonly unknown[]>(
  args: DeployContractParameters<
    TAbi,
    typeof walletClientWithAccount["chain"],
    typeof walletClientWithAccount["account"]
  >,
) => {
  const hash = await walletClientWithAccount.deployContract(args);

  await testClient.mine({ blocks: 1 });
  const obj = await publicClient.getTransactionReceipt({
    hash,
  });

  return { contractAddress: obj.contractAddress };
};

export const deployStorageRegistry = async () => {
  return deploy({
    abi: StorageRegistry.abi,
    account: accounts[0].address,
    bytecode: StorageRegistry.bytecode,
    args: [
      accounts[0].address,
      accounts[0].address,
      BigInt(0),
      BigInt(0),
      BigInt(10000),
      BigInt(0),
      BigInt(0),
      accounts[0].address,
      accounts[0].address,
      accounts[0].address,
      accounts[0].address,
      accounts[0].address,
    ],
  });
};

// Deep merge two objects
export function mergeDeepPartial<T>(obj1: DeepPartial<T>, obj2: DeepPartial<T>): DeepPartial<T> {
  const merged: DeepPartial<T> = Object.assign({}, obj1);

  for (const key in obj2) {
    if (
      typeof obj2[key] === "object" &&
      obj2[key] !== null &&
      typeof merged[key] === "object" &&
      merged[key] !== null
    ) {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      merged[key] = mergeDeepPartial(merged[key] as DeepPartial<any>, obj2[key] as DeepPartial<any>);
    } else {
      merged[key] = obj2[key];
    }
  }

  return merged;
}
