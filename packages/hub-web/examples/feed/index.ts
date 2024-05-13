import { CastAddMessage, Message, fromFarcasterTime } from "@farcaster/core";
import axios from "axios";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo("en-US");

const server = "https://nemes.farcaster.xyz:2281";

async function getUserNameForFid(fid: number): Promise<string> {
  const url = `${server}/v1/userDataByFid?fid=${fid}`;
  try {
    const response = await axios.get(url);
    return response.data.messages.find((m) => m.data?.userDataBody?.type === "USER_DATA_TYPE_USERNAME")?.data
      ?.userDataBody?.value as string;
  } catch (e) {
    // handle errors
    console.error("Error getting Username: ", e.response.data);
    // Fall back to the FID if we can't get the username
    return `${fid}`;
  }
}

async function getPrimaryCastsByFid(fid: number): Promise<CastAddMessage[]> {
  const url = `${server}/v1/castsByFid?fid=${fid}&reverse=1&pageSize=10`;
  try {
    const response = await axios.get(url);
    return response.data.messages.map((m) => Message.fromJSON(m) as CastAddMessage);
  } catch (e) {
    // handle errors
    console.error("Error getting primary casts: ", e.response.data);
    return [];
  }
}

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
const castToString = async (cast: CastAddMessage, nameMapping: Map<number, string>) => {
  const fname = nameMapping.get(cast.data.fid) ?? `${cast.data.fid}!`;

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
    const fname = await getUserNameForFid(mentions[i]);
    textWithMentions += fname;
    indexBytes = mentionsPositions[i];
  }
  textWithMentions += decoder.decode(bytes.slice(indexBytes));

  // Remove newlines from the message text
  const textNoLineBreaks = textWithMentions.replace(/(\r\n|\n|\r)/gm, " ");

  return `${fname}: ${textNoLineBreaks}\n${dateString}\n`;
};

async function genFeed() {
  const FIDS = [2, 3]; // User IDs to fetch casts for

  // 1. Create a mapping of fids to fnames, which we'll need later to display messages
  const fidToFname = new Map<number, string>();
  await Promise.all(
    FIDS.map(async (fid) => {
      const fname = await getUserNameForFid(fid);
      fidToFname.set(fid, fname);
    }),
  );

  // 2. Fetch primary casts for each fid and print them
  const castsResult = await Promise.all(FIDS.map((fid) => getPrimaryCastsByFid(fid)));
  const sortedCasts = castsResult.flat().sort(compareCasts); // sort casts by timestamp

  // convert casts to printable strings
  const stringifiedCasts = await Promise.all(sortedCasts.map((c) => castToString(c, fidToFname)));
  for (const outputCast of stringifiedCasts) {
    console.log(outputCast);
  }
}

genFeed().then(() => console.log("Done!"));
