import { PublicClient, createPublicClient, http } from "viem";
import { mainnet, goerli, optimism, optimismGoerli } from "viem/chains";

export type PublicClients = {
  [chainId: number]: PublicClient;
};

export const defaultL1PublicClient: PublicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export const defaultL2PublicClient: PublicClient = createPublicClient({
  chain: optimism,
  transport: http(),
});

export const defaultL1PublicTestClient: PublicClient = createPublicClient({
  chain: goerli,
  transport: http(),
});

export const defaultL2PublicTestClient: PublicClient = createPublicClient({
  chain: optimismGoerli,
  transport: http(),
});

export const defaultPublicClients: PublicClients = {
  [mainnet.id]: defaultL1PublicClient,
  [optimism.id]: defaultL2PublicClient,
  [goerli.id]: defaultL1PublicTestClient,
  [optimismGoerli.id]: defaultL2PublicTestClient,
};
