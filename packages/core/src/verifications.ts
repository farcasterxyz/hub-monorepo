import { FarcasterNetwork, Protocol } from "./protobufs";
import { err, ok } from "neverthrow";
import { bytesToHexString } from "./bytes";
import { HubError, HubResult } from "./errors";
import { validateEthAddress, validateEthBlockHash, validateSolAddress, validateSolBlockHash } from "./validations";

export type VerificationAddressClaim = VerificationAddressClaimEthereum | VerificationAddressClaimSolana;

export type VerificationAddressClaimEthereum = {
  fid: bigint;
  address: `0x${string}`;
  blockHash: `0x${string}`;
  network: FarcasterNetwork;
  protocol: Protocol.ETHEREUM;
};

export type VerificationAddressClaimSolana = {
  fid: bigint;
  address: string;
  blockHash: string;
  network: FarcasterNetwork;
  protocol: Protocol.SOLANA;
};

export const makeVerificationAddressClaim = (
  fid: number,
  address: Uint8Array,
  network: FarcasterNetwork,
  blockHash: Uint8Array,
  protocol: Protocol,
): HubResult<VerificationAddressClaim> => {
  switch (protocol) {
    case Protocol.ETHEREUM: {
      const ethAddressHex = validateEthAddress(address).andThen((validatedEthAddress) =>
        bytesToHexString(validatedEthAddress),
      );
      if (ethAddressHex.isErr()) {
        return err(ethAddressHex.error);
      }

      const blockHashHex = validateEthBlockHash(blockHash).andThen((validatedBlockHash) =>
        bytesToHexString(validatedBlockHash),
      );
      if (blockHashHex.isErr()) {
        return err(blockHashHex.error);
      }

      return ok({
        fid: BigInt(fid),
        address: ethAddressHex.value,
        network: network,
        blockHash: blockHashHex.value,
        protocol: Protocol.ETHEREUM,
      });
    }
    case Protocol.SOLANA: {
      const solAddress = validateSolAddress(address).andThen((validatedSolAddress) =>
        ok(new TextDecoder().decode(validatedSolAddress)),
      );

      if (solAddress.isErr()) {
        return err(solAddress.error);
      }

      const blockHashSol = validateSolBlockHash(blockHash).andThen((validatedBlockHash) =>
        ok(new TextDecoder().decode(validatedBlockHash)),
      );
      if (blockHashSol.isErr()) {
        return err(blockHashSol.error);
      }

      return ok({
        fid: BigInt(fid),
        address: solAddress.value,
        network: network,
        blockHash: blockHashSol.value,
        protocol: Protocol.SOLANA,
      });
    }
    default:
      return err(new HubError("bad_request.invalid_param", `Invalid protocol: ${protocol}`));
  }
};
