import { ViemLocalEip712Signer } from "./viemLocalEip712Signer";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { testEip712Signer } from "./testUtils";
import { describe } from "vitest";

describe("ViemLocalEip712Signer", () => {
  const privateKeyAccount = privateKeyToAccount(generatePrivateKey());
  const signer = new ViemLocalEip712Signer(privateKeyAccount);
  testEip712Signer(signer);
});
