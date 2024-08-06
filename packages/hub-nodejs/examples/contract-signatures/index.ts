import * as ed from "@noble/ed25519";
import {
  ID_GATEWAY_ADDRESS,
  ID_REGISTRY_ADDRESS,
  ViemLocalEip712Signer,
  idGatewayABI,
  idRegistryABI,
  NobleEd25519Signer,
  KEY_GATEWAY_ADDRESS,
  keyGatewayABI,
  KEY_REGISTRY_ADDRESS,
  keyRegistryABI,
} from "@farcaster/hub-nodejs";
import { bytesToHex, createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { readContract, simulateContract, writeContract } from "viem/actions";

/** NOTE: These are Foundry/Anvil default account keys. Do not use these
 *  outside a local dev environment!
 */
const APP_PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ALICE_PK = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const BOB_PK = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";

(async () => {
  /*******************************************************************************
   * Setup - Create local accounts, Viem clients, helpers, and constants.
   *******************************************************************************/

  console.log("Setting up accounts...");

  /**
   * A local account representing the app. You'll
   * use this to sign key metadata and send
   * transactions on behalf of users.
   */
  const app = privateKeyToAccount(APP_PK);
  const appSigner = new ViemLocalEip712Signer(app);
  console.log("App:", app.address);

  /**
   * A local account representing Alice, a user.
   */
  const alice = privateKeyToAccount(ALICE_PK);
  const aliceSigner = new ViemLocalEip712Signer(alice);
  console.log("Alice:", alice.address);

  /**
   * A local account representing Bob, a user.
   */
  const bob = privateKeyToAccount(BOB_PK);
  const bobSigner = new ViemLocalEip712Signer(bob);
  console.log("Bob:", bob.address);

  /**
   * Create Viem public (read) and wallet (write) clients.
   */
  const publicClient = createPublicClient({
    chain: { ...foundry, id: 10 },
    transport: http(),
  });

  const walletClient = createWalletClient({
    chain: { ...foundry, id: 10 },
    transport: http(),
  });

  /**
   * A convenience function to generate a deadline timestamp one hour from now.
   * All Farcaster EIP-712 signatures include a deadline, a block timestamp
   * after which the signature is no longer valid.
   */
  const getDeadline = () => {
    const now = Math.floor(Date.now() / 1000);
    const oneHour = 60 * 60;
    return BigInt(now + oneHour);
  };

  /** We'll reuse the same deadline in the examples below. */
  const deadline = getDeadline();

  /** Address of the Warpcast recovery proxy. */
  const WARPCAST_RECOVERY_PROXY = "0x00000000FcB080a4D6c39a9354dA9EB9bC104cd7";

  /*******************************************************************************
   * IdGateway - register - Register an app FID.
   *******************************************************************************/

  console.log("Registering app fid...");

  /**
   *  Get the current price to register. We're not going to register any
   *  extra storage, so we pass 0n as the only argument.
   */
  const price = await readContract(publicClient, {
    address: ID_GATEWAY_ADDRESS,
    abi: idGatewayABI,
    functionName: "price",
    args: [0n],
  });

  /**
   *  Call `register` to register an FID to the app account.
   */
  const { request } = await simulateContract(publicClient, {
    account: app,
    address: ID_GATEWAY_ADDRESS,
    abi: idGatewayABI,
    functionName: "register",
    args: [WARPCAST_RECOVERY_PROXY, 0n],
    value: price,
  });
  await writeContract(walletClient, request);

  /**
   *  Read the app fid from the ID Registry contract.
   */
  const APP_FID = await readContract(publicClient, {
    address: ID_REGISTRY_ADDRESS,
    abi: idRegistryABI,
    functionName: "idOf",
    args: [app.address],
  });
  console.log("App fid:", APP_FID);

  /*******************************************************************************
   * IdGateway - registerFor - Register an FID on behalf of Alice.
   *******************************************************************************/
  console.log("Registering fid to Alice...");

  /**
   *  Read Alice's current nonce from the ID Gateway.
   */
  let nonce = await readContract(publicClient, {
    address: ID_GATEWAY_ADDRESS,
    abi: idGatewayABI,
    functionName: "nonces",
    args: [alice.address],
  });

  /**
   *  Collect a signed `Register` message from Alice. We're using a local
   *  account in this demo, but in a real app you'd collect this signature
   *  from the user's wallet on the frontend.
   */
  let signature = await aliceSigner.signRegister({
    to: alice.address,
    recovery: WARPCAST_RECOVERY_PROXY,
    nonce,
    deadline,
  });

  if (signature.isOk()) {
    /**
     *  Get the current price to register. We're not going to register any
     *  extra storage, so we pass 0n as the only argument.
     */
    const price = await readContract(publicClient, {
      address: ID_GATEWAY_ADDRESS,
      abi: idGatewayABI,
      functionName: "price",
      args: [0n],
    });

    /**
     *  Call `registerFor` with Alice's signed message. Note that we also need
     *  to send payment by setting the `value` field.
     */
    const { request } = await simulateContract(publicClient, {
      account: app,
      address: ID_GATEWAY_ADDRESS,
      abi: idGatewayABI,
      functionName: "registerFor",
      args: [alice.address, WARPCAST_RECOVERY_PROXY, deadline, bytesToHex(signature.value), 0n],
      value: price,
    });
    await writeContract(walletClient, request);
  }

  /**
   *  Read Alice's new fid from the ID Registry contract.
   */
  const fid = await readContract(publicClient, {
    address: ID_REGISTRY_ADDRESS,
    abi: idRegistryABI,
    functionName: "idOf",
    args: [alice.address],
  });
  console.log("Alice's fid:", fid);

  /*******************************************************************************
   * IdRegistry - changeRecoveryAddressFor - Change recovery on behalf of Alice.
   *******************************************************************************/
  console.log("Changing Alice's recovery address...");

  /**
   *  Read Alice's current nonce from the ID Registry.
   */
  nonce = await readContract(publicClient, {
    address: ID_REGISTRY_ADDRESS,
    abi: idRegistryABI,
    functionName: "nonces",
    args: [alice.address],
  });

  /**
   *  Collect a signed `ChangeRecoveryAddress` message from Alice.
   *  We're using a local account in this demo, but in a real app you'd collect
   *  this signature from the user's wallet on the frontend.
   */
  signature = await aliceSigner.signChangeRecoveryAddress({
    fid: fid,
    from: WARPCAST_RECOVERY_PROXY,
    to: bob.address,
    nonce,
    deadline,
  });

  if (signature.isOk()) {
    /**
     *  Call `changeRecoveryAddressFor` with Alice's signed message.
     */
    const { request } = await simulateContract(publicClient, {
      account: app,
      address: ID_REGISTRY_ADDRESS,
      abi: idRegistryABI,
      functionName: "changeRecoveryAddressFor",
      args: [alice.address, bob.address, deadline, bytesToHex(signature.value)],
    });
    await writeContract(walletClient, request);
  }

  /*******************************************************************************
   * IdRegistry - transferFor - Transfer fid on behalf of Alice.
   *******************************************************************************/
  console.log("Transferring to Bob...");

  /**
   *  Let's transfer Alice's fid to Bob.
   *
   *  `transferFor` requires two signatures: one from the sender authorizing the
   *  transfer out, and one from the recipient authorizing the transfer in.
   *
   *  First, read Alice's nonce from the ID Registry.
   */
  let aliceNonce = await readContract(publicClient, {
    address: ID_REGISTRY_ADDRESS,
    abi: idRegistryABI,
    functionName: "nonces",
    args: [alice.address],
  });

  /**
   *  Then, collect a `Transfer` signature from Alice.
   */
  let aliceSignature = await aliceSigner.signTransfer({
    fid: fid,
    to: bob.address,
    nonce: aliceNonce,
    deadline,
  });

  /**
   *  Next, read Bob's nonce from the ID Registry.
   */
  let bobNonce = await readContract(publicClient, {
    address: ID_REGISTRY_ADDRESS,
    abi: idRegistryABI,
    functionName: "nonces",
    args: [bob.address],
  });

  /**
   *  ...and collect Bob's `Transfer` signature.
   */
  let bobSignature = await bobSigner.signTransfer({
    fid: fid,
    to: bob.address,
    nonce: bobNonce,
    deadline,
  });

  if (aliceSignature.isOk() && bobSignature.isOk()) {
    /**
     *  Call `transferFor` with both signatures to transfer Alice's fid to Bob.
     */
    const { request } = await simulateContract(publicClient, {
      account: app,
      address: ID_REGISTRY_ADDRESS,
      abi: idRegistryABI,
      functionName: "transferFor",
      args: [
        alice.address,
        bob.address,
        deadline,
        bytesToHex(aliceSignature.value),
        deadline,
        bytesToHex(bobSignature.value),
      ],
    });
    await writeContract(walletClient, request);
  }

  /*******************************************************************************
   * IdRegistry - transferAndChangeRecoveryFor - Transfer and change recovery.
   *******************************************************************************/
  console.log("Transferring back to Alice...");

  /**
   *  Let's transfer the fid back from Bob to Alice, but change the recovery
   *  address back from to Bob's address to the Warpcast recovery proxy.
   *
   *  Like `transferFor`, `transferAndChangeRecovery` requires two signatures:
   *  one from the sender authorizing the transfer out, and one from the
   *  recipient authorizing the transfer in.
   *
   *  First, read Alice's nonce from the ID Registry.
   */
  aliceNonce = await readContract(publicClient, {
    address: ID_REGISTRY_ADDRESS,
    abi: idRegistryABI,
    functionName: "nonces",
    args: [alice.address],
  });

  /**
   *  Then, collect a `TransferAndChangeRecovery` signature from Alice.
   */
  aliceSignature = await aliceSigner.signTransferAndChangeRecovery({
    fid: fid,
    to: alice.address,
    recovery: WARPCAST_RECOVERY_PROXY,
    nonce: aliceNonce,
    deadline,
  });

  /**
   *  Next, read Bob's nonce from the ID Registry.
   */
  bobNonce = await readContract(publicClient, {
    address: ID_REGISTRY_ADDRESS,
    abi: idRegistryABI,
    functionName: "nonces",
    args: [bob.address],
  });

  /**
   *  ...and collect Bob's signature.
   */
  bobSignature = await bobSigner.signTransferAndChangeRecovery({
    fid: fid,
    to: alice.address,
    recovery: WARPCAST_RECOVERY_PROXY,
    nonce: bobNonce,
    deadline,
  });

  if (aliceSignature.isOk() && bobSignature.isOk()) {
    /**
     *  Call `transferAndChangeRecoveryFor` with both signatures to transfer the
     *  fid back from Bob to Alice and change the recovery address to Bob.
     */
    const { request } = await simulateContract(publicClient, {
      account: app,
      address: ID_REGISTRY_ADDRESS,
      abi: idRegistryABI,
      functionName: "transferAndChangeRecoveryFor",
      args: [
        bob.address,
        alice.address,
        WARPCAST_RECOVERY_PROXY,
        deadline,
        bytesToHex(bobSignature.value),
        deadline,
        bytesToHex(aliceSignature.value),
      ],
    });
    await writeContract(walletClient, request);
  }

  /*******************************************************************************
   * KeyGateway - addFor - Add a signer key to Alice's fid.
   *******************************************************************************/
  console.log("Adding a signer key...");

  /**
   * To add a signer key to Alice's fid, we need to follow four steps:
   *
   * 1. Create a new signer keypair for Alice.
   * 2. Use our app account to create a Signed Key Request.
   * 3. Collect Alice's `Add` signature.
   * 4. Call the contract to add the key onchain.
   */

  /**
   *  1. Create an Ed25519 signer keypair for Alice and get the public key.
   */
  const privateKeyBytes = ed.utils.randomPrivateKey();
  const signer = new NobleEd25519Signer(privateKeyBytes);

  let signerPubKey = new Uint8Array();
  const signerKeyResult = await signer.getSignerKey();
  if (signerKeyResult.isOk()) {
    signerPubKey = signerKeyResult.value;

    /**
     *  2. Generate a Signed Key Request from the app account.
     */
    const signedKeyRequestMetadata = await appSigner.getSignedKeyRequestMetadata({
      requestFid: APP_FID,
      key: signerPubKey,
      deadline,
    });

    if (signedKeyRequestMetadata.isOk()) {
      const metadata = bytesToHex(signedKeyRequestMetadata.value);
      /**
       *  3. Read Alice's nonce from the Key Gateway.
       */
      aliceNonce = await readContract(publicClient, {
        address: KEY_GATEWAY_ADDRESS,
        abi: keyGatewayABI,
        functionName: "nonces",
        args: [alice.address],
      });

      /**
       *  Then, collect her `Add` signature.
       */
      aliceSignature = await aliceSigner.signAdd({
        owner: alice.address,
        keyType: 1,
        key: signerPubKey,
        metadataType: 1,
        metadata,
        nonce,
        deadline,
      });

      if (aliceSignature.isOk()) {
        /**
         *  Call `addFor` with Alice's signature and the signed key request.
         */
        const { request } = await simulateContract(publicClient, {
          account: app,
          address: KEY_GATEWAY_ADDRESS,
          abi: keyGatewayABI,
          functionName: "addFor",
          args: [alice.address, 1, bytesToHex(signerPubKey), 1, metadata, deadline, bytesToHex(aliceSignature.value)],
        });
        await writeContract(walletClient, request);
      }
    }
  }

  /*******************************************************************************
   * KeyGateway - removeFor - Remove a signer key from Alice's fid.
   *******************************************************************************/
  console.log("Removing the signer key...");

  /**
   * Let's remove Alice's signer key from the previous step. This is simpler
   * than adding a key, because we don't need to generate a signed key request.
   */

  /**
   *  Read Alice's nonce from the Key Registry.
   */
  aliceNonce = await readContract(publicClient, {
    address: KEY_REGISTRY_ADDRESS,
    abi: keyRegistryABI,
    functionName: "nonces",
    args: [alice.address],
  });

  /**
   *  Then, collect her `Remove` signature.
   */
  aliceSignature = await aliceSigner.signRemove({
    owner: alice.address,
    key: signerPubKey,
    nonce,
    deadline,
  });

  if (aliceSignature.isOk()) {
    /**
     *  Call `removeFor` with Alice's signature and public key.
     */
    const { request } = await simulateContract(publicClient, {
      account: app,
      address: KEY_REGISTRY_ADDRESS,
      abi: keyRegistryABI,
      functionName: "removeFor",
      args: [alice.address, bytesToHex(signerPubKey), deadline, bytesToHex(aliceSignature.value)],
    });
    await writeContract(walletClient, request);
  }

  console.log("All transactions completed.");
})();
