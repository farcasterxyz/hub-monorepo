import { ID_REGISTRY_EIP_712_TYPES, ID_REGISTRY_ADDRESS, idRegistryABI } from "@farcaster/hub-nodejs";
import { createPublicClient, createWalletClient, http, Hex } from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { optimism } from "viem/chains";

export const getDeadline = () => {
  const now = Math.floor(Date.now() / 1000);
  const oneHour = 60 * 60;
  return BigInt(now + oneHour);
};

export const readNonce = async (account: Hex) => {
  return await publicClient.readContract({
    address: ID_REGISTRY_ADDRESS,
    abi: idRegistryABI,
    functionName: "nonces",
    args: [account],
  });
};

const publicClient = createPublicClient({
  chain: optimism,
  transport: http(),
});

// Mnemonic of the OLD account you are transferring the FID from. Make sure this
// has some OP mainnet ETH for the transfer out.
const oldAccount = mnemonicToAccount("test test test test test test test test test test test junk");

// Mnemonic of the NEW account you are transferring the FID to. This is the
// account that signs to receive the transfer.
const newAccount = mnemonicToAccount("test test test test test test test test test test test junk");

const walletClient = createWalletClient({
  chain: optimism,
  transport: http(),
});

const WARPCAST_RECOVERY_PROXY = "0x00000000fcb080a4d6c39a9354da9eb9bc104cd7";

(async () => {
  console.log("Generating transfer signature from new account.");

  const nonce = await readNonce(newAccount.address);
  const deadline = getDeadline();
  const newRecovery = WARPCAST_RECOVERY_PROXY;

  const signature = await walletClient.signTypedData({
    account: newAccount,
    ...ID_REGISTRY_EIP_712_TYPES,
    primaryType: "TransferAndChangeRecovery",
    message: {
      fid: 864711n,
      to: newAccount.address,
      recovery: newRecovery,
      nonce,
      deadline,
    },
  });

  console.log("Simulating transfer to new account.");
  const { request: transferRequest } = await publicClient.simulateContract({
    address: ID_REGISTRY_ADDRESS,
    abi: idRegistryABI,
    chain: optimism,
    functionName: "transferAndChangeRecovery",
    args: [newAccount.address, newRecovery, deadline, signature],
    account: oldAccount,
  });

  // Uncomment if simulation succeeds to execute transfer.
  // console.log("Sending transfer from old account to new account.");
  // await walletClient.writeContract(transferRequest);

  console.log("All transactions completed.");
})();
