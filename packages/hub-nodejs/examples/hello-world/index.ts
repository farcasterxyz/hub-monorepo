import {
  FarcasterNetwork,
  getAuthMetadata,
  getInsecureHubRpcClient,
  getSSLHubRpcClient,
  HubAsyncResult,
  makeUserDataAdd,
  Message,
  Metadata,
  NobleEd25519Signer,
  UserDataType,
  ID_GATEWAY_ADDRESS,
  idGatewayABI,
  KEY_GATEWAY_ADDRESS,
  keyGatewayABI,
  ID_REGISTRY_ADDRESS,
  idRegistryABI,
  ViemLocalEip712Signer,
  makeCastRemove,
  makeUserNameProofClaim,
} from "@farcaster/hub-nodejs";
import { mnemonicToAccount, toAccount } from "viem/accounts";
import {
  createWalletClient,
  decodeEventLog,
  fromHex,
  Hex,
  http,
  LocalAccount,
  publicActions,
  toHex,
  zeroAddress,
  bytesToHex,
} from "viem";
import { optimism } from "viem/chains";
import { ed25519 } from "@noble/curves/ed25519";
import axios from "axios";
import {
  readContract,
  getBalance,
  writeContract,
  simulateContract,
  waitForTransactionReceipt,
  getChainId,
} from "viem/actions";

/**
 * Populate the following constants with your own values
 */
const MNEMONIC = "<REQUIRED>";
const OP_PROVIDER_URL = "<REQUIRED>"; // Alchemy or Infura url
const RECOVERY_ADDRESS = zeroAddress; // Optional, using the default value means the account will not be recoverable later if the mnemonic is lost
const SIGNER_PRIVATE_KEY: Hex = zeroAddress; // Optional, using the default means a new signer will be created each time

// Note: nemes is the Farcaster team's mainnet hub, which is password protected to prevent abuse. Use a 3rd party hub
// provider like https://neynar.com/ Or, run your own mainnet hub and broadcast to it permissionlessly.
const HUB_URL = "nemes.farcaster.xyz:2283"; // URL + Port of the Hub
const HUB_USERNAME = ""; // Username for auth, leave blank if not using TLS
const HUB_PASS = ""; // Password for auth, leave blank if not using TLS
const USE_SSL = false; // set to true if talking to a hub that uses SSL (3rd party hosted hubs or hubs that require auth)
const FC_NETWORK = FarcasterNetwork.MAINNET; // Network of the Hub

const CHAIN = optimism;
const IdGateway = { abi: idGatewayABI, address: ID_GATEWAY_ADDRESS, chain: CHAIN };
const IdContract = { abi: idRegistryABI, address: ID_REGISTRY_ADDRESS, chain: CHAIN };
const KeyContract = { abi: keyGatewayABI, address: KEY_GATEWAY_ADDRESS, chain: CHAIN };

const account = mnemonicToAccount(MNEMONIC);

const walletClient = createWalletClient({
  account,
  chain: optimism,
  transport: http(OP_PROVIDER_URL),
}).extend(publicActions);

const hubClient = USE_SSL ? getSSLHubRpcClient(HUB_URL) : getInsecureHubRpcClient(HUB_URL);
const metadata = HUB_USERNAME !== "" && HUB_PASS !== "" ? getAuthMetadata(HUB_USERNAME, HUB_PASS) : new Metadata();

const getOrRegisterFid = async (): Promise<number> => {
  const balance = await getBalance(walletClient, { address: account.address });
  const existingFid = (await readContract(walletClient, {
    ...IdContract,
    functionName: "idOf",
    args: [account.address],
  })) as bigint;

  console.log(`Using address: ${account.address} with balance: ${balance}`);

  if (balance === 0n && existingFid === 0n) {
    throw new Error("No existing Fid and no funds to register an fid");
  }

  if (existingFid > 0n) {
    console.log(`Using existing fid: ${existingFid}`);
    return parseInt(existingFid.toString());
  }

  const price = await readContract(walletClient, {
    ...IdGateway,
    functionName: "price",
  });

  console.log(`Cost to rent storage: ${price}`);

  if (balance < price) {
    throw new Error(`Insufficient balance to rent storage, required: ${price}, balance: ${balance}`);
  }

  const { request: registerRequest } = await simulateContract(walletClient, {
    ...IdGateway,
    functionName: "register",
    args: [RECOVERY_ADDRESS],
    value: price,
  });
  const registerTxHash = await writeContract(walletClient, registerRequest);
  console.log(`Waiting for register tx to confirm: ${registerTxHash}`);
  const registerTxReceipt = await waitForTransactionReceipt(walletClient, { hash: registerTxHash });
  // Now extract the FID from the logs
  const registerLog = decodeEventLog({
    abi: idRegistryABI,
    data: registerTxReceipt.logs[0].data,
    topics: registerTxReceipt.logs[0].topics,
  });
  // @ts-ignore
  const fid = parseInt(registerLog.args["id"]);
  console.log(`Registered fid: ${fid} to ${account.address}`);

  return fid;
};

const getOrRegisterSigner = async (fid: number) => {
  if (SIGNER_PRIVATE_KEY !== zeroAddress) {
    // If a private key is provided, we assume the signer is already in the key registry
    const privateKeyBytes = fromHex(SIGNER_PRIVATE_KEY, "bytes");
    const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);
    console.log(`Using existing signer with public key: ${toHex(publicKeyBytes)}`);
    return privateKeyBytes;
  }

  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = toHex(ed25519.getPublicKey(privateKey));

  console.log(`Created new signer for test with private key: ${toHex(privateKey)}`);

  // To add a key, we need to sign the metadata with the fid of the app we're adding the key on behalf of
  // We'll use our own fid and custody address for simplicity. This can also be a separate App specific fid.
  const localAccount = toAccount(account);
  const eip712signer = new ViemLocalEip712Signer(localAccount);
  const metadata = await eip712signer.getSignedKeyRequestMetadata({
    requestFid: BigInt(fid),
    key: fromHex(publicKey, "bytes"),
    deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 60), // 1 hour from now
  });

  const metadataHex = toHex(metadata.unwrapOr(new Uint8Array()));

  const { request: signerAddRequest } = await simulateContract(walletClient, {
    ...KeyContract,
    functionName: "add",
    args: [1, publicKey, 1, metadataHex], // keyType, publicKey, metadataType, metadata
  });

  const signerAddTxHash = await writeContract(walletClient, signerAddRequest);
  console.log(`Waiting for signer add tx to confirm: ${signerAddTxHash}`);
  await waitForTransactionReceipt(walletClient, { hash: signerAddTxHash });
  console.log(`Registered new signer with public key: ${publicKey}`);
  console.log("Sleeping 30 seconds to allow hubs to pick up the signer tx");
  await new Promise((resolve) => setTimeout(resolve, 30000));
  return privateKey;
};

const registerFname = async (fid: number) => {
  try {
    // First check if this fid already has an fname
    const response = await axios.get(`https://fnames.farcaster.xyz/transfers/current?fid=${fid}`);
    const fname = response.data.transfer.username;
    console.log(`Fid ${fid} already has fname: ${fname}`);
    return fname;
  } catch (e) {
    // No username, ignore and continue with registering
  }

  const fname = `fid-${fid}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const localAccount = toAccount(account);
  const signer = new ViemLocalEip712Signer(localAccount as LocalAccount<string>);
  const userNameProofSignature = await signer.signUserNameProofClaim(
    makeUserNameProofClaim({
      name: fname,
      timestamp: timestamp,
      owner: account.address,
    })
  );

  console.log(`Registering fname: ${fname} to fid: ${fid}`);
  try {
    const response = await axios.post("https://fnames.farcaster.xyz/transfers", {
      name: fname, // Name to register
      from: 0, // Fid to transfer from (0 for a new registration)
      to: fid, // Fid to transfer to (0 to unregister)
      fid: fid, // Fid making the request (must match from or to)
      owner: account.address, // Custody address of fid making the request
      timestamp: timestamp, // Current timestamp in seconds
      signature: bytesToHex(userNameProofSignature.value), // EIP-712 signature signed by the current custody address of the fid
    });
    return fname;
  } catch (e) {
    // @ts-ignore
    throw new Error(`Error registering fname: ${JSON.stringify(e.response.data)} (status: ${e.response.status})`);
  }
};

const submitMessage = async (resultPromise: HubAsyncResult<Message>) => {
  const result = await resultPromise;
  if (result.isErr()) {
    throw new Error(`Error creating message: ${result.error}`);
  }
  const messageSubmitResult = await hubClient.submitMessage(result.value);
  if (messageSubmitResult.isErr()) {
    throw new Error(`Error submitting message to hub: ${messageSubmitResult.error}`);
  }
};

(async () => {
  const chainId = await getChainId(walletClient);

  if (chainId !== CHAIN.id) {
    throw new Error(`Chain ID ${chainId} not supported`);
  }

  const fid = await getOrRegisterFid();
  const signerPrivateKey = await getOrRegisterSigner(fid);
  const fname = await registerFname(fid);

  // Now set the fname by constructing the appropriate userDataAdd message and signing it
  const signer = new NobleEd25519Signer(signerPrivateKey);
  const dataOptions = {
    fid: fid,
    network: FC_NETWORK,
  };
  const userDataPfpBody = {
    type: UserDataType.USERNAME,
    value: fname,
  };
  await submitMessage(makeUserDataAdd(userDataPfpBody, dataOptions, signer));

  // Now set the PFP and display name as well
  await submitMessage(makeUserDataAdd({ type: UserDataType.DISPLAY, value: fname }, dataOptions, signer));
  await submitMessage(
    makeUserDataAdd({ type: UserDataType.PFP, value: "https://i.imgur.com/yed5Zfk.gif" }, dataOptions, signer),
  );

  console.log(`Successfully set up user, view at: https://warpcast.com/${fname}`);
  hubClient.close();
})();
