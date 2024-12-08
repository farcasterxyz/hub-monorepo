import { mainnet, goerli, optimism, optimismGoerli, base } from "viem/chains";

export const CHAIN_IDS = [mainnet.id, goerli.id, optimism.id, optimismGoerli.id, base.id] as const;
