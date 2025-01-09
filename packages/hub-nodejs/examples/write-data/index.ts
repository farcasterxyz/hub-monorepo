import {
  FarcasterNetwork,
  getInsecureHubRpcClient,
  HubResult,
  makeCastAdd,
  makeCastRemove,
  makeLinkAdd,
  makeLinkRemove,
  makeReactionAdd,
  makeUserDataAdd,
  Message,
  NobleEd25519Signer,
  ReactionType,
  UserDataType,
} from "@farcaster/hub-nodejs";
import { hexToBytes } from "@noble/hashes/utils";

/**
 * Populate the following constants with your own values
 */

// Signer private key registered with the Hub (see hello-world example)
const SIGNER = "<REQUIRED>";
// Fid owned by the custody address
const FID = -1; // <REQUIRED>

// Testnet Configuration
const HUB_URL = "testnet1.farcaster.xyz:2283"; // URL + Port of the Hub
const NETWORK = FarcasterNetwork.TESTNET; // Network of the Hub

(async () => {
  // Set up the signer
  const privateKeyBytes = hexToBytes(SIGNER.slice(2));
  const ed25519Signer = new NobleEd25519Signer(privateKeyBytes);
  const signerPublicKey = (await ed25519Signer.getSignerKey())._unsafeUnwrap();

  const dataOptions = {
    fid: FID,
    network: NETWORK,
  };

  // If your client does not use SSL.
  const client = getInsecureHubRpcClient(HUB_URL);

  // If your client uses SSL and requires authentication.
  // const client = getSSLHubRpcClient(HUB_URL);
  // const authMetadata = getAuthMetadata("username", "password");
  // const result = await client.submitMessage(message, authMetadata);

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

  const castWithEmojiLinkAttachment = await makeCastAdd(
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
  castResults.push(castWithEmojiLinkAttachment);

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

  const createdCast = cast._unsafeUnwrap();

  const otherMessages: HubResult<Message>[] = [];

  // Remove a cast
  const castRemove = await makeCastRemove(
    {
      targetHash: createdCast.hash,
    },
    dataOptions,
    ed25519Signer,
  );
  otherMessages.push(castRemove);

  // Create a reaction
  const reactionAdd = await makeReactionAdd(
    { type: ReactionType.LIKE, targetCastId: { fid: createdCast.data.fid, hash: createdCast.hash } },
    dataOptions,
    ed25519Signer,
  );
  otherMessages.push(reactionAdd);

  // Create a recast (recasts are reactions)
  const recast = await makeReactionAdd(
    { type: ReactionType.RECAST, targetCastId: { fid: createdCast.data.fid, hash: createdCast.hash } },
    dataOptions,
    ed25519Signer,
  );
  otherMessages.push(recast);

  // Update bio field in the profile (other fields are similar, just change the type)
  const bioUpdate = await makeUserDataAdd({ type: UserDataType.BIO, value: "new bio" }, dataOptions, ed25519Signer);
  otherMessages.push(bioUpdate);

  // Create a follow by adding a link message with type "follow" to the fid you want to follow
  const follow = await makeLinkAdd({ type: "follow", targetFid: 1 }, dataOptions, ed25519Signer);
  otherMessages.push(follow);

  // Remove a follow by creating a link remove message with type "follow" to the fid you want to unfollow
  const unfollow = await makeLinkRemove({ type: "follow", targetFid: 1 }, dataOptions, ed25519Signer);
  otherMessages.push(unfollow);

  otherMessages.map((messageResult) => messageResult.map((message) => client.submitMessage(message)));

  client.close();
})();
