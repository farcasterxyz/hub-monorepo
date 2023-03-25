import {
  EthersEip712Signer,
  FarcasterNetwork,
  makeSignerAdd,
  makeUserDataAdd,
  NobleEd25519Signer,
  UserDataType,
} from '@farcaster/hub-nodejs';
import { getInsecureHubRpcClient } from '@farcaster/utils';
import * as ed from '@noble/ed25519';
import { Wallet } from 'ethers';

/* eslint no-console: 0 */

/**
 * Populate the following constants with your own values
 */

const HUB_URL = process.env['HUB_ADDR'] || ''; // URL of the Hub

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
  const mnemonic = 'ordinary long coach bounce thank quit become youth belt pretty diet caught attract melt bargain';
  const wallet = Wallet.fromPhrase(mnemonic);
  const eip712Signer = new EthersEip712Signer(wallet);

  // Generate a new Ed25519 key pair which will become the Signer and store the private key securely
  const signerPrivateKey = ed.utils.randomPrivateKey();
  const ed25519Signer = new NobleEd25519Signer(signerPrivateKey);
  const signerPublicKey = (await ed25519Signer.getSignerKey())._unsafeUnwrap();

  // Create a SignerAdd message that contains the public key of the signer
  const dataOptions = {
    fid: 1, // Set to your fid.
    network: FarcasterNetwork.DEVNET,
  };

  const signerAddResult = await makeSignerAdd({ signer: signerPublicKey }, dataOptions, eip712Signer);
  const signerAdd = signerAddResult._unsafeUnwrap();

  /**
   * Step 2: Broadcast SignerAdd to Hub
   *
   * You should have acquired a SignerAdd message either through the Signer Request flow in an app like Warpcast or by
   * generating it yourself if your application manages the user's mnemonic. Now you can submit it to the Hub.
   */

  const client = getInsecureHubRpcClient(HUB_URL);
  // const client = getSSLHubRpcClient(HUB_URL); if you want to use SSL

  const result = await client.submitMessage(signerAdd);
  result.isOk() ? console.log('SignerAdd was published successfully!') : console.log(result.error);

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
    value: 'https://i.imgur.com/yed5Zfk.gif',
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

  console.log('UserDataAdd was published successfully!');
})();
