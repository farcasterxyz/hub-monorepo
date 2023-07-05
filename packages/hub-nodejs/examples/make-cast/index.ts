import {
  EthersEip712Signer,
  FarcasterNetwork,
  NobleEd25519Signer,
  getSSLHubRpcClient,
  makeCastAdd,
  makeSignerAdd,
} from "@farcaster/hub-nodejs";
import * as ed from "@noble/ed25519";
import { Wallet } from "ethers";

/**
 * Populate the following constants with your own values
 */

// Recovery phrase of the custody address and the
const MNEMONIC = "ordinary long coach bounce thank quit become youth belt pretty diet caught attract melt bargain";

// Fid owned by the custody address
const FID = 2;

// Testnet Configuration
const HUB_URL = "testnet1.farcaster.xyz:2283"; // URL + Port of the Hub
const NETWORK = FarcasterNetwork.TESTNET; // Network of the Hub

(async () => {
  // Create an EIP712 Signer with the wallet that holds the custody address of the user
  const wallet = Wallet.fromPhrase(MNEMONIC);
  const eip712Signer = new EthersEip712Signer(wallet);

  // Generate a new Ed25519 key pair which will become the Signer and store the private key securely
  const signerPrivateKey = ed.utils.randomPrivateKey();
  const ed25519Signer = new NobleEd25519Signer(signerPrivateKey);
  const signerPublicKey = (await ed25519Signer.getSignerKey())._unsafeUnwrap();

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

  const castResults = [];

  /**
   * Example 1: A cast with no mentions
   *
   * "This is a cast with no mentions"
   */

  const cast = await makeCastAdd(
    {
      text: "This is a cast with no mentions",
      embeds: [],
      embedsDeprecated: [],
      mentions: [],
      mentionsPositions: [],
    },
    dataOptions,
    ed25519Signer,
  );
  castResults.push(cast);

  /**
   * Example 2: A cast with mentions
   *
   * "@dwr and @v are big fans of @farcaster"
   */
  const castWithMentions = await makeCastAdd(
    {
      text: " and  are big fans of ",
      embeds: [],
      embedsDeprecated: [],
      mentions: [3, 2, 1],
      mentionsPositions: [0, 5, 22],
    },
    dataOptions,
    ed25519Signer,
  );
  castResults.push(castWithMentions);

  /**
   * Example 3: A cast with mentions and an attachment
   *
   * "Hey @dwr, check this out!"
   */
  const castWithMentionsAndAttachment = await makeCastAdd(
    {
      text: "Hey , check this out!",
      embeds: [{ url: "https://farcaster.xyz" }],
      embedsDeprecated: [],
      mentions: [3],
      mentionsPositions: [4],
    },
    dataOptions,
    ed25519Signer,
  );
  castResults.push(castWithMentionsAndAttachment);

  /**
   * Example 4: A cast with mentions and an attachment, and a link in the text
   *
   * "Hey @dwr, check out https://farcaster.xyz!"
   */
  const castWithMentionsAttachmentLink = await makeCastAdd(
    {
      text: "Hey , check out https://farcaster.xyz!",
      embeds: [{ url: "https://farcaster.xyz" }],
      embedsDeprecated: [],
      mentions: [3],
      mentionsPositions: [4],
    },
    dataOptions,
    ed25519Signer,
  );
  castResults.push(castWithMentionsAttachmentLink);

  /**
   * Example 5: A cast with multiple mentions
   *
   * "You can mention @v multiple times: @v @v @v"
   */

  const castWithMultipleMentions = await makeCastAdd(
    {
      text: "You can mention  multiple times:   ",
      embeds: [],
      embedsDeprecated: [],
      mentions: [2, 2, 2, 2],
      mentionsPositions: [16, 33, 34, 35],
    },
    dataOptions,
    ed25519Signer,
  );
  castResults.push(castWithMultipleMentions);

  /**
   * Example 6: A cast with emoji and mentions
   *
   * "🤓@farcaster can mention immediately after emoji"
   */
  const castWithEmojiAndMentions = await makeCastAdd(
    {
      text: "🤓 can mention immediately after emoji",
      embeds: [],
      embedsDeprecated: [],
      mentions: [1],
      mentionsPositions: [4],
    },
    dataOptions,
    ed25519Signer,
  );
  castResults.push(castWithEmojiAndMentions);

  /**
   * Example 7: A cast with emoji and a link in the text and an attachment
   *
   * "🤓https://url-after-unicode.com can include URL immediately after emoji"
   */

  const castWithEmojiLinkAttachmnent = await makeCastAdd(
    {
      text: "🤓https://url-after-unicode.com can include URL immediately after emoji",
      embeds: [{ url: "https://url-after-unicode.com" }],
      embedsDeprecated: [],
      mentions: [],
      mentionsPositions: [],
    },
    dataOptions,
    ed25519Signer,
  );
  castResults.push(castWithEmojiLinkAttachmnent);

  /**
   * Example 7: A cast that replies to a URL
   *
   * "I think this is a great protocol 🚀"
   */

  const castReplyingToAUrl = await makeCastAdd(
    {
      text: "I think this is a great protocol 🚀",
      embeds: [],
      embedsDeprecated: [],
      mentions: [],
      mentionsPositions: [],
      parentUrl: "https://www.farcaster.xyz/",
    },
    dataOptions,
    ed25519Signer,
  );
  castResults.push(castReplyingToAUrl);

  /**
   * Step 3: Broadcast CastAdd messages to Hub
   *
   * Send the new casts to a Hub so that they become part of the Farcaster network
   */

  // 1. If your client does not use authentication.
  castResults.map((castAddResult) => castAddResult.map((castAdd) => client.submitMessage(castAdd)));

  // 2. If your client uses authentication.
  // castResults.map((castAddResult) => castAddResult.map((castAdd) => client.submitMessage(castAdd, authMetadata)));

  console.log(`Broadcast ${castResults.length} casts`);

  client.close();
})();
