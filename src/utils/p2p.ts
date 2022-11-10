import { Multiaddr, multiaddr, NodeAddress } from '@multiformats/multiaddr';
import { AddressInfo, isIP } from 'net';
import { err, ok, Result } from 'neverthrow';
import { FarcasterError, ServerError } from '~/utils/errors';
import { get } from 'http';
import { logger } from '~/utils/logger';
import { HubError, HubResult } from '~/utils/hubErrors';

/** Parses an address to verify it is actually a valid MultiAddr */
export const parseAddress = (multiaddrStr: string): HubResult<Multiaddr> => {
  return Result.fromThrowable(
    () => multiaddr(multiaddrStr),
    (err) => new HubError('bad_request.parse_failure', { cause: err as Error, message: 'invalid multiaddr' })
  )();
};

/** Checks that the IP address to bind to is valid and that the combined IP, transport, and port multiaddr is valid  */
export const checkNodeAddrs = (listenIPAddr: string, listenCombinedAddr: string): HubResult<void> => {
  return Result.combine([checkIpAddr(listenIPAddr), checkCombinedAddr(listenCombinedAddr)]).map(() => undefined);
};

/** Get an AddressInfo object from a given NodeAddress object */
export const addressInfoFromNodeAddress = (nodeAddress: NodeAddress): AddressInfo => {
  if (nodeAddress.family != 4 && nodeAddress.family != 6)
    throw Error(`${nodeAddress.family}: Invalid NodeAddress Family`);

  return {
    address: nodeAddress.address,
    port: nodeAddress.port,
    family: nodeAddress.family == 4 ? 'IPv4' : 'IPv6',
  };
};

/** Get an AddressInfo object for a given IP and port */
export const addressInfoFromParts = (address: string, port: number) => {
  const family = isIP(address);
  if (!family) return err(new ServerError('Not an IP address'));

  const addrInfo: AddressInfo = {
    address,
    port,
    family: family == 4 ? 'IPv4' : 'IPv6',
  };
  return ok(addrInfo);
};

/**
 * Creates an IP-only multiaddr formatted string from an AddressInfo
 *
 * Does not preserve port or transport information
 */
export const ipMultiAddrStrFromAddressInfo = (addressInfo: AddressInfo) => {
  if (addressInfo.family != 'IPv6' && addressInfo.family != 'IPv4')
    throw Error(`${addressInfo.family}: Invalid AdddressInfo Family`);
  const family = addressInfo.family === 'IPv6' ? 'ip6' : 'ip4';
  const multiaddrStr = `/${family}/${addressInfo.address}`;
  return multiaddrStr;
};

/**
 * Creates an IP-only multiaddr formatted string from an AddressInfo
 *
 * Does not preserve port or transport information
 */
export const p2pMultiAddrStr = (addressInfo: AddressInfo, peerID: string) => {
  const ipMultiAddrStr = ipMultiAddrStrFromAddressInfo(addressInfo);
  return `${ipMultiAddrStr}/tcp/${addressInfo.port}/p2p/${peerID}`;
};

/**
 *
 * Fetches the publicly visible IP address of the running process
 *
 * @returns the public IPv4 or IPv6 as a string
 */
let lastIpFetch = { timestamp: new Date().getTime(), ip: '' };
export const getPublicIp = async (): Promise<Result<string, FarcasterError>> => {
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
      reject(new ServerError(err));
    }
  });
};

/* -------------------------------------------------------------------------- */
/*                               Private Methods                              */
/* -------------------------------------------------------------------------- */

const checkIpAddr = (ipAddr: string): HubResult<void> => {
  const parseListenIpAddrResult = parseAddress(ipAddr);
  if (parseListenIpAddrResult.isErr()) return err(parseListenIpAddrResult.error);

  // DISCUSS: we previously had a null check here (which seems impossible), but we have no
  // empty string check which is possible
  const parsedListenIPAddr = parseListenIpAddrResult.value;

  const toOptionsResult = Result.fromThrowable(
    () => parsedListenIPAddr.toOptions(),
    (error) => err(error)
  )();
  // An IP address should not have options and should throw if well-formed
  if (toOptionsResult.isErr()) return ok(undefined);

  const options = toOptionsResult.value;
  if (options.port !== undefined || options.transport !== undefined) {
    return err(new HubError('bad_request', 'unexpected multiaddr transport/port information'));
  }
  return ok(undefined);
};

const checkCombinedAddr = (ipAddr: string): HubResult<void> => {
  return parseAddress(ipAddr).match(
    (addr) => {
      // DISCUSS: can toOptions throw here? Should we fail if it does?
      if (addr.toOptions().transport != 'tcp')
        return err(new HubError('bad_request.parse_failure', 'Invalid Node MultiAddr: transport must be tcp'));
      return ok(undefined);
    },
    (error) => err(error)
  );
};
