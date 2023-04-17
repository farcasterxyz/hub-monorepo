import { FarcasterNetwork, NobleEd25519Signer, getInsecureHubRpcClient, makeCastAdd } from '@farcaster/hub-nodejs';
import * as ed from '@noble/ed25519';

/**
 * Populate the following constants with your own values
 */

const HUB_URL = process.env['HUB_ADDR'] || ''; // URL of the Hub

// If the Hub requests authentication, set the following constants
// const HUB_USERNAME = process.env['HUB_USERNAME'] || '';
// const HUB_PASSWORD = process.env['HUB_PASSWORD'] || '';

(async () => {
  /**
   * This should be set to the private key of a known signer for the user, instead of randomly generating
   * one, or the Hubs will reject the message. See the write-data tutorial for examples of how to do this.
   */
  const privateKey = ed.utils.randomPrivateKey();
  const ed25519Signer = new NobleEd25519Signer(privateKey);

  const dataOptions = {
    fid: 1, // Set to your fid.
    network: FarcasterNetwork.DEVNET,
  };

  const castResults = [];

  /**
   * Example 1: A cast with no mentions
   *
   * "This is a cast with no mentions"
   */

  const cast = await makeCastAdd(
    {
      text: 'This is a cast with no mentions',
      embeds: [],
      mentions: [],
      mentionsPositions: [],
    },
    dataOptions,
    ed25519Signer
  );
  castResults.push(cast);

  /**
   * Example 2: A cast with mentions
   *
   * "@dwr and @v are big fans of @farcaster"
   */
  const castWithMentions = await makeCastAdd(
    {
      text: ' and  are big fans of ',
      embeds: [],
      mentions: [3, 2, 1],
      mentionsPositions: [0, 5, 22],
    },
    dataOptions,
    ed25519Signer
  );
  castResults.push(castWithMentions);

  /**
   * Example 3: A cast with mentions and an attachment
   *
   * "Hey @dwr, check this out!"
   */
  const castWithMentionsAndAttachment = await makeCastAdd(
    {
      text: 'Hey , check this out!',
      embeds: ['https://farcaster.xyz'],
      mentions: [3],
      mentionsPositions: [4],
    },
    dataOptions,
    ed25519Signer
  );
  castResults.push(castWithMentionsAndAttachment);

  /**
   * Example 4: A cast with mentions and an attachment, and a link in the text
   *
   * "Hey @dwr, check out https://farcaster.xyz!"
   */
  const castWithMentionsAttachmentLink = await makeCastAdd(
    {
      text: 'Hey , check out https://farcaster.xyz!',
      embeds: ['https://farcaster.xyz'],
      mentions: [3],
      mentionsPositions: [4],
    },
    dataOptions,
    ed25519Signer
  );
  castResults.push(castWithMentionsAttachmentLink);

  /**
   * Example 5: A cast with multiple mentions
   *
   * "You can mention @v multiple times: @v @v @v"
   */

  const castWithMultipleMentions = await makeCastAdd(
    {
      text: 'You can mention  multiple times:   ',
      embeds: [],
      mentions: [2, 2, 2, 2],
      mentionsPositions: [16, 33, 34, 35],
    },
    dataOptions,
    ed25519Signer
  );
  castResults.push(castWithMultipleMentions);

  /**
   * Example 6: A cast with emoji and mentions
   *
   * "🤓@farcaster can mention immediately after emoji"
   */
  const castWithEmojiAndMentions = await makeCastAdd(
    {
      text: '🤓 can mention immediately after emoji',
      embeds: [],
      mentions: [1],
      mentionsPositions: [4],
    },
    dataOptions,
    ed25519Signer
  );
  castResults.push(castWithEmojiAndMentions);

  /**
   * Example 7: A cast with emoji and a link in the text and an attachment
   *
   * "🤓https://url-after-unicode.com can include URL immediately after emoji"
   */

  const castWithEmojiLinkAttachmnent = await makeCastAdd(
    {
      text: '🤓https://url-after-unicode.com can include URL immediately after emoji',
      embeds: ['https://url-after-unicode.com'],
      mentions: [],
      mentionsPositions: [],
    },
    dataOptions,
    ed25519Signer
  );

  castResults.push(castWithEmojiLinkAttachmnent);

  // Submit Casts to the Hub
  const client = getInsecureHubRpcClient(HUB_URL);
  // If your Hub is using SSL, use getSSLHubRpcClient instead

  castResults.map((castAddResult) => castAddResult.map((castAdd) => client.submitMessage(castAdd)));

  // If your Hub requires authentication, use the following instead:
  // const authMetadata = getAuthMetadata(HUB_USERNAME, HUB_PASSWORD);
  // castResults.map((castAddResult) => castAddResult.map((castAdd) => client.submitMessage(castAdd, authMetadata)));

  client.close();
})();
