import {
  AdminRpcClient,
  Factories,
  FarcasterNetwork,
  HubResult,
  HubRpcClient,
  Message,
  Metadata,
  getAdminRpcClient,
  getAuthMetadata,
  getInsecureHubRpcClient,
  getSSLHubRpcClient,
} from "@farcaster/hub-nodejs";
import { formatNumber, prettyPrintTable } from "./profile.js";
import { ADMIN_SERVER_PORT } from "../rpc/adminServer.js";

export async function profileRPCServer(addressString: string, useInsecure: boolean) {
  const data: string[][] = [];

  // Push headers
  data.push(["RPC Method", "Total Duration (ms)", "Total Objects", "Avg Duration (ms)"]);

  let rpcClient;
  if (useInsecure) {
    rpcClient = getInsecureHubRpcClient(addressString);
  } else {
    rpcClient = getSSLHubRpcClient(addressString);
  }

  // Admin server is only available on localhost
  const adminClient = await getAdminRpcClient(`127.0.0.1:${ADMIN_SERVER_PORT}`);

  // Get FIDs
  const { fidsProfile, maxFid } = await profileGetFIDs(rpcClient);
  data.push(fidsProfile);

  // Get all casts by FID
  const casts = await profileGetAllCastsByFID(rpcClient);
  data.push(casts);

  // SubmitMessages
  const submitMessages = await profileSubmitMessages(rpcClient, adminClient, maxFid + 1);
  data.push(submitMessages);

  // Pretty print the results
  console.log("\nRPC Server Profile\n");
  console.log(prettyPrintTable(data));

  rpcClient.close();
}

async function profileSubmitMessages(
  rpcClient: HubRpcClient,
  adminRpcClient: AdminRpcClient,
  fid: number,
  username?: string | Metadata,
  password?: string,
): Promise<string[][]> {
  const submitMessage = async (
    msg: Message,
    metadata: Metadata,
  ): Promise<{ timeTakenMs: number; result: HubResult<Message> }> => {
    const start = Date.now();
    const result = await rpcClient.submitMessage(msg, metadata);
    const end = Date.now();

    return { timeTakenMs: end - start, result };
  };

  let metadata = new Metadata();
  if (username && typeof username !== "string") {
    metadata = username;
  } else if (username && password) {
    metadata = getAuthMetadata(username, password);
  }

  // Make sure the network matches
  const network = FarcasterNetwork.DEVNET;

  const custodySigner = Factories.Eip712Signer.build();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  const signer = Factories.Ed25519Signer.build();
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();

  const idRegisterBody = Factories.IdRegistryEventBody.build({ to: custodySignerKey });
  const custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid, idRegisterEventBody: idRegisterBody });
  const idResult = await adminRpcClient.submitOnChainEvent(custodyEvent, metadata);
  if (!idResult.isOk()) {
    throw `Failed to submit custody event for fid ${fid}: ${idResult.error}`;
  }

  const rentRegistryEvent = Factories.StorageRentOnChainEvent.build({
    fid,
    storageRentEventBody: Factories.StorageRentEventBody.build({ units: 2 }),
  });
  const rentResult = await adminRpcClient.submitOnChainEvent(rentRegistryEvent, metadata);

  if (!rentResult.isOk()) {
    throw `Failed to submit rent event for fid ${fid}: ${rentResult.error}. NOTE: RPC profile only works on devnet`;
  }

  const signerAdd = await Factories.SignerOnChainEvent.create({ fid }, { transient: { signer: signerKey } });

  let totalTimeTakenMs = 0;

  const result = await adminRpcClient.submitOnChainEvent(signerAdd, metadata);
  if (!result.isOk()) {
    throw `Failed to submit signer add message for fid ${fid}: ${result.error}`;
  }

  const castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });

  const { result: castAddResult, timeTakenMs: castAddTimeTakenMs } = await submitMessage(castAdd, metadata);
  totalTimeTakenMs += castAddTimeTakenMs;
  if (!castAddResult.isOk()) {
    throw `Failed to submit cast add message for fid ${fid}: ${castAddResult.error}`;
  }

  const reactionAdd = await Factories.ReactionAddMessage.create(
    { data: { fid, network, reactionBody: { targetCastId: { fid, hash: castAdd.hash } } } },
    { transient: { signer } },
  );
  const { result: reactionAddResult, timeTakenMs: reactionAddTimeTakenMs } = await submitMessage(reactionAdd, metadata);
  if (!reactionAddResult.isOk()) {
    throw `Failed to submit reaction add message for fid ${fid}: ${reactionAddResult.error}`;
  }

  totalTimeTakenMs += reactionAddTimeTakenMs;

  return ["submitMessages", `${totalTimeTakenMs}`, `${formatNumber(3)}`, `${formatNumber(totalTimeTakenMs / 3)}`];
}

async function profileGetAllCastsByFID(rpcClient: HubRpcClient): Promise<string[]> {
  const fid = 100_002;

  const data = [];
  let pageToken;
  let finished = false;
  let allCastsLength = 0;

  const start = Date.now();
  do {
    // First, get all the FIDs
    const castsResult = await rpcClient.getAllCastMessagesByFid({ pageSize: 100, pageToken, fid });
    if (castsResult.isErr()) {
      console.log("Error getting casts: ", castsResult.error);
      return [];
    }

    const { messages, nextPageToken } = castsResult.value;
    if (nextPageToken && nextPageToken.length > 0) {
      pageToken = nextPageToken;
    } else {
      finished = true;
    }

    allCastsLength += messages.length;
  } while (!finished);

  const end = Date.now();

  data.push(
    "getAllCastsByFID",
    `${end - start}`,
    `${formatNumber(allCastsLength)}`,
    `${formatNumber((end - start) / allCastsLength)}`,
  );

  return data;
}

async function profileGetFIDs(rpcClient: HubRpcClient): Promise<{ fidsProfile: string[]; maxFid: number }> {
  const data = [];
  let pageToken;
  let finished = false;
  const allFids = [];

  const start = Date.now();
  do {
    // First, get all the FIDs
    const fidsResult = await rpcClient.getFids({ pageSize: 100, pageToken });
    if (fidsResult.isErr()) {
      console.log("Error getting FIDs: ", fidsResult.error);
      return { fidsProfile: [], maxFid: 0 };
    }

    const { fids, nextPageToken } = fidsResult.value;
    if (nextPageToken && nextPageToken.length > 0) {
      pageToken = nextPageToken;
    } else {
      finished = true;
    }

    allFids.push(...fids);
  } while (!finished);

  const end = Date.now();
  data.push(
    "getFids",
    `${end - start}`,
    `${formatNumber(allFids.length)}`,
    `${formatNumber((end - start) / allFids.length)}`,
  );

  return { fidsProfile: data, maxFid: Math.max(...allFids) };
}
