import { Hex, PublicClient } from "viem";
import { clients } from "@farcaster/hub-nodejs";
import { IdRegistry } from "./abis.js";

const ID_REGISTRY_ADDRESS = "0x00000000fcaf86937e41ba038b4fa40baa4b780a" as const;

export function getVerifier(publicClient: PublicClient, address: Hex = ID_REGISTRY_ADDRESS) {
  return {
    fidVerifier: (custody: Hex) =>
      publicClient.readContract({
        address: address,
        abi: IdRegistry.abi,
        functionName: "idOf",
        args: [custody],
      }),
    provider: clients.publicClientToProvider(publicClient),
  };
}
