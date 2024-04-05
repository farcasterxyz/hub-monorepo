import { getInsecureHubRpcClient, getSSLHubRpcClient } from "@farcaster/hub-nodejs";

export function getHubClient(host: string, { ssl }: { ssl?: boolean }) {
  const hub = ssl ? getSSLHubRpcClient(host) : getInsecureHubRpcClient(host);
  return hub;
}
