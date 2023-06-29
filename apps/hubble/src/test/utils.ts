import { DeployContractParameters, createTestClient, createWalletClient, custom } from 'viem';
import { Chain, localhost } from 'viem/chains';
import { createPublicClient, http } from 'viem';
import { Abi } from 'abitype';
import { accounts, localHttpUrl } from './constants.js';
import { IdRegistry, NameRegistry } from '../eth/abis.js';

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
} as const satisfies Chain;

const provider = {
  on: (message: string, listener: (...args: any[]) => null) => {
    if (message === 'accountsChanged') {
      listener([accounts[0].address] as any);
    }
  },
  removeListener: () => null,
  request: async ({ method, params }: any) => {
    if (method === 'eth_requestAccounts') {
      return [accounts[0].address];
    }
    if (method === 'personal_sign') {
      method = 'eth_sign';
      params = [params[1], params[0]];
    }
    if (method === 'wallet_watchAsset') {
      return true;
    }
    if (method === 'wallet_addEthereumChain') return null;
    if (method === 'wallet_switchEthereumChain') {
      return null;
    }
    if (method === 'wallet_getPermissions' || method === 'wallet_requestPermissions')
      return [
        {
          invoker: 'https://example.com',
          parentCapability: 'eth_accounts',
          caveats: [
            {
              type: 'filterResponse',
              value: ['0x0c54fccd2e384b4bb6f2e405bf5cbc15a017aafb'],
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

export const publicClient = httpClient;

export const testClient = createTestClient({
  chain: anvilChain,
  mode: 'anvil',
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

export const deploy = async <TAbi extends Abi | readonly unknown[]>(
  args: DeployContractParameters<
    TAbi,
    (typeof walletClientWithAccount)['chain'],
    (typeof walletClientWithAccount)['account']
  >
) => {
  const hash = await walletClientWithAccount.deployContract(args);
  await testClient.mine({ blocks: 1 });
  const { contractAddress } = await publicClient.getTransactionReceipt({
    hash,
  });

  return { contractAddress };
};

export const deployIdRegistry = async () => {
  return deploy({
    abi: IdRegistry.abi,
    bytecode: IdRegistry.bytecode,
    account: accounts[0].address,
    args: [accounts[0].address],
  });
};

export const deployNameRegistry = async () => {
  return deploy({
    abi: NameRegistry.abi,
    bytecode: NameRegistry.bytecode,
    account: accounts[0].address,
    args: [accounts[0].address],
  });
};
