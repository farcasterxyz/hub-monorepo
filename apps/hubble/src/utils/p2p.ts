import { GossipAddressInfo, HubAsyncResult, HubError, HubResult } from "@farcaster/hub-nodejs";
import { Multiaddr, NodeAddress, multiaddr } from "@multiformats/multiaddr";
import { AddressInfo, isIP } from "net";
import { Result, err, ok, ResultAsync } from "neverthrow";
import { logger } from "./logger.js";
import axios from "axios";

/** Parses an address to verify it is actually a valid MultiAddr */
export const parseAddress = (multiaddrStr: string): HubResult<Multiaddr> => {
  if (multiaddrStr === "") return err(new HubError("bad_request", "multiaddr must not be empty"));

  return Result.fromThrowable(
    () => multiaddr(multiaddrStr),
    (err) =>
      new HubError("bad_request.parse_failure", {
        cause: err as Error,
        message: `'${multiaddrStr}': invalid multiaddr`,
      }),
  )();
};

/* Extracts the ip part from "ip:port" */
export const extractIPAddress = (peerAddress: string): string | undefined => {
  // This regex matches both IPv4 and IPv6 addresses
  const ipRegex = /((?:[0-9]{1,3}\.){3}[0-9]{1,3}|(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}):[0-9]+/;

  const match = peerAddress.match(ipRegex);

  // If the address matches the regex, we remove the port part
  if (match) {
    return match[0].split(":")[0];
  } else {
    return undefined;
  }
};

export const hostPortFromString = (rawPeerAddress: string): HubResult<NodeAddress> => {
  // Strip http:// and https:// from the beginning of the address if present
  const peerAddress = rawPeerAddress.replace(/^(https?:\/\/)/, "");

  const host = peerAddress.split(":")[0] || "";
  const port = parseInt(peerAddress.split(":")[1] || "0", 10);

  if (isNaN(port) || port === 0) {
    return err(new HubError("bad_request", "invalid port"));
  }

  if (host === "") {
    return err(new HubError("bad_request", "invalid host"));
  }

  return ok({
    address: host,
    port,
    family: 4,
  });
};

/** Checks that the IP address to bind to is valid and that the combined IP, transport, and port multiaddr is valid  */
export const checkNodeAddrs = (listenIPAddr: string, listenCombinedAddr: string): HubResult<void> => {
  return Result.combine([checkIpAddr(listenIPAddr), checkCombinedAddr(listenCombinedAddr)]).map(() => undefined);
};

/** Builds an AddressInfo from a NodeAddress */
export const addressInfoFromNodeAddress = (nodeAddress: NodeAddress): HubResult<AddressInfo> => {
  if (nodeAddress.family !== 4 && nodeAddress.family !== 6)
    return err(new HubError("bad_request", `invalid nodeAddress family: ${nodeAddress.family}`));

  return ok({
    address: nodeAddress.address,
    port: nodeAddress.port,
    family: ipFamilyToString(nodeAddress.family),
  });
};

/** Builds an AddressInfo for a given IP address and port */
export const addressInfoFromParts = (address: string, port: number): HubResult<AddressInfo> => {
  const family = isIP(address);
  if (!family) return err(new HubError("bad_request.parse_failure", "invalid ip address"));

  const addrInfo: AddressInfo = {
    address,
    port,
    family: ipFamilyToString(family),
  };
  return ok(addrInfo);
};

/**
 * Creates an IP-only multiaddr formatted string from an AddressInfo
 *
 * Does not preserve port or transport information
 */
export const ipMultiAddrStrFromAddressInfo = (addressInfo: AddressInfo): HubResult<string> => {
  if (addressInfo.family !== "IPv6" && addressInfo.family !== "IPv4")
    return err(new HubError("bad_request", `invalid AddressInfo family: ${addressInfo.family}`));

  const family = addressInfo.family === "IPv6" ? "ip6" : "ip4";
  const multiaddrStr = `/${family}/${addressInfo.address}`;
  return ok(multiaddrStr);
};

/**
 * Returns an IP-only multiaddr formatted string from an AddressInfo without preserving port and
 * transport information.
 */
export const p2pMultiAddrStr = (addressInfo: AddressInfo, peerID: string): HubResult<string> => {
  return ipMultiAddrStrFromAddressInfo(addressInfo).map(
    (ipMultiAddrStr) => `${ipMultiAddrStr}/tcp/${addressInfo.port}/p2p/${peerID}`,
  );
};

/* Converts GossipAddressInfo to net.AddressInfo */
export const addressInfoFromGossip = (addressInfo: GossipAddressInfo): HubResult<AddressInfo> => {
  const dnsName = addressInfo.dnsName;
  const port = addressInfo.port;
  const family = addressInfo.family;

  let address = addressInfo.address;
  if (dnsName && dnsName !== "") {
    address = dnsName;
  }
  if (!address || family === 0) return err(new HubError("bad_request.parse_failure", "Invalid address"));

  const addrInfo: AddressInfo = {
    address,
    port,
    family: ipFamilyToString(family),
  };
  return ok(addrInfo);
};

/* Converts ipFamily number to string */
export const ipFamilyToString = (family: number): string => {
  return family === 4 ? "IPv4" : "IPv6";
};

/* Converts AddressInfo to address string  */
export const addressInfoToString = (addressInfo: AddressInfo): string => {
  if (addressInfo.family === "IPv4") {
    return `${addressInfo.address}:${addressInfo.port}`;
  } else {
    return `[${addressInfo.address}]:${addressInfo.port}`;
  }
};

/** Returns a publicly visible IPv4 or IPv6 address of the running process */
export const getPublicIp = async (format: "text" | "json"): HubAsyncResult<string> => {
  const apiTimeoutMs = 3 * 1000; // 3 seconds
  const publicAddressAPI = `https://api.ipify.org?format=${format}`;
  const publicIPResponse = await ResultAsync.fromPromise(
    axios.get(publicAddressAPI, { timeout: apiTimeoutMs }),
    (error) => {
      return new HubError("unavailable.network_failure", `Failed to get public IP [${error}]`);
    },
  );
  if (publicIPResponse.isErr()) {
    return err(publicIPResponse.error);
  }

  let ip: string;
  if (format === "json") {
    type IPResponse = {
      ip: string;
    };
    const response: IPResponse = publicIPResponse.value.data;
    ip = response.ip;
  } else {
    ip = publicIPResponse.value.data;
  }

  logger.info({ component: "utils/p2p", ip }, "Fetched public IP");
  return ok(ip);
};

/* -------------------------------------------------------------------------- */
/*                               Private Methods                              */
/* -------------------------------------------------------------------------- */

const checkIpAddr = (ipAddr: string): HubResult<void> => {
  const parseListenIpAddrResult = parseAddress(ipAddr);
  if (parseListenIpAddrResult.isErr()) return err(parseListenIpAddrResult.error);

  const optionsResult = Result.fromThrowable(
    () => parseListenIpAddrResult.value.toOptions(),
    (error) => err(error),
  )();

  // An IP address should not have options and should throw if well-formed
  if (optionsResult.isErr()) return ok(undefined);

  const options = optionsResult.value;
  if (options.port !== undefined || options.transport !== undefined) {
    return err(new HubError("bad_request", "unexpected multiaddr transport/port information"));
  }
  return ok(undefined);
};

const checkCombinedAddr = (combinedAddr: string): HubResult<void> => {
  const parseListenIpAddrResult = parseAddress(combinedAddr);
  if (parseListenIpAddrResult.isErr()) return err(parseListenIpAddrResult.error);

  const optionsResult = Result.fromThrowable(
    () => parseListenIpAddrResult.value.toOptions(),
    (error) => new HubError("bad_request.parse_failure", error as Error),
  )();

  return optionsResult.andThen((options) => {
    if (options.transport !== "tcp") return err(new HubError("bad_request", "multiaddr transport must be tcp"));
    return ok(undefined);
  });
};
