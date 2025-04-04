import {
  CastAddMessage,
  fromFarcasterTime,
  getSSLHubRpcClient,
  getInsecureHubRpcClient,
  HubAsyncResult,
  HubRpcClient,
  isCastAddMessage,
  isUserDataAddMessage,
  UserDataType,
} from "@farcaster/hub-nodejs";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import { err, ok, Result } from "neverthrow";

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo("en-US");

/**
 * Populate the following constants with your own values
 */

const HUB_URL = "juno.farcaster.xyz:3383"; // URL of the Hub
const FIDS = [2, 3]; // User IDs to fetch casts for

/**
 * Returns a user's casts which are not replies to any other casts in reverse chronological order.
 */
const getPrimaryCastsByFid = async (fid: number, client: HubRpcClient): HubAsyncResult<CastAddMessage[]> => {
  // TODO: Instead of fetching N casts and returning the primary ones, loop through until N primary casts are found.
  const result = await client.getCastsByFid({ fid: fid, pageSize: 10, reverse: true });

  if (result.isErr()) {
    return err(result.error);
  }

  // Coerce Messages into Casts, should not actually filter out any messages
  const casts = result.value.messages.filter(isCastAddMessage);

  return ok(casts.filter((message) => !message.data.castAddBody.parentCastId));
};

const getFnameFromFid = async (fid: number, client: HubRpcClient): HubAsyncResult<string> => {
  const result = await client.getUserData({ fid: fid, userDataType: UserDataType.USERNAME });
  return ok(
    result.match(
      (message) => {
        if (isUserDataAddMessage(message)) {
          return message.data.userDataBody.value;
        } else {
          return "";
        }
      },
      () => `${fid}!`, // fallback to FID if no username is set
    ),
  );
};

/**
 * Compares two CastAddMessages by timestamp, in reverse chronological order.
 */
const compareCasts = (a: CastAddMessage, b: CastAddMessage) => {
  if (a.data.timestamp < b.data.timestamp) {
    return 1;
  }
  if (a.data.timestamp > b.data.timestamp) {
    return -1;
  }
  return 0;
};

/**
 * Converts a CastAddMessage into a printable string representation.
 */
const castToString = async (cast: CastAddMessage, nameMapping: Map<number, string>, client: HubRpcClient) => {
  const fname = nameMapping.get(cast.data.fid) ?? `${cast.data.fid}!`; // if the user doesn't have a username set, use their FID

  // Convert the timestamp to a human readable string
  // Safety: OK to do this since we know the timestamp coming from the Hub must be in the valid range
  const unixTime = fromFarcasterTime(cast.data.timestamp)._unsafeUnwrap();
  const dateString = timeAgo.format(new Date(unixTime));

  const { text, mentions, mentionsPositions } = cast.data.castAddBody;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);

  const decoder = new TextDecoder();
  let textWithMentions = "";
  let indexBytes = 0;
  for (let i = 0; i < mentions.length; i++) {
    textWithMentions += decoder.decode(bytes.slice(indexBytes, mentionsPositions[i]));
    const result = await getFnameFromFid(mentions[i], client);
    // biome-ignore lint/suspicious/noAssignInExpressions: legacy code, avoid using ignore for new code
    result.map((fname) => (textWithMentions += fname));
    indexBytes = mentionsPositions[i];
  }
  textWithMentions += decoder.decode(bytes.slice(indexBytes));

  // Remove newlines from the message text
  const textNoLineBreaks = textWithMentions.replace(/(\r\n|\n|\r)/gm, " ");

  return `${fname}: ${textNoLineBreaks}\n${dateString}\n`;
};

(async () => {
  // const client = getInsecureHubRpcClient(HUB_URL); // Use this if you're not using SSL
  const client = getSSLHubRpcClient(HUB_URL);

  // 1. Create a mapping of fids to fnames, which we'll need later to display messages
  const fidToFname = new Map<number, string>();

  const fnameResultPromises = FIDS.map((fid) => client.getUserData({ fid, userDataType: UserDataType.USERNAME }));
  const fnameResults = await Promise.all(fnameResultPromises);

  fnameResults.map((result) =>
    result.map((uData) => {
      if (isUserDataAddMessage(uData)) {
        const fid = uData.data.fid;
        const fname = uData.data.userDataBody.value;
        fidToFname.set(fid, fname);
      }
    }),
  );

  // 2. Fetch primary casts for each fid and print them
  const castResultPromises = FIDS.map((fid) => getPrimaryCastsByFid(fid, client));
  const castsResult = Result.combine(await Promise.all(castResultPromises));

  if (castsResult.isErr()) {
    console.error("Fetching casts failed");
    console.error(castsResult.error);
    return;
  }

  const sortedCasts = castsResult.value.flat().sort(compareCasts); // sort casts by timestamp
  const stringifiedCasts = await Promise.all(sortedCasts.map((c) => castToString(c, fidToFname, client))); // convert casts to printable strings

  for (const outputCast of stringifiedCasts) {
    console.log(outputCast);
  }

  // 3. Close the connection
  client.close();
})();
