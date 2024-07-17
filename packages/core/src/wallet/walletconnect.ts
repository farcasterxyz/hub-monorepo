import { mainnet } from "viem/chains";

import { PeerId } from "@libp2p/interface-peer-id";
import { createConfig, signMessage, SignMessageReturnType } from "@wagmi/core";
import { walletConnect } from "@wagmi/connectors";
import { http } from "viem";

const projectId = "<YOUR_PROJECT_ID>";

const chains = [mainnet] as const;

const config = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
  },
  connectors: [walletConnect({ projectId })],
});

export const generateClaimForPeerID = async (peerID: PeerId, fid: number): Promise<SignMessageReturnType> => {
  return signMessage(config, {
    message: "Hello, world!",
  });
};
