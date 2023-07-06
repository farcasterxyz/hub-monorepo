import {
  EthersEip712Signer,
  FarcasterNetwork,
  getSSLHubRpcClient,
  makeSignerAdd,
  makeUserDataAdd,
  NobleEd25519Signer,
  UserDataType,
} from "@farcaster/hub-nodejs";
import * as ed from "@noble/ed25519";
import { Wallet } from "ethers";

/**
 * Populate the following constants with your own values
 */

// Recovery phrase of the custody address
const MNEMONIC = "ordinary long coach bounce thank quit become youth belt pretty diet caught attract melt bargain";

// Fid owned by the custody address
const FID = 2;

// Testnet Configuration
const HUB_URL = "testnet1.farcaster.xyz:2283"; // URL + Port of the Hub
const NETWORK = FarcasterNetwork.TESTNET; // Network of the Hub

// Mainnet Configuration
// const HUB_URL = 'nemes.farcaster.xyz:2283';
// const NETWORK = FarcasterNetwork.MAINNET;
// Note: nemes is the Farcaster team's mainnet hub, which is password protected to prevent abuse. Configure auth in
// step 2 by getting a username and password from the Farcaster team. Or, run your own mainnet hub and broadcast
// to it permissionlessly.

(async () => {
  /**
   *
   * Step 1: Acquire a Signer
   *
   * If the user is using a Farcaster app that holds their custody address and has a Signer Request flow (e.g. Warpcast),
   * you should skip Step 1 and use their Signer Request flow to acquire a Signer.
   *
   * If you are building a user controlled wallet application to hold the user's custody address, you can use this
   * section to generate a Signer from the mnemonic.
   */

  // Create an EIP712 Signer with the wallet that holds the custody address of the user
  const wallet = Wallet.fromPhrase(MNEMONIC);
  const eip712Signer = new EthersEip712Signer(wallet);

  // Generate a new Ed25519 key pair which will become the Signer and store the private key securely
  const signerPrivateKey = ed.utils.randomPrivateKey();
  const ed25519Signer = new NobleEd25519Signer(signerPrivateKey);
  const signerPublicKey = (await ed25519Signer.getSignerKey())._unsafeUnwrap();

  // Create a SignerAdd message that contains the public key of the signer
  const dataOptions = {
    fid: FID,
    network: NETWORK,
  };

  const signerAddResult = await makeSignerAdd({ signer: signerPublicKey }, dataOptions, eip712Signer);
  const signerAdd = signerAddResult._unsafeUnwrap();

  /**
   * Step 2: Broadcast SignerAdd to Hub
   *
   * You should have acquired a SignerAdd message either through the Signer Request flow in an app like Warpcast or by
   * generating it yourself if your application manages the user's mnemonic. Now you can submit it to the Hub.
   */

  // 1. If your client does not use SSL.
  // const client = getInsecureHubRpcClient(HUB_URL);

  // 2. If your client uses SSL.
  const client = getSSLHubRpcClient(HUB_URL);
  const result = await client.submitMessage(signerAdd);

  // 3. If your client uses SSL and requires authentication.
  // const client = getSSLHubRpcClient(HUB_URL);
  // const authMetadata = getAuthMetadata("username", "password");
  // const result = await client.submitMessage(signerAdd, authMetadata);

  if (result.isErr()) {
    console.log(result.error);
    return;
  }

  console.log("SignerAdd was published successfully!");

  /**
   *
   * Step 3: Broadcast UserDataAdd to Hub
   *
   * Create a UserDataAdd message that updates the profile picture, sign it with the Signer you just created
   * and submit it to the hub.
   */

  // Set a profile picture
  const userDataPfpBody = {
    type: UserDataType.PFP,
    value: "https://i.imgur.com/yed5Zfk.gif",
  };

  const userDataAddMakeResult = await makeUserDataAdd(userDataPfpBody, dataOptions, ed25519Signer);

  if (userDataAddMakeResult.isErr()) {
    console.log(userDataAddMakeResult.error);
    return;
  }

  const userDataAddSubmitResult = await client.submitMessage(userDataAddMakeResult.value);

  if (userDataAddSubmitResult.isErr()) {
    console.log(userDataAddSubmitResult.error);
    return;
  }

  console.log("UserDataAdd was published successfully!");

  client.close();
})();
