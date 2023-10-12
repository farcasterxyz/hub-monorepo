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
} from "@farcaster/hub-nodejs";
import { mnemonicToAccount } from "viem/accounts";
import {
  createWalletClient,
  decodeEventLog,
  encodeAbiParameters,
  fromHex,
  Hex,
  http,
  publicActions,
  toHex,
  zeroAddress,
} from "viem";
import { optimism } from "viem/chains";
import { ed25519 } from "@noble/curves/ed25519";
import { IdRegistryABI } from "./abi/IdRegistryABI";
import { KeyRegistryABI } from "./abi/KeyRegistryABI";
import { StorageRegistryABI } from "./abi/StorageRegistryABI";
import { SignedKeyRequestMetadataABI } from "./abi/SignedKeyRequestMetadataABI";
import axios from "axios";

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

const CONTRACTS = {
  idRegistry: "0x00000000fcaf86937e41ba038b4fa40baa4b780a" as const,
  keyRegistry: "0x00000000fc9e66f1c6d86d750b4af47ff0cc343d" as const,
  storageRegistry: "0x00000000fcce7f938e7ae6d3c335bd6a1a7c593d" as const,
  signedKeyRequestValidator: "0x00000000fc700472606ed4fa22623acf62c60553" as const,
};
const CHAIN = optimism;

const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: "Farcaster SignedKeyRequestValidator",
  version: "1",
  chainId: 10, // OP Mainnet
  verifyingContract: "0x00000000fc700472606ed4fa22623acf62c60553",
} as const;

const SIGNED_KEY_REQUEST_TYPE = [
  { name: "requestFid", type: "uint256" },
  { name: "key", type: "bytes" },
  { name: "deadline", type: "uint256" },
] as const;

const USERNAME_PROOF_DOMAIN = {
  name: "Farcaster name verification",
  version: "1",
  chainId: 1,
  verifyingContract: "0xe3be01d99baa8db9905b33a3ca391238234b79d1",
} as const;

const USERNAME_PROOF_TYPE = {
  UserNameProof: [
    { name: "name", type: "string" },
    { name: "timestamp", type: "uint256" },
    { name: "owner", type: "address" },
  ],
} as const;

const account = mnemonicToAccount(MNEMONIC);

const walletClient = createWalletClient({
  account,
  chain: optimism,
  transport: http(OP_PROVIDER_URL),
}).extend(publicActions);

const hubClient = USE_SSL ? getSSLHubRpcClient(HUB_URL) : getInsecureHubRpcClient(HUB_URL);
const metadata = HUB_USERNAME !== "" && HUB_PASS !== "" ? getAuthMetadata(HUB_USERNAME, HUB_PASS) : new Metadata();

const IdContract = { abi: IdRegistryABI, address: CONTRACTS.idRegistry, chain: CHAIN };
const KeyContract = { abi: KeyRegistryABI, address: CONTRACTS.keyRegistry, chain: CHAIN };
const StorageContract = {
  abi: StorageRegistryABI,
  address: CONTRACTS.storageRegistry,
  chain: CHAIN,
};

const getOrRegisterFid = async (): Promise<number> => {
  const balance = await walletClient.getBalance({ address: account.address });
  const existingFid = (await walletClient.readContract({
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

  const { request: registerRequest } = await walletClient.simulateContract({
    ...IdContract,
    functionName: "register",
    args: [RECOVERY_ADDRESS],
  });
  const registerTxHash = await walletClient.writeContract(registerRequest);
  console.log(`Waiting for register tx to confirm: ${registerTxHash}`);
  const registerTxReceipt = await walletClient.waitForTransactionReceipt({ hash: registerTxHash });
  // Now extract the FID from the logs
  const registerLog = decodeEventLog({
    abi: IdRegistryABI,
    data: registerTxReceipt.logs[0].data,
    topics: registerTxReceipt.logs[0].topics,
  });
  // @ts-ignore
  const fid = parseInt(registerLog.args["id"]);
  console.log(`Registered fid: ${fid} to ${account.address}`);

  return fid;
};

const getSignedMetadataParams = async (fid: number, address: Hex, signerPublicKey: Hex) => {
  const deadline = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

  // Sign a EIP-712 message using the account that holds the FID to authorize adding this signer to the key registry
  const signedMetadata = await walletClient.signTypedData({
    domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
    types: {
      SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE,
    },
    primaryType: "SignedKeyRequest",
    message: {
      requestFid: BigInt(fid),
      key: signerPublicKey,
      deadline: BigInt(deadline),
    },
  });

  return encodeAbiParameters(SignedKeyRequestMetadataABI.inputs, [
    {
      requestFid: BigInt(fid),
      requestSigner: address,
      signature: signedMetadata,
      deadline: BigInt(deadline),
    },
  ]);
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

  const params = await getSignedMetadataParams(fid, account.address, publicKey);

  const { request: signerAddRequest } = await walletClient.simulateContract({
    ...KeyContract,
    functionName: "add",
    args: [1, publicKey, 1, params], // keyType, publicKey, metadataType, metadata
  });

  const signerAddTxHash = await walletClient.writeContract(signerAddRequest);
  console.log(`Waiting for signer add tx to confirm: ${signerAddTxHash}`);
  await walletClient.waitForTransactionReceipt({ hash: signerAddTxHash });
  console.log(`Registered new signer with public key: ${publicKey}`);
  console.log("Sleeping 30 seconds to allow hubs to pick up the signer tx");
  await new Promise((resolve) => setTimeout(resolve, 30000));
  return privateKey;
};

const rentStorageIfRequired = async (fid: number) => {
  const existingLimits = await hubClient.getCurrentStorageLimitsByFid({ fid: parseInt(fid.toString()) }, metadata);
  if (existingLimits.isErr()) {
    throw new Error(`Error getting existing storage: ${existingLimits.error}`);
  }

  // If the FID already has storage, every limit will be non-zero
  const existingLimit = existingLimits.value.limits[0].limit;
  if (existingLimit > 0) {
    console.log(`Fid: ${fid} already has storage, skipping storage rent`);
    return;
  }

  const unitPrice = await walletClient.readContract({ ...StorageContract, functionName: "unitPrice" });
  // set price 10% higher to account for price fluctuations. Any excess will be refunded by the contract
  const price = Math.floor(Number(unitPrice) * 1.1);
  console.log(`Storage rent unit price: ${unitPrice}`);
  const balance = await walletClient.getBalance({ address: account.address });
  if (balance < price) {
    throw new Error(`Insufficient balance to rent storage, required: ${price}, balance: ${balance}`);
  }

  const { request: storageRentRequest } = await walletClient.simulateContract({
    ...StorageContract,
    functionName: "rent",
    args: [fid, 1], // fid and number of units to rent
    value: BigInt(price),
  });
  const storageRentTxHash = await walletClient.writeContract(storageRentRequest);
  console.log(`Waiting for storage rent tx to confirm: ${storageRentTxHash}`);
  await walletClient.waitForTransactionReceipt({ hash: storageRentTxHash });
  console.log(`Rented 1 unit of storage for ${price} wei`);
  return;
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
  const userNameProofSignature = await walletClient.signTypedData({
    domain: USERNAME_PROOF_DOMAIN,
    types: USERNAME_PROOF_TYPE,
    primaryType: "UserNameProof",
    message: {
      name: fname,
      timestamp: BigInt(timestamp),
      owner: account.address,
    },
  });

  console.log(`Registering fname: ${fname} to fid: ${fid}`);
  try {
    const response = await axios.post("https://fnames.farcaster.xyz/transfers", {
      name: fname, // Name to register
      from: 0, // Fid to transfer from (0 for a new registration)
      to: fid, // Fid to transfer to (0 to unregister)
      fid: fid, // Fid making the request (must match from or to)
      owner: account.address, // Custody address of fid making the request
      timestamp: timestamp, // Current timestamp in seconds
      signature: userNameProofSignature, // EIP-712 signature signed by the current custody address of the fid
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
  const chainId = await walletClient.getChainId();

  if (chainId !== CHAIN.id) {
    throw new Error(`Chain ID ${chainId} not supported`);
  }

  const fid = await getOrRegisterFid();
  const signerPrivateKey = await getOrRegisterSigner(fid);
  await rentStorageIfRequired(fid);
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
