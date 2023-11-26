import { VerifyTypedDataParameters, createPublicClient, http } from "viem";
import { mainnet, goerli, optimism, optimismGoerli } from "viem/chains";

export interface ViemPublicClient {
  verifyTypedData: (args: VerifyTypedDataParameters) => Promise<boolean>;
}

export type PublicClients = {
  [chainId: number]: ViemPublicClient;
};

export const defaultL1PublicClient: ViemPublicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export const defaultL2PublicClient: ViemPublicClient = createPublicClient({
  chain: optimism,
  transport: http(),
});

export const defaultL1PublicTestClient: ViemPublicClient = createPublicClient({
  chain: goerli,
  transport: http(),
});

export const defaultL2PublicTestClient: ViemPublicClient = createPublicClient({
  chain: optimismGoerli,
  transport: http(),
});

export const defaultPublicClients: PublicClients = {
  [mainnet.id]: defaultL1PublicClient,
  [optimism.id]: defaultL2PublicClient,
  [goerli.id]: defaultL1PublicTestClient,
  [optimismGoerli.id]: defaultL2PublicTestClient,
};
