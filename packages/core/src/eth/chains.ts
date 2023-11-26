import { mainnet, goerli, optimism, optimismGoerli } from "viem/chains";

export const CHAIN_IDS = [mainnet.id, goerli.id, optimism.id, optimismGoerli.id] as const;
