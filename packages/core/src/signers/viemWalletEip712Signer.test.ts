import { ViemWalletEip712Signer } from "./viemWalletEip712Signer";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { testEip712Signer } from "./testUtils";
import { createWalletClient, http } from "viem";
import { foundry } from "viem/chains";

describe("ViemWalletEip712Signer", () => {
  const client = createWalletClient({
    account: privateKeyToAccount(generatePrivateKey()),
    chain: foundry,
    transport: http(),
  });
  const signer = new ViemWalletEip712Signer(client);
  testEip712Signer(signer);
});
