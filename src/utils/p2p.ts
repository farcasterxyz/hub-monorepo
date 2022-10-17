import { Multiaddr, multiaddr } from '@multiformats/multiaddr';
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
