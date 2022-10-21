import { Multiaddr, multiaddr, NodeAddress } from '@multiformats/multiaddr';
import { AddressInfo, isIP } from 'net';
import { err, ok, Result } from 'neverthrow';
import { FarcasterError, ServerError } from '~/utils/errors';

/** Parses an address to verify it is actually a valid MultiAddr */
export const parseAddress = (multiaddrStr: string): Result<Multiaddr, FarcasterError> => {
  try {
    return ok(multiaddr(multiaddrStr));
  } catch (error: any) {
    return err(new ServerError('Invalid MultiAddr: ' + error.message));
  }
};

/** Checks that the IP address to bind to is valid and that the combined IP, transport, and port multiaddr is valid  */
export const checkNodeAddrs = (listenIPAddr: string, listenCombinedAddr: string): Result<void, FarcasterError> => {
  let parsedAddr = parseAddress(listenIPAddr);
  let result = parsedAddr.match(
    (addr) => {
      if (!addr) return err(new ServerError('Invalid IP MultiAddr: could not parse multiaddr'));
      let options;
      try {
        options = addr.toOptions();
      } catch (error) {
        return ok(undefined);
        // intentional no-op since the IP MultiAddr is not expected to have port or transport information and will throw
      }
      if (options.port !== undefined || options.transport !== undefined) {
        return err(new ServerError('Invalid IP MultiAddr: unexpected transport/port information'));
      }
      return ok(undefined);
    },
    (error) => {
      return err(new ServerError(error));
    }
  );
  if (result.isErr()) return result;

  // check that the combined address is actually valid
  parsedAddr = parseAddress(listenCombinedAddr);
  result = parsedAddr.match(
    (addr) => {
      if (!addr) return err(new ServerError('Invalid Node MultiAddr: could not parse multiaddr'));
      const options = addr.toOptions();
      if (options.transport != 'tcp') return err(new ServerError('Invalid Node MultiAddr: transport must be tcp'));
      return ok(undefined);
    },
    (error) => {
      return err(new ServerError(error));
    }
  );

  return result;
};

/** Get an AddressInfo object from a given NodeAddress object */
export const addressInfoFromNodeAddress = (nodeAddress: NodeAddress): AddressInfo => {
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
 *
 * Creates an IP-only multiaddr formatted string from an AddressInfo
 *
 * Does not preserve port or transport information
 */
export const ipMultiAddrStrFromAddressInfo = (addressInfo: AddressInfo) => {
  if (addressInfo.family != 'IPv6' && addressInfo.family != 'IPv4')
    throw Error(`${addressInfo.family}: Invalid AdddressInfo`);
  const family = addressInfo.family === 'IPv6' ? 'ip6' : 'ip4';
  const multiaddrStr = `/${family}/${addressInfo.address}`;
  return multiaddrStr;
};
