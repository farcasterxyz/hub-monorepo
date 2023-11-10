import { Hex, PublicClient } from "viem";
import { clients } from "@farcaster/hub-nodejs";
import { IdRegistry } from "./abis.js";
import { OptimismConstants } from "./l2EventsProvider.js";

export function getVerifier(publicClient: PublicClient, address: Hex = OptimismConstants.IdRegistryV2Address) {
  const provider = clients.publicClientToProvider(publicClient);
  return {
    fidVerifier: (custody: Hex) =>
      publicClient.readContract({
        address: address,
        abi: IdRegistry.abi,
        functionName: "idOf",
        args: [custody],
      }),
    provider,
  };
}
