import { GossipAddressInfo } from '@hub/flatbuffers';
import { HubAsyncResult, HubError, HubResult } from '@hub/utils';
import { Multiaddr, multiaddr, NodeAddress } from '@multiformats/multiaddr';
import { get } from 'http';
import { AddressInfo, isIP } from 'net';
import { err, ok, Result } from 'neverthrow';
import { logger } from '~/utils/logger';

/** Parses an address to verify it is actually a valid MultiAddr */
export const parseAddress = (multiaddrStr: string): HubResult<Multiaddr> => {
  if (multiaddrStr === '') return err(new HubError('bad_request', 'multiaddr must not be empty'));

  return Result.fromThrowable(
    () => multiaddr(multiaddrStr),
    (err) => new HubError('bad_request.parse_failure', { cause: err as Error, message: 'invalid multiaddr' })
  )();
};

/** Checks that the IP address to bind to is valid and that the combined IP, transport, and port multiaddr is valid  */
export const checkNodeAddrs = (listenIPAddr: string, listenCombinedAddr: string): HubResult<void> => {
  return Result.combine([checkIpAddr(listenIPAddr), checkCombinedAddr(listenCombinedAddr)]).map(() => undefined);
};

/** Builds an AddressInfo from a NodeAddress */
export const addressInfoFromNodeAddress = (nodeAddress: NodeAddress): HubResult<AddressInfo> => {
  if (nodeAddress.family != 4 && nodeAddress.family != 6)
    return err(new HubError('bad_request', `invalid nodeAddress family: ${nodeAddress.family}`));

  return ok({
    address: nodeAddress.address,
    port: nodeAddress.port,
    family: ipFamilyToString(nodeAddress.family),
  });
};

/** Builds an AddressInfo for a given IP address and port */
export const addressInfoFromParts = (address: string, port: number): HubResult<AddressInfo> => {
  const family = isIP(address);
  if (!family) return err(new HubError('bad_request.parse_failure', 'invalid ip address'));

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
  if (addressInfo.family != 'IPv6' && addressInfo.family != 'IPv4')
    return err(new HubError('bad_request', `invalid AddressInfo family: ${addressInfo.family}`));

  const family = addressInfo.family === 'IPv6' ? 'ip6' : 'ip4';
  const multiaddrStr = `/${family}/${addressInfo.address}`;
  return ok(multiaddrStr);
};

/**
 * Returns an IP-only multiaddr formatted string from an AddressInfo without preserving port and
 * transport information.
 */
export const p2pMultiAddrStr = (addressInfo: AddressInfo, peerID: string): HubResult<string> => {
  return ipMultiAddrStrFromAddressInfo(addressInfo).map(
    (ipMultiAddrStr) => `${ipMultiAddrStr}/tcp/${addressInfo.port}/p2p/${peerID}`
  );
};

/* Converts GossipAddressInfo to net.AddressInfo */
export const addressInfoFromGossip = (addressInfo: GossipAddressInfo): HubResult<AddressInfo> => {
  const address = addressInfo.address();
  const port = addressInfo.port();
  const family = addressInfo.family();
  if (!address || family === 0) return err(new HubError('bad_request.parse_failure', 'Invalid address'));
  const addrInfo: AddressInfo = {
    address,
    port,
    family: ipFamilyToString(family),
  };
  return ok(addrInfo);
};

/* Converts ipFamily number to string */
export const ipFamilyToString = (family: number): string => {
  return family == 4 ? 'IPv4' : 'IPv6';
};

/* Converts AddressInfo to address string  */
export const addressInfoToString = (addressInfo: AddressInfo): string => {
  if (addressInfo.family === 'IPv4') {
    return `${addressInfo.address}:${addressInfo.port}`;
  } else {
    return `[${addressInfo.address}]:${addressInfo.port}`;
  }
};

/**
 * Returns publicly visible IPv4 or IPv6 address of the running process
 */
let lastIpFetch = { timestamp: new Date().getTime(), ip: '' };

export const getPublicIp = async (): HubAsyncResult<string> => {
  return new Promise((resolve, reject) => {
    const now = new Date().getTime();
    const since = now - lastIpFetch.timestamp;
    if (since <= 10 * 60 * 1000 && lastIpFetch.ip != '') {
      logger.debug({ component: 'utils/p2p', ip: lastIpFetch.ip }, `Cached public IP`);
      resolve(ok(lastIpFetch.ip));
      return;
    }
    try {
      get({ host: 'api64.ipify.org', port: 80, path: '/' }, (resp) => {
        resp.on('data', (ip: Buffer) => {
          logger.info({ component: 'utils/p2p', ip: ip.toString() }, `Fetched public IP`);
          lastIpFetch = { timestamp: now, ip: ip.toString() };
          resolve(ok(ip.toString()));
        });
      });
    } catch (err: any) {
      reject(new HubError('unavailable.network_failure', err));
    }
  });
};

/* -------------------------------------------------------------------------- */
/*                               Private Methods                              */
/* -------------------------------------------------------------------------- */

const checkIpAddr = (ipAddr: string): HubResult<void> => {
  const parseListenIpAddrResult = parseAddress(ipAddr);
  if (parseListenIpAddrResult.isErr()) return err(parseListenIpAddrResult.error);

  const optionsResult = Result.fromThrowable(
    () => parseListenIpAddrResult.value.toOptions(),
    (error) => err(error)
  )();

  // An IP address should not have options and should throw if well-formed
  if (optionsResult.isErr()) return ok(undefined);

  const options = optionsResult.value;
  if (options.port !== undefined || options.transport !== undefined) {
    return err(new HubError('bad_request', 'unexpected multiaddr transport/port information'));
  }
  return ok(undefined);
};

const checkCombinedAddr = (combinedAddr: string): HubResult<void> => {
  const parseListenIpAddrResult = parseAddress(combinedAddr);
  if (parseListenIpAddrResult.isErr()) return err(parseListenIpAddrResult.error);

  const optionsResult = Result.fromThrowable(
    () => parseListenIpAddrResult.value.toOptions(),
    (error) => new HubError('bad_request.parse_failure', error as unknown as Error)
  )();

  return optionsResult.andThen((options) => {
    if (options.transport != 'tcp') return err(new HubError('bad_request', 'multiaddr transport must be tcp'));
    return ok(undefined);
  });
};
