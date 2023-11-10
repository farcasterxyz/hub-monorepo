import { JsonRpcProvider, FallbackProvider, Networkish } from "ethers";
import { HttpTransport, PublicClient, VerifyTypedDataParameters, createPublicClient, http } from "viem";
import { mainnet, goerli, optimism, optimismGoerli } from "viem/chains";

export interface ViemPublicClient {
  verifyTypedData: (args: VerifyTypedDataParameters) => Promise<boolean>;
}

export type PublicClients = {
  [chainId: number]: ViemPublicClient;
};

export const defaultL1PublicClient: ViemPublicClient = createPublicClient({
  chain: mainnet,
  transport: http(mainnet.rpcUrls.default.http[0]),
});

export const defaultL2PublicClient: ViemPublicClient = createPublicClient({
  chain: optimism,
  transport: http(optimism.rpcUrls.default.http[0]),
});

export const defaultL1PublicTestClient: ViemPublicClient = createPublicClient({
  chain: goerli,
  transport: http(goerli.rpcUrls.default.http[0]),
});

export const defaultL2PublicTestClient: ViemPublicClient = createPublicClient({
  chain: optimismGoerli,
  transport: http(optimismGoerli.rpcUrls.default.http[0]),
});

export const defaultPublicClients: PublicClients = {
  [mainnet.id]: defaultL1PublicClient,
  [optimism.id]: defaultL2PublicClient,
  [goerli.id]: defaultL1PublicTestClient,
  [optimismGoerli.id]: defaultL2PublicTestClient,
};

export function publicClientToProvider(publicClient: PublicClient): JsonRpcProvider | FallbackProvider {
  const { chain, transport } = publicClient;
  const network = {
    chainId: chain?.id,
    name: chain?.name,
    ensAddress: chain?.contracts?.ensRegistry?.address,
  } as Networkish;
  if (transport.type === "fallback") {
    const providers = (transport["transports"] as ReturnType<HttpTransport>[]).map(
      ({ value }) => new JsonRpcProvider(value?.url, network),
    );
    if (providers.length === 1) return providers[0] as JsonRpcProvider;
    return new FallbackProvider(providers);
  }
  return new JsonRpcProvider(transport["url"], network);
}
